'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Icon, type IconName } from '../icons'
import { InstallRow } from '../InstallPrompt'
import { PageHeader } from '../PageHeader'
import { Avatar, FontScaleControl, SectionTitle, buttonClass } from '../ui'
import { hasEverything } from './AnualView'
import { OFFERS } from '@/lib/catalog'
import { ANUAL, APP, DEMO_MODE } from '@/lib/config'
import { formatUsd } from '@/lib/funnel/config'
import { computeStats } from '@/lib/gamification'
import { useInstallStatus } from '@/lib/install'
import { disablePush, enablePush, pushState, updateApp, type PushState } from '@/lib/push-client'
import { resetProgress, setName, setOfferOwned, setTheme, signOut, useAppState, useToday } from '@/lib/store'
import { plural } from '@/lib/text'

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <Icon name={icon} className="size-5 text-gold" />
      <p className="mt-2 font-serif text-[22px] font-semibold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[14px] text-muted">{label}</p>
    </div>
  )
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${on ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

/** One row of the settings list. */
function Row({ icon, title, hint, children, danger }: { icon: IconName; title: string; hint?: ReactNode; children?: ReactNode; danger?: boolean }) {
  return (
    <div className="flex min-h-16 items-center gap-3.5 px-4 py-3">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${danger ? 'bg-danger/10 text-danger' : 'bg-gold-soft text-gold'}`}>
        <Icon name={icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[16px] font-medium ${danger ? 'text-danger' : 'text-ink'}`}>{title}</span>
        {hint && <span className="mt-0.5 block text-[13.5px] leading-snug text-muted">{hint}</span>}
      </span>
      {children}
    </div>
  )
}

function NameEditor({ name }: { name: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [saving, setSaving] = useState(false)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const clean = value.replace(/\s+/g, ' ').trim()
    if (!clean) return
    setSaving(true)
    const res = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: clean }) }).catch(() => null)
    setSaving(false)
    if (res?.ok) {
      setName(clean)
      setEditing(false)
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => { setValue(name); setEditing(true) }} className="group flex items-center gap-2 text-left">
        <span className="font-serif text-[24px] font-semibold leading-tight text-ink">{name}</span>
        <Icon name="pencil" className="size-4 text-muted group-hover:text-ink" label="Zmień imię" />
      </button>
    )
  }
  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <label htmlFor="nombre" className="sr-only">
        Twoje imię
      </label>
      <input
        id="nombre"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={60}
        autoFocus
        className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-[17px] text-ink focus:border-primary focus:outline-none"
      />
      <button type="submit" disabled={saving} className="rounded-xl bg-primary px-3 py-2 text-[15px] font-semibold text-white disabled:opacity-60">
        {saving ? '…' : 'Zapisz'}
      </button>
    </form>
  )
}

