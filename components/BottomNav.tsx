'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from './icons'
import { OFFERS } from '@/lib/catalog'
import { useAppState } from '@/lib/store'

const TABS: { href: string; label: string; icon: IconName; match: string[] }[] = [
  { href: '/start', label: 'Start', icon: 'home', match: ['/start'] },
  { href: '/czytaj', label: 'Czytaj', icon: 'book', match: ['/czytaj', '/modul', '/lekcja'] },
  { href: '/spolecznosc', label: 'Wspólnota', icon: 'globe', match: ['/spolecznosc'] },
  { href: '/sklep', label: 'Sklep', icon: 'store', match: ['/sklep'] },
]

export function BottomNav() {
  const pathname = usePathname() || ''
  const { owned } = useAppState()
  // A dot on Sklep only while there is really something left to unlock.
  const pending = OFFERS.some((o) => o.id !== 'front' && !owned.includes(o.id))

  return (
    <nav aria-label="Nawigacja główna" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <ul className="mx-auto grid max-w-[440px] grid-cols-4 gap-1 rounded-[26px] border border-line bg-surface/95 p-1.5 shadow-[0_10px_30px_-12px_rgb(53_38_15/0.45)] backdrop-blur">
        {TABS.map((tab) => {
          const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`))
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] transition ${active ? 'bg-gold-soft text-ink' : 'text-muted hover:text-ink'}`}
              >
                <Icon name={tab.icon} className="size-[22px]" strokeWidth={active ? 2 : 1.8} />
                <span className={`text-[12.5px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
                {tab.href === '/sklep' && pending && (
                  <span className="absolute right-[26%] top-2 size-2 rounded-full bg-flame" aria-label="Są treści do odblokowania" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
