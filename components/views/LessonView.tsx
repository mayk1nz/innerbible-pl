'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AudioPlayer } from '../AudioPlayer'
import { LockedProduct } from '../cards'
import { Icon, type IconName } from '../icons'
import { PageHeader } from '../PageHeader'
import { Avatar, FontScaleControl, buttonClass } from '../ui'
import type { Lesson, LessonContent } from '@/lib/catalog'
import { loadPlanDay } from '@/lib/content/plans/load'
import { trackFor } from '@/lib/player'
import { SEED_POSTS, SEED_REFLECTIONS } from '@/lib/community-seed'
import { POINTS } from '@/lib/config'
import { computeStats } from '@/lib/gamification'
import { findLesson, isOwned, lessonHref, lessonKey, planDayStatus, type LessonRef } from '@/lib/progress'
import {
  completeLesson,
  saveReflection,
  setLastLesson,
  uncompleteLesson,
  useAppState,
  useNowMinute,
  useToday,
  type AppState,
  type Reflection,
  type UserPost,
} from '@/lib/store'
import { plural, timeAgo } from '@/lib/text'

export function LessonView({ productId, lessonId }: { productId: string; lessonId: string }) {
  const s = useAppState()
  const ref = findLesson(productId, lessonId)
  if (!ref) return null
  if (!isOwned(ref.product, s.owned)) return <LockedProduct product={ref.product} />
  // Keyed per lesson so drafts and the "just completed" moment never leak between lessons.
  return <LessonReader key={`${productId}/${lessonId}`} lessonRef={ref} state={s} />
}

function LessonReader({ lessonRef, state: s }: { lessonRef: LessonRef; state: AppState }) {
  const { product, section, lesson, index, total, prev, next } = lessonRef
  const key = lessonKey(product.id, lesson.id)
  const today = useToday()
  const stats = useMemo(() => computeStats(s, today), [s, today])
  const done = Boolean(s.completed[key])
  const [celebrate, setCelebrate] = useState(false)
  // Plan days open one at a time; a day not open yet shows when it opens instead.
  const status = planDayStatus(product.id, section, lesson.id, s.completed, today)
  const waiting = status === 'locked' || status === 'tomorrow'
  const dayN = section.lessons.findIndex((l) => l.id === lesson.id) + 1
  const nextStatus = next ? planDayStatus(product.id, section, next.id, s.completed, today) : null
  const nextInPlan = Boolean(section.plan && next && section.lessons.some((l) => l.id === next.id))
  const track = lesson.format === 'audio' ? trackFor(product, lesson) : null

  useEffect(() => {
    if (!waiting) setLastLesson(key)
  }, [key, waiting])

  if (waiting) {
    return (
      <>
        <PageHeader back={`/modul/${product.id}`} eyebrow={`${section.tab ?? section.title} · ${lesson.title}`} title={lesson.subtitle ?? lesson.title} />
        <div className="rounded-3xl border border-line bg-surface p-6 text-center shadow-card">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-soft text-gold">
            <Icon name={status === 'tomorrow' ? 'calendar' : 'lock'} className="size-7" />
          </span>
          <p className="mt-4 font-serif text-[21px] font-semibold text-ink">
            {status === 'tomorrow' ? `Dzień ${dayN} otworzy się jutro` : `Najpierw Dzień ${dayN - 1}`}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[15.5px] leading-relaxed text-muted">
            {status === 'tomorrow'
              ? 'Dzisiejszy krok już za tobą. Jeden dzień naraz: wróć jutro, żeby iść dalej.'
              : `Ten plan przechodzi się dzień po dniu. Ukończ Dzień ${dayN - 1}, żeby pójść dalej.`}
          </p>
          <Link href={`/modul/${product.id}`} className={`${buttonClass.secondary} mt-5`}>
            Wróć do planu
          </Link>
        </div>
      </>
    )
  }

  const toggle = () => {
    if (done) {
      uncompleteLesson(key)
      setCelebrate(false)
    } else {
      completeLesson(key)
      setCelebrate(true)
    }
  }

  return (
    <>
      <PageHeader
        back={`/modul/${product.id}`}
        eyebrow={section.plan ? `${section.tab ?? section.title} · ${lesson.title}` : section.title}
        title={lesson.subtitle ?? lesson.title}
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-[14.5px] leading-snug text-muted">
          {section.plan ? section.title : product.title}
          <br />
          {section.plan ? `Dzień ${dayN} z ${section.lessons.length}` : `Lekcja ${index + 1} z ${total}`}
        </p>
        <FontScaleControl scale={s.fontScale} />
      </div>

      {track && (
        <div className="mb-5">
          <AudioPlayer track={track} cover={product.cover} />
        </div>
      )}

      {/* An audio lesson is the audio; its text shows only when there is one. */}
      {(lesson.format !== 'audio' || lesson.content) && <LessonBody lesson={lesson} scale={s.fontScale} />}

      <CompletionCard
        done={done}
        celebrate={celebrate}
        streak={stats.streak}
        onToggle={toggle}
        isPlanDay={Boolean(section.plan)}
        next={
          next && !(nextInPlan && nextStatus !== 'open' && nextStatus !== 'done')
            ? { href: lessonHref(product.id, next.id), title: next.title }
            : null
        }
        opensTomorrow={nextInPlan && nextStatus === 'tomorrow' ? next?.title ?? null : null}
      />

      <ReflectionBox lessonKey={key} existing={s.reflections[key]} />
      <SharedReflections lessonKey={key} mine={s.reflections[key]} myPosts={s.posts} myName={s.session?.name ?? 'Ty'} />

      <nav aria-label="Inne lekcje" className="mt-10 grid grid-cols-2 gap-3">
        {prev ? (
          <Link href={lessonHref(product.id, prev.id)} className="rounded-2xl border border-line bg-surface p-3.5 transition hover:bg-surface-hover">
            <span className="flex items-center gap-1 text-[13.5px] text-muted">
              <Icon name="arrowLeft" className="size-4" />
              Poprzednia
            </span>
            <span className="mt-1 line-clamp-2 block font-serif text-[15.5px] leading-snug text-ink">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={lessonHref(product.id, next.id)} className="rounded-2xl border border-line bg-surface p-3.5 text-right transition hover:bg-surface-hover">
            <span className="flex items-center justify-end gap-1 text-[13.5px] text-muted">
              Następna
              <Icon name="arrowRight" className="size-4" />
            </span>
            <span className="mt-1 line-clamp-2 block font-serif text-[15.5px] leading-snug text-ink">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  )
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-gold">
        <Icon name={icon} className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.78em] font-semibold uppercase tracking-[0.07em] text-muted">{label}</p>
        <p className="mt-0.5 leading-snug text-ink">{value}</p>
      </div>
    </div>
  )
}

