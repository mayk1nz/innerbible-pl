'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { GuideRow, ProductTile } from '../cards'
import { Icon } from '../icons'
import { PageHeader } from '../PageHeader'
import { EmptyState, SearchInput, SectionTitle } from '../ui'
import { PRODUCTS } from '@/lib/catalog'
import { lessonHref, lessonKey, searchLessons } from '@/lib/progress'
import { useAppState } from '@/lib/store'

export function LibraryView() {
  const s = useAppState()
  const [query, setQuery] = useState('')
  const hits = useMemo(() => searchLessons(query, s.owned), [query, s.owned])
  const searching = query.trim().length >= 2
  const recorridos = PRODUCTS.filter((p) => p.kind === 'recorrido')
  const guias = PRODUCTS.filter((p) => p.kind !== 'recorrido')

  return (
    <>
      <PageHeader title="Czytaj" subtitle="Cała twoja biblioteka w jednym miejscu" />
      <SearchInput value={query} onChange={setQuery} placeholder="Szukaj księgi, tematu…" label="Szukaj w bibliotece" />

      {searching ? (
        <section aria-label="Wyniki wyszukiwania" className="mt-5">
          {hits.length === 0 ? (
            <EmptyState icon="search" title="Brak wyników" text="Wpisz nazwę księgi, np. „Rut” albo „Dzieje Apostolskie”." />
          ) : (
            <ul className="space-y-2.5">
              {hits.map((h) => {
                const done = Boolean(s.completed[lessonKey(h.product.id, h.lesson.id)])
                return (
                  <li key={`${h.product.id}/${h.lesson.id}`}>
                    <Link href={lessonHref(h.product.id, h.lesson.id)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition hover:bg-surface-hover">
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-[16.5px] leading-snug text-ink">{h.lesson.title}</span>
                        <span className="mt-0.5 block text-[14px] text-muted">{h.product.title}</span>
                      </span>
                      {!h.owned && <Icon name="lock" className="size-4.5 text-gold" label="Zablokowane" />}
                      {h.owned && done && <Icon name="check" className="size-5 text-success" strokeWidth={2.4} label="Przeczytana" />}
                      <Icon name="chevronRight" className="size-5 text-muted" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : (
        <>
          <SectionTitle>Ścieżki</SectionTitle>
          <div className="grid grid-cols-2 gap-3.5">
            {recorridos.map((p) => (
              <ProductTile key={p.id} product={p} state={s} />
            ))}
          </div>

          <SectionTitle>Przewodniki i bonusy</SectionTitle>
          <ul className="space-y-3">
            {guias.map((p) => (
              <li key={p.id}>
                <GuideRow product={p} state={s} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
