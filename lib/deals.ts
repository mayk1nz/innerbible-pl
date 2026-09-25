import { productById, type OfferId } from './catalog'
import { plural } from './text'

/** Audio lessons of the Resumen en Audio (one section, or all). */
function audioCount(sectionId?: string): number {
  const sections = productById('cronologico-audio')?.sections ?? []
  return sections.filter((s) => !sectionId || s.id === sectionId).flatMap((s) => s.lessons).length
}

// The in-app offers for what a member has not bought yet: 50% off for life during the
// member's own first 15 days (the clock starts on their first login and is kept on the
// server, so it is the same on every device), then the normal price. Every price and
// link lives here; the Tienda, the locked pages and the Consejero all read from it.

export type UpsellId = Exclude<OfferId, 'front'>

export interface Deal {
  fullPrice: number
  discountPrice: number
  /** KashPay checkout at 50% (normal checkout, not a /u/ one-click link). Empty → "Disponible muy pronto". */
  discountUrl: string
  /** KashPay checkout at the full price, once the 15 days are over. */
  fullUrl: string
  /** Everything the member receives, in the order it is sold. */
  benefits: string[]
  note?: string
}

export const DEAL_DAYS = 15

export const DEALS: Record<UpsellId, Deal> = {
  upsell1: {
    fullPrice: 4.9,
    discountPrice: 2.45,
    discountUrl: process.env.NEXT_PUBLIC_CHECKOUT_UPSELL1_DISCOUNT_URL || '',
    fullUrl: process.env.NEXT_PUBLIC_CHECKOUT_UPSELL1_URL || '',
    benefits: [
      `${plural(audioCount(), 'nagranie', 'nagrania', 'nagrań')}: wprowadzenie, cała historia biblijna w porządku chronologicznym i zakończenie`,
      `Stary Testament: ${plural(audioCount('antiguo-testamento'), 'nagranie', 'nagrania', 'nagrań')}, od Księgi Rodzaju do Malachiasza`,
      `Nowy Testament: ${plural(audioCount('nuevo-testamento'), 'nagranie', 'nagrania', 'nagrań')}, od Ewangelii do Objawienia`,
      'Każde nagranie ma własną okładkę, a odtwarzacz gra dalej, gdy przeglądasz aplikację',
      'Słuchaj na spacerze, w drodze, w pracy albo w chwili odpoczynku',
      'Regulowana prędkość od 0,75x do 2x oraz przyciski przewijania o 15 sekund do przodu i do tyłu',
      'W każdym nagraniu wracasz dokładnie do miejsca, w którym przerwano słuchanie',
      'Każde wysłuchane nagranie daje punkty i podtrzymuje twoją serię',
    ],
  },
  upsell2: {
    fullPrice: 9.9,
    discountPrice: 4.95,
    discountUrl: process.env.NEXT_PUBLIC_CHECKOUT_CONSEJERO_URL || 'https://checkout.kashpay.com.br/checkout/checkout-1790363235240',
    fullUrl: process.env.NEXT_PUBLIC_CHECKOUT_UPSELL2_URL || 'https://checkout.kashpay.com.br/checkout/checkout-1790361317561',
    benefits: [
      'Twój Doradca Biblijny: do 30 rozmów dziennie, z praktycznymi wskazówkami i krokami na to, co teraz przeżywasz',
      '90-dniowy plan Duchowej Przemiany',
      '90-dniowy plan: jak żyć według nauki Jezusa',
      '90-dniowy plan: zmień sposób myślenia i stań się prawdziwym chrześcijaninem',
      'Łącznie 270 dni: każdy z czytaniem, wersetem, mini-zadaniem i praktycznymi krokami',
      'Przewodnik „Słowa Pana”: co mówi Biblia w każdej sytuacji życiowej',
      'Biblioteka „Kroczyć z olbrzymami”: wielcy mężczyźni i kobiety wiary',
    ],
    note: 'Bezwarunkowa gwarancja 30 dni.',
  },
}

export interface DealState {
  /** Still inside the member's 15 days. */
  active: boolean
  deadline: number
  price: number
  url: string
}

/** `now` 0 (server / before hydration) counts as "just started". */
export function dealState(offer: UpsellId, offerStartedAt: string | null, now: number): DealState {
  const deal = DEALS[offer]
  const started = offerStartedAt ? Date.parse(offerStartedAt) : now || Date.now()
  const deadline = started + DEAL_DAYS * 86_400_000
  const inWindow = !now || now < deadline
  // Only the full-price link exists: sell at full price rather than show a 50% nobody can buy.
  const active = inWindow && !(deal.fullUrl && !deal.discountUrl)
  return { active, deadline, price: active ? deal.discountPrice : deal.fullPrice, url: active ? deal.discountUrl : deal.fullUrl }
}

/** Pre-fill the member's e-mail: access is granted by the purchase e-mail. */
export function withEmail(url: string, email?: string): string {
  if (!url || !email) return url
  return `${url}${url.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}`
}
