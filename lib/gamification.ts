import { SEED_MEMBERS } from './community-seed'
import { addDays, weekStart } from './dates'
import type { AppState } from './store'

// Streak = consecutive local days with at least one lesson marked as read. A day
// without reading yet (today) does not break it: the streak still counts from
// yesterday until midnight, so the member always has "today" to keep it alive.
//
// Points reset every Monday in the ranking, so a newcomer can reach the top in their
// first week; the all-time total stays on the profile.

export interface Stats {
  streak: number
  best: number
  weekPoints: number
  totalPoints: number
  lessonsDone: number
  doneToday: boolean
}

export function streakFrom(days: ReadonlySet<string>, today: string): number {
  let cursor = days.has(today) ? today : addDays(today, -1)
  let count = 0
  while (days.has(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

export function bestStreak(days: ReadonlySet<string>): number {
  let best = 0
  let run = 0
  let prev = ''
  for (const day of [...days].sort()) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }
  return best
}

export function computeStats(s: AppState, today: string): Stats {
  const days = new Set(Object.values(s.completed).map((c) => c.day))
  const monday = today ? weekStart(today) : ''
  const sum = (from: string) =>
    s.points.reduce((total, p) => (from === '' || p.day >= from ? total + p.pts : total), 0)
  return {
    streak: today ? streakFrom(days, today) : 0,
    best: bestStreak(days),
    weekPoints: monday ? sum(monday) : 0,
    totalPoints: sum(''),
    lessonsDone: Object.keys(s.completed).length,
    doneToday: today ? days.has(today) : false,
  }
}

export type RankMode = 'semana' | 'racha'

export interface RankRow {
  name: string
  weekPoints: number
  streak: number
  rank: number
  me: boolean
}

export function leaderboard(mode: RankMode, me: { name: string; weekPoints: number; streak: number }): RankRow[] {
  const rows = [
    ...SEED_MEMBERS.map((m) => ({ ...m, me: false })),
    { ...me, me: true },
  ]
  rows.sort((a, b) =>
    mode === 'semana'
      ? b.weekPoints - a.weekPoints || b.streak - a.streak || Number(b.me) - Number(a.me)
      : b.streak - a.streak || b.weekPoints - a.weekPoints || Number(b.me) - Number(a.me),
  )
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}
