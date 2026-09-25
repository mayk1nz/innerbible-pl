'use client'

import Link from 'next/link'
import { Cover } from './Cover'
import { Icon } from './icons'
import { PageHeader } from './PageHeader'
import { ProgressBar, buttonClass } from './ui'
import { PRODUCTS, offerById, productById, type Offer, type Product } from '@/lib/catalog'
import { CHECKOUT_URLS, OFFER_PRICES } from '@/lib/config'
import { allLessons, isOwned, lessonHref, nextLesson, productProgress } from '@/lib/progress'
import type { AppState } from '@/lib/store'
import { plural } from '@/lib/text'

function contentsLine(product: Product): string {
  if (product.kind === 'enlace') return 'Dostęp do grupy'
  return plural(allLessons(product).length, 'lekcja', 'lekcje', 'lekcji')
}

/** Big card for an owned reading path, like the "featured" row of the reference app. */
export function ProductHeroCard({ product, completed }: { product: Product; completed: AppState['completed'] }) {
  const progress = productProgress(product, completed)
  const next = nextLesson(product, completed)
  const started = progress.done > 0
  const cta = !next ? 'Powtórz' : started ? 'Kontynuuj' : product.sections[0]?.lessons[0]?.format === 'audio' ? 'Zacznij słuchać' : 'Zacznij czytać'

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <Link href={`/modul/${product.id}`} aria-label={product.title} tabIndex={-1}>
        <Cover cover={product.cover} size="hero" />
      </Link>
      <div className="p-5">
        <h3 className="font-serif text-[21px] font-semibold leading-snug text-ink">{product.title}</h3>
        <p className="mt-1.5 text-[16px] leading-relaxed text-text">{product.short}</p>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={progress.pct} label={`Postęp: ${product.title}`} />
          <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">{progress.pct}%</span>
        </div>
        <p className="mt-1.5 text-[14px] text-muted">{progress.done} z {plural(progress.total, 'lekcji', 'lekcji', 'lekcji')}</p>
        <Link href={next ? lessonHref(product.id, next.lesson.id) : `/modul/${product.id}`} className={`${buttonClass.primary} mt-4`}>
          {cta}
          <Icon name="arrowRight" className="size-5 text-gold-bright" />
        </Link>
        {next && started && <p className="mt-2.5 text-center text-[14px] text-muted">Dalej: {next.lesson.title}</p>}
      </div>
    </article>
  )
}

