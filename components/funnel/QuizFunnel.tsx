'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { VturbPlayer } from './VturbPlayer'
import { Icon } from '../icons'
import { BrandMark, buttonClass } from '../ui'
import { APP } from '@/lib/config'
import { FUNNEL, formatUsd } from '@/lib/funnel/config'
import {
  ANALYSIS_IMAGE,
  INTRO,
  OFFER,
  PAYMENT_NOTE,
  PROFILE,
  RESULT,
  TEST,
  TEST_INTRO,
  type ProfileQuestion,
  type TestQuestion,
} from '@/lib/funnel/questions'
import { initPixel, trackCheckout, trackViewContent, withAttribution } from '@/lib/funnel/tracking'

// The owner's quiz funnel in the app's look. 22 steps:
//   0 intro · 1–7 profile · 8 test intro · 9–18 test · 19 analysis · 20 result · 21 video
// The browser Back button walks back through the steps. Answers stay in memory only.
// The score is computed from the answers.

const TEST_INTRO_STEP = 1 + PROFILE.length
const FIRST_TEST = TEST_INTRO_STEP + 1
const ANALYSIS = FIRST_TEST + TEST.length
const RESULT_STEP = ANALYSIS + 1
const VIDEO = RESULT_STEP + 1
const TOTAL = VIDEO + 1
const ANALYSIS_MS = 4500
const PRODUCT_ID = 'resumen-cronologico'

type ProfileAnswers = Record<string, number[]>
type HeadingRef = RefObject<HTMLHeadingElement | null>

export function QuizFunnel() {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<ProfileAnswers>({})
  const [test, setTest] = useState<number[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    initPixel()
    try {
      window.history.replaceState({ quizStep: 0 }, '')
    } catch {
      // history unavailable: Back simply leaves the page
    }
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { quizStep?: number } | null)?.quizStep
      setPicked(null)
      setStep(typeof s === 'number' && s >= 0 && s < TOTAL ? s : 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (step > 0) heading.current?.focus({ preventScroll: true })
  }, [step])

  const go = useCallback((next: number) => {
    setPicked(null)
    setStep(next)
    try {
      window.history.pushState({ quizStep: next }, '')
    } catch {
      // ignore
    }
  }, [])

  // Stable, so the analysis timer is not restarted by unrelated re-renders.
  const toResult = useCallback(() => go(RESULT_STEP), [go])

  const answerProfile = (q: ProfileQuestion, choice: number) => {
    if (picked !== null) return
    setPicked(choice)
    setProfile((p) => ({ ...p, [q.id]: [choice] }))
    window.setTimeout(() => go(step + 1), 220)
  }

  const answerTest = (index: number, choice: number) => {
    if (picked !== null) return
    setPicked(choice)
    setTest((t) => {
      const next = [...t]
      next[index] = choice
      return next
    })
    window.setTimeout(() => go(step + 1), 260)
  }

  const inProfile = step >= 1 && step <= PROFILE.length
  const inTest = step >= FIRST_TEST && step < ANALYSIS
  const showProgress = step > 0 && step < VIDEO

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] px-5 pb-16 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="mb-6">
        <div className="flex items-center justify-center gap-2.5">
          <BrandMark />
          <span className="font-serif text-[19px] font-semibold text-ink">{APP.name}</span>
        </div>
        {showProgress && (
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-line-soft" aria-hidden>
            <div className="h-full rounded-full bg-gold-bright transition-[width] duration-500" style={{ width: `${Math.round(((step + 1) / TOTAL) * 100)}%` }} />
          </div>
        )}
      </header>

      <main key={step} className="animate-rise">
        {step === 0 && <Intro onStart={() => go(1)} />}

        {inProfile && (
          <ProfileStep
            q={PROFILE[step - 1]}
            headingRef={heading}
            picked={picked}
            multiValue={profile[PROFILE[step - 1].id] ?? []}
            onPick={(c) => answerProfile(PROFILE[step - 1], c)}
            onMulti={(values) => setProfile((p) => ({ ...p, [PROFILE[step - 1].id]: values }))}
            onContinue={() => go(step + 1)}
          />
        )}

        {step === TEST_INTRO_STEP && <Interstitial headingRef={heading} onStart={() => go(FIRST_TEST)} />}

        {inTest && (
          <TestStep
            q={TEST[step - FIRST_TEST]}
            number={step - FIRST_TEST + 1}
            headingRef={heading}
            picked={picked}
            onPick={(c) => answerTest(step - FIRST_TEST, c)}
          />
        )}

        {step === ANALYSIS && <Analysis headingRef={heading} onDone={toResult} />}

        {step === RESULT_STEP && <Result headingRef={heading} test={test} onNext={() => go(VIDEO)} />}

        {step === VIDEO && <VideoOffer headingRef={heading} />}
      </main>
    </div>
  )
}