/** A task written as "Intro: 1) … 2) … 3) …" shows its steps as a numbered list. */
function TaskText({ text }: { text: string }) {
  const parts = text.split(/\s(?=\d\)\s)/)
  if (parts.length < 3) return <p className="mt-1.5 font-serif text-[1.05em] leading-relaxed">{text}</p>
  const [intro, ...steps] = parts
  return (
    <div className="mt-1.5 font-serif text-[1.05em] leading-relaxed">
      <p>{intro}</p>
      <ol className="mt-2 space-y-1.5">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold-bright font-sans text-[0.75em] font-bold text-primary">{i + 1}</span>
            <span>{step.replace(/^\d\)\s*/, '').replace(/;\s*$/, '')}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** The lesson's text: inline in the catalog, or — for plan days — fetched when opened. */
function useLessonContent(lesson: Lesson): { content?: LessonContent; loading: boolean } {
  const planId = lesson.plan?.id
  const planDay = lesson.plan?.day ?? 0
  const key = planId ? `${planId}/${planDay}` : ''
  const [loaded, setLoaded] = useState<{ key: string; content: LessonContent | null } | null>(null)

  useEffect(() => {
    if (!planId) return
    let alive = true
    loadPlanDay(planId, planDay)
      .then((content) => alive && setLoaded({ key: `${planId}/${planDay}`, content }))
      .catch(() => alive && setLoaded({ key: `${planId}/${planDay}`, content: null }))
    return () => {
      alive = false
    }
  }, [planId, planDay])

  if (!planId) return { content: lesson.content, loading: false }
  if (loaded?.key !== key) return { loading: true }
  return { content: loaded.content ?? undefined, loading: false }
}

