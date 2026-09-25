'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { BenefitList } from '../Deal'
import { Icon } from '../icons'
import { PageHeader } from '../PageHeader'
import { buttonClass } from '../ui'
import { PRODUCTS, type OfferId } from '@/lib/catalog'
import { ANUAL, APP } from '@/lib/config'
import { DEALS } from '@/lib/deals'
import { formatUsd } from '@/lib/funnel/config'
import { useAppState } from '@/lib/store'
import { plural } from '@/lib/text'

// The annual plan (everything for a year), sold only inside the app. The savings are
// computed from the real monthly prices — never an invented "before" price.

const MONTHLY_TOTAL = ANUAL.monthly.front + ANUAL.monthly.upsell1 + ANUAL.monthly.upsell2
const YEAR_MONTHLY = Math.round(MONTHLY_TOTAL * 12 * 100) / 100
const SAVED = Math.round((YEAR_MONTHLY - ANUAL.price) * 100) / 100
const SAVED_PCT = Math.round((SAVED / YEAR_MONTHLY) * 100)
const PER_MONTH = Math.round((ANUAL.price / 12) * 100) / 100
/** Whole months of the front alone that already cost more than the whole year. */
const FRONT_MONTHS = Math.ceil(ANUAL.price / ANUAL.monthly.front)

export function hasEverything(owned: readonly OfferId[]): boolean {
  return owned.includes('upsell1') && owned.includes('upsell2')
}

const DISMISS_KEY = 'ib-pl-anual-bar'

/** The slim bar on top of every tab, for members who don't have everything yet. */
export function AnualBar() {
  const { owned } = useAppState()
  const pathname = usePathname() || ''
  const [hidden, setHidden] = useState(() => {
    try {
      return Number(window.localStorage.getItem(DISMISS_KEY)) > Date.now()
    } catch {
      return false
    }
  })
  // Not on the offer page itself, and not while reading a lesson.
  if (hidden || hasEverything(owned) || pathname === '/roczny' || pathname.startsWith('/lekcja/')) return null

  const dismiss = () => {
    try {
      // Back in three days.
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + 3 * 86_400_000))
    } catch {
      // storage blocked: it just comes back next visit
    }
    setHidden(true)
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary py-2 pl-3 pr-1.5 text-white shadow-card">
      <Icon name="sparkles" className="size-5 shrink-0 text-gold-bright" />
      <Link href="/roczny" className="min-w-0 flex-1 text-[14px] leading-snug">
        <strong className="font-semibold">Cała {APP.name}</strong> za {formatUsd(ANUAL.price)} rocznie ·{' '}
        <span className="font-semibold text-gold-bright underline underline-offset-2">oszczędzasz {SAVED_PCT}%</span>
      </Link>
      <button type="button" onClick={dismiss} aria-label="Ukryj na razie" className="grid size-9 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
        <Icon name="x" className="size-4" />
      </button>
    </div>
  )
}

/** Card at the top of the Tienda. */
export function AnualCard() {
  const { owned } = useAppState()
  if (hasEverything(owned)) return null
  return (
    <Link href="/roczny" className="relative block overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-float">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(90% 70% at 90% 0%, rgba(224,172,74,.35), transparent 60%)' }} />
      <div className="relative">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-bright">Plan roczny · wszystko w cenie</p>
        <p className="mt-1 font-serif text-[22px] font-semibold leading-snug">Cała {APP.name} za {formatUsd(ANUAL.price)} rocznie</p>
        <p className="mt-1 text-[15px] text-white/80">
          Oszczędzasz {formatUsd(SAVED)} w porównaniu z płaceniem za wszystko co miesiąc.
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-gold-bright">
          Zobacz ofertę
          <Icon name="arrowRight" className="size-4" />
        </span>
      </div>
    </Link>
  )
}

