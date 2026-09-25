import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LessonView } from '@/components/views/LessonView'
import { findLesson } from '@/lib/progress'

type Props = { params: Promise<{ product: string; lesson: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product, lesson } = await params
  return { title: findLesson(product, lesson)?.lesson.title ?? 'Lekcja' }
}

export default async function Page({ params }: Props) {
  const { product, lesson } = await params
  if (!findLesson(product, lesson)) notFound()
  return <LessonView productId={product} lessonId={lesson} />
}
