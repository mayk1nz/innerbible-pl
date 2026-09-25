'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../icons'
import { BrandMark, buttonClass } from '../ui'
import { APP, DEMO_MODE } from '@/lib/config'
import { signIn, useAppState, useHydrated } from '@/lib/store'
import { nameFromEmail } from '@/lib/text'

// Two steps: the purchase email, then a 6-digit code sent to it. The reference app
// lets anyone in who types a buyer's email; the code closes that door and stops
// shared logins, at the cost of one extra step.
//
// Mock for now: any 6 digits are accepted. The backend will send and verify the code
// and refuse emails without a purchase.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function LoginForm() {
  const router = useRouter()
  const hydrated = useHydrated()
  const { session } = useAppState()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && session) router.replace('/start')
  }, [hydrated, session, router])

  const submitEmail = (e: FormEvent) => {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!EMAIL_RE.test(clean)) {
      setError('Sprawdź adres e-mail — wygląda na niepełny.')
      return
    }
    setEmail(clean)
    setError(null)
    setStep('code')
  }

  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Kod ma 6 cyfr.')
      return
    }
    signIn(email, nameFromEmail(email))
    router.replace('/start')
  }

  const inputClass =
    'min-w-0 flex-1 bg-transparent py-3.5 text-[17px] text-ink placeholder:text-muted focus:outline-none'

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[400px] rounded-[28px] border border-line bg-surface px-6 py-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <h1 className="mt-5 font-serif text-[28px] font-semibold leading-tight text-ink">{APP.name}</h1>
          <p className="mt-1.5 text-[16px] leading-snug text-muted">
            {step === 'email' ? 'Zaloguj się adresem e-mail podanym przy zakupie' : 'Sprawdź swoją skrzynkę'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={submitEmail} className="mt-7" noValidate>
            <label htmlFor="email" className="mb-2 block text-[15px] font-semibold text-ink">
              Adres e-mail
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 focus-within:border-primary">
              <Icon name="mail" className="size-5 shrink-0 text-muted" />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="ty@przyklad.pl"
                className={inputClass}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : 'login-help'}
              />
            </div>
            {error && (
              <p id="login-error" role="alert" className="mt-2 text-[14.5px] font-medium text-danger">
                {error}
              </p>
            )}
            <button type="submit" className={`${buttonClass.primary} mt-4`}>
              Kontynuuj
            </button>
            <p id="login-help" className="mt-4 text-center text-[14.5px] leading-relaxed text-muted">
              Użyj tego samego adresu e-mail, który podano przy zakupie. Wyślemy na niego kod do logowania.
            </p>
          </form>
        ) : (
          <form onSubmit={submitCode} className="mt-7" noValidate>
            <p className="text-center text-[15.5px] leading-relaxed text-text">
              Wysłaliśmy 6-cyfrowy kod na adres<br />
              <strong className="text-ink">{email}</strong>
            </p>
            <label htmlFor="code" className="sr-only">
              6-cyfrowy kod
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError(null)
              }}
              placeholder="000000"
              className="mt-4 w-full rounded-2xl border border-line bg-surface-2 py-3.5 text-center font-serif text-[30px] tracking-[0.4em] text-ink placeholder:text-line focus:border-primary focus:outline-none"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'code-error' : undefined}
            />
            {error && (
              <p id="code-error" role="alert" className="mt-2 text-center text-[14.5px] font-medium text-danger">
                {error}
              </p>
            )}
            <button type="submit" className={`${buttonClass.primary} mt-4`}>
              Zaloguj się
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
              className={`${buttonClass.ghost} mt-2`}
            >
              Użyj innego adresu e-mail
            </button>
            {DEMO_MODE && (
              <p className="mt-3 rounded-xl bg-gold-soft/60 px-3 py-2 text-center text-[13.5px] text-ink">
                Tryb demonstracyjny: zadziała dowolny 6-cyfrowy kod.
              </p>
            )}
          </form>
        )}

        <p className="mt-6 border-t border-line-soft pt-5 text-center text-[14px] text-muted">
          Problem z logowaniem?{' '}
          <a href={`mailto:${APP.supportEmail}`} className="font-semibold text-primary underline-offset-4 hover:underline">
            Napisz do nas
          </a>
        </p>
      </div>
    </main>
  )
}
