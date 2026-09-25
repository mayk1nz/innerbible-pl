'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { VturbPlayer } from './VturbPlayer'
import { Icon } from '../icons'
import { BrandMark, buttonClass } from '../ui'
import { APP } from '@/lib/config'
import { FUNNEL, formatUsd } from '@/lib/funnel/config'
import { initPixel, trackCheckout, withAttribution } from '@/lib/funnel/tracking'

// One-click upsell after the main purchase. KashPay's upsell processor charges the
// card from the purchase that brought the buyer here; this page never sees payment
// data and never decides whether a payment happened — KashPay does, and redirects.

declare global {
  interface Window {
    acceptUpsell?: (url: string) => Promise<unknown>
  }
}

const PROCESSOR = 'https://checkout.kashpay.com.br/scripts/upsell-processor.js'

let processor: Promise<void> | null = null

function loadProcessor(): Promise<void> {
  if (typeof window.acceptUpsell === 'function') return Promise.resolve()
  if (processor) return processor
  processor = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = window.setTimeout(() => reject(new Error('timeout')), 15_000)
    script.src = PROCESSOR
    script.async = true
    script.onload = () => {
      window.clearTimeout(timer)
      if (typeof window.acceptUpsell === 'function') resolve()
      else reject(new Error('unavailable'))
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error('load-failed'))
    }
    document.head.appendChild(script)
  }).catch((err: unknown) => {
    processor = null
    throw err
  })
  return processor
}

/** Only KashPay one-click links (https://checkout.kashpay.com.br/u/…) are accepted. */
function validUpsellUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.kashpay.com.br' || !url.pathname.startsWith('/u/')) return null
    return url.href
  } catch {
    return null
  }
}

// The owner's upsell copy.
const COPY = {
  up1: {
    product: 'parabolas-de-jesus',
    eyebrow: 'Uzupełnienie twojego Chronologicznego Streszczenia Biblii',
    name: 'Przypowieści Jezusa krok po kroku',
    title: 'Znasz już tę historię.',
    highlight: 'Teraz zrozum, czego nauczał Jezus.',
    text: 'Zgłęb 20 przypowieści Jezusa z przewodnikiem, który wyjaśnia ich kontekst, główne przesłanie i to, jak przenieść każdą naukę do codziennego życia.',
    benefit: 'Jedna przypowieść naraz. Więcej kontekstu do lektury, więcej jasności do refleksji.',
    includes: [
      'Kontekst i postacie każdej opowieści.',
      'Przystępne wyjaśnienia z odnośnikami do czytania w twojej Biblii.',
      'Pytania do refleksji i praktyczne zastosowanie w każdym studium.',
    ],
    detail: 'Cyfrowy przewodnik do studium · 20 przypowieści',
    accept: 'Tak, chcę zgłębić przypowieści',
    decline: 'Nie, dziękuję. Przejdź dalej bez tego dodatku',
    next: '/up2',
  },
  up2: {
    product: 'devocional-en-familia',
    eyebrow: 'Czas na wspólną lekturę i rozmowę',
    name: 'Rodzinne nabożeństwo — 60 spotkań',
    title: 'Niech Słowo nie zostaje tylko z tobą.',
    highlight: 'Dziel się nim z rodziną.',
    text: 'Przewodnik, dzięki któremu otworzycie razem Biblię, porozmawiacie o jednej nauce i zakończycie modlitwą — bez przygotowywania każdego spotkania od zera.',
    benefit: 'Proponowany rytm: 15 minut, by razem słuchać, rozważać i dzielić się wiarą.',
    includes: [
      '60 spotkań z fragmentem Pisma Świętego i refleksją.',
      'Pytania do rozmowy, które łatwo dopasować do wieku dzieci i dorosłych.',
      'Modlitwa i proste zadanie na każde spotkanie.',
    ],
    detail: 'Cyfrowy przewodnik · 60 spotkań do wspólnego przeżycia',
    accept: 'Tak, chcę rodzinne nabożeństwo',
    decline: 'Nie, dziękuję. Zakończ bez dodawania',
    next: '/witaj',
  },
} as const

const subscribeNothing = () => () => {}

