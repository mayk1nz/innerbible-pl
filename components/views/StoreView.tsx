'use client'

import Link from 'next/link'
import { OfferCard } from '../cards'
import { PageHeader } from '../PageHeader'
import { EmptyState, buttonClass } from '../ui'
import { OFFERS } from '@/lib/catalog'
import { useAppState } from '@/lib/store'

export function StoreView() {
  const s = useAppState()
  const pending = OFFERS.filter((o) => o.id !== 'front' && !s.owned.includes(o.id))

  return (
    <>
      <PageHeader title="Sklep" subtitle="Poszerz swoją bibliotekę o to, czego jeszcze nie masz" />
      {pending.length === 0 ? (
        <EmptyState
          icon="gift"
          title="Masz już całą bibliotekę"
          text="Nie ma już nic do odblokowania. Idź dalej swoją ścieżką i dziel się tym, czego się uczysz, z braćmi i siostrami."
          action={
            <Link href="/czytaj" className={buttonClass.primary}>
              Przejdź do czytania
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {pending.map((o) => (
            <OfferCard key={o.id} offer={o} email={s.session?.email} />
          ))}
        </div>
      )}
    </>
  )
}
