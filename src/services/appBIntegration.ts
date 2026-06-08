const APP_B_URL = 'https://bgpygirvzfjvfathywjb.supabase.co'
const APP_B_BASE = 'https://appbplatform.vercel.app'

export interface AppBCourse {
  id: string
  nome: string
  preco: number
  externalId: string
  checkoutUrl: string
}

export const APP_B_COURSES: AppBCourse[] = [
  {
    id: 'low_ticket_maia',
    nome: 'Low Ticket Maia',
    preco: 67,
    externalId: 'low_ticket_maia',
    checkoutUrl: `${APP_B_BASE}/checkout/low_ticket_maia`,
  },
]

export function getAppBCheckoutUrl(courseExternalId: string, email?: string): string {
  const course = APP_B_COURSES.find(c => c.externalId === courseExternalId)
  if (!course) return APP_B_BASE
  const url = new URL(course.checkoutUrl)
  if (email) url.searchParams.set('email', email)
  return url.toString()
}

export function getStudentCourseBadge(courseIds: string[]): string {
  if (!courseIds || courseIds.length === 0) return ''
  const courseName = APP_B_COURSES.find(c => c.externalId === courseIds[0])?.nome
  return courseName ? `Aluno ${courseName}` : 'Aluno'
}
