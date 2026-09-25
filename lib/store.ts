import { useSyncExternalStore } from 'react'
import type { OfferId } from './catalog'
import { POINTS } from './config'
import { localDay } from './dates'

// The member's state. While the app runs on sample data it lives in localStorage;
// every action below maps one-to-one to a future backend call (completions,
// reflections, posts, likes and points become tables; the session becomes an email
// code login). Components only use the hooks and actions exported here, so swapping
// the backend does not touch the UI.

export interface Session {
  email: string
  name: string
}
export interface Completion {
  day: string
  at: number
}
export interface Reflection {
  text: string
  shared: boolean
  at: number
}
export interface UserPost {
  id: string
  text: string
  at: number
  lessonKey: string | null
}
export interface PostComment {
  id: string
  author: string
  text: string
  at: number
}
export type PointKind = 'lesson' | 'reflection' | 'post'
export interface PointEvent {
  id: string
  kind: PointKind
  pts: number
  day: string
  at: number
}

export interface AppState {
  v: 1
  session: Session | null
  owned: OfferId[]
  completed: Record<string, Completion>
  reflections: Record<string, Reflection>
  posts: UserPost[]
  likes: Record<string, true>
  comments: Record<string, PostComment[]>
  points: PointEvent[]
  lastLesson: string | null
  fontScale: number
  audioPos: Record<string, number>
  theme: 'light' | 'dark'
  /** The member is on the annual plan (from the server). */
  annual: boolean
  /** Start of the member's 15 days of 50% off (from the server). */
  offerStartedAt: string | null
}

export const DEFAULT_STATE: AppState = {
  v: 1,
  session: null,
  owned: [],
  completed: {},
  reflections: {},
  posts: [],
  likes: {},
  comments: {},
  points: [],
  lastLesson: null,
  fontScale: 1,
  audioPos: {},
  theme: 'light',
  annual: false,
  offerStartedAt: null,
}

import { STORAGE_KEY } from './storage-key'
const OFFER_IDS: readonly OfferId[] = ['front', 'upsell1', 'upsell2']
export const FONT_SCALE_MIN = 0.9
export const FONT_SCALE_MAX = 1.4

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function clampScale(n: number): number {
  return Math.round(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, n)) * 10) / 10
}

function sanitize(raw: unknown): AppState {
  if (!isRecord(raw) || raw.v !== 1) return DEFAULT_STATE
  const sess = raw.session
  const session = isRecord(sess) && typeof sess.email === 'string' && typeof sess.name === 'string'
    ? { email: sess.email, name: sess.name }
    : null
  return {
    v: 1,
    session,
    // Only a cache: AppShell refreshes it from the server (/api/auth/me) on every visit.
    owned: Array.isArray(raw.owned) ? raw.owned.filter((o): o is OfferId => OFFER_IDS.includes(o as OfferId)) : [],
    completed: isRecord(raw.completed) ? (raw.completed as AppState['completed']) : {},
    reflections: isRecord(raw.reflections) ? (raw.reflections as AppState['reflections']) : {},
    posts: Array.isArray(raw.posts) ? (raw.posts as UserPost[]) : [],
    likes: isRecord(raw.likes) ? (raw.likes as AppState['likes']) : {},
    comments: isRecord(raw.comments) ? (raw.comments as AppState['comments']) : {},
    points: Array.isArray(raw.points) ? (raw.points as PointEvent[]) : [],
    lastLesson: typeof raw.lastLesson === 'string' ? raw.lastLesson : null,
    fontScale: typeof raw.fontScale === 'number' ? clampScale(raw.fontScale) : 1,
    audioPos: isRecord(raw.audioPos) ? (raw.audioPos as AppState['audioPos']) : {},
    theme: raw.theme === 'dark' ? 'dark' : 'light',
    annual: raw.annual === true,
    offerStartedAt: typeof raw.offerStartedAt === 'string' ? raw.offerStartedAt : null,
  }
}

let state: AppState | undefined
const listeners = new Set<() => void>()

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

export function getAppState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  if (state === undefined) state = load()
  return state
}

function commit(next: AppState): void {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked: memory still works for this visit
  }
  listeners.forEach((l) => l())
}

function update(fn: (s: AppState) => AppState): void {
  const prev = getAppState()
  const next = fn(prev)
  if (next !== prev) commit(next)
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  // Another tab changed the state (e.g. marked a lesson): follow it.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    state = load()
    cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

// ─── Hooks ─────────────────────────────────────────────────────────

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getAppState, () => DEFAULT_STATE)
}

const subscribeNothing = () => () => {}

/** false on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNothing, () => true, () => false)
}

function subscribeClock(cb: () => void): () => void {
  const id = window.setInterval(cb, 30_000)
  return () => window.clearInterval(id)
}

/** Current minute (epoch minutes). Re-renders at most twice a minute. 0 on the server. */
export function useNowMinute(): number {
  return useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / 60_000), () => 0)
}

/** The member's local day ("YYYY-MM-DD"); '' on the server. Rolls over at midnight. */
export function useToday(): string {
  return useSyncExternalStore(subscribeClock, () => localDay(Date.now()), () => '')
}

// ─── Actions ───────────────────────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function omit<T>(obj: Record<string, T>, key: string): Record<string, T> {
  const next = { ...obj }
  delete next[key]
  return next
}

