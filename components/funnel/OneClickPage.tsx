'use client'

import { Fragment, useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { VturbPlayer } from './VturbPlayer'
import { Icon } from '../icons'
import { BrandMark, buttonClass } from '../ui'
import { APP } from '@/lib/config'
import { FUNNEL, formatUsd, type OneClickStep } from '@/lib/funnel/config'
import { initPixel, trackCheckout } from '@/lib/funnel/tracking'

// The pages after the main purchase: two upsells (video, then the buttons) and a
// half-price downsell after each "no". Each page is one step of the upsell flow set
// up in KashPay; KashPay's official script (<KashPayScript/>, loaded synchronously by
// the page) defines acceptUpsell / declineUpsell. "Tak" charges the card of the
// purchase that brought the buyer here, "Nie" moves on without charging — and in both
// cases KashPay itself redirects to the next step of its flow, carrying the `ks`
// parameter of the current URL (which these pages never touch). These pages never
// see payment data and never decide whether a payment happened.

declare global {
  interface Window {
    acceptUpsell?: (url: string) => unknown
    declineUpsell?: (url: string) => unknown
  }
}

/** Only KashPay one-click links (https://checkout.kashpay.com.br/u/…), used exactly as given. */
function validUpsellUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.kashpay.com.br' || !url.pathname.startsWith('/u/')) return null
    return raw
  } catch {
    return null
  }
}

// ─── Copy ──────────────────────────────────────────────────────────

const AUDIO = {
  id: 'cronologico-audio',
  name: 'Chronologiczne Streszczenie Biblii w audio',
  receive: [
    'Chronologiczne Streszczenie Biblii w audio',
    '66 ksiąg opowiedzianych w porządku chronologicznym',
    'Regulowana prędkość i zapamiętywanie miejsca, w którym przerwiesz słuchanie',
    'Bezwarunkowa 30-dniowa gwarancja',
  ],
}

const PALABRAS = {
  id: 'palabras-del-senor',
  name: 'Słowa Pana',
  receive: [
    'Przewodnik „Słowa Pana”',
    'Twój Doradca Biblijny: rozmawiaj z nim, kiedy tylko potrzebujesz, i znajduj w Słowie pocieszenie i wskazówki',
    '90-dniowy plan Duchowej Przemiany',
    '90-dniowy plan: jak żyć według nauki Jezusa (krok po kroku)',
    '90-dniowy plan: zmień sposób myślenia i stań się prawdziwym chrześcijaninem',
    'Biblioteka „Kroczyć z olbrzymami”',
    'Sekretny prezent',
    'Bezwarunkowa 30-dniowa gwarancja',
  ],
}

interface UpsellCopy {
  kind: 'upsell'
  progress: number
  product: typeof AUDIO
  title: string
  text: string
  accept: string
  decline: string
  next: string
}

interface DownsellCopy {
  kind: 'downsell'
  progress: number
  product: typeof AUDIO
  /** `**bold**` marks the words in bold. `{from}` is replaced by the upsell price. */
  paragraphs: string[]
  accept: string
  decline: string
  next: string
}