// ─── Building blocks ───────────────────────────────────────────────

const headingClass = 'font-serif font-semibold leading-[1.2] text-balance text-ink focus:outline-none focus-visible:outline-none'

function Picture({ src, className = '' }: { src?: string; className?: string }) {
  if (!src) return null
  // eslint-disable-next-line @next/next/no-img-element -- local static illustrations, sized by CSS
  return <img src={src} alt="" className={`mx-auto aspect-square w-full max-w-[340px] rounded-3xl object-cover shadow-card ${className}`} />
}

function Title({ headingRef, children, hint, eyebrow }: { headingRef: HeadingRef; children: ReactNode; hint?: string; eyebrow?: string }) {
  return (
    <div className="mb-6 text-center">
      {eyebrow && <p className="mb-2 text-[14px] font-semibold text-gold">{eyebrow}</p>}
      <h1 ref={headingRef} tabIndex={-1} className={`text-[25px] ${headingClass}`}>
        {children}
      </h1>
      {hint && <p className="mt-2 text-[15.5px] text-muted">{hint}</p>}
    </div>
  )
}

function Option({
  label,
  selected,
  onClick,
  leading,
  multi = false,
}: {
  label: string
  selected: boolean
  onClick: () => void
  leading?: ReactNode
  multi?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-16 w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.99] ${
        selected ? 'border-primary bg-[#e8ecf3]' : 'border-line bg-surface hover:border-[#cdb888] hover:bg-surface-hover'
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1 text-[17px] font-medium leading-snug text-ink">{label}</span>
      {multi && (
        <span className={`grid size-6 shrink-0 place-items-center rounded-md border-2 ${selected ? 'border-primary bg-primary text-white' : 'border-[#b9a57c] bg-surface-2'}`}>
          {selected && <Icon name="check" className="size-4" strokeWidth={3} />}
        </span>
      )}
    </button>
  )
}

