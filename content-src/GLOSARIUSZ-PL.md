# Polish version — glossary and rules (shared by every translator)

The Polish app ("Biblia Wewnętrzna", pl.innerbible.app) is the Spanish app ("La Biblia
Interior") translated 1:1. Same features, same prices (USD), same funnel. Only the
language changes. Readers: Polish Christians, mostly Catholic, some evangelical.
Write natural, warm, modern Polish (not a word-for-word calque of the Spanish).

## Tone (mandatory)
- Everything out of love for Christ. NEVER attack or criticise churches, priests,
  denominations or institutions. Reveal deeper layers of the Word without confrontation.
- Speak to the reader as "ty" (informal, warm), like the Spanish "tú".
- Ecumenical: nothing that only one denomination would accept.

## Bible
- Translation: **Uwspółcześniona Biblia Gdańska (UBG18)**. Every quoted verse must be
  the exact UBG18 text. Get it with:
  `node content-src/planes/verse.mjs "Jana 3,16" "Psalm 23,1-2"`
- Reference format: `<Book> <chapter>,<verse>` e.g. `Jana 3,16`, `Psalm 23,1-2`,
  `1 Koryntian 13,4-7`. Book names exactly as in content-src/planes/verify-verses.mjs
  (Rodzaju, Wyjścia, …, Psalm, Przysłów, …, Mateusza, Marka, Łukasza, Jana, Dzieje
  Apostolskie, Rzymian, …, Objawienie).
- Psalm numbering is the same as in the Spanish text (Hebrew numbering).

## Names (use exactly these)
| Spanish | Polish |
|---|---|
| La Biblia Interior | Biblia Wewnętrzna |
| Resumen Cronológico de la Biblia | Chronologiczne Streszczenie Biblii |
| Resumen Cronológico en Audio | Chronologiczne Streszczenie Biblii w audio |
| Palabras del Señor | Słowa Pana |
| Guía Palabras del Señor | Przewodnik „Słowa Pana” |
| Tu Consejero Bíblico / Consejero | Twój Doradca Biblijny / Doradca |
| Plan de 90 días de Transformación Espiritual | 90-dniowy plan Duchowej Przemiany (tab: Przemiana) |
| Plan de 90 días para aprender a vivir según la filosofía de Jesús | 90-dniowy plan: jak żyć według nauki Jezusa (tab: Żyć jak Jezus) |
| Plan de 90 días para cambiar tu mentalidad y convertirte en un verdadero cristiano | 90-dniowy plan: zmień sposób myślenia i stań się prawdziwym chrześcijaninem (tab: Nowe myślenie) |
| Biblioteca «Caminando con Gigantes» | Biblioteka „Kroczyć z olbrzymami” |
| regalos / 9 regalos especiales | prezenty / 9 prezentów |
| Minitarea de hoy | Mini-zadanie na dziś |
| Para poner en práctica | W praktyce |
| Para meditar | Do rozważenia |
| racha | seria (dni z rzędu) |
| puntos | punkty |
| los hermanos | bracia i siostry (wspólnota) |
| Plan anual | Plan roczny |
| Inicio · Leer · Consejero · Comunidad · Tienda · Perfil | Start · Czytaj · Doradca · Społeczność · Sklep · Profil |
| Día N | Dzień N |
| lección / lecciones | lekcja (1) / lekcje (2–4) / lekcji (5+) |

## Routes (already renamed in the code — do not change them)
/start, /czytaj, /doradca, /spolecznosc, /sklep, /profil, /roczny, /lekcja/…, /modul/…,
/witaj, /logowanie, /quiz, /upsell, /upsell-downsell, /slowa-pana, /slowa-pana-downsell.
API routes (/api/…) stay as they are.

## Money and numbers
- Prices stay in US dollars. Written the Polish way: `11,90 USD`, `4,95 USD` (formatUsd
  in lib/funnel/config.ts produces this).
- Dates/numbers in Polish format.

## Code rules
- Translate only what the user sees (UI text, aria-labels, alt texts, metadata titles,
  e-mails, prompts). Do NOT rename identifiers, ids, keys, file names, routes or
  offer ids (front/upsell1/upsell2), product ids (cronologico, hacedores, …) or plan ids.
- Code comments may stay in English.
- Polish plurals have 3 forms (1 / 2–4 / 5+, with 12–14 → 5+ form). Use the `plural`
  helper in lib/text.ts (it takes one, few, many).
- After editing TypeScript, `npx tsc --noEmit -p .` must pass.
