import type { CSSProperties } from 'react'
import type { CoverStyle } from '@/lib/catalog'
import { APP } from '@/lib/config'
import { Icon } from './icons'

// Covers are drawn, not images: one gradient and the product's title in type. Every
// product gets a consistent cover from day one, they weigh nothing, and swapping in
// real artwork later only means rendering an <img> here instead.

function background(c: CoverStyle): CSSProperties {
  return {
    backgroundImage: `radial-gradient(120% 75% at 50% -5%, ${c.glow} 0%, transparent 60%), linear-gradient(180deg, ${c.from} 0%, ${c.to} 100%)`,
  }
}

// The cover stays readable under the lock: a light dim and a badge in the corner, so
// the member still sees what they would be unlocking.
function LockOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 bg-[#0b0906]/35">
      <span
        className={`absolute flex items-center gap-1 rounded-full bg-[#fdf7e8] font-semibold text-[#35260f] shadow-card ${compact ? 'right-1 top-1 p-1' : 'right-2.5 top-2.5 px-2.5 py-1 text-[12.5px]'}`}
      >
        <Icon name="lock" className={compact ? 'size-3.5' : 'size-3.5'} strokeWidth={2.2} />
        {!compact && 'Zablokowane'}
      </span>
    </div>
  )
}

export function Cover({ cover, size, locked = false }: { cover: CoverStyle; size: 'hero' | 'banner' | 'tile' | 'thumb'; locked?: boolean }) {
  if (size === 'thumb') {
    return (
      <div aria-hidden className="relative size-[76px] shrink-0 overflow-hidden rounded-xl" style={background(cover)}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
          <Icon name={cover.icon} className="size-6 text-gold-bright" strokeWidth={1.6} />
          <span className="font-serif text-[10px] font-bold uppercase leading-tight tracking-wide text-[#f6e9c8]">{cover.highlight}</span>
        </div>
        {locked && <LockOverlay compact />}
      </div>
    )
  }

  // A banner is the hero's type on a short strip: the offer below gets the room.
  if (size === 'banner') {
    return (
      <div aria-hidden className="relative flex h-36 w-full flex-col items-center justify-center overflow-hidden px-5 text-center" style={background(cover)}>
        <span className="font-serif text-[14px] font-medium uppercase leading-[1.1] tracking-[0.06em] text-[#fbf1dc] [text-shadow:0_0_24px_rgba(255,220,160,0.35)]">
          {cover.lines.join(' ')}
        </span>
        <span className={`mt-1 font-serif font-black uppercase leading-none text-gold-bright ${cover.highlight.length >= 7 ? 'text-[34px]' : 'text-[44px]'}`}>
          {cover.highlight}
        </span>
        {locked && <LockOverlay />}
      </div>
    )
  }

  const hero = size === 'hero'
  const long = cover.highlight.length >= 7
  const highlightSize = hero ? (long ? 'text-[46px]' : 'text-[64px]') : long ? 'text-[22px]' : 'text-[30px]'

  return (
    <div aria-hidden className={`relative w-full overflow-hidden ${hero ? 'aspect-[5/4]' : 'aspect-[4/3]'}`} style={background(cover)}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        {cover.lines.map((line) => (
          <span
            key={line}
            className={`font-serif font-medium uppercase leading-[1.05] text-[#fbf1dc] [text-shadow:0_0_24px_rgba(255,220,160,0.35)] ${hero ? 'text-[25px] tracking-[0.05em]' : 'text-[12.5px] tracking-[0.06em]'}`}
          >
            {line}
          </span>
        ))}
        <span className={`font-serif font-black uppercase leading-none tracking-[-0.01em] text-gold-bright ${hero ? 'mt-1.5' : 'mt-1'} ${highlightSize}`}>
          {cover.highlight}
        </span>
        <span className={`absolute bottom-[7%] font-semibold uppercase text-[#fbf1dc]/65 ${hero ? 'text-[10px] tracking-[0.32em]' : 'text-[8px] tracking-[0.26em]'}`}>
          {APP.name}
        </span>
      </div>
      {/* On a tile the lock is just the icon: the tile already says "Desbloquear", and its corner holds the 50% badge. */}
      {locked && <LockOverlay compact={!hero} />}
    </div>
  )
}
