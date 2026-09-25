'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../icons'
import { RankItem } from '../Leaderboard'
import { PageHeader } from '../PageHeader'
import { Avatar, Segmented } from '../ui'
import { SEED_POSTS, type SeedComment } from '@/lib/community-seed'
import { POINTS } from '@/lib/config'
import { computeStats, leaderboard, type RankMode } from '@/lib/gamification'
import { findLessonByKey, lessonHref } from '@/lib/progress'
import { addComment, addPost, toggleLike, useAppState, useNowMinute, useToday, type PostComment } from '@/lib/store'
import { timeAgo } from '@/lib/text'

type Tab = 'muro' | 'constancia'

export function CommunityView() {
  const params = useSearchParams()
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'constancia' ? 'constancia' : 'muro')
  return (
    <>
      <PageHeader title="Wspólnota" subtitle="Dziel się swoją drogą i ucz się razem z braćmi i siostrami" />
      <Segmented
        label="Sekcje wspólnoty"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'muro', label: 'Tablica' },
          { value: 'constancia', label: 'Wytrwałość' },
        ]}
      />
      <div className="mt-5">{tab === 'muro' ? <Wall /> : <Standing />}</div>
    </>
  )
}

// ─── Muro ──────────────────────────────────────────────────────────

interface FeedItem {
  id: string
  author: string
  text: string
  ago: number
  baseLikes: number
  lessonKey: string | null
  mine: boolean
  seedComments: SeedComment[]
}

function Wall() {
  const s = useAppState()
  const minute = useNowMinute()
  const me = s.session?.name ?? 'Ty'

  const items = useMemo<FeedItem[]>(() => {
    const own = s.posts.map((p) => ({
      id: p.id,
      author: me,
      text: p.text,
      ago: minute ? Math.max(0, minute - Math.floor(p.at / 60_000)) : 0,
      baseLikes: 0,
      lessonKey: p.lessonKey,
      mine: true,
      seedComments: [],
    }))
    const seed = SEED_POSTS.map((p) => ({
      id: p.id,
      author: p.author,
      text: p.text,
      ago: p.ageMin,
      baseLikes: p.likes,
      lessonKey: p.lessonKey ?? null,
      mine: false,
      seedComments: p.comments,
    }))
    return [...own, ...seed]
  }, [s.posts, minute, me])

  return (
    <>
      <Composer name={me} lastLesson={s.lastLesson} />
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <PostCard key={item.id} item={item} liked={Boolean(s.likes[item.id])} comments={s.comments[item.id] ?? []} minute={minute} />
        ))}
      </ul>
    </>
  )
}

function Composer({ name, lastLesson }: { name: string; lastLesson: string | null }) {
  const [text, setText] = useState('')
  const [linked, setLinked] = useState(false)
  const lesson = lastLesson ? findLessonByKey(lastLesson) : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addPost(text, linked && lastLesson ? lastLesson : null)
    setText('')
    setLinked(false)
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-4 shadow-card">
      <div className="flex gap-3">
        <Avatar name={name} primary />
        <label htmlFor="nuevo-post" className="sr-only">
          Napisz wpis
        </label>
        <textarea
          id="nuevo-post"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={1500}
          placeholder="Co Bóg powiedział dziś do twojego serca?"
          className="min-w-0 flex-1 resize-none rounded-2xl border border-line bg-surface-2 px-4 py-3 text-[16px] leading-relaxed text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>
      {lesson && (
        <label className="mt-3 flex min-h-11 items-center gap-3 text-[15px] text-text">
          <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} className="size-5 accent-primary" />
          <span>
            Dotyczy lekcji <strong className="text-ink">{lesson.lesson.title}</strong>
          </span>
        </label>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[13.5px] text-muted">+{POINTS.post} pkt za wpis</span>
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[15.5px] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-45"
        >
          <Icon name="send" className="size-[18px]" />
          Opublikuj
        </button>
      </div>
    </form>
  )
}

