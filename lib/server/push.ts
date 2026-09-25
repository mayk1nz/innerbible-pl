import 'server-only'
import webpush from 'web-push'
import { PUSH_PUBLIC_KEY } from '../config'
import { db, t } from './db'

// Web push: the daily reminder. The private key lives in the database (app_config),
// the public one in the code (lib/config) — it's public by design.

let ready = false

async function setup(): Promise<void> {
  if (ready) return
  const { data } = await db().from(t('app_config')).select('value').eq('key', 'vapid_private_key').single()
  if (!data?.value) throw new Error('push private key missing')
  webpush.setVapidDetails('mailto:contact@innerbible.app', PUSH_PUBLIC_KEY, data.value)
  ready = true
}

export interface PushSub {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function saveSubscription(email: string, sub: PushSub): Promise<void> {
  await db()
    .from(t('push_subscriptions'))
    .upsert({ endpoint: sub.endpoint, email, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: 'endpoint' })
}

export async function removeSubscription(email: string, endpoint: string): Promise<void> {
  await db().from(t('push_subscriptions')).delete().eq('endpoint', endpoint).eq('email', email)
}

export interface Reminder {
  title: string
  body: string
  url: string
}

/**
 * Sends `reminder` once today to every subscribed device that hasn't had one yet.
 * Devices that no longer exist (the browser says 404/410) are removed.
 */
export async function sendDailyReminders(pick: (email: string) => Reminder): Promise<{ sent: number; removed: number; failed: number }> {
  await setup()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await db()
    .from(t('push_subscriptions'))
    .select('endpoint, email, p256dh, auth, last_sent_day')
    .or(`last_sent_day.is.null,last_sent_day.lt.${today}`)
    .limit(5000)
  let sent = 0
  let removed = 0
  let failed = 0
  for (const s of data ?? []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(pick(s.email)), { TTL: 60 * 60 * 12 })
      await db().from(t('push_subscriptions')).update({ last_sent_day: today }).eq('endpoint', s.endpoint)
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) {
        await db().from(t('push_subscriptions')).delete().eq('endpoint', s.endpoint)
        removed++
      } else failed++
    }
  }
  return { sent, removed, failed }
}
