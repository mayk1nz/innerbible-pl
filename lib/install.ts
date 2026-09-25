import { useSyncExternalStore } from 'react'
import { INSTALL_CHANGE_EVENT } from './install-bootstrap'

// "Install the app" (PWA). Chromium browsers (Chrome, Edge, Samsung Internet) fire
// `beforeinstallprompt` once per page load when the site is installable; the inline
// script from installBootstrap() (in the root layout's <head>) keeps that event before
// React has even loaded, so our own button can open the native dialog later. iOS
// Safari has no such event — there the member adds the app by hand (Share → Add to
// Home Screen), so we show the steps instead.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __ibInstallEvent?: InstallPromptEvent | null
    __ibInstalled?: boolean
  }
}

export type InstallStatus = 'installed' | 'available' | 'ios' | 'unsupported'

const CHANGE = INSTALL_CHANGE_EVENT
const DISMISS_KEY = 'ib-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  // Chrome/Firefox/Edge on iOS can't add to the Home Screen on older iOS versions.
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

function status(): InstallStatus {
  if (window.__ibInstalled || isStandalone()) return 'installed'
  if (window.__ibInstallEvent) return 'available'
  if (isIosSafari()) return 'ios'
  return 'unsupported'
}

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE, listener)
  return () => window.removeEventListener(CHANGE, listener)
}

export function useInstallStatus(): InstallStatus {
  return useSyncExternalStore(subscribe, status, () => 'unsupported')
}

/** Opens the browser's install dialog. Resolves true when the member accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = window.__ibInstallEvent
  if (!event) return false
  // The event can be used only once.
  window.__ibInstallEvent = null
  window.dispatchEvent(new Event(CHANGE))
  await event.prompt()
  const { outcome } = await event.userChoice
  if (outcome === 'accepted') {
    window.__ibInstalled = true
    window.dispatchEvent(new Event(CHANGE))
  }
  return outcome === 'accepted'
}

function dismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function useInstallDismissed(): boolean {
  return useSyncExternalStore(subscribe, dismissed, () => true)
}

export function dismissInstall(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // storage blocked: the banner simply comes back on the next visit
  }
  window.dispatchEvent(new Event(CHANGE))
}