function NotificationsRow() {
  const [state, setState] = useState<PushState | 'loading'>('loading')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    pushState().then((s) => alive && setState(s)).catch(() => alive && setState('unsupported'))
    return () => {
      alive = false
    }
  }, [])

  const toggle = async (next: boolean) => {
    setBusy(true)
    setFailed(false)
    try {
      setState(next ? await enablePush() : await disablePush())
    } catch {
      setState('off')
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const hint = failed
    ? 'Nie udało się ich włączyć w tej przeglądarce. Spróbuj w zainstalowanej aplikacji albo w Chrome.'
    : state === 'on'
      ? 'Każdego ranka przypomnimy ci o twoim kroku na dziś.'
      : state === 'blocked'
        ? 'Są zablokowane w twojej przeglądarce. Włącz je w ustawieniach strony.'
        : state === 'install-first'
          ? 'Na iPhonie najpierw dodaj aplikację do ekranu początkowego.'
          : state === 'unsupported'
            ? 'Ta przeglądarka nie obsługuje powiadomień.'
            : 'Codzienne przypomnienie, żeby nie przerwać serii.'
  return (
    <Row icon="bell" title="Powiadomienia" hint={hint}>
      <Switch on={state === 'on'} onChange={(n) => void toggle(n)} label="Codzienne przypomnienie" disabled={busy || state === 'loading' || state === 'blocked' || state === 'install-first' || state === 'unsupported'} />
    </Row>
  )
}

function AppRows() {
  const install = useInstallStatus()
  const [updating, setUpdating] = useState(false)
  return (
    <>
      {install === 'installed' ? (
        <Row icon="download" title="Aplikacja zainstalowana" hint="Masz ją już na ekranie początkowym." />
      ) : (
        <InstallRow>
          {(open) => (
            <Row icon="download" title="Zainstaluj aplikację" hint="Otwieraj ją z ekranu początkowego, jak każdą inną aplikację.">
              <Icon name="chevronDown" className={`size-5 text-muted transition ${open ? 'rotate-180' : ''}`} />
            </Row>
          )}
        </InstallRow>
      )}
      <button type="button" onClick={() => { setUpdating(true); void updateApp() }} className="block w-full text-left transition hover:bg-surface-hover">
        <Row icon="refresh" title={updating ? 'Aktualizowanie…' : 'Zaktualizuj aplikację'} hint="Wczytuje najnowszą wersję.">
          <Icon name="chevronRight" className="size-5 text-muted" />
        </Row>
      </button>
      <a href={`mailto:${APP.supportEmail}`} className="block transition hover:bg-surface-hover">
        <Row icon="mail" title="Pomoc" hint={APP.supportEmail}>
          <Icon name="chevronRight" className="size-5 text-muted" />
        </Row>
      </a>
    </>
  )
}

/** Before cancelling: the annual plan as the better way to stay. */
function ManageSubscription({ annual }: { annual: boolean }) {
  const [open, setOpen] = useState(false)
  const { session } = useAppState()
  const mail = `mailto:${APP.supportEmail}?subject=${encodeURIComponent('Zarządzanie subskrypcją')}&body=${encodeURIComponent(`Dzień dobry, mój e-mail użyty przy zakupie to ${session?.email ?? ''}. Chcę `)}`
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="flex-1 text-[15.5px] font-medium text-ink">Zarządzaj subskrypcją</span>
        <Icon name="chevronDown" className={`size-5 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="animate-rise border-t border-line-soft px-4 pb-4 pt-3 text-[15px] leading-relaxed text-text">
          {!annual && (
            <div className="mb-3 rounded-2xl bg-gold-soft/60 p-3.5">
              <p className="font-semibold text-ink">Myślisz o przerwie? Najpierw zobacz to:</p>
              <p className="mt-1">
                W planie rocznym masz wszystko za {formatUsd(ANUAL.price)} rocznie, dużo taniej niż przy płatności co miesiąc.
              </p>
              <Link href="/roczny" className="mt-2 inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
                Zobacz plan roczny
                <Icon name="arrowRight" className="size-4" />
              </Link>
            </div>
          )}
          <p>Jeśli chcesz zmienić plan, zaktualizować kartę albo zrezygnować, napisz do nas, a zrobimy to za ciebie.</p>
          <a href={mail} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline">
            <Icon name="mail" className="size-4" />
            Napisz do pomocy
          </a>
        </div>
      )}
    </div>
  )
}

export function ProfileView() {
  const s = useAppState()
  const today = useToday()
  const router = useRouter()
  const stats = useMemo(() => computeStats(s, today), [s, today])
  if (!s.session) return null
  const everything = hasEverything(s.owned)

  return (
    <>
      <PageHeader back="/start" title="Twój profil" showAvatar={false} />

      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card">
        <Avatar name={s.session.name} size="lg" primary />
        <div className="min-w-0 flex-1">
          <NameEditor name={s.session.name} />
          <p className="truncate text-[15px] text-muted">{s.session.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat icon="flame" value={plural(stats.streak, 'dzień', 'dni', 'dni')} label="Obecna seria" />
        <Stat icon="trophy" value={plural(stats.best, 'dzień', 'dni', 'dni')} label="Najdłuższa seria" />
        <Stat icon="star" value={`${stats.totalPoints} pkt`} label="Punkty łącznie" />
        <Stat icon="check" value={String(stats.lessonsDone)} label="Przeczytane lekcje" />
      </div>

      <SectionTitle>Twój plan</SectionTitle>
      {s.annual ? (
        <p className="mb-3 flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-[15px] font-semibold text-success">
          <Icon name="sparkles" className="size-5" />
          Plan roczny aktywny: masz wszystko w cenie.
        </p>
      ) : (
        <Link href="/roczny" className="mb-3 flex items-center gap-3.5 rounded-2xl bg-primary p-4 text-white shadow-card">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-bright">
            <Icon name="sparkles" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{everything ? 'Przejdź na plan roczny' : 'Wszystko w cenie na cały rok'}</span>
            <span className="mt-0.5 block text-[13.5px] leading-snug text-white/80">
              {everything ? `To samo, co już masz, za ${formatUsd(ANUAL.price)} rocznie zamiast płacenia co miesiąc.` : `Wszystkie ścieżki, Doradca i plany za ${formatUsd(ANUAL.price)} rocznie.`}
            </span>
          </span>
          <Icon name="chevronRight" className="size-5 text-gold-bright" />
        </Link>
      )}
      <ul className="space-y-2.5">
        {OFFERS.map((o) => {
          const has = s.owned.includes(o.id)
          return (
            <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${has ? 'bg-success-soft text-success' : 'bg-line-soft text-muted'}`}>
                <Icon name={has ? 'check' : 'lock'} className="size-[18px]" strokeWidth={has ? 2.6 : 1.8} />
              </span>
              <span className="min-w-0 flex-1 font-serif text-[16px] leading-snug text-ink">{o.title}</span>
              {!has && (
                <Link href={`/sklep#${o.id}`} className="shrink-0 text-[15px] font-semibold text-primary underline-offset-4 hover:underline">
                  Zobacz
                </Link>
              )}
            </li>
          )
        })}
      </ul>
      <div className="mt-2.5">
        <ManageSubscription annual={s.annual} />
      </div>

      <SectionTitle>Ustawienia</SectionTitle>
      <div className="divide-y divide-line-soft rounded-3xl border border-line bg-surface">
        <Row icon="moon" title="Tryb ciemny" hint="Wygodniejszy do czytania wieczorem.">
          <Switch on={s.theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} label="Tryb ciemny" />
        </Row>
        <NotificationsRow />
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[16px] font-medium text-ink">Rozmiar tekstu</p>
            <FontScaleControl scale={s.fontScale} />
          </div>
          <p className="mt-3 font-serif leading-relaxed text-text" style={{ fontSize: `${1.08 * s.fontScale}rem` }}>
            „Twoje słowo jest pochodnią dla moich nóg i światłością na mojej ścieżce.”
          </p>
          <p className="mt-1 text-[14px] font-semibold text-gold">Psalm 119,105</p>
        </div>
      </div>

      <SectionTitle>Aplikacja i pomoc</SectionTitle>
      <div className="divide-y divide-line-soft overflow-hidden rounded-3xl border border-line bg-surface">
        <AppRows />
      </div>

      <button
        type="button"
        onClick={() => {
          signOut()
          router.replace('/logowanie')
        }}
        className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-danger/50 text-[16px] font-semibold text-danger transition hover:bg-danger/5"
      >
        <Icon name="logout" className="size-5" />
        Wyloguj się
      </button>

      {DEMO_MODE && (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-[#b9a57c] p-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">Tryb demonstracyjny</p>
          <p className="mt-1 text-[14.5px] leading-snug text-muted">Tylko do testowania aplikacji. Klienci tego nie widzą.</p>
          <div className="mt-4 space-y-2">
            {OFFERS.filter((o) => o.id !== 'front').map((o) => {
              const has = s.owned.includes(o.id)
              return (
                <label key={o.id} className="flex min-h-11 items-center gap-3 text-[15.5px] text-ink">
                  <input type="checkbox" checked={has} onChange={(e) => setOfferOwned(o.id, e.target.checked)} className="size-5 accent-primary" />
                  Kupione: {o.title}
                </label>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Usunąć lekcje, refleksje, wpisy i punkty z tego konta?')) resetProgress()
            }}
            className={`${buttonClass.ghost} mt-3 text-danger`}
          >
            Wyzeruj postępy
          </button>
        </div>
      )}
    </>
  )
}
