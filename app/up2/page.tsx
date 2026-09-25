import { UpsellPage } from '@/components/funnel/UpsellPage'

export const metadata = { title: 'Ostatni krok', robots: { index: false, follow: false } }

export default function Page() {
  return <UpsellPage offer="up2" />
}
