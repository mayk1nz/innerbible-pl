import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { OfferId } from '../catalog'

// Reading KashPay webhooks. KashPay has no public documentation of the payload, so the
// parser looks for the fields by name anywhere in it (e-mail, product name, dates) and
// every event is stored raw first — nothing is lost if a field turns out to be elsewhere.

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

/**
 * Product name in KashPay → what it unlocks (most specific first). The annual plan
 * ("…Anual…") opens the three offers for a year.
 */
const PRODUCT_RULES: { match: RegExp; offers: OfferId[]; days?: number }[] = [
  // Polish names too: "Plan roczny" (annual), "Słowa Pana", "Chronologiczne Streszczenie Biblii".
  { match: /anual|annual|12 meses|roczn|12 miesi(e|ę)cy/i, offers: ['front', 'upsell1', 'upsell2'], days: 366 },
  { match: /palabras del se(n|ñ)or|hacedores|s(l|ł)owa pana|s(l|ł)(o|ó)w pana/i, offers: ['upsell2'] },
  { match: /audio/i, offers: ['upsell1'] },
  // The front is "Estudio Cronológico de la Biblia" in KashPay (also accept the app's name).
  {
    match:
      /(resumen|estudio) cronol(o|ó)gico|cronolog(i|í)a b(i|í)blica|la biblia interior|plan mensual|chronologiczne streszczenie|streszczenie biblii|biblia wewn(e|ę)trzna|plan miesi(e|ę)czny/i,
    offers: ['front'],
  },
]

function walk(node: Json, visit: (key: string, value: Json, path: string) => void, path = ''): void {
  if (Array.isArray(node)) node.forEach((v, i) => walk(v, visit, `${path}[${i}]`))
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      visit(k.toLowerCase(), v, `${path}.${k.toLowerCase()}`)
      walk(v, visit, `${path}.${k.toLowerCase()}`)
    }
  }
}

export interface ParsedEvent {
  event: string
  email: string | null
  product: string | null
  /** Offers this product opens (empty = not one of ours). */
  offers: OfferId[]
  /** How long a payment opens them when the event carries no date (default: a month). */
  days: number
  periodEnd: string | null
}

/**
 * The offer's price in cents → what it opens, for offers whose name doesn't say it
 * (e.g. an offer called "US$ 4,90"). Prices of our funnel, in USD.
 */
const PRICE_RULES: Record<number, { offers: OfferId[]; days?: number }> = {
  9900: { offers: ['front', 'upsell1', 'upsell2'], days: 366 },
  1190: { offers: ['front'] },
  490: { offers: ['upsell1'] },
  245: { offers: ['upsell1'] },
  990: { offers: ['upsell2'] },
  495: { offers: ['upsell2'] },
}

// Payload (KashPay docs, app.kashpay.com.br/docs/webhooks):
//   { event, created_at, data: { id, amount (cents), currency, status, offers: [{ id, name,
//     price (cents), type, … }], customer: { id, name, phone, email }, subscription | null, tracking } }
export function parseEvent(payload: Json): ParsedEvent {
  const root = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  const event = typeof root.event === 'string' ? root.event : typeof root.type === 'string' ? root.type : ''
  const data = root.data && typeof root.data === 'object' && !Array.isArray(root.data) ? root.data : {}
  const customer = data.customer && typeof data.customer === 'object' && !Array.isArray(data.customer) ? data.customer : {}
  let email: string | null = typeof customer.email === 'string' && customer.email.includes('@') ? customer.email.trim().toLowerCase() : null
  let periodEnd: string | null = null

  walk(payload, (key, value, path) => {
    if (typeof value !== 'string') return
    if (!email && key.includes('email') && /@/.test(value) && !/seller|merchant|producer|owner/.test(path)) email = value.trim().toLowerCase()
    if (!periodEnd && /(current_period_end|period_end|next_billing|next_charge|next_payment|expires_at|expiration)/.test(key) && !Number.isNaN(Date.parse(value))) periodEnd = new Date(value).toISOString()
  })

  // Each offer in the order: by its price first (all our prices differ, and offer names
  // can be generic like "Plan Mensual"), then by its name.
  const list = Array.isArray(data.offers) ? data.offers : []
  const offers = new Set<OfferId>()
  let days = 31
  const names: string[] = []
  for (const o of list) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) continue
    const name = typeof o.name === 'string' ? o.name : ''
    if (name) names.push(name)
    const byName = PRODUCT_RULES.find((r) => r.match.test(name))
    const byPrice = typeof o.price === 'number' ? PRICE_RULES[o.price] : undefined
    const rule = byPrice ?? byName
    rule?.offers.forEach((x) => offers.add(x))
    if (rule?.days) days = Math.max(days, rule.days)
  }
  // No offers list (older format): a product name anywhere, or the total amount.
  if (!list.length) {
    const rule = PRODUCT_RULES.find((r) => r.match.test(JSON.stringify(payload))) ?? (typeof data.amount === 'number' ? PRICE_RULES[data.amount] : undefined)
    rule?.offers.forEach((x) => offers.add(x))
    if (rule?.days) days = rule.days
  }
  return { event, email, product: names.join(' + ') || null, offers: [...offers], days, periodEnd }
}

/**
 * KashPay signs every webhook: header X-KashPay-Signature = "sha256=" + hex
 * HMAC-SHA256(secret, raw body). With KASHPAY_WEBHOOK_SECRET set, an event without a
 * valid signature is refused; without the secret, null (not checked).
 */
export function checkSignature(rawBody: string, headers: Record<string, string>): boolean | null {
  const secret = process.env.KASHPAY_WEBHOOK_SECRET?.trim().split(/\s+/)[0]
  if (!secret) return null
  const header = headers['x-kashpay-signature'] ?? Object.entries(headers).find(([k]) => k.includes('signature'))?.[1]
  if (!header) return false
  const given = header.replace(/^sha256=/i, '').trim()
  const mac = createHmac('sha256', secret).update(rawBody)
  const digest = mac.digest()
  for (const candidate of [digest.toString('hex'), digest.toString('base64'), digest.toString('base64url')]) {
    const a = Buffer.from(candidate)
    const b = Buffer.from(given)
    if (a.length === b.length && timingSafeEqual(a, b)) return true
  }
  return false
}
