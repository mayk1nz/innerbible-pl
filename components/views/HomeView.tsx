'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ProductHeroCard, ProductTile } from '../cards'
import { Cover } from '../Cover'
import { Icon, type IconName } from '../icons'
import { RankItem } from '../Leaderboard'
import { PageHeader } from '../PageHeader'
import { SectionTitle } from '../ui'
import { OFFERS, PRODUCTS, productById, type Lesson, type Product } from '@/lib/catalog'
import { computeStats, leaderboard, type Stats } from '@/lib/gamification'
import { continueTarget, isOwned, lessonHref } from '@/lib/progress'
import { useAppState, useNowMinute, useToday } from '@/lib/store'
import { plural, pluralWord } from '@/lib/text'

// Home answers one question — "what do I do today?" — before anything else. The
// reference app opens on a copy of the library; here the library lives in Leer.

function greeting(minute: number): string {
  if (!minute) return 'Witaj'
  const hour = new Date(minute * 60_000).getHours()
  if (hour < 18) return 'Dzień dobry'
  return 'Dobry wieczór'
}

function StatsStrip({ stats }: { stats: Stats }) {
  const items: { icon: IconName; value: number; unit: string; label: string; hot?: boolean }[] = [
    { icon: 'flame', value: stats.streak, unit: stats.streak === 1 ? 'dzień' : 'dni', label: 'Seria', hot: stats.streak > 0 },
    { icon: 'star', value: stats.weekPoints, unit: 'pkt', label: 'W tym tygodniu' },
    { icon: 'check', value: stats.lessonsDone, unit: '', label: pluralWord(stats.lessonsDone, 'Lekcja', 'Lekcje', 'Lekcji') },
  ]
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-line bg-surface px-2 py-3.5 text-center">
          <Icon name={it.icon} className={`mx-auto size-5 ${it.hot ? 'text-flame' : 'text-gold'}`} filled={it.hot} />
          <p className="mt-1.5 font-serif text-[24px] font-semibold leading-none tabular-nums text-ink">
            {it.value}
            {it.unit && <span className="ml-1 font-sans text-[13px] font-medium text-muted">{it.unit}</span>}
          </p>
          <p className="mt-1.5 text-[13px] text-muted">{it.label}</p>
        </div>
      ))}
    </div>
  )
}

function TodayCard({ stats, target }: { stats: Stats; target: { product: Product; lesson: Lesson } | null }) {
  if (stats.doneToday) {
    return (
      <div className="mt-4 flex items-center gap-4 rounded-3xl border border-success/25 bg-success-soft p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success text-white">
          <Icon name="check" className="size-6" strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[18px] font-semibold text-ink">Dzisiejszy krok już za tobą</p>
          <p className="text-[15px] leading-snug text-text">
            {stats.streak > 1 ? `To już ${stats.streak} dni z rzędu. Do zobaczenia jutro!` : 'Wróć jutro i zacznij swoją serię.'}
          </p>
          {target && (
            <Link href={lessonHref(target.product.id, target.lesson.id)} className="mt-2 inline-flex items-center gap-1 text-[15px] font-semibold text-primary underline-offset-4 hover:underline">
              Czytaj dalej: {target.lesson.title}
              <Icon name="arrowRight" className="size-4" />
            </Link>
          )}
        </div>
      </div>
    )
  }
  if (!target) return null
  const audio = target.lesson.format === 'audio'
  return (
    <Link href={lessonHref(target.product.id, target.lesson.id)} className="mt-4 block rounded-3xl bg-primary p-5 text-white shadow-float transition hover:bg-primary-hover">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-bright">Twój krok na dziś</p>
      <p className="mt-1.5 font-serif text-[23px] font-semibold leading-snug">{target.lesson.title}</p>
      <p className="mt-1 text-[15px] text-white/80">
        {target.product.title}
        {stats.streak > 0 ? ` · podtrzymaj serię: ${plural(stats.streak, 'dzień', 'dni', 'dni')}` : ' · zacznij swoją serię już dziś'}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-bright px-5 py-2.5 text-[15px] font-semibold text-primary">
        <Icon name={audio ? 'headphones' : 'book'} className="size-5" />
        {audio ? 'Słuchaj teraz' : 'Czytaj teraz'}
      </span>
    </Link>
  )
}

/** A horizontal row of covers that scrolls sideways (swipe on the phone). */
function Shelf({ products }: { products: Product[] }) {
  const s = useAppState()
  return (
    <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
      {products.map((p) => (
        <div key={p.id} className="flex w-[42%] max-w-[180px] shrink-0 snap-start">
          <ProductTile product={p} state={s} />
        </div>
      ))}
    </div>
  )
}