function LessonBody({ lesson, scale }: { lesson: Lesson; scale: number }) {
  const { content: c, loading } = useLessonContent(lesson)
  if (loading) {
    return (
      <div aria-busy className="animate-pulse space-y-3 rounded-3xl border border-line bg-surface-2 px-5 py-6">
        <div className="h-16 rounded-2xl bg-gold-soft/50" />
        <div className="h-4 rounded bg-line-soft" />
        <div className="h-4 w-11/12 rounded bg-line-soft" />
        <div className="h-4 w-4/5 rounded bg-line-soft" />
      </div>
    )
  }
  if (!c) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface-2 px-6 py-8 text-center">
        <Icon name="feather" className="mx-auto size-8 text-gold" />
        <p className="mt-3 font-serif text-[19px] font-semibold text-ink">Treść w przygotowaniu</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[15.5px] leading-relaxed text-muted">Już wkrótce znajdziesz tu tę lekcję.</p>
      </div>
    )
  }
  return (
    <article className="rounded-3xl border border-line bg-surface-2 px-5 py-6 shadow-card" style={{ fontSize: `${scale}rem` }}>
      {(c.fecha || c.autor || c.periodo) && (
        <div className="grid gap-3.5 border-b border-line-soft pb-5 text-[0.98em]">
          {c.fecha && <Fact icon="calendar" label="Przybliżona data" value={c.fecha} />}
          {c.autor && <Fact icon="feather" label="Autor" value={c.autor} />}
          {c.periodo && <Fact icon="users" label="Okres i postacie" value={c.periodo} />}
        </div>
      )}
      {c.versiculo && (
        <figure className="my-6 rounded-2xl bg-gold-soft/50 px-5 py-4">
          <blockquote className="font-serif text-[1.18em] italic leading-relaxed text-ink">„{c.versiculo.texto.trim().replace(/[;:,]$/, '')}”</blockquote>
          <figcaption className="mt-2 text-[0.85em] font-semibold text-gold">{c.versiculo.referencia}</figcaption>
        </figure>
      )}
      {c.resumen && (
        <div className="space-y-4 font-serif text-[1.08em] leading-[1.75] text-text">
          {c.resumen.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      )}
      {c.tarea && (
        <div className="mt-6 rounded-2xl bg-primary px-5 py-4 text-white">
          <p className="text-[0.8em] font-semibold uppercase tracking-[0.08em] text-gold-bright">Mini-zadanie na dziś</p>
          <TaskText text={c.tarea} />
        </div>
      )}
      {c.practica && c.practica.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line-soft bg-surface p-4">
          <p className="text-[0.8em] font-semibold uppercase tracking-[0.08em] text-gold">W praktyce</p>
          <ol className="mt-2 space-y-2">
            {c.practica.map((step, i) => (
              <li key={step} className="flex gap-3 leading-relaxed text-ink">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold-soft text-[0.8em] font-bold text-ink">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
      {c.meditar && (
        <div className="mt-6 rounded-2xl border border-line-soft bg-surface p-4">
          <p className="text-[0.8em] font-semibold uppercase tracking-[0.08em] text-gold">Do rozważenia</p>
          <p className="mt-1.5 font-serif text-[1.05em] leading-relaxed text-ink">{c.meditar}</p>
        </div>
      )}
    </article>
  )
}

function CompletionCard({
  done,
  celebrate,
  streak,
  onToggle,
  next,
  isPlanDay,
  opensTomorrow,
}: {
  done: boolean
  celebrate: boolean
  streak: number
  onToggle: () => void
  next: { href: string; title: string } | null
  isPlanDay: boolean
  /** Title of the next plan day when it only opens tomorrow. */
  opensTomorrow: string | null
}) {
  if (!done) {
    return (
      <div className="mt-6">
        <button type="button" onClick={onToggle} className={buttonClass.primary}>
          <Icon name="check" className="size-5" strokeWidth={2.6} />
          {isPlanDay ? 'Ukończ dzień' : 'Oznacz jako przeczytaną'}
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[13px] font-semibold">+{POINTS.lesson} pkt</span>
        </button>
        <p className="mt-2 text-center text-[14px] text-muted">Zdobywasz punkty i podtrzymujesz swoją serię.</p>
      </div>
    )
  }
  return (
    <div role="status" className={`mt-6 rounded-3xl border border-success/25 bg-success-soft p-5 ${celebrate ? 'animate-rise' : ''}`}>
      <div className="flex items-center gap-3.5">
        <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-success text-white ${celebrate ? 'animate-pop' : ''}`}>
          <Icon name="check" className="size-6" strokeWidth={2.8} />
        </span>
        <div>
          <p className="font-serif text-[19px] font-semibold text-ink">{isPlanDay ? 'Dzień ukończony' : 'Lekcja ukończona'}</p>
          <p className="text-[15px] text-text">
            {streak > 0 ? (
              <>
                Seria: <strong>{plural(streak, 'dzień', 'dni', 'dni')}</strong>
              </>
            ) : (
              'Świetnie!'
            )}
            {celebrate && ` · +${plural(POINTS.lesson, 'punkt', 'punkty', 'punktów')}`}
          </p>
        </div>
      </div>
      {next && (
        <Link href={next.href} className={`${buttonClass.primary} mt-4`}>
          Dalej: {next.title}
          <Icon name="arrowRight" className="size-5 shrink-0 text-gold-bright" />
        </Link>
      )}
      {opensTomorrow && (
        <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-surface-2 p-3 text-center text-[15px] text-ink">
          <Icon name="calendar" className="size-5 shrink-0 text-gold" />
          {opensTomorrow} otworzy się jutro. Czekamy na ciebie!
        </p>
      )}
      <button type="button" onClick={onToggle} className="mt-3 w-full py-1 text-center text-[14px] font-medium text-muted underline underline-offset-4 hover:text-ink">
        {isPlanDay ? 'Cofnij ukończenie dnia' : 'Cofnij oznaczenie lekcji'}
      </button>
    </div>
  )
}

function ReflectionBox({ lessonKey: key, existing }: { lessonKey: string; existing?: Reflection }) {
  const [text, setText] = useState(existing?.text ?? '')
  const [shared, setShared] = useState(existing?.shared ?? true)
  const [saved, setSaved] = useState(false)
  const dirty = text.trim() !== (existing?.text ?? '') || shared !== (existing?.shared ?? true)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    saveReflection(key, text, shared)
    setSaved(true)
  }

  return (
    <section className="mt-10" aria-labelledby="reflexion-titulo">
      <h2 id="reflexion-titulo" className="font-serif text-[22px] font-semibold text-ink">
        Twoja refleksja
      </h2>
      <p className="mt-1 text-[15.5px] leading-snug text-muted">Czego nauczyło cię to streszczenie? Co poruszyło twoje serce?</p>
      <form onSubmit={submit} className="mt-3.5 rounded-3xl border border-line bg-surface p-4">
        <label htmlFor="reflexion" className="sr-only">
          Twoja refleksja
        </label>
        <textarea
          id="reflexion"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setSaved(false)
          }}
          rows={4}
          maxLength={1200}
          placeholder="Napisz własnymi słowami…"
          className="w-full resize-y rounded-2xl border border-line bg-surface-2 px-4 py-3 text-[16px] leading-relaxed text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <label className="mt-3 flex min-h-11 items-center gap-3 text-[15.5px] text-text">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => {
              setShared(e.target.checked)
              setSaved(false)
            }}
            className="size-5 accent-primary"
          />
          Podziel się z braćmi i siostrami
        </label>
        <button type="submit" disabled={!dirty || !text.trim()} className={`${buttonClass.secondary} mt-2`}>
          {existing ? 'Zaktualizuj refleksję' : 'Zapisz refleksję'}
          {!existing && <span className="text-[13px] font-semibold text-gold">+{POINTS.reflection} pkt</span>}
        </button>
        {saved && !dirty && (
          <p role="status" className="mt-2.5 text-center text-[14.5px] font-medium text-success">
            {shared ? 'Zapisana i udostępniona braciom i siostrom.' : 'Zapisana tylko dla ciebie.'}
          </p>
        )}
      </form>
    </section>
  )
}

// Shared reflections and wall posts about this lesson, in one conversation: a post
// tagged "Génesis" on the Comunidad wall shows up here too, so the lesson and the
// community feed each other instead of living in separate tabs.
function SharedReflections({
  lessonKey: key,
  mine,
  myPosts,
  myName,
}: {
  lessonKey: string
  mine?: Reflection
  myPosts: UserPost[]
  myName: string
}) {
  const minute = useNowMinute()
  const ago = (at: number) => (minute ? Math.max(0, minute - Math.floor(at / 60_000)) : 0)
  const items = [
    ...(mine?.shared ? [{ author: myName, text: mine.text, ago: ago(mine.at), me: true }] : []),
    ...myPosts.filter((p) => p.lessonKey === key).map((p) => ({ author: myName, text: p.text, ago: ago(p.at), me: true })),
    ...(SEED_REFLECTIONS[key] ?? []).map((r) => ({ author: r.author, text: r.text, ago: r.ageMin, me: false })),
    ...SEED_POSTS.filter((p) => p.lessonKey === key).map((p) => ({ author: p.author, text: p.text, ago: p.ageMin, me: false })),
  ].sort((a, b) => a.ago - b.ago)

  return (
    <section className="mt-10" aria-labelledby="hermanos-titulo">
      <h2 id="hermanos-titulo" className="font-serif text-[22px] font-semibold text-ink">
        Co zrozumieli bracia i siostry
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line px-5 py-6 text-center text-[15.5px] leading-relaxed text-muted">
          Nikt jeszcze nie podzielił się tu refleksją. Możesz być pierwszą osobą.
        </p>
      ) : (
        <ul className="mt-3.5 space-y-3">
          {items.map((r) => (
            <li key={`${r.author}-${r.ago}-${r.text.slice(0, 24)}`} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <Avatar name={r.author} size="sm" primary={r.me} />
                <div className="min-w-0">
                  <p className="text-[15.5px] font-semibold text-ink">
                    {r.author}
                    {r.me && <span className="font-normal text-muted"> · ty</span>}
                  </p>
                  <p className="text-[13.5px] text-muted">{timeAgo(r.ago)}</p>
                </div>
              </div>
              <p className="mt-2.5 font-serif text-[16.5px] leading-relaxed text-text">{r.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
