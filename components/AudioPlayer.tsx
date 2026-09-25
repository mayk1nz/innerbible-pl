'use client'

import { useEffect, useState } from 'react'
import { Icon } from './icons'
import type { CoverStyle } from '@/lib/catalog'
import { cycleRate, hasNeighbour, next, playTrack, previous, seek, seekBy, toggle, usePlayer, type Track } from '@/lib/player'
import { useAppState } from '@/lib/store'

// The lesson's big player: a view of the app's one audio player (lib/player.ts), so
// leaving the page keeps the audio going in the mini player. Speed, ±15 s and the
// position remembered per lesson. No download.

function clock(sec: number): string {
  const safe = Number.isFinite(sec) && sec > 0 ? sec : 0
  const m = Math.floor(safe / 60)
  const s = Math.floor(safe % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Round cover: the lesson's own artwork, or the product's colours if there is none. */
export function Disc({ image, cover, title, size = 'lg' }: { image?: string; cover?: CoverStyle; title: string; size?: 'lg' | 'sm' }) {
  const [failed, setFailed] = useState<string | null>(null)
  const showImage = image && failed !== image
  const bg = cover
    ? `radial-gradient(120% 75% at 50% -5%, ${cover.glow} 0%, transparent 60%), linear-gradient(180deg, ${cover.from} 0%, ${cover.to} 100%)`
    : undefined
  const lg = size === 'lg'
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden bg-primary ${lg ? 'mx-auto size-48 rounded-full border-[6px] border-gold-soft shadow-float' : 'size-11 rounded-xl'}`}
      style={bg ? { backgroundImage: bg } : undefined}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" draggable={false} onError={() => setFailed(image)} className="absolute inset-0 size-full object-cover" />
      ) : lg ? (
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <Icon name="headphones" className="size-8 text-gold-bright" />
          <span className="line-clamp-2 font-serif text-[15px] font-semibold uppercase leading-tight tracking-wide text-[#fbf1dc]">{title}</span>
        </div>
      ) : (
        <Icon name="headphones" className="size-5 text-gold-bright" />
      )}
    </div>
  )
}

/** Whether the file is there, asked once per lesson (the route answers 404 until it is uploaded). */
function useAvailable(src: string): boolean | null {
  const [result, setResult] = useState<{ src: string; ok: boolean } | null>(null)
  useEffect(() => {
    let alive = true
    fetch(src, { method: 'HEAD', redirect: 'manual', cache: 'no-store' })
      .then((r) => alive && setResult({ src, ok: r.type === 'opaqueredirect' || r.ok }))
      .catch(() => alive && setResult({ src, ok: true }))
    return () => {
      alive = false
    }
  }, [src])
  return result?.src === src ? result.ok : null
}

export function AudioPlayer({ track, cover }: { track: Track; cover?: CoverStyle }) {
  const p = usePlayer()
  const { audioPos } = useAppState()
  const available = useAvailable(track.src)
  const current = p.track?.key === track.key
  const missing = available === false || (current && p.missing)

  if (missing) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-5 text-center shadow-card">
        <Disc image={track.image} cover={cover} title={track.title} />
        <p className="mt-4 font-serif text-[20px] font-semibold text-ink">{track.title}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-soft/70 px-3 py-1 text-[14px] font-medium text-ink">
          <Icon name="headphones" className="size-4 text-gold" />
          Nagranie w przygotowaniu
        </p>
        <p className="mx-auto mt-2 max-w-xs text-[14.5px] leading-snug text-muted">Już wkrótce posłuchasz tu tej lekcji.</p>
      </div>
    )
  }

  const time = current ? p.time : (audioPos[track.key] ?? 0)
  const duration = current ? p.duration : 0
  const playing = current && p.playing

  return (
    <div className="rounded-3xl border border-line bg-surface px-5 pb-5 pt-4 shadow-card" onContextMenu={(e) => e.preventDefault()}>
      <button
        type="button"
        onClick={cycleRate}
        aria-label={`Prędkość ${p.rate}x`}
        className="min-w-14 rounded-full border border-gold/50 bg-gold-soft/60 px-3 py-1.5 text-[13.5px] font-bold text-gold transition hover:bg-gold-soft"
      >
        {p.rate}×
      </button>
      <div className="mt-1">
        <Disc image={track.image} cover={cover} title={track.title} />
      </div>
      <p className="mt-4 text-center font-serif text-[21px] font-semibold leading-snug text-ink">{track.title}</p>
      <p className="mt-0.5 text-center text-[14.5px] text-muted">{track.subtitle}</p>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.min(time, duration || 0)}
        disabled={!current || !duration}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Pozycja nagrania"
        className="mt-4 w-full accent-gold"
      />
      <div className="mt-1 flex justify-between text-xs tabular-nums text-muted">
        <span>{clock(time)}</span>
        <span>{duration ? `-${clock(Math.max(0, duration - time))}` : '--:--'}</span>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={previous} disabled={!current || !hasNeighbour(-1)} aria-label="Poprzednie" className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-hover disabled:opacity-30">
          <Icon name="skipBack" className="size-6" />
        </button>
        <button type="button" onClick={() => (current ? seekBy(-15) : undefined)} disabled={!current} aria-label="Cofnij o 15 sekund" className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-hover disabled:opacity-30">
          <Icon name="rewind" className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => (current ? toggle() : playTrack(track))}
          aria-label={playing ? 'Wstrzymaj' : 'Odtwórz'}
          className="mx-1 grid size-[72px] place-items-center rounded-full bg-primary text-gold-bright shadow-float transition active:scale-95"
        >
          <Icon name={playing ? 'pause' : 'play'} className="size-8" />
        </button>
        <button type="button" onClick={() => (current ? seekBy(15) : undefined)} disabled={!current} aria-label="Przewiń o 15 sekund do przodu" className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-hover disabled:opacity-30">
          <Icon name="forward" className="size-6" />
        </button>
        <button type="button" onClick={next} disabled={!current || !hasNeighbour(1)} aria-label="Następne" className="grid size-11 place-items-center rounded-full text-ink hover:bg-surface-hover disabled:opacity-30">
          <Icon name="skipForward" className="size-6" />
        </button>
      </div>
    </div>
  )
}
