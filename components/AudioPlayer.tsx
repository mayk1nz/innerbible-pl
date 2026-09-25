'use client'

import { useRef, useState } from 'react'
import { Icon } from './icons'
import { getAppState, saveAudioPosition } from '@/lib/store'

// Speed, ±15 s, and the position remembered per lesson — the three things the
// reference audio player lacks and a 30-minute narration needs. Reaching the end
// marks the lesson as read.

const RATES = [1, 1.25, 1.5, 2, 0.75]

function clock(sec: number): string {
  const safe = Number.isFinite(sec) && sec > 0 ? sec : 0
  const m = Math.floor(safe / 60)
  const s = Math.floor(safe % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function AudioPlayer({ src, positionKey, onEnded }: { src?: string; positionKey: string; onEnded?: () => void }) {
  const audio = useRef<HTMLAudioElement>(null)
  const lastSaved = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)

  if (!src) {
    return (
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-gold-bright">
          <Icon name="headphones" className="size-7" />
        </span>
        <div>
          <p className="font-semibold text-ink">Nagranie w przygotowaniu</p>
          <p className="text-[14.5px] leading-snug text-muted">Już wkrótce posłuchasz tu tej lekcji.</p>
        </div>
      </div>
    )
  }

  const toggle = () => {
    const el = audio.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }

  const seekBy = (delta: number) => {
    const el = audio.current
    if (!el) return
    const end = Number.isFinite(el.duration) ? el.duration : el.currentTime + delta
    el.currentTime = Math.min(Math.max(0, el.currentTime + delta), end)
  }

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length]
    setRate(next)
    if (audio.current) audio.current.playbackRate = next
  }

  return (
    <div className="rounded-3xl bg-primary p-5 text-white shadow-float">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          setDuration(el.duration)
          el.playbackRate = rate
          const saved = getAppState().audioPos[positionKey]
          if (saved && saved < el.duration - 5) {
            el.currentTime = saved
            setTime(saved)
          }
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setTime(t)
          if (Math.abs(t - lastSaved.current) >= 5) {
            lastSaved.current = t
            saveAudioPosition(positionKey, t)
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false)
          saveAudioPosition(positionKey, e.currentTarget.currentTime)
        }}
        onEnded={() => {
          setPlaying(false)
          saveAudioPosition(positionKey, 0)
          onEnded?.()
        }}
      />
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={1}
        value={Math.min(time, duration || 0)}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (audio.current) audio.current.currentTime = v
          setTime(v)
        }}
        aria-label="Pozycja odtwarzania"
        className="w-full accent-gold-bright"
      />
      <div className="mt-1 flex justify-between text-xs tabular-nums text-white/75">
        <span>{clock(time)}</span>
        <span>{clock(duration)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={cycleRate} aria-label={`Prędkość ${String(rate).replace('.', ',')}x`} className="min-w-14 rounded-full border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
          {String(rate).replace('.', ',')}x
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => seekBy(-15)} aria-label="Cofnij o 15 sekund" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
            <Icon name="rewind" className="size-6" />
          </button>
          <button type="button" onClick={toggle} aria-label={playing ? 'Wstrzymaj' : 'Odtwórz'} className="grid size-16 place-items-center rounded-full bg-gold-bright text-primary transition active:scale-95">
            <Icon name={playing ? 'pause' : 'play'} className="size-7" />
          </button>
          <button type="button" onClick={() => seekBy(15)} aria-label="Przewiń o 15 sekund do przodu" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
            <Icon name="forward" className="size-6" />
          </button>
        </div>
        <span className="min-w-14" aria-hidden />
      </div>
    </div>
  )
}
