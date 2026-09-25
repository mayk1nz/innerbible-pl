import { Suspense } from 'react'
import { CommunityView } from '@/components/views/CommunityView'

export const metadata = { title: 'Społeczność' }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CommunityView />
    </Suspense>
  )
}
