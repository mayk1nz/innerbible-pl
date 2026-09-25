import 'server-only'
import { PRODUCTS, type LessonContent } from '../catalog'
import { DAYS as NUEVA_MENTALIDAD } from '../content/plans/nueva-mentalidad'
import { PLAN_TITLES, type PlanId } from '../content/plans/titles'
import { DAYS as TRANSFORMACION } from '../content/plans/transformacion'
import { DAYS as VIVIR_COMO_JESUS } from '../content/plans/vivir-como-jesus'

// The Consejero's library: everything the app teaches, searched on our own server
// (no outside lookup). For each question only the few most relevant passages are sent
// to the model, so each answer costs a fraction of a cent however large the library
// grows. Search = BM25 over Polish words (diacritics folded, light suffix stemming).

export interface Passage {
  /** Where it comes from, as the member sees it: "Nowe myślenie · Dzień 41: …". */
  source: string
  /** Link inside the app. */
  href: string
  text: string
}

const PLAN_NAMES: Record<PlanId, string> = {
  transformacion: 'Duchowa Przemiana',
  'vivir-como-jesus': 'Żyć jak Jezus',
  'nueva-mentalidad': 'Nowe myślenie',
}
const PLAN_DAYS: Record<PlanId, LessonContent[]> = {
  transformacion: TRANSFORMACION,
  'vivir-como-jesus': VIVIR_COMO_JESUS,
  'nueva-mentalidad': NUEVA_MENTALIDAD,
}

function contentText(c: LessonContent): string {
  return [
    c.versiculo ? `${c.versiculo.referencia}: «${c.versiculo.texto}»` : '',
    ...(c.resumen ?? []),
    c.tarea ? `Mini-zadanie na dziś: ${c.tarea}` : '',
    c.practica?.length ? `W praktyce: ${c.practica.join(' ')}` : '',
    c.meditar ? `Do rozważenia: ${c.meditar}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildLibrary(): Passage[] {
  const out: Passage[] = []
  for (const plan of Object.keys(PLAN_DAYS) as PlanId[]) {
    PLAN_DAYS[plan].forEach((c, i) => {
      out.push({
        source: `Słowa Pana · ${PLAN_NAMES[plan]} · Dzień ${i + 1}: ${PLAN_TITLES[plan][i] ?? ''}`,
        href: `/lekcja/hacedores/${plan}-dia-${i + 1}`,
        text: contentText(c),
      })
    })
  }
  // Lessons written inline in the catalog (the chronological summaries as they arrive).
  for (const p of PRODUCTS) {
    for (const s of p.sections) {
      for (const l of s.lessons) {
        if (l.content) out.push({ source: `${p.title} · ${l.title}`, href: `/lekcja/${p.id}/${l.id}`, text: contentText(l.content) })
      }
    }
  }
  return out
}

// ─── BM25 ──────────────────────────────────────────────────────────

// Written without diacritics ("ł" → "l"), as tokens() folds them.
const STOP = new Set(
  (
    'aby ale ani bardzo bez bowiem byc byl byla byli bylo byly bede beda bedzie cala cale caly cie ciebie cos czy czyli dla dlaczego dlatego gdy gdyz gdzie ich ile inna inne inny jak jaka jakas jakie jaki jako jego jej jemu jest jestem jestes jestesmy jeszcze jesli jezeli juz kazdy kazda kazde kiedy kto ktora ktore ktory ktorych ktorzy ktorej ktorego lub mam mamy masz mie mna mnie moj moja moje moim mojej mozna mozesz nad nam nami nas nasz nasza nasze naszej nawet nia nic nich nie niech niego niej niemu nim nimi oraz ona one oni ono pod poniewaz przed przez przy sam sama sami sie siebie sobie soba swoj swoja swoje swojej swoim tak takze tam tego tej ten teraz tez tobie toba tutaj twoj twoja twoje twojej twoim tych tylko wiec wszystko wszyscy wszystkie zas zeby czego czym tym tyle bardziej zawsze nigdy troche coraz albo ktos komus kogos robic robisz robie rzecz rzeczy dzien dnia dniu dni dniach dzis dzisiaj raz razy'
  ).split(' '),
)

// Light Polish stemmer: strips one common inflectional ending (longest first) as long
// as a stem of at least 3 letters remains — "modlitwy", "modlitwie", "modlitwą" →
// "modlitw"; "przebaczenie", "przebaczyć" → "przebacz"; "lęku", "lękiem" → "lek".
const SUFFIXES = [
  'owania', 'owanie', 'owaniu',
  'aniem', 'eniem', 'owych', 'owego', 'owemu', 'owymi',
  'ania', 'anie', 'aniu', 'enia', 'enie', 'eniu', 'acie', 'ecie', 'icie', 'ycie',
  'ach', 'ami', 'ego', 'emu', 'ymi', 'imi', 'ych', 'ich', 'owi', 'iem', 'asz', 'esz', 'isz', 'ysz', 'amy', 'emy', 'imy', 'ymy', 'aja', 'eja',
  'ow', 'om', 'em', 'ej', 'ie', 'ym', 'im', 'ac', 'ec', 'ic', 'yc', 'am',
  'a', 'e', 'i', 'o', 'u', 'y',
]

function stem(w: string): string {
  for (const s of SUFFIXES) if (w.length - s.length >= 3 && w.endsWith(s)) return w.slice(0, -s.length)
  return w
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem)
}

interface Index {
  docs: { passage: Passage; tf: Map<string, number>; len: number }[]
  df: Map<string, number>
  avgLen: number
}

let index: Index | null = null

function getIndex(): Index {
  if (index) return index
  const docs = buildLibrary().map((passage) => {
    const tf = new Map<string, number>()
    const words = tokens(`${passage.source} ${passage.text}`)
    for (const w of words) tf.set(w, (tf.get(w) ?? 0) + 1)
    return { passage, tf, len: words.length }
  })
  const df = new Map<string, number>()
  for (const d of docs) for (const w of d.tf.keys()) df.set(w, (df.get(w) ?? 0) + 1)
  index = { docs, df, avgLen: docs.reduce((s, d) => s + d.len, 0) / Math.max(1, docs.length) }
  return index
}

/** The `limit` passages that best match the question (none when nothing is relevant). */
export function searchLibrary(question: string, limit = 4): Passage[] {
  const { docs, df, avgLen } = getIndex()
  const q = [...new Set(tokens(question))]
  if (!q.length) return []
  const k1 = 1.2
  const b = 0.75
  const n = docs.length
  const scored = docs.map((d) => {
    let score = 0
    for (const w of q) {
      const f = d.tf.get(w)
      if (!f) continue
      const idf = Math.log(1 + (n - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5))
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avgLen)))
    }
    return { passage: d.passage, score }
  })
  return scored
    .filter((s) => s.score > 2)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, limit)
    .map((s) => s.passage)
}
