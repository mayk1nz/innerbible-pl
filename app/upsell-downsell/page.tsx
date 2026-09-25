import { KashPayScript } from '@/components/funnel/KashPayScript'
import { OneClickPage } from '@/components/funnel/OneClickPage'

export const metadata = { title: 'Ostatnia szansa: 50% zniżki', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <>
      <KashPayScript />
      <OneClickPage step="down1" />
    </>
  )
}
