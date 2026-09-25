# Brief — three 90-day plans for "La Biblia Interior" (Palabras del Señor)

## Who reads this
Spanish-speaking Christians (Latin America + US Hispanics), mostly 35–65, many women, evangelical
and Catholic alike, who bought a chronological Bible summary because the Bible felt hard to
understand. They are sincere but busy, often tired, some carry anxiety, grief, family tension,
money worries, loneliness. They read on a phone, a few minutes a day. Many have tried Bible plans
before and quit. They need something that CHANGES DAILY LIFE, not more information.

## What each plan must be
A real 90-day journey of growth — not 90 disconnected devotionals. Each plan has a clear arc:
phases that build on each other (foundations → practice → deeper change → consolidation), with
habits introduced gradually and revisited, and days that reference what was built before
("¿Recuerdas la lista del Día 1?"). By Day 90 the reader should be able to see concretely how
they changed (the plan should plant things early that are harvested at the end).

Every day = ONE clear idea + ONE Bible verse that truly expresses that exact change + ONE small
task for today + concrete behaviors to practice during the day + ONE question to meditate.

## The three plans (keep them clearly distinct — no overlapping arcs)
1. **transformacion** — "Plan de 90 días de Transformación Espiritual".
   The inner life with God: prayer, the Word, repentance and grace, surrender, trusting God in
   trials, holiness in small things, the fruit of the Spirit, gratitude as worship, fasting/
   silence (gently), serving, community, perseverance. Relationship with God at the centre.
2. **vivir-como-jesus** — "Plan de 90 días para aprender a vivir según la filosofía de Jesús
   (paso a paso)". Jesus' teachings lived out with others: the Sermon on the Mount, the
   beatitudes, love for enemies, forgiveness, humility, service, generosity, honesty ("sea
   vuestro hablar sí, sí"), not judging, the parables applied (the good Samaritan, the prodigal
   son, the talents…), how Jesus treated people (the woman at the well, Zacchaeus, children),
   rest and priorities, the Lord's Prayer phrase by phrase. Relationships and daily conduct at
   the centre. ("filosofía" is the owner's word for the title; in the texts speak of Jesus'
   teachings / way of life — He is Lord, not a philosopher.)
3. **nueva-mentalidad** — "Plan de 90 días para cambiar tu mentalidad y convertirte en un
   verdadero cristiano". Renewing the mind (Romans 12:2): catching and replacing negative
   thoughts, complaining → gratitude, fear/anxiety → trust (Philippians 4:6-8), words that build
   (Proverbs 18:21), identity in Christ (not in failures or others' opinions), comparison and
   envy, resentment, discipline and self-control, contentment, hope, speaking life over family,
   a Christ-centred view of money, work and time. "Verdadero cristiano" = someone whose mind and
   habits are being shaped by Christ — never a judgment of anyone's faith or church.

## Tone (non-negotiable)
- Warm, hopeful, close — like a wise friend who loves Jesus. Address the reader as "tú".
- Everything flows from the love of Christ. NEVER attack, criticise or compare churches,
  denominations, pastors, priests, traditions or institutions. No "religion vs. relationship"
  jabs. No guilt-tripping, no fear, no shame. Grace first, then growth.
- Neutral, simple Latin American Spanish. Short sentences. No jargon without explaining it.
- No prosperity gospel, no promises of money/healing. No political topics.
- Mental health: be pastoral, never clinical. When a day touches anxiety, sadness, grief or
  trauma, include a gentle line that seeking help from a pastor, a counsellor or a professional
  is also a way God cares for us. Never suggest stopping medication or treatment.
- Tasks must be doable by anyone in 5–15 minutes, at home, free, alone or with family. Nothing
  embarrassing or risky; nothing that requires money. Include variety: writing, praying aloud,
  a message to someone, a small act of service, a gratitude list, reading a short passage,
  memorising a verse, a moment of silence, a conversation at dinner…

## Bible
- Quote the **Reina-Valera 1960** text EXACTLY (verse text will be machine-checked against
  RVR1960 afterwards, so do not paraphrase; if a verse is long, quote only the verse(s) cited).
- Reference format: "Libro capítulo:versículo" in Spanish, e.g. "Romanos 12:2", "Salmos 51:10",
  "1 Corintios 13:4-5", "Mateo 5:44". Use "Salmos" (plural) for Psalms. Prefer 1 verse, max 2.
- The verse must fit the day's change precisely — not a generic nice verse. Do not repeat a
  verse within the same plan (except a deliberate callback on the last days, flagged in notes).

## Output format of a day (JSON)
{
  "day": 1,
  "title": "Un corazón dispuesto",            // 2–5 words, the day's idea
  "versiculo": { "texto": "…RVR1960…", "referencia": "Salmos 51:10" },
  "resumen": ["párrafo 1", "párrafo 2", "párrafo 3 (opcional)"],   // 150–230 words in total
  "tarea": "Una tarea pequeña y concreta para hoy (1–2 frases).",
  "practica": ["comportamiento 1 para el día", "comportamiento 2", "comportamiento 3"],
  "meditar": "Una sola pregunta personal."
}
- resumen: explains the idea, connects it with the verse and with real life (concrete everyday
  situations: the queue at the bank, a teenager's reply, the bills, the WhatsApp group…), and
  with the journey so far. No bullet lists inside.
- practica: 3 concrete, observable behaviors ("Antes de responder un mensaje que te molestó,
  espera diez minutos y ora una frase"), not vague wishes ("sé más amable").
