import { KashPayScript } from '@/components/funnel/KashPayScript'
import { OneClickPage } from '@/components/funnel/OneClickPage'

export const metadata = { title: 'Ważna informacja o twoim zamówieniu', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <>
      <KashPayScript />
      <OneClickPage step="up1" />
    </>
  )
}
