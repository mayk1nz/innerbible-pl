import { PRODUCTS, productById, type Lesson, type OfferId, type Product, type Section } from './catalog'
import type { AppState } from './store'
import { normalize } from './text'

export function lessonKey(productId: string, lessonId: string): string {
  return `${productId}/${lessonId}`
}

export function lessonHref(productId: string, lessonId: string): string {
  return `/lekcja/${productId}/${lessonId}`
}

export function isOwned(product: Product, owned: readonly OfferId[]): boolean {
  return owned.includes(product.offer)
}

/**
 * A plan day is 'done'; 'open' (day 1, or the previous day was done on an earlier
 * date); 'tomorrow' (the previous day was done today — one day at a time); or
 * 'locked' (the previous day is not done yet). null for lessons outside a plan.
 * `today` is a local YYYY-MM-DD (useToday).
 */
export type PlanDayStatus = 'done' | 'open' | 'tomorrow' | 'locked'

export function planDayStatus(
  productId: string,
  section: Section,
  lessonId: string,
  completed: AppState['completed'],
  today: string,
): PlanDayStatus | null {
  if (!section.plan) return null
  if (completed[lessonKey(productId, lessonId)]) return 'done'
  const i = section.lessons.findIndex((l) => l.id === lessonId)
  if (i <= 0) return 'open'
  const prev = completed[lessonKey(productId, section.lessons[i - 1].id)]
  if (!prev) return 'locked'
  return today && prev.day < today ? 'open' : 'tomorrow'
}

/** The plan day to do now (first not done), with its status; null when the plan is finished. */
export function currentPlanDay(
  productId: string,
  section: Section,
  completed: AppState['completed'],
  today: string,
): { lesson: Lesson; n: number; status: PlanDayStatus } | null {
  const i = section.lessons.findIndex((l) => !completed[lessonKey(productId, l.id)])
  if (i < 0) return null
  const lesson = section.lessons[i]
  return { lesson, n: i + 1, status: planDayStatus(productId, section, lesson.id, completed, today) ?? 'open' }
}

export function allLessons(product: Product): Lesson[] {
  return product.sections.flatMap((s) => s.lessons)
}

export function productProgress(product: Product, completed: AppState['completed']): { done: number; total: number; pct: number } {
  const list = allLessons(product)
  const done = list.filter((l) => completed[lessonKey(product.id, l.id)]).length
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 }
}

export interface LessonRef {
  product: Product
  section: Section
  lesson: Lesson
  index: number
  total: number
  prev: Lesson | null
  next: Lesson | null
}

export function findLesson(productId: string, lessonId: string): LessonRef | null {
  const product = productById(productId)
  if (!product) return null
  const flat = product.sections.flatMap((section) => section.lessons.map((lesson) => ({ section, lesson })))
  const index = flat.findIndex((f) => f.lesson.id === lessonId)
  if (index < 0) return null
  return {
    product,
    section: flat[index].section,
    lesson: flat[index].lesson,
    index,
    total: flat.length,
    prev: flat[index - 1]?.lesson ?? null,
    next: flat[index + 1]?.lesson ?? null,
  }
}

export function findLessonByKey(key: string): LessonRef | null {
  const [productId, lessonId] = key.split('/')
  return productId && lessonId ? findLesson(productId, lessonId) : null
}

/**
 * The lesson to read next: `fromId` itself if it is still open, otherwise the first
 * open lesson after it, wrapping around to the start. null when everything is done.
 */
export function nextLesson(
  product: Product,
  completed: AppState['completed'],
  fromId?: string,
): { section: Section; lesson: Lesson } | null {
  const flat = product.sections.flatMap((section) => section.lessons.map((lesson) => ({ section, lesson })))
  if (!flat.length) return null
  const isOpen = (l: Lesson) => !completed[lessonKey(product.id, l.id)]
  const start = fromId ? Math.max(0, flat.findIndex((f) => f.lesson.id === fromId)) : 0
  for (let i = 0; i < flat.length; i += 1) {
    const item = flat[(start + i) % flat.length]
    if (isOpen(item.lesson)) return item
  }
  return null
}

/** Where "Continuar" leads: the product last opened, else the first owned recorrido. */
export function continueTarget(s: AppState): { product: Product; lesson: Lesson } | null {
  const last = s.lastLesson ? findLessonByKey(s.lastLesson) : null
  if (last && isOwned(last.product, s.owned)) {
    const n = nextLesson(last.product, s.completed, last.lesson.id)
    if (n) return { product: last.product, lesson: n.lesson }
  }
  for (const product of PRODUCTS) {
    if (product.kind !== 'recorrido' || !isOwned(product, s.owned)) continue
    const n = nextLesson(product, s.completed)
    if (n) return { product, lesson: n.lesson }
  }
  return null
}

export interface SearchHit {
  product: Product
  lesson: Lesson
  owned: boolean
}

export function searchLessons(query: string, owned: readonly OfferId[], limit = 30): SearchHit[] {
  const q = normalize(query)
  if (q.length < 2) return []
  const hits: SearchHit[] = []
  for (const product of PRODUCTS) {
    for (const lesson of allLessons(product)) {
      if (normalize(lesson.title).includes(q) || normalize(product.title).includes(q)) {
        hits.push({ product, lesson, owned: isOwned(product, owned) })
        if (hits.length >= limit) return hits
      }
    }
  }
  return hits
}