/** Grid tile in Czytaj → reading paths. Locked tiles still open the product page (with the offer). */
export function ProductTile({ product, state }: { product: Product; state: AppState }) {
  const owned = isOwned(product, state.owned)
  const progress = productProgress(product, state.completed)
  return (
    <Link href={`/modul/${product.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5">
      <Cover cover={product.cover} size="tile" locked={!owned} />
      <span className="flex flex-1 flex-col gap-2.5 p-3.5">
        <span className="font-serif text-[15.5px] font-medium leading-snug text-ink">{product.title}</span>
        <span className="mt-auto">
          {owned ? (
            <span className="flex items-center gap-2">
              <ProgressBar value={progress.pct} label={`Postęp: ${product.title}`} />
              <span className="text-xs font-semibold tabular-nums text-muted">{progress.pct}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-gold">
              <Icon name="lock" className="size-3.5" />
              Odblokuj
            </span>
          )}
        </span>
      </span>
    </Link>
  )
}

/** Row in Czytaj → guides. */
export function GuideRow({ product, state }: { product: Product; state: AppState }) {
  const owned = isOwned(product, state.owned)
  const progress = productProgress(product, state.completed)
  const meta = !owned
    ? `Zawarte w ${offerById(product.offer).short}`
    : product.kind === 'enlace'
      ? 'Modlitwa i wspólne studium'
      : progress.done > 0
        ? `${progress.done} z ${progress.total} · ${progress.pct}%`
        : contentsLine(product)

  return (
    <Link href={`/modul/${product.id}`} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-2 pr-4 shadow-card transition hover:bg-surface-hover">
      <Cover cover={product.cover} size="thumb" locked={!owned} />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[16.5px] leading-snug text-ink">{product.title}</span>
        <span className={`mt-1 block text-[14px] ${owned ? 'text-muted' : 'font-semibold text-gold'}`}>{meta}</span>
      </span>
      <Icon name={product.kind === 'enlace' && owned ? 'external' : 'chevronRight'} className="size-5 shrink-0 text-muted" />
    </Link>
  )
}

export function CheckoutButton({ offer, email }: { offer: Offer; email?: string }) {
  if (offer.id === 'front') return null
  const url = CHECKOUT_URLS[offer.id]
  if (!url) {
    return (
      <button type="button" disabled className={buttonClass.primary}>
        Dostępne wkrótce
      </button>
    )
  }
  // Pre-fill the member's email: access is granted by the purchase email, so a typo
  // at checkout would buy something the account cannot see.
  const href = email ? `${url}${url.includes('?') ? '&' : '?'}email=${encodeURIComponent(email)}` : url
  return (
    <a href={href} className={buttonClass.primary}>
      Odblokuj teraz
      <Icon name="arrowRight" className="size-5 text-gold-bright" />
    </a>
  )
}

export function OfferCard({ offer, email }: { offer: Offer; email?: string }) {
  const main = productById(offer.productId)
  const includes = PRODUCTS.filter((p) => p.offer === offer.id)
  const price = offer.id === 'front' ? '' : OFFER_PRICES[offer.id]
  if (!main) return null

  return (
    <article id={offer.id} className="scroll-mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <Cover cover={main.cover} size="hero" />
      <div className="p-5">
        <h2 className="font-serif text-[22px] font-semibold leading-snug text-ink">{offer.title}</h2>
        <p className="mt-1.5 text-[16px] leading-relaxed text-text">{offer.pitch}</p>
        <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-gold">W zestawie</p>
        <ul className="mt-2.5 space-y-2.5">
          {includes.map((p) => (
            <li key={p.id} className="flex gap-2.5 text-[15.5px] leading-snug text-ink">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <Icon name="check" className="size-3.5" strokeWidth={2.6} />
              </span>
              <span>
                {p.title}
                <span className="text-muted"> · {contentsLine(p)}</span>
              </span>
            </li>
          ))}
        </ul>
        {price && <p className="mt-6 font-serif text-[26px] font-semibold text-ink">{price}</p>}
        <div className="mt-4">
          <CheckoutButton offer={offer} email={email} />
        </div>
        <p className="mt-3 text-center text-[14px] text-muted">Kup na ten sam e-mail, którego używasz w aplikacji, a dostęp włączy się automatycznie.</p>
      </div>
    </article>
  )
}

/** What a member sees when opening a product they have not bought. */
export function LockedProduct({ product, email }: { product: Product; email?: string }) {
  const offer = offerById(product.offer)
  return (
    <>
      <PageHeader back="/czytaj" title={product.title} />
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <Cover cover={product.cover} size="hero" locked />
        <div className="p-5">
          <p className="text-[16.5px] leading-relaxed text-text">{product.description}</p>
          {product.sections.length > 0 && (
            <ul className="mt-5 divide-y divide-line-soft rounded-2xl border border-line-soft bg-surface-2">
              {product.sections.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[15.5px]">
                  <span className="font-serif text-ink">{s.title}</span>
                  <span className="shrink-0 text-muted">{plural(s.lessons.length, 'lekcja', 'lekcje', 'lekcji')}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 rounded-2xl bg-gold-soft/60 p-4 text-[15.5px] leading-relaxed text-ink">
            Te treści są częścią oferty <strong>{offer.title}</strong>.
          </p>
          <div className="mt-4">
            <CheckoutButton offer={offer} email={email} />
          </div>
          <Link href={`/sklep#${offer.id}`} className={`${buttonClass.ghost} mt-2`}>
            Zobacz wszystko, co zawiera
          </Link>
        </div>
      </div>
    </>
  )
}