export function AnualView() {
  const { owned, session } = useAppState()
  const everything = hasEverything(owned)
  const gifts = PRODUCTS.filter((p) => p.offer === 'front' && p.id !== 'cronologico')
  const rows = [
    { label: 'Chronologiczne Streszczenie Biblii + 9 prezentów', price: ANUAL.monthly.front },
    { label: 'Chronologiczne Streszczenie Biblii w audio', price: ANUAL.monthly.upsell1 },
    { label: 'Słowa Pana + Twój Doradca Biblijny', price: ANUAL.monthly.upsell2 },
  ]
  const groups = [
    {
      title: 'Chronologiczne Streszczenie Biblii',
      items: [
        '66 ksiąg Biblii w kolejności, w jakiej rozgrywały się wydarzenia',
        'Każde streszczenie z przybliżoną datą, autorem, postaciami, kluczowym wersetem i jasnym wyjaśnieniem',
        'Postępy, seria, punkty i refleksje, którymi dzielisz się z braćmi i siostrami',
      ],
    },
    { title: plural(gifts.length, 'prezent', 'prezenty', 'prezentów'), items: gifts.map((p) => p.title) },
    { title: 'Chronologiczne Streszczenie Biblii w audio', items: DEALS.upsell1.benefits },
    { title: 'Słowa Pana', items: DEALS.upsell2.benefits },
    { title: 'A do tego', items: ['Wszystko, co dodamy w ciągu twojego roku, bez żadnych dopłat'] },
  ]
  const checkout = ANUAL.checkoutUrl && session?.email ? `${ANUAL.checkoutUrl}${ANUAL.checkoutUrl.includes('?') ? '&' : '?'}email=${encodeURIComponent(session.email)}` : ANUAL.checkoutUrl

  return (
    <>
      <PageHeader back="/sklep" title="Plan roczny" subtitle="Wszystko, co oferujemy, na cały rok" />

      <div className="relative overflow-hidden rounded-[28px] bg-primary px-5 pb-6 pt-5 text-center text-white shadow-float">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(90% 70% at 50% 0%, rgba(224,172,74,.4), transparent 60%)' }} />
        <div className="relative">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-bright">Cała {APP.name}</p>
          <p className="mt-3 font-serif text-[46px] font-bold leading-none">{formatUsd(ANUAL.price)}</p>
          <p className="mt-1 text-[15px] text-white/80">za 12 miesięcy · to tylko {formatUsd(PER_MONTH)} miesięcznie</p>
          <p className="mx-auto mt-4 inline-block rounded-full bg-gold-bright px-4 py-1.5 text-[14px] font-bold text-primary">
            Oszczędzasz {formatUsd(SAVED)} ({SAVED_PCT}%)
          </p>
        </div>
      </div>

      <section aria-label="Ile to kosztuje miesięcznie" className="mt-6 rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-serif text-[19px] font-semibold text-ink">Gdyby płacić za wszystko co miesiąc</h2>
        <ul className="mt-3 divide-y divide-line-soft">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between gap-3 py-2.5 text-[15.5px]">
              <span className="text-ink">{r.label}</span>
              <span className="shrink-0 tabular-nums text-text">{formatUsd(r.price)}/mies.</span>
            </li>
          ))}
          <li className="flex items-baseline justify-between gap-3 py-2.5 text-[15.5px] font-semibold">
            <span className="text-ink">Razem za 12 miesięcy</span>
            <span className="shrink-0 tabular-nums text-danger line-through">{formatUsd(YEAR_MONTHLY)}</span>
          </li>
          <li className="flex items-baseline justify-between gap-3 py-2.5 text-[16.5px] font-bold">
            <span className="text-ink">W planie rocznym</span>
            <span className="shrink-0 tabular-nums text-success">{formatUsd(ANUAL.price)}</span>
          </li>
        </ul>
        <p className="mt-3 rounded-2xl bg-gold-soft/60 px-4 py-3 text-[14.5px] leading-snug text-ink">
          To mniej niż koszt {FRONT_MONTHS === 1 ? 'jednego miesiąca' : `${FRONT_MONTHS} miesięcy`} samego Chronologicznego Streszczenia Biblii.
        </p>
      </section>

      <section aria-label="Co zawiera" className="mt-5 rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-serif text-[19px] font-semibold text-ink">Zawiera wszystko</h2>
        <div className="mt-4 space-y-5">
          {groups.map((g) => (
            <BenefitList key={g.title} label={g.title} items={g.items} />
          ))}
        </div>
      </section>

      <div className="mt-6">
        {everything ? (
          <p className="rounded-2xl bg-success-soft p-4 text-center text-[15.5px] font-semibold text-success">Masz już dostęp do wszystkiego. Dziękujemy, że idziesz z nami!</p>
        ) : checkout ? (
          <a href={checkout} className={`${buttonClass.primary} min-h-14 text-[17px]`}>
            Chcę plan roczny
            <Icon name="arrowRight" className="size-5 text-gold-bright" />
          </a>
        ) : (
          <button type="button" disabled className={buttonClass.primary}>
            Już wkrótce dostępny
          </button>
        )}
        <p className="mt-3 text-center text-[14px] leading-snug text-muted">
          Kup, podając ten sam e-mail co w koncie, a wszystko aktywuje się samo. Jeśli dziś płacisz miesięczną subskrypcję, napisz do nas na {APP.supportEmail}, a anulujemy ją, żeby nie płacić podwójnie.
        </p>
      </div>
    </>
  )
}
