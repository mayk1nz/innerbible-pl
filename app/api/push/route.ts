import { removeSubscription, saveSubscription, type PushSub } from '@/lib/server/push'
import { sessionEmail } from '@/lib/server/session'

// Turn the daily reminder on (POST the browser's subscription) or off (DELETE) for
// this device.

export const dynamic = 'force-dynamic'

function parse(raw: unknown): PushSub | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { endpoint, keys } = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) return null
  if (typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string') return null
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

export async function POST(request: Request) {
  const email = await sessionEmail()
  if (!email) return Response.json({ error: 'no-session' }, { status: 401 })
  const sub = parse(await request.json().catch(() => null))
  if (!sub) return Response.json({ error: 'invalid' }, { status: 400 })
  await saveSubscription(email, sub)
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const email = await sessionEmail()
  if (!email) return Response.json({ error: 'no-session' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { endpoint?: unknown }
  if (typeof body.endpoint === 'string') await removeSubscription(email, body.endpoint)
  return Response.json({ ok: true })
}
