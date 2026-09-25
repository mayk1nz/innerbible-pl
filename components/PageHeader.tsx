'use client'

import Link from 'next/link'
import { Icon } from './icons'
import { Avatar } from './ui'
import { useAppState } from '@/lib/store'

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  back,
  showAvatar = true,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  back?: string
  showAvatar?: boolean
}) {
  const { session } = useAppState()
  return (
    <header className="mb-6 flex items-start gap-2">
      {back && (
        <Link
          href={back}
          aria-label="Wróć"
          className="-ml-2.5 grid size-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-surface"
        >
          <Icon name="arrowLeft" className="size-6" />
        </Link>
      )}
      <div className="min-w-0 flex-1 pt-1">
        {eyebrow && <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">{eyebrow}</p>}
        <h1 className="font-serif text-[28px] font-semibold leading-[1.15] text-balance text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[16px] leading-snug text-muted">{subtitle}</p>}
      </div>
      {showAvatar && session && (
        <Link href="/profil" aria-label="Twój profil" className="shrink-0 rounded-full transition hover:opacity-90">
          <Avatar name={session.name} primary />
        </Link>
      )}
    </header>
  )
}
