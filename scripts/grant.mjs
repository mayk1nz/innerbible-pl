// Grants (or removes) access by hand — e.g. buyers from before the KashPay webhook.
//   node scripts/grant.mjs <email> <front|upsell1|upsell2> [days=31]
//   node scripts/grant.mjs <email> <offer> revoke
//   node scripts/grant.mjs <email>            (shows what the e-mail can open)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
// Table prefix of this site (Spanish '' / Polish 'pl_'), as in lib/config.ts.
const P = fs.readFileSync(path.join(ROOT, 'lib', 'config.ts'), 'utf8').match(/dbPrefix:\s*'([^']*)'/)[1]
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
const url = env.match(/^SUPABASE_DB_URL=(.*)$/m)?.[1].trim()
const [emailArg, offer, arg] = process.argv.slice(2)
if (!emailArg) throw new Error('usage: node scripts/grant.mjs <email> [offer] [days|revoke]')
const email = emailArg.trim().toLowerCase()

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
if (offer) {
  if (!['front', 'upsell1', 'upsell2'].includes(offer)) throw new Error('offer must be front, upsell1 or upsell2')
  if (arg === 'revoke') {
    await client.query(`delete from public.${P}entitlements where email = $1 and offer = $2`, [email, offer])
    console.log(`removido: ${email} ${offer}`)
  } else {
    const days = Number(arg ?? 31)
    await client.query(
      `insert into public.${P}entitlements (email, offer, status, current_period_end, source, updated_at)
       values ($1, $2, 'active', now() + ($3 || ' days')::interval, 'manual', now())
       on conflict (email, offer) do update set status = 'active', current_period_end = excluded.current_period_end, source = 'manual', updated_at = now()`,
      [email, offer, String(days)],
    )
    console.log(`liberado: ${email} ${offer} por ${days} dias`)
  }
}
const rows = (await client.query(`select offer, status, current_period_end, source from public.${P}entitlements where email = $1 order by offer`, [email])).rows
console.log(rows.length ? rows.map((r) => `  ${r.offer}: ${r.status} até ${r.current_period_end?.toISOString().slice(0, 10) ?? 'sem fim'} (${r.source})`).join('\n') : '  (nada liberado)')
await client.end()