/** Picture card for options that come with an illustration (age, gender, Bible scenes). */
function ImageOption({
  label,
  image,
  selected,
  onClick,
  badge,
}: {
  label: string
  image: string
  selected: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col overflow-hidden rounded-2xl border-2 text-left transition active:scale-[0.99] ${
        selected ? 'border-primary bg-[#e8ecf3]' : 'border-line bg-surface hover:border-[#cdb888]'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local static illustration */}
      <img src={image} alt="" className="aspect-square w-full object-cover" />
      <span className="flex min-h-14 flex-1 items-center gap-2 px-3 py-2.5">
        {badge && (
          <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold ${selected ? 'bg-primary text-white' : 'bg-gold-soft text-ink'}`}>{badge}</span>
        )}
        <span className="text-[15px] font-medium leading-snug text-ink">{label}</span>
      </span>
    </button>
  )
}

// ─── Steps ─────────────────────────────────────────────────────────

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="pt-2 text-center">
      <h1 className="font-serif text-[33px] font-semibold leading-[1.1] text-balance text-ink">{INTRO.title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-[17px] leading-relaxed text-text">{INTRO.text}</p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-soft/70 px-4 py-2 text-[15.5px] font-semibold text-ink">
        <Icon name="gift" className="size-5 text-gold" />
        {INTRO.gift}
      </p>
      <Picture src={INTRO.image} className="mt-6" />
      <button type="button" onClick={onStart} className={`${buttonClass.primary} mt-6 min-h-14 text-[17px]`}>
        {INTRO.button}
        <Icon name="arrowRight" className="size-5 text-gold-bright" />
      </button>
    </div>
  )
}

function ProfileStep({
  q,
  headingRef,
  picked,
  multiValue,
  onPick,
  onMulti,
  onContinue,
}: {
  q: ProfileQuestion
  headingRef: HeadingRef
  picked: number | null
  multiValue: number[]
  onPick: (choice: number) => void
  onMulti: (values: number[]) => void
  onContinue: () => void
}) {
  const pick = (i: number) => {
    if (!q.multi) {
      onPick(i)
      return
    }
    onMulti(multiValue.includes(i) ? multiValue.filter((v) => v !== i) : [...multiValue, i])
  }
  const grid = !q.thumbs && q.options.every((o) => o.image)

  return (
    <>
      <Picture src={q.image} className="mb-6" />
      <Title headingRef={headingRef} hint={q.hint} eyebrow={q.eyebrow}>
        {q.title}
      </Title>
      {grid ? (
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o, i) => (
            <ImageOption key={o.label} label={o.label} image={o.image ?? ''} selected={picked === i} onClick={() => pick(i)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {q.options.map((o, i) => (
            <Option
              key={o.label}
              label={o.label}
              multi={q.multi}
              selected={q.multi ? multiValue.includes(i) : picked === i}
              onClick={() => pick(i)}
              leading={
                o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local static illustration
                  <img src={o.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                ) : o.icon ? (
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${o.icon === 'x' ? 'bg-[#f6dcd8] text-danger' : o.icon === 'check' ? 'bg-success-soft text-success' : 'bg-gold-soft text-gold'}`}>
                    <Icon name={o.icon} className="size-5" strokeWidth={2.6} />
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
      {q.multi && (
        <button type="button" onClick={onContinue} disabled={multiValue.length === 0} className={`${buttonClass.primary} mt-6`}>
          Dalej
        </button>
      )}
    </>
  )
}

function Interstitial({ headingRef, onStart }: { headingRef: HeadingRef; onStart: () => void }) {
  return (
    <div className="text-center">
      <h1 ref={headingRef} tabIndex={-1} className={`text-[27px] ${headingClass}`}>
        {TEST_INTRO.title}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[17px] leading-relaxed text-text">{TEST_INTRO.text}</p>
      <Picture src={TEST_INTRO.image} className="mt-6" />
      <button type="button" onClick={onStart} className={`${buttonClass.primary} mt-6 min-h-14 text-[17px]`}>
        {TEST_INTRO.button}
      </button>
    </div>
  )
}

const LETTERS = ['A', 'B', 'C', 'D']

function TestStep({
  q,
  number,
  headingRef,
  picked,
  onPick,
}: {
  q: TestQuestion
  number: number
  headingRef: HeadingRef
  picked: number | null
  onPick: (choice: number) => void
}) {
  const grid = Boolean(q.optionImages && q.optionImages.length === q.options.length)
  return (
    <>
      <p className="mb-3 text-center text-[14px] font-semibold uppercase tracking-[0.08em] text-gold">
        Pytanie {number} z {TEST.length}
      </p>
      <Picture src={q.image} className="mb-6" />
      <Title headingRef={headingRef}>{q.title}</Title>
      {grid ? (
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((label, i) => (
            <ImageOption key={label} label={label} image={q.optionImages?.[i] ?? ''} badge={LETTERS[i]} selected={picked === i} onClick={() => onPick(i)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {q.options.map((label, i) => (
            <Option
              key={label}
              label={label}
              selected={picked === i}
              onClick={() => onPick(i)}
              leading={
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-bold ${picked === i ? 'bg-primary text-white' : 'bg-gold-soft text-ink'}`}>
                  {LETTERS[i]}
                </span>
              }
            />
          ))}
        </div>
      )}
    </>
  )
}

function Analysis({ headingRef, onDone }: { headingRef: HeadingRef; onDone: () => void }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const tick = window.setInterval(() => {
      setPct(Math.min(100, Math.round(((Date.now() - started) / ANALYSIS_MS) * 100)))
    }, 60)
    const done = window.setTimeout(onDone, ANALYSIS_MS + 150)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [onDone])

  return (
    <div className="text-center">
      <h1 ref={headingRef} tabIndex={-1} className={`text-[26px] ${headingClass}`}>
        Analizujemy twoje odpowiedzi…
      </h1>
      <Picture src={ANALYSIS_IMAGE} className="mt-6" />
      <p className="mt-6 font-serif text-[44px] font-semibold tabular-nums text-ink" aria-live="polite">
        {pct}%
      </p>
      <div className="mx-auto mt-2 h-2.5 max-w-xs overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full rounded-full bg-gold-bright" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Result({ headingRef, test, onNext }: { headingRef: HeadingRef; test: number[]; onNext: () => void }) {
  const score = TEST.reduce((sum, q, i) => sum + (test[i] === q.correct ? 1 : 0), 0)
  const lines = score >= 7 ? RESULT.high : RESULT.low

  return (
    <>
      <p className="text-center text-[13px] font-semibold uppercase tracking-[0.1em] text-gold">{RESULT.eyebrow}</p>
      <h1 ref={headingRef} tabIndex={-1} className={`mt-2 text-center text-[29px] ${headingClass}`}>
        Poprawne odpowiedzi: {score} z {TEST.length}
      </h1>
      <p className="mt-2 text-center text-[18px] font-semibold text-ink">{lines[0]}</p>

      <div className="mt-5 space-y-2 text-center text-[16.5px] leading-relaxed text-text">
        {lines.slice(1).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>

      <Picture src={RESULT.image} className="mt-6" />

      <div className="mt-6 rounded-3xl border border-line bg-surface p-5 text-center">
        <p className="font-serif text-[22px] font-semibold text-ink">{RESULT.goodNews}</p>
        <div className="mt-2 space-y-2 text-[16.5px] leading-relaxed text-text">
          {RESULT.pitch.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 font-serif text-[19px] font-semibold text-ink">
          <Icon name="sparkles" className="size-5 shrink-0 text-gold" />
          {RESULT.product}
        </p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element -- local static product image */}
      <img src={RESULT.productImage} alt="Chronologiczne Streszczenie Biblii" className="mx-auto mt-6 w-full max-w-[340px]" />

      <button type="button" onClick={onNext} className={`${buttonClass.primary} mt-6 min-h-14 text-[17px]`}>
        {RESULT.button}
        <Icon name="arrowRight" className="size-5 text-gold-bright" />
      </button>
    </>
  )
}

function VideoOffer({ headingRef }: { headingRef: HeadingRef }) {
  const [revealed, setRevealed] = useState(false)
  const reveal = useCallback(() => setRevealed(true), [])
  const offer = FUNNEL.front

  useEffect(() => {
    trackViewContent(PRODUCT_ID, offer.price)
  }, [offer.price])

  const buy = () => {
    trackCheckout(PRODUCT_ID, offer.price)
    window.location.href = withAttribution(offer.checkoutUrl, window.location.search)
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className={`mb-5 text-center text-[24px] ${headingClass}`}>
        {OFFER.title}
      </h1>
      <VturbPlayer video={offer.video} onReveal={reveal} />

      {revealed && (
        <div className="animate-rise mt-6 rounded-3xl border-2 border-gold-bright bg-surface p-5 text-center shadow-card">
          <p className="text-[15px] font-semibold uppercase tracking-[0.08em] text-gold">{OFFER.headline}</p>
          <p className="mt-1 font-serif text-[24px] font-semibold text-ink">{OFFER.product}</p>
          <p className="text-[16px] font-semibold text-text">{OFFER.extra}</p>
          <p className="mt-4 text-[16px] text-text">
            {offer.priceFrom > offer.price && (
              <>
                Zamiast <span className="text-muted line-through">{formatUsd(offer.priceFrom)}</span> tylko
              </>
            )}
          </p>
          <p className="font-serif text-[40px] font-bold leading-tight text-ink">
            {formatUsd(offer.price)}
            <span className="text-[20px] font-semibold text-text">{OFFER.perMonth}</span>
          </p>
          <button type="button" onClick={buy} className={`${buttonClass.primary} mt-4 min-h-14 text-[17px]`}>
            {OFFER.button}
            <Icon name="arrowRight" className="size-5 shrink-0 text-gold-bright" />
          </button>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {OFFER.bullets.map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-[15px] font-medium text-ink">
                <Icon name="check" className="size-4 text-success" strokeWidth={2.8} />
                {b}
              </li>
            ))}
          </ul>
          <div className="mx-auto mt-5 max-w-[360px] rounded-2xl bg-primary px-5 py-5 text-white">
            <p className="inline-block rounded-lg bg-gold-bright px-3 py-1 text-[15px] font-bold uppercase tracking-[0.04em] text-ink">{PAYMENT_NOTE.badge}</p>
            <p className="mt-3 text-[15px] font-semibold uppercase leading-snug">
              {PAYMENT_NOTE.plan}: {formatUsd(offer.price)}
              {OFFER.perMonth}
            </p>
            <p className="mt-4 inline-block rounded-lg bg-white/15 px-3 py-1 text-[14.5px] font-bold uppercase">{PAYMENT_NOTE.calm}</p>
            <p className="mt-2 text-[14px] leading-relaxed text-white/90">{PAYMENT_NOTE.convert}</p>
          </div>
        </div>
      )}
    </>
  )
}
