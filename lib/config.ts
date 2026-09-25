// Brand, prices and external links. Anything a non-developer may want to change
// lives here or in the environment (.env.example), never inside a component.

export const APP = {
  name: 'Biblia Wewnętrzna',
  tagline: 'Cała historia Biblii, po kolei i we wspólnocie',
  supportEmail: 'contact@innerbible.app',
} as const

/**
 * What differs between the Spanish and the Polish app on the server side (same
 * Supabase project for both): table prefix and the private bucket of the audios.
 */
export const SITE = {
  dbPrefix: 'pl_',
  audioBucket: 'audios-pl',
} as const

export const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || ''

// In-app checkout links and prices of the upsells (50% offer + full price): lib/deals.ts.

// Accounts that see every offer unlocked (the owner). Kept as hashes (cyrb53 of the
// lowercase e-mail) so the addresses never appear in the site's public code.
// Temporary, until access comes from the KashPay purchases on the backend.
const FULL_ACCESS = new Set(['1re1mulvdxk'])

function cyrb53(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export function hasFullAccess(email: string): boolean {
  return FULL_ACCESS.has(cyrb53(email.trim().toLowerCase()))
}

/** Tu Consejero Bíblico (included in upsell 2, Palabras del Señor; its offer is DEALS.upsell2). */
export const CONSEJERO = {
  dailyLimit: 30,
} as const

/**
 * The annual plan: everything (front + upsell 1 + upsell 2) for a year, sold only inside
 * the app. The comparison uses the real monthly prices of the three subscriptions.
 */
export const ANUAL = {
  price: 99,
  monthly: { front: 11.9, upsell1: 4.9, upsell2: 9.9 },
  /** KashPay checkout of the annual product (name must contain "Anual"). Empty → "Disponible pronto". */
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_ANUAL_URL || 'https://checkout.kashpay.com.br/checkout/checkout-1790375740991',
} as const

/** Web push public key (VAPID). Public by design; the private one is in the database. */
export const PUSH_PUBLIC_KEY = 'BFKcZtQQMSYJ_xcfylnG24SUCdGH7rLR58UjsFRHa6U-Ufy92RLacKdU4jd6mMu686EYKqHN-NjmX-au6jWm93Q'

/** What each action is worth. Shown to members, so keep it simple. */
export const POINTS = { lesson: 10, reflection: 5, post: 3 } as const

/** Demo panel (unlock offers, reset progress): always in dev, opt-in on a deployed build. */
export const DEMO_MODE =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEMO_MODE === '1'
