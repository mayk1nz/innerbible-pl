'use client'

import { Avatar } from './ui'
import type { RankMode, RankRow } from '@/lib/gamification'
import { plural } from '@/lib/text'

const MEDALS: Record<number, string> = { 1: '#e0ac4a', 2: '#c9c3b5', 3: '#c98d58' }

export function RankItem({ row, mode }: { row: RankRow; mode: RankMode }) {
  const medal = MEDALS[row.rank]
  const value = mode === 'semana' ? `${row.weekPoints} pkt` : plural(row.streak, 'dzień', 'dni', 'dni')
  const detail = mode === 'semana' ? `Seria: ${plural(row.streak, 'dzień', 'dni', 'dni')} z rzędu` : `${row.weekPoints} pkt w tym tygodniu`
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${row.me ? 'border-primary/40 bg-[#e8ecf3]' : 'border-line bg-surface'}`}
      aria-current={row.me ? 'true' : undefined}
    >
      <span
        className="grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-bold tabular-nums"
        style={medal ? { background: medal, color: '#35260f' } : { color: 'var(--color-muted)' }}
      >
        {row.rank}
      </span>
      <Avatar name={row.name} size="sm" primary={row.me} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-semibold text-ink">
          {row.me ? 'Ty' : row.name}
        </span>
        <span className="block text-[13px] text-muted">{detail}</span>
      </span>
      <span className="shrink-0 font-serif text-[17px] font-semibold tabular-nums text-ink">{value}</span>
    </li>
  )
}
