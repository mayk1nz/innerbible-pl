'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { Icon, type IconName } from '../icons'
import { PageHeader } from '../PageHeader'
import { Avatar, FontScaleControl, SectionTitle, buttonClass } from '../ui'
import { OFFERS } from '@/lib/catalog'
import { APP, DEMO_MODE } from '@/lib/config'
import { computeStats } from '@/lib/gamification'
import { resetProgress, setOfferOwned, signOut, useAppState, useToday } from '@/lib/store'
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

export function ProfileView() {
  const s = useAppState()
  const today = useToday()
  const router = useRouter()
  const stats = useMemo(() => computeStats(s, today), [s, today])
  if (!s.session) return null

  return (
    <>
      <PageHeader back="/start" title="Twój profil" showAvatar={false} />

      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-card">
        <Avatar name={s.session.name} size="lg" primary />
        <div className="min-w-0">
          <p className="font-serif text-[24px] font-semibold leading-tight text-ink">{s.session.name}</p>
          <p className="truncate text-[15px] text-muted">{s.session.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat icon="flame" value={plural(stats.streak, 'dzień', 'dni', 'dni')} label="Obecna seria" />
        <Stat icon="trophy" value={plural(stats.best, 'dzień', 'dni', 'dni')} label="Najdłuższa seria" />
        <Stat icon="star" value={`${stats.totalPoints} pkt`} label="Punkty łącznie" />
        <Stat icon="check" value={String(stats.lessonsDone)} label="Przeczytane lekcje" />
      </div>

      <SectionTitle>Twoje dostępy</SectionTitle>
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

      <SectionTitle>Czytanie</SectionTitle>
      <div className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] text-ink">Rozmiar tekstu</p>
          <FontScaleControl scale={s.fontScale} />
        </div>
        <p className="mt-4 font-serif leading-relaxed text-text" style={{ fontSize: `${1.08 * s.fontScale}rem` }}>
          „Twoje słowo jest lampą dla moich stóp i światłem na mojej ścieżce”.
        </p>
        <p className="mt-1 text-[14px] font-semibold text-gold">Ps 119,105</p>
      </div>

      <SectionTitle>Pomoc</SectionTitle>
      <a href={`mailto:${APP.supportEmail}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:bg-surface-hover">
        <Icon name="mail" className="size-5 text-gold" />
        <span className="flex-1 text-[16px] text-ink">Napisz do nas: {APP.supportEmail}</span>
      </a>

      <button
        type="button"
        onClick={() => {
          signOut()
          router.replace('/logowanie')
        }}
        className={`${buttonClass.secondary} mt-8`}
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
              if (window.confirm('Usunąć przeczytane lekcje, refleksje, wpisy i punkty z tego konta?')) resetProgress()
            }}
            className={`${buttonClass.ghost} mt-3 text-danger`}
          >
            Zresetuj postęp
          </button>
        </div>
      )}
    </>
  )
}