export function HomeView() {
  const s = useAppState()
  const today = useToday()
  const minute = useNowMinute()
  const stats = useMemo(() => computeStats(s, today), [s, today])
  const target = useMemo(() => continueTarget(s), [s])
  const name = s.session?.name ?? ''
  const board = useMemo(
    () => leaderboard('semana', { name, weekPoints: stats.weekPoints, streak: stats.streak }),
    [name, stats.weekPoints, stats.streak],
  )
  const me = board.find((r) => r.me)
  const recorridos = PRODUCTS.filter((p) => p.kind === 'recorrido' && isOwned(p, s.owned))
  // One big card — the recorrido in progress — and the rest as small covers, so Home
  // stays short however much the member owns.
  const hero = recorridos.find((p) => p.id === target?.product.id) ?? recorridos[0]
  const otherRecorridos = recorridos.filter((p) => p !== hero)
  const guides = PRODUCTS.filter((p) => p.kind !== 'recorrido' && isOwned(p, s.owned))
  const pending = OFFERS.filter((o) => o.id !== 'front' && !s.owned.includes(o.id))

  return (
    <>
      <PageHeader title={`${greeting(minute)}, ${name}`} subtitle="Jeden krok każdego dnia. Dobrze, że jesteś." />
      <StatsStrip stats={stats} />
      <TodayCard stats={stats} target={target} />

      <Link
        href="/doradca"
        className="mt-3 flex items-center gap-3.5 rounded-3xl border border-line bg-surface p-4 shadow-card transition hover:bg-surface-hover"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-gold-bright">
          <Icon name="chatCross" className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-[17px] font-semibold leading-snug text-ink">Co dziś masz na sercu?</span>
          <span className="mt-0.5 block text-[14px] leading-snug text-muted">Opowiedz o tym swojemu Doradcy Biblijnemu i znajdź światło w Słowie.</span>
        </span>
        <Icon name="chevronRight" className="size-5 shrink-0 text-muted" />
      </Link>

      {hero && (
        <>
          <SectionTitle>{otherRecorridos.length ? 'Twoja obecna ścieżka' : 'Twoja ścieżka'}</SectionTitle>
          <ProductHeroCard product={hero} completed={s.completed} />
        </>
      )}

      {otherRecorridos.length > 0 && (
        <>
          <SectionTitle>Twoje pozostałe ścieżki</SectionTitle>
          <Shelf products={otherRecorridos} />
        </>
      )}

      {guides.length > 0 && (
        <>
          <SectionTitle
            action={
              <Link href="/czytaj?tab=guias" className="text-[15px] font-semibold text-primary underline-offset-4 hover:underline">
                Zobacz wszystkie
              </Link>
            }
          >
            Twoje przewodniki i prezenty
          </SectionTitle>
          <Shelf products={guides} />
        </>
      )}

      {pending.length > 0 && (
        <>
          <SectionTitle>Uzupełnij swoją bibliotekę</SectionTitle>
          <ul className="space-y-3">
            {pending.map((o) => {
              const product = productById(o.productId)
              if (!product) return null
              return (
                <li key={o.id}>
                  <Link href={`/sklep#${o.id}`} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-2 pr-4 shadow-card transition hover:bg-surface-hover">
                    <Cover cover={product.cover} size="thumb" locked />
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-[16.5px] leading-snug text-ink">{o.title}</span>
                      <span className="mt-1 line-clamp-2 block text-[14px] leading-snug text-muted">{o.pitch}</span>
                    </span>
                    <Icon name="chevronRight" className="size-5 shrink-0 text-muted" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <SectionTitle
        action={
          <Link href="/spolecznosc?tab=constancia" className="text-[15px] font-semibold text-primary underline-offset-4 hover:underline">
            Zobacz wszystko
          </Link>
        }
      >
        Wytrwałość w tym tygodniu
      </SectionTitle>
      <ol className="space-y-2">
        {board.slice(0, 3).map((row) => (
          <RankItem key={row.name + row.rank} row={row} mode="semana" />
        ))}
      </ol>
      {me && me.rank > 3 && (
        <p className="mt-3 text-center text-[15px] text-muted">
          Jesteś na <strong className="text-ink">{me.rank}.</strong> miejscu z wynikiem {me.weekPoints} pkt. Każda lekcja się liczy.
        </p>
      )}
    </>
  )
}
