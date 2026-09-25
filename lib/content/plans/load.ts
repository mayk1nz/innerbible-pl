import type { LessonContent } from '../../catalog'
import type { PlanId } from './titles'

// Each plan's 90 days are a separate chunk, fetched only when a member opens one of
// its days — so the texts never weigh on the rest of the app.
const LOADERS: Record<PlanId, () => Promise<{ DAYS: LessonContent[] }>> = {
  transformacion: () => import('./transformacion'),
  'vivir-como-jesus': () => import('./vivir-como-jesus'),
  'nueva-mentalidad': () => import('./nueva-mentalidad'),
}

export async function loadPlanDay(plan: PlanId, day: number): Promise<LessonContent | null> {
  const mod = await LOADERS[plan]()
  return mod.DAYS[day - 1] ?? null
}
