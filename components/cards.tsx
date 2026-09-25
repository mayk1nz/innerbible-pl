'use client'

import Link from 'next/link'
import { Cover } from './Cover'
import { BenefitList, DealBadge, DealBox } from './Deal'
import { Icon } from './icons'
import { PageHeader } from './PageHeader'
import { ProgressBar, buttonClass } from './ui'
import { offerById, productById, type Offer, type Product } from '@/lib/catalog'
import { DEALS, type UpsellId } from '@/lib/deals'
import { isOwned, lessonHref, nextLesson, productProgress } from '@/lib/progress'
import type { AppState } from '@/lib/store'

/** Big card for an owned recorrido, like the "Destacados" of the reference app. */
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
        <p className="mt-1.5 text-[14px] text-muted">{progress.done} z {progress.total} lekcji</p>
        <Link href={next ? lessonHref(product.id, next.lesson.id) : `/modul/${product.id}`} className={`${buttonClass.primary} mt-4`}>
          {cta}
          <Icon name="arrowRight" className="size-5 text-gold-bright" />
        </Link>
        {next && started && <p className="mt-2.5 text-center text-[14px] text-muted">Dalej: {next.lesson.title}</p>}
      </div>
    </article>
  )
}

/** Grid tile in Leer → Recorridos. Locked tiles still open the product page (with the offer). */
export function ProductTile({ product, state }: { product: Product; state: AppState }) {
  const owned = isOwned(product, state.owned)
  const progress = productProgress(product, state.completed)
  return (
    <Link href={`/modul/${product.id}`} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5">
      <span className="relative block">
        <Cover cover={product.cover} size="tile" locked={!owned} />
        {!owned && product.offer !== 'front' && (
          <span className="absolute left-1.5 top-1">
            <DealBadge offer={product.offer} />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-2.5 p-3.5">
        <span className="font-serif text-[15.5px] font-medium leading-snug text-ink">{product.title}</span>
        <span className="mt-auto">
          {owned && product.kind === 'enlace' ? (
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
              <Icon name="message" className="size-3.5" />
              Dołącz do grupy
            </span>
          ) : owned ? (
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

/** How each upsell is named on its offer box, and what its button says. */
const DEAL_COPY: Record<UpsellId, { title: string; cta: string }> = {
  upsell1: { title: 'Cała Biblia w audio, w porządku chronologicznym', cta: 'Chcę słuchać Biblii' },
  upsell2: { title: 'Twój Doradca + 3 plany 90-dniowe', cta: 'Chcę Słowa Pana' },
}

/** One upsell in the Tienda: a short cover strip, then the offer. */
export function OfferCard({ offer }: { offer: Offer }) {
  const main = productById(offer.productId)
  if (!main || offer.id === 'front') return null
  const copy = DEAL_COPY[offer.id]

  return (
    <article id={offer.id} className="scroll-mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
      <Cover cover={main.cover} size="banner" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-[22px] font-semibold leading-snug text-ink">{offer.title}</h2>
          <span className="mt-1.5 shrink-0">
            <DealBadge offer={offer.id} />
          </span>
        </div>
        <p className="mt-1.5 text-[16px] leading-relaxed text-text">{offer.pitch}</p>
        <div className="mt-5">
          <BenefitList items={DEALS[offer.id].benefits} />
        </div>
        <div className="mt-5">
          <DealBox offer={offer.id} title={copy.title} cta={copy.cta} />
        </div>
      </div>
    </article>
  )
}

/** What a member sees when opening a product they have not bought: everything it includes and the offer, right here. */
export function LockedProduct({ product }: { product: Product }) {
  const offer = offerById(product.offer)
  return (
    <>
      <PageHeader back="/czytaj" title={product.title} />
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <Cover cover={product.cover} size="banner" locked />
        <div className="p-5">
          <p className="text-[16.5px] leading-relaxed text-text">{product.description}</p>
          {offer.id === 'front' ? (
            <p className="mt-5 rounded-2xl bg-gold-soft/60 p-4 text-[15.5px] leading-relaxed text-ink">
              Te treści są częścią pakietu <strong>{offer.title}</strong>.
            </p>
          ) : (
            <>
              <div className="mt-5">
                <BenefitList items={DEALS[offer.id].benefits} />
              </div>
              <div className="mt-5">
                <DealBox offer={offer.id} title={DEAL_COPY[offer.id].title} cta={DEAL_COPY[offer.id].cta} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
