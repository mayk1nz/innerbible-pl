'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { LockedProduct } from '../cards'
import { Cover } from '../Cover'
import { Icon } from '../icons'
import { PageHeader } from '../PageHeader'
import { EmptyState, ProgressBar, SearchInput, buttonClass } from '../ui'
import { productById, type Lesson, type Product } from '@/lib/catalog'
import { allLessons, isOwned, lessonHref, lessonKey, nextLesson, productProgress } from '@/lib/progress'
import { toggleLesson, useAppState, type AppState } from '@/lib/store'
import { normalize } from '@/lib/text'

export function ModuleView({ productId }: { productId: string }) {
  const s = useAppState()
  const product = productById(productId)
  if (!product) return null
  if (!isOwned(product, s.owned)) return <LockedProduct product={product} email={s.session?.email} />
  if (product.kind === 'enlace') return <LinkProduct product={product} />
  return <ModuleContent product={product} completed={s.completed} />
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
            <p className="mt-5 rounded-2xl bg-gold-soft/60 p-4 text-[15.5px] text-ink">Link do grupy pojawi się tutaj już wkrótce.</p>
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
            {/* "z N lekcji" is genitive, identical for every N — no plural helper needed. */}
            <strong className="text-ink">{progress.done}</strong> z {progress.total} lekcji
          </p>
          <p className="font-serif text-[26px] font-semibold tabular-nums text-ink">{progress.pct}%</p>
        </div>
        <div className="mt-2.5">
          <ProgressBar value={progress.pct} label={`Postęp: ${product.title}`} />
        </div>
        {next ? (
          <Link href={lessonHref(product.id, next.lesson.id)} className={`${buttonClass.primary} mt-4`}>
            {progress.done ? 'Kontynuuj' : 'Zacznij'}: {next.lesson.title}
            <Icon name="arrowRight" className="size-5 shrink-0 text-gold-bright" />
          </Link>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-success-soft p-3 text-[15.5px] font-semibold text-success">
            <Icon name="trophy" className="size-5" />
            Ścieżka ukończona!
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
