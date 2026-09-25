import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Figtree, Literata } from 'next/font/google'
import { InstallBanner } from '@/components/InstallPrompt'
import { APP } from '@/lib/config'
import { installBootstrap } from '@/lib/install-bootstrap'
import { STORAGE_KEY } from '@/lib/storage-key'
import { themeBootstrap } from '@/lib/theme-bootstrap'
import './globals.css'

// Literata was drawn for long-form reading on screens (it is the Google Play Books
// face); Figtree keeps buttons and labels clear. Self-hosted by next/font: no
// request to Google at runtime and no render-blocking @import.
const literata = Literata({ subsets: ['latin', 'latin-ext'], variable: '--font-literata', display: 'swap' })
const figtree = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-figtree', display: 'swap' })

export const metadata: Metadata = {
  title: { default: APP.name, template: `%s · ${APP.name}` },
  description: 'Cała historia Biblii — po kolei i we wspólnocie.',
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
      <head>
        {/* Must run before the bundles: the install event can fire before React loads. */}
        <script dangerouslySetInnerHTML={{ __html: installBootstrap(process.env.NODE_ENV === 'production') }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap(STORAGE_KEY) }} />
      </head>
      <body>
        {children}
        <InstallBanner />
      </body>
    </html>
  )
}
