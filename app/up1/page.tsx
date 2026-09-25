import { UpsellPage } from '@/components/funnel/UpsellPage'

export const metadata = { title: 'Twoje zamówienie nie jest jeszcze zakończone', robots: { index: false, follow: false } }

export default function Page() {
  return <UpsellPage offer="up1" />
}
