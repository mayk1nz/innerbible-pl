import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ModuleView } from '@/components/views/ModuleView'
import { productById } from '@/lib/catalog'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: productById(slug)?.title ?? 'Treści' }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  if (!productById(slug)) notFound()
  return <ModuleView productId={slug} />
}
