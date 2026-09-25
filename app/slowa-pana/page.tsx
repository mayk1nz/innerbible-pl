import { KashPayScript } from '@/components/funnel/KashPayScript'
import { OneClickPage } from '@/components/funnel/OneClickPage'

export const metadata = { title: 'Została tylko jedna rzecz', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <>
      <KashPayScript />
      <OneClickPage step="up2" />
    </>
  )
}
