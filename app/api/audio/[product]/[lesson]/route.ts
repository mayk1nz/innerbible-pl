import { productById } from '@/lib/catalog'
import { SITE } from '@/lib/config'
import { ownedOffers } from '@/lib/server/access'
import { db } from '@/lib/server/db'
import { sessionEmail } from '@/lib/server/session'

// GET /api/audio/<product>/<lesson> → a short-lived link to the audio file, only for a
// member who owns that product. The files live in the private Supabase Storage bucket
// "audios" as "<product>/<lesson>.mp3" (upload: scripts/upload-audios.mjs), so the
// address of a file never works on its own for someone who did not buy it.

export const dynamic = 'force-dynamic'

const LINK_SECONDS = 24 * 3600

type Params = { params: Promise<{ product: string; lesson: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { product: productId, lesson: lessonId } = await params
  const product = productById(productId)
  const lesson = product?.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId && l.format === 'audio')
  if (!product || !lesson) return new Response('Not found', { status: 404 })

  const email = await sessionEmail()
  if (!email) return new Response('Unauthorized', { status: 401 })
  try {
    const owned = await ownedOffers(email)
    if (!owned.includes(product.offer)) return new Response('Forbidden', { status: 403 })
    const { data, error } = await db().storage.from(SITE.audioBucket).createSignedUrl(`${productId}/${lessonId}.mp3`, LINK_SECONDS)
    // Not uploaded yet: the player shows "Audio en preparación".
    if (error || !data?.signedUrl) return new Response('Not found', { status: 404 })
    return new Response(null, { status: 302, headers: { location: data.signedUrl, 'cache-control': 'private, no-store' } })
  } catch {
    return new Response('Error', { status: 500 })
  }
}
