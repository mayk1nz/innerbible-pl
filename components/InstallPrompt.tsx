'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from './icons'
import { BrandMark, buttonClass } from './ui'
import { APP } from '@/lib/config'
import { dismissInstall, promptInstall, useInstallDismissed, useInstallStatus } from '@/lib/install'

const TEXT = {
  title: `Zainstaluj aplikację ${APP.name}`,
  pitch: 'Otwieraj ją jak zwykłą aplikację, prosto z ekranu głównego, bez szukania linku.',
  install: 'Zainstaluj',
  later: 'Nie teraz',
  close: 'Zamknij',
  iosStep1: 'Stuknij przycisk Udostępnij',
  iosStep2: 'Wybierz „Do ekranu początkowego”',
  noDialog: 'Jeśli nie widzisz okna, otwórz menu przeglądarki i wybierz „Zainstaluj aplikację”.',
}

/** Pages where the banner must never appear (the sales funnel). */
const HIDDEN_ON = ['/', '/quiz', '/upsell', '/upsell-downsell', '/slowa-pana', '/slowa-pana-downsell']
/** Pages without the bottom navigation bar. */
const NO_NAV = ['/logowanie', '/witaj']

function IosSteps() {
  return (
    <ol className="mt-3 space-y-2 text-[15px] text-ink">
      <li className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">
          <Icon name="share" className="size-[18px]" />
        </span>
        {TEXT.iosStep1}
      </li>
      <li className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">
          <Icon name="plusSquare" className="size-[18px]" />
        </span>
        {TEXT.iosStep2}
      </li>
    </ol>
  )
}

/** Shown once, on the first visit to the members area, until installed or dismissed. */
export function InstallBanner() {
  const pathname = usePathname() || '/'
  const status = useInstallStatus()
  const dismissed = useInstallDismissed()

  if (dismissed || HIDDEN_ON.includes(pathname)) return null
  if (status !== 'available' && status !== 'ios') return null

  const aboveNav = !NO_NAV.includes(pathname)
  return (
    <>
      {/* Scroll room, so the banner never hides the end of the page (e.g. "Escríbenos"). */}
      <div aria-hidden className={status === 'ios' ? 'h-52' : 'h-44'} />
      <div
        role="dialog"
        aria-label={TEXT.title}
        className="animate-rise fixed inset-x-0 z-50 px-3"
        style={{ bottom: aboveNav ? 'calc(max(env(safe-area-inset-bottom), 12px) + 84px)' : 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <div className="relative mx-auto max-w-[440px] rounded-3xl border border-line bg-surface p-4 shadow-[0_18px_40px_-16px_rgb(53_38_15/0.55)]">
          <button
            type="button"
            onClick={dismissInstall}
            aria-label={TEXT.close}
            className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-hover hover:text-ink"
          >
            <Icon name="x" className="size-5" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <span className="shrink-0">
              <BrandMark />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-[18px] font-semibold leading-tight text-ink">{TEXT.title}</p>
              <p className="mt-1 text-[14.5px] leading-snug text-text">{TEXT.pitch}</p>
            </div>
          </div>
          {status === 'ios' ? (
            <IosSteps />
          ) : (
            <div className="mt-4 flex gap-2.5">
              <button type="button" onClick={dismissInstall} className={`${buttonClass.secondary} flex-1`}>
                {TEXT.later}
              </button>
              <button type="button" onClick={() => void promptInstall()} className={`${buttonClass.primary} flex-1`}>
                <Icon name="download" className="size-5 text-gold-bright" />
                {TEXT.install}
              </button>
            </div>
          )}
          {status !== 'ios' && <p className="mt-2.5 text-center text-[13px] leading-snug text-muted">{TEXT.noDialog}</p>}
        </div>
      </div>
    </>
  )
}

function Step({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">
        <Icon name={icon} className="size-[18px]" />
      </span>
      <span className="pt-1">{children}</span>
    </li>
  )
}

/** How to install by hand, for when the browser shows no dialog (or has none). */
export function InstallHelp({ ios }: { ios: boolean }) {
  return (
    <div className="text-[15px] leading-snug text-ink">
      {ios ? (
        <IosSteps />
      ) : (
        <ol className="mt-1 space-y-2.5">
          <Step icon="phone">
            <strong className="font-semibold">Android (Chrome):</strong> stuknij menu <strong>⋮</strong> w prawym górnym rogu i wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.
          </Step>
          <Step icon="download">
            <strong className="font-semibold">Komputer (Chrome lub Edge):</strong> kliknij ikonę instalacji na pasku adresu albo w menu <strong>⋮</strong> → „Zainstaluj {APP.name}”.
          </Step>
          <Step icon="share">
            <strong className="font-semibold">iPhone:</strong> otwórz tę stronę w Safari, stuknij Udostępnij i wybierz „Do ekranu początkowego”.
          </Step>
        </ol>
      )}
      <p className="mt-3 rounded-xl bg-gold-soft/60 px-3 py-2 text-[14px] text-ink">{TEXT.noDialog}</p>
    </div>
  )
}

/**
 * Permanent entry in the profile. Always does something: opens the browser's dialog when
 * it can, and always unfolds the steps to install by hand — the dialog may not show.
 */
export function InstallRow({ children }: { children: (open: boolean) => ReactNode }) {
  const status = useInstallStatus()
  const [open, setOpen] = useState(false)
  const click = () => {
    if (status === 'available' && !open) void promptInstall()
    setOpen((o) => !o)
  }
  return (
    <div>
      <button type="button" onClick={click} aria-expanded={open} className="block w-full text-left transition hover:bg-surface-hover">
        {children(open)}
      </button>
      {open && (
        <div className="animate-rise px-4 pb-4">
          <InstallHelp ios={status === 'ios'} />
        </div>
      )}
    </div>
  )
}
