// Turns the writers' JSON (planes/<plan>/days-*.json) into the app's content files:
//   lib/content/plans/titles.ts      — only the day titles (small; used by the catalog)
//   lib/content/plans/<plan>.ts      — the full days, loaded only when a day is opened
// Usage: node build-plans.mjs <app root>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PLANS = ['transformacion', 'vivir-como-jesus', 'nueva-mentalidad']
// fileURLToPath decodes %20 etc. — the project folder has spaces in its name.
const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP = process.argv[2]
const OUT = path.join(APP, 'lib', 'content', 'plans')
fs.mkdirSync(OUT, { recursive: true })

const titles = {}
for (const plan of PLANS) {
  const dir = path.join(HERE, plan)
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^days-.*\.json$/.test(f)).sort() : []
  const days = files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).sort((a, b) => a.day - b.day)
  const problems = []
  days.forEach((d, i) => {
    if (d.day !== i + 1) problems.push(`brak dnia ${i + 1} albo jest powtórzony (znaleziono ${d.day})`)
    if (!d.title || !d.versiculo?.texto || !d.versiculo?.referencia || !d.resumen?.length || !d.tarea || d.practica?.length !== 3 || !d.meditar)
      problems.push(`dzień ${d.day}: niekompletne pola`)
  })
  if (days.length !== 90) problems.push(`${days.length} dni (oczekiwano 90)`)
  if (!days.length) throw new Error(`${plan}: nie znaleziono dni w ${dir} — nic nie zapisano`)
  titles[plan] = days.map((d) => d.title)
  const content = days.map((d) => ({
    versiculo: { texto: d.versiculo.texto, referencia: d.versiculo.referencia },
    resumen: d.resumen,
    tarea: d.tarea,
    practica: d.practica,
    meditar: d.meditar,
  }))
  fs.writeFileSync(
    path.join(OUT, `${plan}.ts`),
    `// Generated from the plan texts (scratchpad planes/${plan}). Day n = DAYS[n - 1].\n` +
      `import type { LessonContent } from '../../catalog'\n\n` +
      `export const DAYS: LessonContent[] = ${JSON.stringify(content, null, 2)}\n`,
  )
  console.log(`${plan}: ${days.length} dni${problems.length ? ' — PROBLEMY: ' + problems.join('; ') : ' OK'}`)
}

// The Consejero's map of the app: every day with its name and core idea (from the
// architects' outlines), always sent first so the model can point to the right day.
const NAMES = { transformacion: 'Duchowa Przemiana', 'vivir-como-jesus': 'Żyć jak Jezus', 'nueva-mentalidad': 'Nowe myślenie' }
const mapLines = []
for (const plan of PLANS) {
  const outlineFile = path.join(HERE, plan, 'outline.json')
  const outline = fs.existsSync(outlineFile) ? JSON.parse(fs.readFileSync(outlineFile, 'utf8')) : []
  mapLines.push(`## ${NAMES[plan]} (90-dniowy plan w „Słowach Pana”)`)
  titles[plan].forEach((t, i) => {
    const idea = outline.find((o) => o.day === i + 1)?.idea ?? ''
    mapLines.push(
      `- Dzień ${i + 1}: ${t}${idea ? ` — ${idea.replace(/\s*\((Incluir línea pastoral|Uwzględnij linię duszpasterską)\.?\)\s*/g, ' ').trim()}` : ''}`,
    )
  })
}
fs.mkdirSync(path.join(APP, 'lib', 'consejero'), { recursive: true })
fs.writeFileSync(
  path.join(APP, 'lib', 'consejero', 'map.ts'),
  `// Generated: the map of the three 90-day plans (day, name, core idea) for the Consejero.\n` +
    `import 'server-only'\n\n` +
    `export const APP_MAP = ${JSON.stringify(mapLines.join('\n'))}\n`,
)
console.log(`zapisano map.ts (${mapLines.length} linii, ~${Math.round(mapLines.join('\n').length / 4)} tokenów)`)

fs.writeFileSync(
  path.join(OUT, 'titles.ts'),
  `// Generated: the name of each day of the 90-day plans (the full texts load on demand).\n` +
    `export type PlanId = ${PLANS.map((p) => `'${p}'`).join(' | ')}\n\n` +
    `export const PLAN_TITLES: Record<PlanId, string[]> = ${JSON.stringify(titles, null, 2)}\n`,
)
console.log('zapisano titles.ts')
