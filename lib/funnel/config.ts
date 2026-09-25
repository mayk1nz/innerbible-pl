// Sales funnel settings: checkout links, prices, Pixel and the VSL of each page.
// All public values (they end up in the browser anyway), set on Vercel so they can
// change without a code change. See .env.example.

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export interface VslConfig {
  /** VTurb player id, e.g. "vid-64f0c0…" (from the embed code). Empty → placeholder. */
  playerId: string
  /** VTurb player script URL (from the embed code). */
  scriptUrl: string
  /** Second of the video at which the offer appears. 0 → shown at once. */
  delaySeconds: number
}

export const FUNNEL = {
  pixelId: process.env.NEXT_PUBLIC_FUNNEL_PIXEL_ID || '1734156964506551',
  currency: 'USD',
  front: {
    checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_FRONT_URL || 'https://checkout.kashpay.com.br/checkout/checkout-1790282470977',
    price: num(process.env.NEXT_PUBLIC_PRICE_FRONT, 17.9),
    /** Crossed-out "was" price. 0 → no anchor shown (never invent one). */
    priceFrom: num(process.env.NEXT_PUBLIC_PRICE_FRONT_FROM, 188),
    // TEMPORARY: the Spanish VSL, checkout and upsell links, until the Polish ones exist.
    // Set the NEXT_PUBLIC_* variables on Vercel to switch without a code change.
    // Owner's VTurb player "Resumen Cronológico de la Biblia". The offer appears at
    // 10:15 (615 s), the timing that was configured for this same video.
    video: {
      playerId: process.env.NEXT_PUBLIC_VTURB_FRONT_ID || 'vid-6ab58aff91c2cea332a2396c',
      scriptUrl:
        process.env.NEXT_PUBLIC_VTURB_FRONT_SCRIPT ||
        'https://scripts.converteai.net/90eef771-3dd8-46c8-b5b3-3c5b48ea076b/players/6ab58aff91c2cea332a2396c/v4/player.js',
      delaySeconds: num(process.env.NEXT_PUBLIC_VTURB_FRONT_DELAY, 615),
    } satisfies VslConfig,
  },
  up1: {
    /** KashPay one-click upsell link (checkout.kashpay.com.br/u/…). */
    checkoutUrl: process.env.NEXT_PUBLIC_KASHPAY_UP1_URL || 'https://checkout.kashpay.com.br/u/3b7c5fb39b1a3127',
    price: num(process.env.NEXT_PUBLIC_PRICE_UP1, 0),
    video: {
      playerId: process.env.NEXT_PUBLIC_VTURB_UP1_ID || '',
      scriptUrl: process.env.NEXT_PUBLIC_VTURB_UP1_SCRIPT || '',
      delaySeconds: num(process.env.NEXT_PUBLIC_VTURB_UP1_DELAY, 0),
    } satisfies VslConfig,
  },
  up2: {
    checkoutUrl: process.env.NEXT_PUBLIC_KASHPAY_UP2_URL || 'https://checkout.kashpay.com.br/u/df227ca0ddefadfe',
    price: num(process.env.NEXT_PUBLIC_PRICE_UP2, 0),
    video: {
      playerId: process.env.NEXT_PUBLIC_VTURB_UP2_ID || '',
      scriptUrl: process.env.NEXT_PUBLIC_VTURB_UP2_SCRIPT || '',
      delaySeconds: num(process.env.NEXT_PUBLIC_VTURB_UP2_DELAY, 0),
    } satisfies VslConfig,
  },
} as const

/** Polish notation: "17,90 USD". */
export function formatUsd(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} USD`
}
