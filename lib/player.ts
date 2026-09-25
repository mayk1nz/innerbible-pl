'use client'

import { useSyncExternalStore } from 'react'
import type { Lesson, Product } from './catalog'
import { findLesson, lessonKey } from './progress'
import { completeLesson, getAppState, saveAudioPosition } from './store'

// The app's one audio player. A single <audio> element lives here, outside any page,
// so what is playing keeps playing while the member moves between tabs (the mini
// player in AppShell shows it). The lesson page and the mini player are two views of
// this same state. There is no download: the file comes from a short-lived link that
// only a buyer gets, and no control offers to save it.

export interface Track {
  key: string
  productId: string
  lessonId: string
  src: string
  title: string
  subtitle: string
  image?: string
}

export interface PlayerState {
  track: Track | null
  playing: boolean
  time: number
  duration: number
  rate: number
  /** The file is not there (not uploaded yet). */
  missing: boolean
}

const RATES = [1, 1.25, 1.5, 2, 0.75]
const IDLE: PlayerState = { track: null, playing: false, time: 0, duration: 0, rate: 1, missing: false }

let state: PlayerState = IDLE
let audio: HTMLAudioElement | null = null
let lastSaved = 0
const listeners = new Set<() => void>()

function set(patch: Partial<PlayerState>): void {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function trackFor(product: Product, lesson: Lesson): Track | null {
  if (!lesson.audioSrc) return null
  return {
    key: lessonKey(product.id, lesson.id),
    productId: product.id,
    lessonId: lesson.id,
    src: lesson.audioSrc,
    title: lesson.title,
    subtitle: product.title,
    image: lesson.image,
  }
}

/** The audio lesson before/after the current one, in the product's order. */
function neighbour(delta: 1 | -1): Track | null {
  const t = state.track
  const ref = t ? findLesson(t.productId, t.lessonId) : null
  if (!ref) return null
  const flat = ref.product.sections.flatMap((s) => s.lessons).filter((l) => l.audioSrc)
  const i = flat.findIndex((l) => l.id === ref.lesson.id)
  const other = flat[i + delta]
  return other ? trackFor(ref.product, other) : null
}

function element(): HTMLAudioElement {
  if (audio) return audio
  const el = new Audio()
  el.preload = 'metadata'
  el.setAttribute('controlsList', 'nodownload')
  el.addEventListener('loadedmetadata', () => {
    const key = state.track?.key
    const saved = key ? getAppState().audioPos[key] : 0
    if (saved && saved < el.duration - 5) el.currentTime = saved
    el.playbackRate = state.rate
    set({ duration: el.duration, time: el.currentTime })
  })
  el.addEventListener('timeupdate', () => {
    const t = el.currentTime
    // Twice a second is plenty for the screen.
    if (Math.abs(t - state.time) >= 0.5) set({ time: t })
    const key = state.track?.key
    if (key && Math.abs(t - lastSaved) >= 5) {
      lastSaved = t
      saveAudioPosition(key, t)
    }
  })
  el.addEventListener('play', () => set({ playing: true }))
  el.addEventListener('pause', () => {
    set({ playing: false })
    if (state.track) saveAudioPosition(state.track.key, el.currentTime)
  })
  el.addEventListener('error', () => set({ playing: false, missing: true }))
  el.addEventListener('ended', () => {
    const t = state.track
    set({ playing: false })
    if (!t) return
    saveAudioPosition(t.key, 0)
    completeLesson(t.key)
    // Like an audiobook: the next chapter starts by itself.
    const next = neighbour(1)
    if (next) playTrack(next)
  })
  audio = el
  mediaSession()
  return el
}

function mediaSession(): void {
  if (!('mediaSession' in navigator)) return
  const ms = navigator.mediaSession
  ms.setActionHandler('play', () => void element().play().catch(() => {}))
  ms.setActionHandler('pause', () => element().pause())
  ms.setActionHandler('previoustrack', () => previous())
  ms.setActionHandler('nexttrack', () => next())
  ms.setActionHandler('seekbackward', () => seekBy(-15))
  ms.setActionHandler('seekforward', () => seekBy(15))
}

function showOnLockScreen(t: Track): void {
  if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: t.title,
    artist: t.subtitle,
    artwork: t.image ? [{ src: new URL(t.image, location.origin).href, sizes: '512x512', type: 'image/webp' }] : [],
  })
}

/** Plays a lesson: resumes it if it is the current one, otherwise switches to it. */
export function playTrack(t: Track): void {
  const el = element()
  if (state.track?.key !== t.key) {
    if (state.track) saveAudioPosition(state.track.key, el.currentTime)
    lastSaved = 0
    set({ track: t, playing: false, time: getAppState().audioPos[t.key] ?? 0, duration: 0, missing: false })
    el.src = t.src
    showOnLockScreen(t)
  }
  void el.play().catch(() => {})
}

export function toggle(): void {
  const el = element()
  if (!state.track) return
  if (el.paused) void el.play().catch(() => {})
  else el.pause()
}

export function seek(seconds: number): void {
  const el = element()
  el.currentTime = Math.max(0, Math.min(seconds, Number.isFinite(el.duration) ? el.duration : seconds))
  set({ time: el.currentTime })
}

export function seekBy(delta: number): void {
  seek(element().currentTime + delta)
}

export function cycleRate(): void {
  const rate = RATES[(RATES.indexOf(state.rate) + 1) % RATES.length]
  element().playbackRate = rate
  set({ rate })
}

export function next(): void {
  const t = neighbour(1)
  if (t) playTrack(t)
}

export function previous(): void {
  // Like any player: back to the start first, the previous track on a second tap.
  if (state.time > 5) return seek(0)
  const t = neighbour(-1)
  if (t) playTrack(t)
}

export function hasNeighbour(delta: 1 | -1): boolean {
  return neighbour(delta) !== null
}

/** Stops and hides the mini player (the position is kept). */
export function closePlayer(): void {
  const el = audio
  if (el && state.track) {
    saveAudioPosition(state.track.key, el.currentTime)
    el.pause()
  }
  set({ ...IDLE, rate: state.rate })
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function usePlayer(): PlayerState {
  return useSyncExternalStore(subscribe, () => state, () => IDLE)
}
