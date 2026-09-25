import { sendDailyReminders, type Reminder } from '@/lib/server/push'

// The daily reminder, run by Vercel Cron (vercel.json) once a day. Each device gets at
// most one reminder per day (last_sent_day), so calling this again does nothing more.
// With CRON_SECRET set on Vercel, only Vercel's own call is accepted.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MESSAGES: Omit<Reminder, 'url'>[] = [
  { title: 'Twój dzisiejszy krok czeka 📖', body: 'Kilka minut ze Słowem, by zacząć dzień w pokoju.' },
  { title: 'Chwila z Bogiem', body: 'Twoje dzisiejsze czytanie jest gotowe. Przeczytamy je razem?' },
  { title: 'Idź dalej swoją drogą 🙏', body: 'Jeden krok każdego dnia: dzisiejszy też liczy się do twojej serii.' },
  { title: 'Słowo na dziś', body: '„Twoje słowo jest pochodnią dla moich nóg”. Twoje czytanie czeka.' },
]

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Same message for everyone on a given day, changing through the week.
  const message = MESSAGES[Math.floor(Date.now() / 86_400_000) % MESSAGES.length]
  const result = await sendDailyReminders(() => ({ ...message, url: '/start' }))
  return Response.json({ ok: true, ...result })
}
