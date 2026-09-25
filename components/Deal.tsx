'use client'

import { useSyncExternalStore } from 'react'
import { Icon } from './icons'
import { buttonClass } from './ui'
import { DEALS, dealState, withEmail, type UpsellId } from '@/lib/deals'
import { formatUsd } from '@/lib/funnel/config'
import { useAppState } from '@/lib/store'

// The 50%-for-life offer box (countdown, price, checkout) and the list of everything an
// offer includes. Same pieces in the Tienda, on a locked product and in the Consejero.

function subscribeSecond(cb: () => void): () => void {
  const id = window.setInterval(cb, 1000)
  return () => window.clearInterval(id)
}

/** Epoch ms, ticking every second; 0 on the server. */
function useNowSecond(): number {
  return useSyncExternalStore(subscribeSecond, () => Math.floor(Date.now() / 1000) * 1000, () => 0)
}

export function useDeal(offer: UpsellId) {
  const { offerStartedAt, session } = useAppState()
  const now = useNowSecond()
  return { ...dealState(offer, offerStartedAt, now), now, email: session?.email }
}

function Countdown({ deadline, now }: { deadline: number; now: number }) {
  const ms = Math.max(0, deadline - now)
  const days = Math.floor(ms / 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const parts: [string, string][] = [
    [String(days), days === 1 ? 'dzień' : 'dni'],
    [pad(Math.floor((ms % 86_400_000) / 3_600_000)), 'godz.'],
    [pad(Math.floor((ms % 3_600_000) / 60_000)), 'min'],
    [pad(Math.floor((ms % 60_000) / 1000)), 's'],
  ]
  return (
    <div className="mt-3 flex items-center justify-center gap-2 font-sans tabular-nums" role="timer" aria-label={`Oferta kończy się za ${days} ${days === 1 ? 'dzień' : 'dni'}`}>
      {parts.map(([v, unit]) => (
        <span key={unit} className="min-w-14 rounded-xl bg-white/10 px-2 py-1.5 text-center">
          <span className="block text-[22px] font-bold leading-none">{now ? v : '–'}</span>
          <span className="mt-1 block text-[11px] uppercase tracking-wide text-white/70">{unit}</span>
        </span>
      ))}
    </div>
  )
}

export function DealBox({ offer, title, cta }: { offer: UpsellId; title: string; cta: string }) {
  const deal = DEALS[offer]
  const { active, deadline, price, url, now, email } = useDeal(offer)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-5 text-center text-white shadow-float">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(90% 70% at 50% 0%, rgba(224,172,74,.32), transparent 60%)' }} />
      <div className="relative">
        {active ? (
          <>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-bright">Tylko dla ciebie · 50% zniżki na zawsze</p>
            <Countdown deadline={deadline} now={now} />
          </>
        ) : (
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-bright">Odblokuj teraz</p>
        )}
        <p className="mt-4 font-serif text-[20px] font-semibold leading-snug">{title}</p>
        <p className="mt-1 text-[15px] text-white/80">
          {active && (
            <>
              <span className="line-through">{formatUsd(deal.fullPrice)}</span>{' '}
            </>
          )}
          <strong className="text-[24px] text-white">{formatUsd(price)}</strong> miesięcznie
        </p>
        {url ? (
          <a
            href={withEmail(url, email)}
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold-bright px-5 text-[17px] font-semibold text-primary shadow-card transition hover:brightness-105 active:scale-[0.99]"
          >
            {cta}
            <Icon name="arrowRight" className="size-5" />
          </a>
        ) : (
          <button type="button" disabled className={`${buttonClass.primary} mt-4 bg-white/15 text-white/80`}>
            Dostępne już wkrótce
          </button>
        )}
        {active && (
          <p className="mt-3 text-[13px] leading-snug text-white/75">
            Płacisz {formatUsd(deal.discountPrice)} miesięcznie, dopóki utrzymujesz subskrypcję. Gdy czas oferty minie, cena wraca do {formatUsd(deal.fullPrice)}.
          </p>
        )}
        <p className="mt-2 text-[13px] text-white/75">
          Kup, podając ten sam e-mail co w koncie, a dostęp włączy się sam.{deal.note ? ` ${deal.note}` : ''}
        </p>
      </div>
    </div>
  )
}

export function BenefitList({ items, label = 'Wszystko, co otrzymujesz' }: { items: readonly string[]; label?: string }) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">{label}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[15.5px] leading-snug text-ink">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
              <Icon name="check" className="size-3.5" strokeWidth={2.6} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Small "50% OFF" pill for locked tiles while the member's offer lasts. */
export function DealBadge({ offer }: { offer: UpsellId }) {
  const { active, now } = useDeal(offer)
  if (!now || !active) return null
  return <span className="rounded-full bg-danger px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-wide text-white">-50%</span>
}
