import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Figtree, Literata } from 'next/font/google'
import { APP } from '@/lib/config'
import './globals.css'

// Literata was drawn for long-form reading on screens (it is the Google Play Books
// face); Figtree keeps buttons and labels clear. Self-hosted by next/font: no
// request to Google at runtime and no render-blocking @import.
const literata = Literata({ subsets: ['latin', 'latin-ext'], variable: '--font-literata', display: 'swap' })
const figtree = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-figtree', display: 'swap' })

export const metadata: Metadata = {
  title: { default: APP.name, template: `%s · ${APP.name}` },
  description: APP.tagline,
  // Members-only app: nothing here should be indexed.
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: APP.name, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#f8f3e8',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className={`${literata.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  )
}
