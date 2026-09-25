import { db, t } from '@/lib/server/db'
import { checkSignature, parseEvent } from '@/lib/server/kashpay'

// KashPay webhook. Every event is stored raw first (kashpay_events), then applied to
// the member's access (entitlements):
//   order.paid · subscription.created · subscription.renewed → active until the paid date
//   subscription.failed → past_due (access continues until the paid date + grace)
//   subscription.canceled → canceled (access until the end of what was paid)
//   order.refunded · order.chargeback → refunded (closed at once)
// Other events (created, awaiting payment, abandoned, failed) are only stored.

export const dynamic = 'force-dynamic'

const STATUS: Record<string, 'active' | 'past_due' | 'canceled' | 'refunded'> = {
  'order.paid': 'active',
  'subscription.created': 'active',
  'subscription.renewed': 'active',
  'subscription.failed': 'past_due',
  'subscription.canceled': 'canceled',
  'order.refunded': 'refunded',
  'order.chargeback': 'refunded',
}

export async function POST(request: Request) {
  const raw = await request.text()
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    if (key !== 'cookie' && key !== 'authorization') headers[key] = value
  })
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = { raw }
  }

  const parsed = parseEvent(payload as Parameters<typeof parseEvent>[0])
  const signatureOk = checkSignature(raw, headers)
  const status = STATUS[parsed.event]

  let note = ''
  if (!status) note = 'stored only'
  else if (signatureOk === false) note = 'signature mismatch: not applied'
  else if (!parsed.email) note = 'no e-mail found: not applied'
  else if (!parsed.offers.length) note = 'unknown product: not applied'

  const { data: stored, error: storeError } = await db()
    .from(t('kashpay_events'))
    .insert({ event: parsed.event || null, email: parsed.email, product: parsed.product, headers, payload, signature_ok: signatureOk, note: note || null })
    .select('id')
    .single()
  if (storeError) {
    console.error('kashpay-webhook: could not store event', storeError.message)
    // 500 → KashPay retries later; nothing is lost.
    return Response.json({ ok: false }, { status: 500 })
  }

  if (!note && status && parsed.email && parsed.offers.length) {
    const results: string[] = []
    for (const offer of parsed.offers) results.push(await apply(parsed.email, offer, status, parsed))
    await db().from(t('kashpay_events')).update({ processed: true, note: results.join(' · ') }).eq('id', stored.id)
  }

  return Response.json({ ok: true })
}

/**
 * Applies one event to one offer. Paid time never shrinks because of another product:
 * someone who moved to the annual plan and then has their old monthly cancelled or
 * refunded keeps the year they paid for.
 */
async function apply(email: string, offer: string, status: 'active' | 'past_due' | 'canceled' | 'refunded', parsed: ReturnType<typeof parseEvent>): Promise<string> {
  const { data: existing } = await db()
    .from(t('entitlements'))
    .select('status, current_period_end, product')
    .eq('email', email)
    .eq('offer', offer)
    .maybeSingle()
  const existingEnd = existing?.current_period_end ? Date.parse(existing.current_period_end) : 0
  const otherProduct = existing?.product && parsed.product && existing.product !== parsed.product

  if (status !== 'active' && otherProduct && existing?.status === 'active' && existingEnd > Date.now()) {
    return `${offer}: kept (paid by ${existing.product})`
  }

  let end: number | null
  if (status === 'active') {
    const paidUntil = parsed.periodEnd ? Date.parse(parsed.periodEnd) : Date.now() + (parsed.days || 31) * 86_400_000
    end = Math.max(paidUntil, existingEnd) // a renewal or an annual never shortens access
  } else if (parsed.periodEnd) {
    end = Date.parse(parsed.periodEnd)
  } else {
    // No date: keep what was paid; with nothing paid before, nothing opens (end = now).
    end = existing ? (existingEnd || null) : Date.now()
  }

  const { error } = await db()
    .from(t('entitlements'))
    .upsert(
      {
        email,
        offer,
        status,
        product: status === 'active' ? parsed.product : (existing?.product ?? parsed.product),
        source: 'kashpay',
        current_period_end: end ? new Date(end).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email,offer' },
    )
  return error ? `${offer}: apply failed (${error.message})` : `${offer}: ${status}`
}

/** Lets a browser (or KashPay's URL check) see the endpoint is alive. */
export async function GET() {
  return Response.json({ ok: true, endpoint: 'kashpay-webhook' })
}
