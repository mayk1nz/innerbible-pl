import { Suspense } from 'react'
import { CommunityView } from '@/components/views/CommunityView'

export const metadata = { title: 'Wspólnota' }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CommunityView />
    </Suspense>
  )
}
