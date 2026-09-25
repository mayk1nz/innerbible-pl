import type { MetadataRoute } from 'next'
import { APP } from '@/lib/config'

// Makes the members area installable (desktop and phone). start_url is the members
// home: without a session the app itself sends the visitor to /logowanie.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/start',
    name: APP.name,
    short_name: APP.name,
    description: APP.tagline,
    lang: 'pl',
    start_url: '/start',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f3e8',
    theme_color: '#f8f3e8',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
