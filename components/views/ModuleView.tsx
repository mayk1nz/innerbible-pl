'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LockedProduct } from '../cards'
import { Cover } from '../Cover'
import { Icon } from '../icons'
import { PageHeader } from '../PageHeader'
import { EmptyState, ProgressBar, SearchInput, buttonClass } from '../ui'
import { productById, type Lesson, type Product, type Section } from '@/lib/catalog'
import { allLessons, currentPlanDay, isOwned, lessonHref, lessonKey, nextLesson, planDayStatus, productProgress } from '@/lib/progress'
import { toggleLesson, useAppState, useToday, type AppState } from '@/lib/store'
import { normalize, plural } from '@/lib/text'

export function ModuleView({ productId }: { productId: string }) {
  const s = useAppState()
  const product = productById(productId)
  if (!product) return null
  if (!isOwned(product, s.owned)) return <LockedProduct product={product} />
  if (product.kind === 'enlace') return <LinkProduct product={product} />
  if (product.tabs) return <TabbedModule product={product} completed={s.completed} lastLesson={s.lastLesson} />
  return <ModuleContent product={product} completed={s.completed} />
}

// ─── Products with tabs (Palabras del Señor: the guide + its 90-day plans) ────

function TabbedModule({ product, completed, lastLesson }: { product: Product; completed: AppState['completed']; lastLesson: string | null }) {
  // Open on the tab of the lesson read last, if it belongs to this product.
  const [tab, setTab] = useState(() => {
    const lastId = lastLesson?.startsWith(`${product.id}/`) ? lastLesson.slice(product.id.length + 1) : null
    return product.sections.find((sec) => sec.lessons.some((l) => l.id === lastId))?.id ?? product.sections[0]?.id
  })
  const section = product.sections.find((sec) => sec.id === tab) ?? product.sections[0]
  if (!section) return null

  return (
    <>
      <PageHeader back="/czytaj" title={product.title} />
      {/* A grid, not a sideways-scrolling row: every section stays visible (with a mouse
          there is no way to tell that a row scrolls). */}
      <div role="tablist" aria-label={`Sekcje: ${product.title}`} className="grid grid-cols-2 gap-2">
        {product.sections.map((sec) => {
          const active = sec.id === section.id
          return (
            <button
              key={sec.id}
              type="button"
              role="tab"
              id={`tab-${sec.id}`}
              aria-selected={active}
              aria-controls={`panel-${sec.id}`}
              onClick={() => setTab(sec.id)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border px-3 py-2 text-center transition ${
                active ? 'border-primary bg-primary text-white shadow-card' : 'border-line bg-surface text-ink hover:bg-surface-hover'
              }`}
            >
              <span className="text-[15px] font-semibold leading-tight">{sec.tab ?? sec.title}</span>
              <span className={`mt-0.5 text-[12.5px] ${active ? 'text-white/75' : 'text-muted'}`}>
                {sec.plan ? `Plan na ${plural(sec.lessons.length, 'dzień', 'dni', 'dni')}` : 'Przewodnik'}
              </span>
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`panel-${section.id}`} aria-labelledby={`tab-${section.id}`} className="mt-5">
        {section.plan ? (
          <PlanPanel product={product} section={section} completed={completed} />
        ) : (
          <>
            <h2 className="mb-3 font-serif text-[20px] font-semibold text-ink">{section.title}</h2>
            <ul className="space-y-2.5">
              {section.lessons.map((lesson, i) => (
                <LessonRow key={lesson.id} product={product} lesson={lesson} n={i + 1} done={Boolean(completed[lessonKey(product.id, lesson.id)])} />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

function PlanPanel({ product, section, completed }: { product: Product; section: Section; completed: AppState['completed'] }) {
  const today = useToday()
  const total = section.lessons.length
  const done = section.lessons.filter((l) => completed[lessonKey(product.id, l.id)]).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const current = currentPlanDay(product.id, section, completed, today)

  return (
    <>
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
        <h2 className="font-serif text-[20px] font-semibold leading-snug text-ink">{section.title}</h2>
        {section.plan && <p className="mt-1 text-[15.5px] leading-snug text-muted">{section.plan.goal}</p>}
        <div className="mt-4 flex items-baseline justify-between gap-3">
          <p className="text-[15.5px] text-text">
            <strong className="text-ink">{done}</strong> z {total} dni
          </p>
          <p className="font-serif text-[24px] font-semibold tabular-nums text-ink">{pct}%</p>
        </div>
        <div className="mt-2">
          <ProgressBar value={pct} label={`Postęp: ${section.title}`} />
        </div>
        {!current ? (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-success-soft p-3 text-[15.5px] font-semibold text-success">
            <Icon name="trophy" className="size-5" />
            Wszystkie {total} dni za tobą!
          </p>
        ) : current.status === 'open' ? (
          <Link href={lessonHref(product.id, current.lesson.id)} className={`${buttonClass.primary} mt-4`}>
            {done ? `Czas na Dzień ${current.n}` : 'Zacznij Dzień 1'}
            {current.lesson.subtitle ? `: ${current.lesson.subtitle}` : ''}
            <Icon name="arrowRight" className="size-5 shrink-0 text-gold-bright" />
          </Link>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gold-soft/60 p-3 text-center text-[15.5px] font-medium text-ink">
            <Icon name="check" className="size-5 shrink-0 text-success" strokeWidth={2.6} />
            Dzisiejszy dzień ukończony. Dzień {current.n} otworzy się jutro.
          </p>
        )}
      </div>

      <ol className="mt-5 grid grid-cols-6 gap-2" aria-label={`Dni planu: ${section.title}`}>
        {section.lessons.map((lesson, i) => {
          const status = planDayStatus(product.id, section, lesson.id, completed, today) ?? 'open'
          const n = i + 1
          if (status === 'done' || status === 'open') {
            return (
              <li key={lesson.id}>
                <Link
                  href={lessonHref(product.id, lesson.id)}
                  aria-label={`Dzień ${n}${status === 'done' ? ', ukończony' : ', dostępny'}`}
                  className={`grid aspect-square place-items-center rounded-xl text-[14px] font-semibold tabular-nums transition ${
                    status === 'done' ? 'bg-success text-white' : 'bg-primary text-white ring-2 ring-gold-bright ring-offset-2 ring-offset-bg'
                  }`}
                >
                  {status === 'done' ? <Icon name="check" className="size-4" strokeWidth={3} /> : n}
                </Link>
              </li>
            )
          }
          return (
            <li key={lesson.id}>
              <span
                aria-label={`Dzień ${n}, ${status === 'tomorrow' ? 'otworzy się jutro' : 'zablokowany'}`}
                className="grid aspect-square place-items-center rounded-xl border border-line-soft bg-surface text-[13.5px] tabular-nums text-muted"
              >
                {n}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-[14px] text-muted">Jeden dzień naraz: każdy kolejny dzień otwiera się nazajutrz po ukończeniu poprzedniego.</p>
    </>
  )
}

function LinkProduct({ product }: { product: Product }) {
  return (
    <>
      <PageHeader back="/czytaj" title={product.title} />
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <Cover cover={product.cover} size="hero" />
        <div className="p-5">
          <p className="text-[16.5px] leading-relaxed text-text">{product.description}</p>
          {product.url ? (
            <a href={product.url} target="_blank" rel="noopener noreferrer" className={`${buttonClass.primary} mt-5`}>
              <Icon name="message" className="size-5" />
              Dołącz do grupy
            </a>
          ) : (
            <p className="mt-5 rounded-2xl bg-gold-soft/60 p-4 text-[15.5px] text-ink">Link do grupy pojawi się tu już wkrótce.</p>
          )}
        </div>
      </div>
    </>
  )
}

function LessonRow({ product, lesson, n, done }: { product: Product; lesson: Lesson; n: number; done: boolean }) {
  const key = lessonKey(product.id, lesson.id)
  return (
    <li className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      {/* The checklist: one tap marks the lesson without opening it. */}
      <button
        type="button"
        onClick={() => toggleLesson(key)}
        aria-pressed={done}
        aria-label={done ? `Odznacz „${lesson.title}”` : `Oznacz „${lesson.title}” jako przeczytaną`}
        className="grid w-14 shrink-0 place-items-center border-r border-line-soft transition hover:bg-surface-hover"
      >
        <span className={`grid size-7 place-items-center rounded-full border-2 transition ${done ? 'animate-pop border-success bg-success text-white' : 'border-[#b9a57c] bg-surface-2'}`}>
          {done && <Icon name="check" className="size-4" strokeWidth={3} />}
        </span>
      </button>
      <Link href={lessonHref(product.id, lesson.id)} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 transition hover:bg-surface-hover">
        <span className="w-7 shrink-0 text-[13px] font-semibold tabular-nums text-muted">{String(n).padStart(2, '0')}</span>
        <span className={`min-w-0 flex-1 font-serif text-[16.5px] leading-snug ${done ? 'text-muted' : 'text-ink'}`}>{lesson.title}</span>
        {lesson.format === 'audio' && <Icon name="headphones" className="size-4.5 shrink-0 text-gold" label="Audio" />}
        <Icon name="chevronRight" className="size-5 shrink-0 text-muted" />
      </Link>
    </li>
  )
}

function ModuleContent({ product, completed }: { product: Product; completed: AppState['completed'] }) {
  const progress = productProgress(product, completed)
  const next = nextLesson(product, completed)
  // Chronological number of each lesson: the order is the product's whole point.
  const numbers = useMemo(() => new Map(allLessons(product).map((l, i) => [l.id, i + 1])), [product])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set([next?.section.id ?? product.sections[0]?.id ?? '']))
  const q = normalize(query)
  const single = product.sections.length === 1

  const toggleSection = (id: string) =>
    setOpen((prev) => {
      const nextOpen = new Set(prev)
      if (nextOpen.has(id)) nextOpen.delete(id)
      else nextOpen.add(id)
      return nextOpen
    })

  const visible = product.sections.map((section) => ({
    section,
    lessons: q ? section.lessons.filter((l) => normalize(l.title).includes(q)) : section.lessons,
  }))
  const nothingFound = q.length > 0 && visible.every((v) => v.lessons.length === 0)

  return (
    <>
      <PageHeader back="/czytaj" title={product.title} />

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15.5px] text-text">
            <strong className="text-ink">{progress.done}</strong> z {progress.total} lekcji
          </p>
          <p className="font-serif text-[26px] font-semibold tabular-nums text-ink">{progress.pct}%</p>
        </div>
        <div className="mt-2.5">
          <ProgressBar value={progress.pct} label={`Postęp: ${product.title}`} />
        </div>
        {next ? (
          <Link href={lessonHref(product.id, next.lesson.id)} className={`${buttonClass.primary} mt-4`}>
            {progress.done ? 'Czytaj dalej' : 'Zacznij'}: {next.lesson.title}
            <Icon name="arrowRight" className="size-5 shrink-0 text-gold-bright" />
          </Link>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-success-soft p-3 text-[15.5px] font-semibold text-success">
            <Icon name="trophy" className="size-5" />
            Cała ścieżka za tobą!
          </p>
        )}
      </div>

      {progress.total > 8 && (
        <div className="mt-5">
          <SearchInput value={query} onChange={setQuery} placeholder="Czego szukasz?" label={`Szukaj w: ${product.title}`} />
        </div>
      )}

      <div className="mt-3">
        {nothingFound && (
          <div className="mt-4">
            <EmptyState icon="search" title="Brak wyników" text="Spróbuj innej nazwy albo sprawdź pisownię." />
          </div>
        )}
        {visible.map(({ section, lessons }) => {
          if (q && lessons.length === 0) return null
          const isOpen = single || q.length > 0 || open.has(section.id)
          const done = section.lessons.filter((l) => completed[lessonKey(product.id, l.id)]).length
          return (
            <section key={section.id} className="border-b border-line-soft last:border-b-0">
              {!single && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left"
                >
                  <span className="font-serif text-[19px] font-semibold text-ink">{section.title}</span>
                  <span className="flex shrink-0 items-center gap-2 text-[14px] tabular-nums text-muted">
                    {done}/{section.lessons.length}
                    <Icon name="chevronDown" className={`size-5 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
              )}
              {isOpen && (
                <ul className={`space-y-2.5 pb-5 ${single ? 'pt-2' : ''}`}>
                  {lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      product={product}
                      lesson={lesson}
                      n={numbers.get(lesson.id) ?? 0}
                      done={Boolean(completed[lessonKey(product.id, lesson.id)])}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
