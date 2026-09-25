import 'server-only'
import { CONSEJERO } from '../config'
import { ownedOffers } from './access'
import { db, t } from './db'

// Who may talk with the Consejero today, and the conversation kept for each member.
// Members with Słowa Pana: 30 messages a day. Everyone else signed in: 1 free
// question a day. Days are counted in UTC.

export interface ConsejeroStatus {
  member: boolean
  limit: number
  used: number
  /** When this member's 50%-off window started (non-members only). */
  offerStartedAt: string | null
}

export const today = () => new Date().toISOString().slice(0, 10)

export async function consejeroStatus(email: string): Promise<ConsejeroStatus> {
  const [owned, usage] = await Promise.all([
    ownedOffers(email),
    db().from(t('consejero_usage')).select('count').eq('email', email).eq('day', today()).maybeSingle(),
  ])
  const member = owned.includes('upsell2')
  let offerStartedAt: string | null = null
  if (!member) {
    const { data } = await db().from(t('members')).select('offer_started_at').eq('email', email).maybeSingle()
    offerStartedAt = data?.offer_started_at ?? null
    if (!offerStartedAt) {
      // The personal 15 days start the first time the offer is shown — once, on the server.
      offerStartedAt = new Date().toISOString()
      await db().from(t('members')).upsert({ email, offer_started_at: offerStartedAt }, { onConflict: 'email' })
    }
  }
  return { member, limit: member ? CONSEJERO.dailyLimit : 1, used: usage.data?.count ?? 0, offerStartedAt }
}

export async function countMessage(email: string): Promise<void> {
  await db().rpc(t('consejero_count'), { p_email: email, p_day: today() })
}

export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  crisis: boolean
  created_at: string
}

export async function recentMessages(email: string, limit: number): Promise<StoredMessage[]> {
  const { data } = await db()
    .from(t('consejero_messages'))
    .select('role, content, crisis, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  return ((data ?? []) as StoredMessage[]).reverse()
}

export async function saveMessage(email: string, role: 'user' | 'assistant', content: string, crisis = false): Promise<void> {
  await db().from(t('consejero_messages')).insert({ email, role, content, crisis })
}

export async function clearMessages(email: string): Promise<void> {
  await db().from(t('consejero_messages')).delete().eq('email', email)
}
