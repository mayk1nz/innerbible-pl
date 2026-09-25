import { FUNNEL } from './config'

// Meta Pixel for the funnel. Only commercial signals: PageView, ViewContent when the
// video page opens, InitiateCheckout on the buy click. Quiz answers are never sent.
// Purchase comes from KashPay's own Pixel integration (approved sale), not from here —
// a click is not a payment.

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[][]; loaded?: boolean; version?: string; push?: unknown }

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

let initialized = false
let lastCheckout = 0

function pixelId(): string | null {
  return /^\d{5,25}$/.test(FUNNEL.pixelId) ? FUNNEL.pixelId : null
}

export function initPixel(): void {
  const id = pixelId()
  if (!id || initialized || typeof window === 'undefined') return
  initialized = true
  if (!window.fbq) {
    const queue = function (...args: unknown[]) {
      if (queue.callMethod) queue.callMethod(...args)
      else queue.queue?.push(args)
    } as Fbq
    queue.queue = []
    queue.loaded = true
    queue.version = '2.0'
    queue.push = queue
    window.fbq = queue
    window._fbq = queue
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }
  window.fbq?.('set', 'autoConfig', false, id)
  window.fbq?.('init', id)
  window.fbq?.('trackSingle', id, 'PageView')
}

export function trackViewContent(product: string, value: number): void {
  const id = pixelId()
  if (!id) return
  window.fbq?.('trackSingle', id, 'ViewContent', { content_ids: [product], content_type: 'product', value, currency: FUNNEL.currency })
}

export function trackCheckout(product: string, value: number): void {
  const id = pixelId()
  if (!id || Date.now() - lastCheckout < 1500) return
  lastCheckout = Date.now()
  window.fbq?.('trackSingle', id, 'InitiateCheckout', {
    content_ids: [product],
    content_type: 'product',
    value,
    currency: FUNNEL.currency,
    num_items: 1,
  })
}

const ATTRIBUTION = /^(utm_(source|medium|campaign|content|term|id)|src|sck|xcod|fbclid|gclid|ttclid)$/

/**
 * Carries the campaign parameters the visitor arrived with into a checkout link, so
 * the gateway attributes the sale. Never overrides a parameter the link already has.
 */
export function withAttribution(target: string, search: string): string {
  try {
    const url = new URL(target)
    if (url.protocol !== 'https:') return target
    new URLSearchParams(search).forEach((value, key) => {
      if (ATTRIBUTION.test(key) && !url.searchParams.has(key)) url.searchParams.set(key, value)
    })
    return url.href
  } catch {
    return target
  }
}
