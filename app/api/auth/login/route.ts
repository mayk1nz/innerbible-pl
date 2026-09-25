import { memberInfo, normalizeEmail, ownedOffers, touchMember } from '@/lib/server/access'
import { startSession } from '@/lib/server/session'

// Sign in with the purchase e-mail: allowed only when that e-mail has something to open.
// (No code by e-mail for now — see SEND_CODE in LoginForm.)

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown; name?: unknown }
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
  if (!EMAIL_RE.test(email)) return Response.json({ error: 'invalid-email' }, { status: 400 })

  let owned
  try {
    owned = await ownedOffers(email)
  } catch {
    // Never echo the error: a misconfigured key can end up inside the message.
    console.error('login: could not read entitlements')
    return Response.json({ error: 'server' }, { status: 500 })
  }
  if (!owned.length) return Response.json({ error: 'no-purchase' }, { status: 403 })

  const name = typeof body.name === 'string' ? body.name.slice(0, 60) : ''
  await touchMember(email, name)
  await startSession(email)
  const info = await memberInfo(email)
  return Response.json({ email, ...info })
}
