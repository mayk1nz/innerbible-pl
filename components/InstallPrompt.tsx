'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Icon } from './icons'
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
  profileRow: 'Zainstaluj aplikację na tym urządzeniu',
}

/** Pages where the banner must never appear (the sales funnel). */
const HIDDEN_ON = ['/', '/quiz', '/up1', '/up2']
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
      {/* Scroll room, so the banner never hides the end of the page (e.g. the support link). */}
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
        </div>
      </div>
    </>
  )
}

/** Permanent entry in the profile, for whoever closed the banner. */
export function InstallRow() {
  const status = useInstallStatus()
  const [open, setOpen] = useState(false)

  if (status !== 'available' && status !== 'ios') return null
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => (status === 'available' ? void promptInstall() : setOpen((o) => !o))}
        aria-expanded={status === 'ios' ? open : undefined}
        className="flex w-full items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-surface-hover"
      >
        <Icon name="download" className="size-5 text-gold" />
        <span className="flex-1 text-[16px] text-ink">{TEXT.profileRow}</span>
        <Icon name={status === 'ios' && open ? 'chevronDown' : 'chevronRight'} className="size-5 text-muted" />
      </button>
      {status === 'ios' && open && (
        <div className="px-4 pb-4">
          <IosSteps />
        </div>
      )}
    </div>
  )
}
