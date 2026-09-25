import { memberInfo, normalizeEmail } from '@/lib/server/access'
import { db, t } from '@/lib/server/db'
import { endSession, sessionEmail } from '@/lib/server/session'

// Who is signed in on this device and what they can open right now (a new purchase,
// a cancellation or a refund shows up here on the next visit).

export const dynamic = 'force-dynamic'

export async function GET() {
  const email = await sessionEmail()
  if (!email) return Response.json({ error: 'no-session' }, { status: 401 })
  return Response.json({ email, ...(await memberInfo(email)) })
}

/** Change the name shown in the app (kept on the server, so every device sees it). */
export async function PATCH(request: Request) {
  const email = await sessionEmail()
  if (!email) return Response.json({ error: 'no-session' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { name?: unknown }
  const name = typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim().slice(0, 60) : ''
  if (!name) return Response.json({ error: 'empty' }, { status: 400 })
  await db().from(t('members')).upsert({ email: normalizeEmail(email), name }, { onConflict: 'email' })
  return Response.json({ ok: true, name })
}

/** Sign out on this device. */
export async function DELETE() {
  await endSession()
  return Response.json({ ok: true })
}
