/** "Dlaczego Biblia dzieli się…?" → "dlaczego-biblia-dzieli-sie". Stable ids for lessons. */
export function slugify(input: string): string {
  return input
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Accent- and case-insensitive form for search ("Księga" matches "ksiega"). */
export function normalize(input: string): string {
  return input.replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** "kasia.nowak82@gmail.com" → "Kasia". Used until the member sets a name. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const word = local.split(/[._+\-\d]+/).find((w) => w.length > 1) ?? ''
  if (!word) return 'Przyjaciel'
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function initial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase()
}

/**
 * Polish plural: 1 dzień · 2–4 dni · 5+ dni (12–14 take the "many" form).
 * `plural(3, 'punkt', 'punkty', 'punktów')` → "3 punkty".
 */
export function pluralWord(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  const d = n % 10
  const dd = n % 100
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many
}

export function plural(n: number, one: string, few: string, many: string): string {
  return `${n} ${pluralWord(n, one, few, many)}`
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return 'teraz'
  if (minutes < 60) return `${minutes} min temu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} godz. temu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'wczoraj'
  if (days < 7) return `${days} dni temu`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? 'tydzień temu' : `${plural(weeks, 'tydzień', 'tygodnie', 'tygodni')} temu`
}
