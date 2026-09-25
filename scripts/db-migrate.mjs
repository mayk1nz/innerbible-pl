// Applies supabase/migrations/*.sql in order, once each (tracked in _migrations).
// Usage: node scripts/db-migrate.mjs   (reads SUPABASE_DB_URL from .env.local)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
const url = env.match(/^SUPABASE_DB_URL=(.*)$/m)?.[1].trim()
if (!url) throw new Error('SUPABASE_DB_URL missing in .env.local')

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query('create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())')
await client.query('alter table public._migrations enable row level security')
const done = new Set((await client.query('select name from public._migrations')).rows.map((r) => r.name))
const dir = path.join(ROOT, 'supabase', 'migrations')
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(file)) {
    console.log(`= ${file} (já aplicada)`)
    continue
  }
  const sql = fs.readFileSync(path.join(dir, file), 'utf8')
  await client.query('begin')
  try {
    await client.query(sql)
    await client.query('insert into public._migrations (name) values ($1)', [file])
    await client.query('commit')
    console.log(`+ ${file}`)
  } catch (e) {
    await client.query('rollback')
    console.error(`! ${file}: ${e.message}`)
    process.exitCode = 1
    break
  }
}
const tables = (await client.query("select tablename from pg_tables where schemaname='public' order by 1")).rows.map((r) => r.tablename)
console.log('tabelas:', tables.join(', '))
await client.end()
