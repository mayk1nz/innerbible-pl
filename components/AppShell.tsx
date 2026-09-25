'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from './BottomNav'
import { BrandMark } from './ui'
import { useAppState, useHydrated } from '@/lib/store'

// Everything inside the app is members-only. The session lives on the device for now,
// so the gate waits for hydration before deciding — the server always renders the
// splash, which also means no server/client markup can disagree.
export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  const { session } = useAppState()
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !session) router.replace('/logowanie')
  }, [hydrated, session, router])

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
      <main className="mx-auto w-full max-w-[480px] px-5 pb-36 pt-[max(env(safe-area-inset-top),24px)]">{children}</main>
      <BottomNav />
    </>
  )
}
