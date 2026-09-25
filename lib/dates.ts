// Local calendar days as "YYYY-MM-DD" strings: streaks count the member's own days,
// not UTC ones, and the strings compare correctly with < and >.

const pad = (n: number) => String(n).padStart(2, '0')

export function localDay(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day)
  d.setDate(d.getDate() + n)
  return localDay(d.getTime())
}

/** Monday of the week that contains `day`. The weekly ranking resets on it. */
export function weekStart(day: string): string {
  const offset = (parseDay(day).getDay() + 6) % 7
  return addDays(day, -offset)
}
