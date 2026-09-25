import Link from 'next/link'
import { Icon } from '@/components/icons'
import { buttonClass } from '@/components/styles'
import { BrandMark } from '@/components/ui'
import { APP } from '@/lib/config'

export const metadata = { title: 'Dziękujemy za zakup', robots: { index: false, follow: false } }

// End of the funnel. Deliberately does not claim a payment was approved: this page
// is reachable by anyone; the gateway's email is the confirmation.
export default function Page() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] border border-line bg-surface px-6 py-8 text-center shadow-card">
        <div className="flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="mt-5 font-serif text-[28px] font-semibold leading-tight text-ink">Dziękujemy za zakup!</h1>
        <p className="mt-3 text-[16.5px] leading-relaxed text-text">
          W ciągu kilku minut otrzymasz e-mail z potwierdzeniem. Twój dostęp czeka w aplikacji {APP.name}.
        </p>
        <div className="mt-6 rounded-2xl bg-gold-soft/60 p-4 text-left">
          <p className="flex gap-3 text-[15.5px] leading-snug text-ink">
            <Icon name="mail" className="mt-0.5 size-5 shrink-0 text-gold" />
            <span>
              Zaloguj się <strong>tym samym adresem e-mail</strong>, którego użyto przy zakupie.
            </span>
          </p>
        </div>
        <Link href="/logowanie" className={`${buttonClass.primary} mt-6 min-h-14 text-[17px]`}>
          Przejdź do aplikacji
          <Icon name="arrowRight" className="size-5 text-gold-bright" />
        </Link>
        <p className="mt-5 text-[14px] text-muted">
          Nie widzisz e-maila? Sprawdź folder spam albo napisz do nas:{' '}
          <a href={`mailto:${APP.supportEmail}`} className="font-semibold text-primary underline-offset-4 hover:underline">
            {APP.supportEmail}
          </a>
        </p>
      </div>
    </main>
  )
}