function withPoint(points: PointEvent[], id: string, kind: PointKind, pts: number, at: number): PointEvent[] {
  if (points.some((p) => p.id === id)) return points
  return [...points, { id, kind, pts, day: localDay(at), at }]
}

function withoutPoint(points: PointEvent[], id: string): PointEvent[] {
  return points.some((p) => p.id === id) ? points.filter((p) => p.id !== id) : points
}

/**
 * The member as the server knows them (after /api/auth/login or /api/auth/me): the
 * offers come from the purchases, never from this device. Progress on this device is
 * kept; if another e-mail signs in here, it starts from scratch.
 */
export interface ServerMember {
  owned: OfferId[]
  name?: string
  annual?: boolean
  offerStartedAt?: string | null
}

export function setMember(email: string, fallbackName: string, me: ServerMember): void {
  update((s) => {
    const same = s.session?.email === email
    const base = same ? s : { ...DEFAULT_STATE, fontScale: s.fontScale, theme: s.theme }
    // A name saved on the server (edited in the profile) wins over the one guessed from the e-mail.
    const finalName = me.name || (same ? s.session?.name : '') || fallbackName
    return {
      ...base,
      session: { email, name: finalName },
      owned: me.owned.filter((o) => OFFER_IDS.includes(o)),
      annual: me.annual === true,
      offerStartedAt: me.offerStartedAt ?? base.offerStartedAt,
    }
  })
}

export function setName(name: string): void {
  update((s) => (s.session ? { ...s, session: { ...s.session, name } } : s))
}

export function setTheme(theme: 'light' | 'dark'): void {
  update((s) => (s.theme === theme ? s : { ...s, theme }))
}

export function signOut(): void {
  update((s) => ({ ...s, session: null }))
  // Also end the server session (the cookie); if offline, the next /me check does it.
  void fetch('/api/auth/me', { method: 'DELETE' }).catch(() => {})
}

export function completeLesson(key: string): void {
  update((s) => {
    if (s.completed[key]) return s
    const at = Date.now()
    return {
      ...s,
      completed: { ...s.completed, [key]: { day: localDay(at), at } },
      points: withPoint(s.points, `lesson:${key}`, 'lesson', POINTS.lesson, at),
      lastLesson: key,
    }
  })
}

export function uncompleteLesson(key: string): void {
  update((s) => {
    if (!s.completed[key]) return s
    return { ...s, completed: omit(s.completed, key), points: withoutPoint(s.points, `lesson:${key}`) }
  })
}

export function toggleLesson(key: string): void {
  if (getAppState().completed[key]) uncompleteLesson(key)
  else completeLesson(key)
}

export function setLastLesson(key: string): void {
  update((s) => (s.lastLesson === key ? s : { ...s, lastLesson: key }))
}

export function saveReflection(key: string, text: string, shared: boolean): void {
  update((s) => {
    const clean = text.trim().slice(0, 1200)
    if (!clean) {
      return { ...s, reflections: omit(s.reflections, key), points: withoutPoint(s.points, `reflection:${key}`) }
    }
    const at = Date.now()
    return {
      ...s,
      reflections: { ...s.reflections, [key]: { text: clean, shared, at: s.reflections[key]?.at ?? at } },
      points: withPoint(s.points, `reflection:${key}`, 'reflection', POINTS.reflection, at),
    }
  })
}

export function addPost(text: string, lessonKey: string | null): void {
  const clean = text.trim().slice(0, 1500)
  if (!clean) return
  update((s) => {
    const at = Date.now()
    const id = uid('post')
    return {
      ...s,
      posts: [{ id, text: clean, at, lessonKey }, ...s.posts],
      points: withPoint(s.points, `post:${id}`, 'post', POINTS.post, at),
    }
  })
}

export function toggleLike(postId: string): void {
  update((s) => ({
    ...s,
    likes: s.likes[postId] ? omit(s.likes, postId) : { ...s.likes, [postId]: true as const },
  }))
}

export function addComment(postId: string, text: string): void {
  const clean = text.trim().slice(0, 800)
  if (!clean) return
  update((s) => {
    const author = s.session?.name ?? 'Tú'
    const comment: PostComment = { id: uid('c'), author, text: clean, at: Date.now() }
    return { ...s, comments: { ...s.comments, [postId]: [...(s.comments[postId] ?? []), comment] } }
  })
}

export function setFontScale(value: number): void {
  update((s) => {
    const next = clampScale(value)
    return next === s.fontScale ? s : { ...s, fontScale: next }
  })
}

export function saveAudioPosition(key: string, seconds: number): void {
  update((s) => ({ ...s, audioPos: { ...s.audioPos, [key]: Math.max(0, Math.floor(seconds)) } }))
}

// ─── Demo only (profile panel) ─────────────────────────────────────

export function setOfferOwned(offer: OfferId, owned: boolean): void {
  update((s) => {
    const has = s.owned.includes(offer)
    if (has === owned) return s
    return { ...s, owned: owned ? [...s.owned, offer] : s.owned.filter((o) => o !== offer) }
  })
}

export function resetProgress(): void {
  update((s) => ({ ...DEFAULT_STATE, session: s.session, owned: s.owned, fontScale: s.fontScale, theme: s.theme, annual: s.annual }))
}