function PostCard({ item, liked, comments, minute }: { item: FeedItem; liked: boolean; comments: PostComment[]; minute: number }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const lesson = item.lessonKey ? findLessonByKey(item.lessonKey) : null
  const thread = [
    ...item.seedComments.map((c) => ({ key: `${c.author}-${c.ageMin}`, author: c.author, text: c.text, ago: c.ageMin })),
    ...comments.map((c) => ({ key: c.id, author: c.author, text: c.text, ago: minute ? Math.max(0, minute - Math.floor(c.at / 60_000)) : 0 })),
  ]
  const likes = item.baseLikes + (liked ? 1 : 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    addComment(item.id, draft)
    setDraft('')
  }

  return (
    <li className="rounded-3xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Avatar name={item.author} primary={item.mine} />
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-ink">
            {item.author}
            {item.mine && <span className="font-normal text-muted"> · ty</span>}
          </p>
          <p className="text-[13.5px] text-muted">{timeAgo(item.ago)}</p>
        </div>
      </div>

      {lesson && (
        <Link
          href={lessonHref(lesson.product.id, lesson.lesson.id)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft/70 px-3 py-1.5 text-[13.5px] font-semibold text-ink transition hover:bg-gold-soft"
        >
          <Icon name="book" className="size-4" />
          {lesson.lesson.title}
        </Link>
      )}

      <p className="mt-3 whitespace-pre-line font-serif text-[17px] leading-relaxed text-text">{item.text}</p>

      <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-2">
        <button
          type="button"
          onClick={() => toggleLike(item.id)}
          aria-pressed={liked}
          aria-label={liked ? 'Cofnij „Amen”' : 'Powiedz „Amen”'}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold transition hover:bg-surface-hover ${liked ? 'text-danger' : 'text-muted'}`}
        >
          <Icon name="heart" className="size-5" filled={liked} />
          <span className="tabular-nums">{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold text-muted transition hover:bg-surface-hover"
        >
          <Icon name="message" className="size-5" />
          <span className="tabular-nums">{thread.length}</span>
          <span className="sr-only">komentarze</span>
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-3 border-t border-line-soft pt-3">
          {thread.map((c) => (
            <div key={c.key} className="flex gap-2.5">
              <Avatar name={c.author} size="sm" />
              <div className="min-w-0 flex-1 rounded-2xl bg-surface-2 px-3.5 py-2.5">
                <p className="text-[14px] font-semibold text-ink">
                  {c.author} <span className="font-normal text-muted">· {timeAgo(c.ago)}</span>
                </p>
                <p className="mt-0.5 text-[15.5px] leading-snug text-text">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submit} className="flex items-center gap-2">
            <label htmlFor={`comentario-${item.id}`} className="sr-only">
              Napisz komentarz
            </label>
            <input
              id={`comentario-${item.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={800}
              placeholder="Napisz komentarz…"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-surface-2 px-4 text-[16px] text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <button type="submit" disabled={!draft.trim()} aria-label="Wyślij komentarz" className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-45">
              <Icon name="send" className="size-[18px]" />
            </button>
          </form>
        </div>
      )}
    </li>
  )
}

// ─── Constancia (ranking) ──────────────────────────────────────────

function Standing() {
  const s = useAppState()
  const today = useToday()
  const stats = useMemo(() => computeStats(s, today), [s, today])
  const [mode, setMode] = useState<RankMode>('semana')
  const name = s.session?.name ?? 'Ty'
  const rows = useMemo(
    () => leaderboard(mode, { name, weekPoints: stats.weekPoints, streak: stats.streak }),
    [mode, name, stats.weekPoints, stats.streak],
  )
  const me = rows.find((r) => r.me)

  return (
    <>
      <Segmented
        label="Rodzaj rankingu"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'semana', label: 'Punkty tygodnia' },
          { value: 'racha', label: 'Seria' },
        ]}
      />
      <ol className="mt-4 space-y-2">
        {rows.slice(0, 10).map((row) => (
          <RankItem key={`${row.name}-${row.rank}`} row={row} mode={mode} />
        ))}
      </ol>
      {me && me.rank > 10 && (
        <>
          <p className="py-2 text-center text-muted" aria-hidden>
            · · ·
          </p>
          <ol>
            <RankItem row={me} mode={mode} />
          </ol>
        </>
      )}

      <div className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <p className="font-serif text-[18px] font-semibold text-ink">Jak zdobywać punkty</p>
        <ul className="mt-3 space-y-2 text-[15.5px] text-text">
          <li className="flex justify-between gap-3"><span>Przeczytana lekcja</span><strong className="text-ink">+{POINTS.lesson}</strong></li>
          <li className="flex justify-between gap-3"><span>Napisana refleksja</span><strong className="text-ink">+{POINTS.reflection}</strong></li>
          <li className="flex justify-between gap-3"><span>Wpis na tablicy</span><strong className="text-ink">+{POINTS.post}</strong></li>
        </ul>
        <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
          Seria to liczba dni z rzędu, w które przeczytasz co najmniej jedno streszczenie. Ranking tygodnia zeruje się w każdy poniedziałek, żeby każdy mógł dotrzeć na szczyt.
        </p>
      </div>
    </>
  )
}
