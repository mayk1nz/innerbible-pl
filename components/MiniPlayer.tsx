'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Disc } from './AudioPlayer'
import { Icon } from './icons'
import { closePlayer, hasNeighbour, next, previous, toggle, usePlayer } from '@/lib/player'
import { lessonHref } from '@/lib/progress'

// What is playing, above the tab bar, on every tab: the audio does not stop when the
// member leaves the lesson. Hidden on the lesson that is playing (its big player is
// there) and in the Consejero (its message box sits in the same spot).

export function MiniPlayer() {
  const p = usePlayer()
  const pathname = usePathname() || ''
  const t = p.track
  if (!t || p.missing) return null
  const href = lessonHref(t.productId, t.lessonId)
  if (pathname === href || pathname === '/doradca') return null
  const pct = p.duration ? Math.min(100, (p.time / p.duration) * 100) : 0

  return (
    <>
      <div aria-hidden className="h-20" />
      <div
        role="region"
        aria-label="Teraz odtwarzane"
        className="animate-rise fixed inset-x-0 z-40 px-3"
        style={{ bottom: 'calc(max(env(safe-area-inset-bottom), 12px) + 80px)' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative mx-auto flex max-w-[460px] items-center gap-2.5 overflow-hidden rounded-2xl border border-line bg-surface/95 py-2 pl-2 pr-1.5 shadow-[0_10px_30px_-12px_rgb(53_38_15/0.45)] backdrop-blur">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-line-soft">
            <span className="block h-full bg-gold" style={{ width: `${pct}%` }} />
          </span>
          <Link href={href} className="flex min-w-0 flex-1 items-center gap-2.5">
            <Disc image={t.image} title={t.title} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold text-ink">{t.title}</span>
              <span className="block truncate text-[12.5px] text-muted">{t.subtitle}</span>
            </span>
          </Link>
          <button type="button" onClick={previous} disabled={!hasNeighbour(-1) && p.time <= 5} aria-label="Poprzednie" className="grid size-9 shrink-0 place-items-center rounded-full text-ink hover:bg-surface-hover disabled:opacity-30">
            <Icon name="skipBack" className="size-5" />
          </button>
          <button type="button" onClick={toggle} aria-label={p.playing ? 'Wstrzymaj' : 'Odtwórz'} className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-gold-bright transition active:scale-95">
            <Icon name={p.playing ? 'pause' : 'play'} className="size-5" />
          </button>
          <button type="button" onClick={next} disabled={!hasNeighbour(1)} aria-label="Następne" className="grid size-9 shrink-0 place-items-center rounded-full text-ink hover:bg-surface-hover disabled:opacity-30">
            <Icon name="skipForward" className="size-5" />
          </button>
          <button type="button" onClick={closePlayer} aria-label="Zamknij odtwarzacz" className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-ink">
            <Icon name="x" className="size-4" />
          </button>
        </div>
      </div>
    </>
  )
}