const COPY: Record<OneClickStep, UpsellCopy | DownsellCopy> = {
  up1: {
    kind: 'upsell',
    progress: 40,
    product: AUDIO,
    title: 'Twoje zamówienie jest prawie gotowe, ale najpierw muszę przekazać ci ważną informację.',
    text: 'Zobaczysz tę stronę tylko raz, dlatego proszę cię o chwilę pełnej uwagi — obejrzyj poniższe wideo.',
    accept: 'Tak, chcę Streszczenie w audio',
    decline: 'Nie, dziękuję. Nie chcę wersji audio',
    next: '/upsell-downsell',
  },
  down1: {
    kind: 'downsell',
    progress: 55,
    product: AUDIO,
    paragraphs: [
      'Doskonale rozumiem, że {from} może się teraz wydawać sporą kwotą, zwłaszcza tuż po zakupie Chronologicznego Streszczenia Biblii.',
      'Ale naprawdę wierzę, że Słowo zapada w serce głębiej, gdy **również go słuchasz** — w tych chwilach dnia, kiedy nie możesz usiąść do czytania.',
      'Dlatego zrobię coś, co **proponuję tylko na tej stronie**:',
      'Dam ci dostęp do **Chronologicznego Streszczenia Biblii w audio** ze zniżką {pct}%.',
    ],
    accept: 'Tak, naprawdę chcę słuchać Słowa każdego dnia',
    decline: 'Nie, dziękuję. Przejdź dalej bez audio',
    next: '/slowa-pana',
  },
  up2: {
    kind: 'upsell',
    progress: 80,
    product: PALABRAS,
    title: 'Została tylko jedna rzecz, zanim przekażę ci twój materiał',
    text: 'To ostatni krok, zanim otrzymasz cały zamówiony materiał. Obejrzyj poniższe wideo.',
    accept: 'Tak, chcę „Słowa Pana”',
    decline: 'Nie, dziękuję. Przejdź dalej bez tego przewodnika',
    next: '/slowa-pana-downsell',
  },
  down2: {
    kind: 'downsell',
    progress: 92,
    product: PALABRAS,
    paragraphs: [
      'Doskonale rozumiem, że {from} może się teraz wydawać sporą kwotą, zwłaszcza tuż po zakupie Chronologicznego Streszczenia Biblii.',
      'Ale naprawdę wierzę, że pełnię tego, co daje nasz materiał, odkrywasz dopiero wtedy, gdy **wprowadzasz w życie** wszystko, czego się z niego uczysz.',
      'Dlatego zrobię coś, co **proponuję tylko na tej stronie**:',
      'Dam ci dostęp do **„Słów Pana”** ze zniżką {pct}%.',
    ],
    accept: 'Tak, chcę „Słowa Pana” ze wszystkimi prezentami',
    decline: 'Nie, dziękuję. Zakończ moje zamówienie',
    next: '/witaj',
  },
}

const TEXT = {
  notice: 'Nie zamykaj strony — zakup w toku!',
  lastChance: 'Ostatnia szansa!',
  discount: '{pct}% zniżki!',
  receive: 'Otrzymasz wszystko:',
  from: 'zamiast',
  for: 'tylko',
  perMonth: '/mies.',
  /** Every offer is a monthly subscription: said right under the button. */
  sameCard: 'Subskrypcja miesięczna: {price} miesięcznie, tą samą metodą płatności i bez ponownego wpisywania danych.',
  error: 'Nie udało się połączyć z płatnością. Nic nie zostało pobrane — odśwież stronę i spróbuj ponownie.',
  unavailable: 'Ta oferta jest w tej chwili niedostępna.',
  ps: 'To wyjątkowa okazja, ważna tylko teraz, na tej stronie — te warunki nie będą już dla ciebie dostępne.',
}

/** "a **b** c" → a <strong>b</strong> c */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) => (
        <Fragment key={i}>{i % 2 ? <strong className="font-semibold text-ink">{part}</strong> : part}</Fragment>
      ))}
    </>
  )
}

