'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from './BottomNav'
import { MiniPlayer } from './MiniPlayer'
import { BrandMark } from './ui'
import { closePlayer } from '@/lib/player'
import { AnualBar } from './views/AnualView'
import { setMember, signOut, useAppState, useHydrated, type ServerMember } from '@/lib/store'

// Everything inside the app is members-only. The device remembers the member (so the
// app opens instantly and offline), and on every visit the server confirms the session
// and what the purchases open — a new upsell, a cancellation or a refund shows up here.
// The gate waits for hydration before deciding, so server and client markup agree.
export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  const { session, theme } = useAppState()
  const router = useRouter()
  const email = session?.email
  const name = session?.name ?? ''

  // Dark mode switched in the profile applies at once (the <head> script covers page loads).
  useEffect(() => {
    if (!hydrated) return
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
  }, [hydrated, theme])

  useEffect(() => {
    if (hydrated && !email) {
      closePlayer()
      router.replace('/logowanie')
    }
  }, [hydrated, email, router])

  useEffect(() => {
    if (!hydrated || !email) return
    let alive = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (res) => {
        if (!alive) return
        if (res.status === 401) {
          signOut()
          return
        }
        if (!res.ok) return // server hiccup: keep what the device knows
        const me = (await res.json()) as ServerMember & { email: string }
        if (me.email !== email) signOut()
        else setMember(email, name, me)
      })
      .catch(() => {
        // offline: keep what the device knows
      })
    return () => {
      alive = false
    }
    // Once per visit and per account, not on every name change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, email])

  if (!hydrated || !session) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="animate-pulse">
          <BrandMark size="lg" />
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[480px] px-5 pb-36 pt-[max(env(safe-area-inset-top),24px)]">
        <AnualBar />
        {children}
      </main>
      <MiniPlayer />
      <BottomNav />
    </>
  )
}
