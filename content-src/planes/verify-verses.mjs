// Checks every verse of a plan against the Uwspółcześniona Biblia Gdańska
// (bolls.life, UBG18) and writes the exact text back. Usage:
//   node verify-verses.mjs <days.json> [--fix]
// Reference format: "Jana 3,16" or "Jana 3,16-18" (a colon also works).
// Reports: reference that could not be parsed, verse not found, text that differs.
import fs from 'node:fs'

// Names as the app shows them (the reference is displayed as written).
const BOOKS = [
  'Rodzaju', 'Wyjścia', 'Kapłańska', 'Liczb', 'Powtórzonego Prawa', 'Jozuego', 'Sędziów', 'Rut', '1 Samuela', '2 Samuela',
  '1 Królewska', '2 Królewska', '1 Kronik', '2 Kronik', 'Ezdrasza', 'Nehemiasza', 'Estery', 'Hioba', 'Psalm', 'Przysłów',
  'Koheleta', 'Pieśń nad Pieśniami', 'Izajasza', 'Jeremiasza', 'Lamentacje', 'Ezechiela', 'Daniela', 'Ozeasza', 'Joela', 'Amosa',
  'Abdiasza', 'Jonasza', 'Micheasza', 'Nahuma', 'Habakuka', 'Sofoniasza', 'Aggeusza', 'Zachariasza', 'Malachiasza',
  'Mateusza', 'Marka', 'Łukasza', 'Jana', 'Dzieje Apostolskie', 'Rzymian', '1 Koryntian', '2 Koryntian', 'Galacjan', 'Efezjan',
  'Filipian', 'Kolosan', '1 Tesaloniczan', '2 Tesaloniczan', '1 Tymoteusza', '2 Tymoteusza', 'Tytusa', 'Filemona',
  'Hebrajczyków', 'Jakuba', '1 Piotra', '2 Piotra', '1 Jana', '2 Jana', '3 Jana', 'Judy', 'Objawienie',
]
const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().trim()
const INDEX = new Map(BOOKS.map((b, i) => [plain(b), i + 1]))
for (const [alias, n] of [['psalmy', 19], ['psalmu', 19], ['kaznodziei', 21], ['kaznodziei salomona', 21], ['piesn nad piesniami', 22], ['dzieje', 44], ['objawienie jana', 66], ['apokalipsa', 66]]) INDEX.set(alias, n)

export function parse(ref) {
  const m = ref.trim().match(/^(.+?)\s+(\d+)[,:](\d+)(?:[-–](\d+))?$/)
  if (!m) return null
  const book = INDEX.get(plain(m[1]))
  if (!book) return null
  const from = Number(m[3])
  const to = m[4] ? Number(m[4]) : from
  return { book, chapter: Number(m[2]), from, to }
}

const cache = new Map()
async function chapter(book, ch) {
  const key = `${book}/${ch}`
  if (!cache.has(key)) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(`https://bolls.life/get-text/UBG18/${book}/${ch}/`)
        if (r.ok) { cache.set(key, await r.json()); break }
      } catch { /* retry */ }
      await new Promise((r) => setTimeout(r, 800))
    }
  }
  return cache.get(key) ?? []
}

// Psalm titles come in <b>…</b> ("Psalm Dawida."): not part of the verse's words.
const clean = (t) => t.replace(/<b>.*?<\/b>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const loose = (t) => plain(t).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

/** The official UBG18 text of a reference, or null. */
export async function official(ref) {
  const p = parse(ref)
  if (!p) return null
  const verses = await chapter(p.book, p.chapter)
  const picked = verses.filter((v) => v.verse >= p.from && v.verse <= p.to)
  if (picked.length !== p.to - p.from + 1) return null
  return clean(picked.map((v) => v.text).join(' '))
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const file = process.argv[2]
  const fix = process.argv.includes('--fix')
  const days = JSON.parse(fs.readFileSync(file, 'utf8'))
  let changed = 0
  const problems = []
  for (const d of days) {
    const ref = d.versiculo?.referencia ?? ''
    if (!parse(ref)) { problems.push(`Dzień ${d.day}: nierozpoznane odniesienie "${ref}"`); continue }
    const text = await official(ref)
    if (!text) { problems.push(`Dzień ${d.day}: nie znaleziono ${ref}`); continue }
    if (loose(text) !== loose(d.versiculo.texto)) {
      const distance = levenshtein(loose(text), loose(d.versiculo.texto))
      if (distance <= 3) {
        problems.push(`Dzień ${d.day} (${ref}) drobna różnica (${distance}), zostaje tekst napisany`)
      } else {
        changed++
        problems.push(`Dzień ${d.day} (${ref}) ${fix ? 'POPRAWIONO' : 'różni się'}:\n   napisane: ${d.versiculo.texto}\n   UBG18:    ${text}`)
        if (fix) d.versiculo.texto = text
      }
    }
  }
  if (fix) fs.writeFileSync(file, JSON.stringify(days, null, 2) + '\n')
  console.log(`${file}: ${days.length} dni, ${changed} tekstów ${fix ? 'poprawionych' : 'różnych'} od UBG18, ${problems.length} uwag`)
  for (const p of problems) console.log(' - ' + p)
}