function Receive({ items }: { items: string[] }) {
  return (
    <ul className="mx-auto max-w-sm space-y-2.5 text-left">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[15.5px] leading-snug text-ink">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
            <Icon name="check" className="size-3.5" strokeWidth={2.6} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

const subscribeNothing = () => () => {}

export function OneClickPage({ step }: { step: OneClickStep }) {
  const copy = COPY[step]
  const config = FUNNEL[step]
  const search = useSyncExternalStore(subscribeNothing, () => window.location.search, () => '')
  const hasVideo = Boolean(config.video.playerId && config.video.scriptUrl)
  const [videoRevealed, setVideoRevealed] = useState(false)
  const reveal = useCallback(() => setVideoRevealed(true), [])
  // No video → the buttons are shown straight away.
  const revealed = videoRevealed || !hasVideo
  const [failed, setFailed] = useState(false)
  const checkout = validUpsellUrl(config.checkoutUrl)
  // Downsell discount from the real prices, so the text can never disagree with them.
  const pct = config.priceFrom > config.price ? Math.round((1 - config.price / config.priceFrom) * 100) : 0
  const fill = (text: string) =>
    text
      .replace('{pct}', String(pct))
      .replace('{from}', `${formatUsd(config.priceFrom)} miesięcznie`)
      .replace('{price}', formatUsd(config.price))

  useEffect(() => {
    initPixel()
  }, [])

  // KashPay's own functions, called with the step's /u/ link exactly as KashPay
  // generated it. KashPay handles the charge, the double clicks and the redirect.
  const accept = () => {
    if (!checkout) return
    if (typeof window.acceptUpsell !== 'function') {
      setFailed(true)
      return
    }
    trackCheckout(copy.kind === 'downsell' ? `${copy.product.id}-downsell` : copy.product.id, config.price)
    window.acceptUpsell(checkout)
  }

  const decline = () => {
    if (checkout && typeof window.declineUpsell === 'function') {
      window.declineUpsell(checkout)
      return
    }
    // Step not set up in KashPay yet (or its script unavailable): just go on.
    window.location.href = `${copy.next}${search}`
  }

  const offer = (
    <div className="animate-rise mt-6 rounded-3xl border-2 border-gold-bright bg-surface p-5 text-center shadow-card">
      {checkout ? (
        <>
          {copy.kind === 'downsell' ? (
            config.priceFrom > config.price && (
              <p className="text-[18px] font-semibold text-danger line-through">
                {TEXT.from} {formatUsd(config.priceFrom)}
                {TEXT.perMonth}
              </p>
            )
          ) : (
            <p className="font-serif text-[21px] font-semibold text-ink">{copy.product.name}</p>
          )}
          {config.price > 0 && (
            <p className="font-serif text-[36px] font-bold leading-tight text-ink">
              {copy.kind === 'downsell' && <span className="text-[22px] font-semibold">{TEXT.for} </span>}
              {formatUsd(config.price)}
              <span className="text-[19px] font-semibold text-text">{TEXT.perMonth}</span>
            </p>
          )}
          <button type="button" onClick={accept} className={`${buttonClass.primary} mt-3 min-h-14 text-[17px]`}>
            {fill(copy.accept)}
          </button>
          {config.price > 0 && <p className="mt-3 text-[14px] leading-snug text-muted">{fill(TEXT.sameCard)}</p>}
          {failed && (
            <p role="alert" className="mt-3 text-[14.5px] font-medium text-danger">
              {TEXT.error}
            </p>
          )}
        </>
      ) : (
        <p className="text-[15.5px] text-text">{TEXT.unavailable}</p>
      )}
    </div>
  )

  const declineButton = (
    <button
      type="button"
      onClick={decline}
      className="mx-auto mt-5 block w-full py-3 text-center text-[15px] text-muted underline underline-offset-4 hover:text-ink"
    >
      {copy.decline}
    </button>
  )

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pb-16 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="mb-5">
        <div className="flex items-center justify-center gap-2.5">
          <BrandMark />
          <span className="font-serif text-[19px] font-semibold text-ink">{APP.name}</span>
        </div>
        <div className="mx-auto mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-line-soft" aria-hidden>
          <div className="h-full rounded-full bg-gold-bright" style={{ width: `${copy.progress}%` }} />
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-ink">
          <Icon name="clock" className="size-5 shrink-0 text-primary" />
          {TEXT.notice}
        </p>
      </header>

      {copy.kind === 'upsell' ? (
        <main>
          <h1 className="text-center font-serif text-[27px] font-semibold leading-tight text-balance text-ink">{copy.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-[16.5px] leading-relaxed text-text">{copy.text}</p>
          {hasVideo && (
            <div className="mt-6">
              <VturbPlayer video={config.video} onReveal={reveal} />
            </div>
          )}
          {revealed && (
            <>
              {offer}
              {!hasVideo && (
                <div className="mt-5">
                  <Receive items={copy.product.receive} />
                </div>
              )}
              {declineButton}
            </>
          )}
        </main>
      ) : (
        <main className="text-center">
          <p className="flex items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.08em] text-flame">
            <Icon name="alert" className="size-5 shrink-0" />
            {TEXT.lastChance}
          </p>
          <h1 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-primary">{fill(TEXT.discount)}</h1>
          <div className="mx-auto mt-4 max-w-md space-y-3 text-[16.5px] leading-relaxed text-text">
            {copy.paragraphs.map((p) => (
              <p key={p}>
                <Rich text={fill(p)} />
              </p>
            ))}
          </div>
          <p className="mt-6 font-serif text-[21px] font-semibold text-ink">{TEXT.receive}</p>
          <div className="mt-3">
            <Receive items={copy.product.receive} />
          </div>
          {offer}
          {declineButton}
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
            <strong className="font-semibold text-text">PS</strong> {TEXT.ps}
          </p>
        </main>
      )}
    </div>
  )
}