export function UpsellPage({ offer }: { offer: 'up1' | 'up2' }) {
  const copy = COPY[offer]
  const config = FUNNEL[offer]
  const search = useSyncExternalStore(subscribeNothing, () => window.location.search, () => '')
  const hasVideo = Boolean(config.video.playerId && config.video.scriptUrl)
  const [videoRevealed, setVideoRevealed] = useState(false)
  const reveal = useCallback(() => setVideoRevealed(true), [])
  // No upsell video yet: the offer is shown straight away (no empty player box).
  const revealed = videoRevealed || !hasVideo
  const [state, setState] = useState<'idle' | 'working' | 'sent' | 'error'>('idle')
  const checkout = validUpsellUrl(config.checkoutUrl)
  const available = Boolean(checkout)

  useEffect(() => {
    initPixel()
  }, [])

  const accept = async () => {
    if (!checkout || state === 'working' || state === 'sent') return
    setState('working')
    trackCheckout(copy.product, config.price)
    try {
      await loadProcessor()
    } catch {
      setState('error')
      return
    }
    // Once the payment request is sent, never retry automatically: the gateway owns
    // the result and the redirect that follows it.
    setState('sent')
    try {
      await window.acceptUpsell?.(withAttribution(checkout, search))
    } catch {
      // KashPay reports the outcome on its own confirmation.
    }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] px-5 pb-16 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="mb-6 flex items-center justify-center gap-2.5">
        <BrandMark />
        <span className="font-serif text-[19px] font-semibold text-ink">{APP.name}</span>
      </header>

      <p className="rounded-2xl bg-primary px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-white">{copy.eyebrow}</p>
      <p className="mt-6 text-center text-[15px] font-semibold text-gold">{copy.name}</p>
      <h1 className="mt-2 text-center font-serif text-[29px] font-semibold leading-tight text-balance text-ink">
        {copy.title} <span className="text-gold">{copy.highlight}</span>
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-center text-[16.5px] leading-relaxed text-text">{copy.text}</p>
      <p className="mx-auto mt-3 max-w-sm text-center text-[16px] font-semibold leading-snug text-ink">{copy.benefit}</p>

      {hasVideo && (
        <div className="mt-6">
          <VturbPlayer video={config.video} onReveal={reveal} />
        </div>
      )}

      <ul className="mt-6 space-y-2.5 rounded-3xl border border-line bg-surface-2 p-5">
        {copy.includes.map((item) => (
          <li key={item} className="flex gap-2.5 text-[15.5px] leading-snug text-ink">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
              <Icon name="check" className="size-3.5" strokeWidth={2.6} />
            </span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[14px] text-muted">{copy.detail}</p>

      {revealed && (
        <div className="animate-rise mt-6 rounded-3xl border-2 border-gold-bright bg-surface p-5 text-center shadow-card">
          {available ? (
            <>
              {config.price > 0 && <p className="font-serif text-[34px] font-bold text-ink">{formatUsd(config.price)}</p>}
              <button
                type="button"
                onClick={accept}
                disabled={state === 'working' || state === 'sent'}
                aria-busy={state === 'working'}
                className={`${buttonClass.primary} mt-3 min-h-14 text-[17px]`}
              >
                {state === 'working' ? 'Łączenie z płatnością…' : state === 'sent' ? 'Przetwarzamy twoje zamówienie…' : copy.accept}
              </button>
              <p className="mt-3 text-[14px] leading-snug text-muted">
                Dodamy to do twojego zakupu tą samą metodą płatności — bez ponownego wpisywania danych.
              </p>
              {state === 'error' && (
                <p role="alert" className="mt-3 text-[14.5px] font-medium text-danger">
                  Nie udało się połączyć z płatnością. Nic nie zostało pobrane — spróbuj ponownie za chwilę.
                </p>
              )}
              {state === 'sent' && (
                <p role="status" className="mt-3 text-[14.5px] text-text">
                  Jeśli ta strona nie zmieni się w ciągu kilku sekund, sprawdź e-mail z potwierdzeniem, zanim spróbujesz ponownie.
                </p>
              )}
            </>
          ) : (
            <p className="text-[15.5px] text-text">Ta oferta jest w tej chwili niedostępna.</p>
          )}
        </div>
      )}

      <Link href={`${copy.next}${search}`} className="mt-5 block py-3 text-center text-[15px] text-muted underline underline-offset-4 hover:text-ink">
        {copy.decline}
      </Link>
    </div>
  )
}
