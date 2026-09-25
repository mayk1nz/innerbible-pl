import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// The member's session: an httpOnly cookie "email.expiry.signature", signed with a
// server secret so it can't be forged or edited in the browser. One year per device.

const COOKIE = 'ib_session'
const MAX_AGE_S = 60 * 60 * 24 * 365

function secret(): string {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('No session secret configured')
  return s
}

const b64 = (s: string) => Buffer.from(s).toString('base64url')
const sign = (data: string) => createHmac('sha256', secret()).update(data).digest('base64url')

export async function startSession(email: string): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S
  const data = `${b64(email)}.${exp}`
  const jar = await cookies()
  jar.set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_S,
  })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

/** The signed-in e-mail, or null (no cookie, forged, or expired). */
export async function sessionEmail(): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  const [emailB64, exp, sig] = raw.split('.')
  if (!emailB64 || !exp || !sig) return null
  const expected = sign(`${emailB64}.${exp}`)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  if (Number(exp) * 1000 < Date.now()) return null
  return Buffer.from(emailB64, 'base64url').toString()
}
