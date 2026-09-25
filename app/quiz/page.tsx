import type { Metadata } from 'next'
import { QuizFunnel } from '@/components/funnel/QuizFunnel'

export const metadata: Metadata = {
  title: { absolute: 'Jak dobrze znasz Słowo Boże? · Quiz biblijny' },
  description: 'Odpowiedz na kilka krótkich pytań i sprawdź, jak dobrze znasz Biblię.',
  // Ad landing page: the ads bring the traffic, search engines do not need it.
  robots: { index: false, follow: false },
}

export default function Page() {
  return <QuizFunnel />
}
