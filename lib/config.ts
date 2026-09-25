// Brand, prices and external links. Anything a non-developer may want to change
// lives here or in the environment (.env.example), never inside a component.

export const APP = {
  name: 'Biblia Wewnętrzna',
  tagline: 'Cała historia Biblii, po kolei i we wspólnocie',
  supportEmail: 'soporte@innerbible.app',
} as const

export const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || ''

/** KashPay checkout links (Stripe underneath). Empty → the button reads "Wkrótce dostępne". */
export const CHECKOUT_URLS: Record<'upsell1' | 'upsell2', string> = {
  upsell1: process.env.NEXT_PUBLIC_CHECKOUT_UPSELL1_URL || '',
  upsell2: process.env.NEXT_PUBLIC_CHECKOUT_UPSELL2_URL || '',
}

/** Price labels exactly as they should read in the Sklep. Empty → no price line. */
export const OFFER_PRICES: Record<'upsell1' | 'upsell2', string> = {
  upsell1: process.env.NEXT_PUBLIC_PRICE_UPSELL1 || '',
  upsell2: process.env.NEXT_PUBLIC_PRICE_UPSELL2 || '',
}

/** What each action is worth. Shown to members, so keep it simple. */
export const POINTS = { lesson: 10, reflection: 5, post: 3 } as const

/** Demo panel (unlock offers, reset progress): always in dev, opt-in on a deployed build. */
export const DEMO_MODE =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEMO_MODE === '1'
