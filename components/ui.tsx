'use client'

import type { ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { FONT_SCALE_MAX, FONT_SCALE_MIN, setFontScale } from '@/lib/store'
import { initial } from '@/lib/text'

export { buttonClass } from './styles'

// Avatar colours for other members: deterministic per name, all dark enough for white
// text. Navy is left out on purpose — it marks "you" everywhere.
const TONES = ['#6b3f1d', '#2d5a4a', '#57406b', '#7a2e2e', '#4a5a2a', '#5d4a1f', '#2f5560']

function toneFor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[h % TONES.length]
}

export function Avatar({ name, size = 'md', primary = false }: { name: string; size?: 'sm' | 'md' | 'lg'; primary?: boolean }) {
  const cls = size === 'sm' ? 'size-9 text-[15px]' : size === 'lg' ? 'size-20 text-3xl' : 'size-11 text-lg'
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${cls}`}
      style={{ background: primary ? 'var(--color-primary)' : toneFor(name) }}
    >
      {initial(name)}
    </span>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3.5 mt-10 flex items-end justify-between gap-3">
      <h2 className="font-serif text-[22px] font-semibold leading-tight text-ink">{children}</h2>
      {action}
    </div>
  )
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2 w-full overflow-hidden rounded-full bg-line-soft"
    >
      <div className="h-full rounded-full bg-gold-bright transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label: string
}) {
  return (
    <label className="flex min-h-13 items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 focus-within:border-primary">
      <span className="sr-only">{label}</span>
      <Icon name="search" className="size-5 shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-ink placeholder:text-muted focus:outline-none"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Wyczyść wyszukiwanie" className="-mr-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface">
          <Icon name="x" className="size-4" />
        </button>
      )}
    </label>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-surface-2 px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-gold-soft text-gold">
        <Icon name={icon} className="size-8" />
      </span>
      <p className="mt-4 font-serif text-[20px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-xs text-[15.5px] leading-relaxed text-muted">{text}</p>
      {action && <div className="mt-5 w-full max-w-xs">{action}</div>}
    </div>
  )
}

export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-24 rounded-[28px]' : 'size-12 rounded-2xl'
  const icon = size === 'lg' ? 'size-11' : 'size-6'
  return (
    <span
      aria-hidden
      className={`grid place-items-center text-gold-bright shadow-card ${box}`}
      style={{ backgroundImage: 'radial-gradient(120% 80% at 50% 0%, rgba(255,210,130,.45), transparent 60%), linear-gradient(180deg, #2b2418, #0c0a07)' }}
    >
      <Icon name="book" className={icon} strokeWidth={1.6} />
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl border border-line bg-surface p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`min-h-11 rounded-xl px-3 text-[15px] font-semibold transition ${active ? 'bg-surface-2 text-ink shadow-card' : 'text-muted hover:text-ink'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** A− / A+ for the reading size. The choice is remembered for every lesson. */
export function FontScaleControl({ scale }: { scale: number }) {
  return (
    <div role="group" aria-label="Rozmiar tekstu" className="flex items-center rounded-full border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => setFontScale(scale - 0.1)}
        disabled={scale <= FONT_SCALE_MIN}
        aria-label="Mniejszy tekst"
        className="grid size-11 place-items-center rounded-l-full font-serif text-[15px] font-semibold text-ink disabled:opacity-35"
      >
        A
      </button>
      <span className="h-5 w-px bg-line" aria-hidden />
      <button
        type="button"
        onClick={() => setFontScale(scale + 0.1)}
        disabled={scale >= FONT_SCALE_MAX}
        aria-label="Większy tekst"
        className="grid size-11 place-items-center rounded-r-full font-serif text-[21px] font-semibold text-ink disabled:opacity-35"
      >
        A
      </button>
    </div>
  )
}
