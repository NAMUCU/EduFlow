/**
 * 성적 관리 서비스 - Supabase grades 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Grade, GradeInsert, GradeUpdate } from '@/types/database'

export interface GradeWithStudent extends Grade {
  student?: { id: string; user: { name: string } }
}

const mockGrades: GradeWithStudent[] = [
  { id: 'grade-001', student_id: 'student-001', subject: '수학', unit: '이차방정식', score: 85, max_score: 100, exam_type: '단원평가', date: '2024-02-15', memo: '실수 줄이기', created_at: '2024-02-15T10:00:00Z', updated_at: '2024-02-15T10:00:00Z', student: { id: 'student-001', user: { name: '김민수' } } },
  { id: 'grade-002', student_id: 'student-001', subject: '영어', unit: '문법', score: 90, max_score: 100, exam_type: '단원평가', date: '2024-02-16', memo: null, created_at: '2024-02-16T10:00:00Z', updated_at: '2024-02-16T10:00:00Z', student: { id: 'student-001', user: { name: '김민수' } } },
  { id: 'grade-003', student_id: 'student-002', subject: '수학', unit: '함수', score: 78, max_score: 100, exam_type: '모의고사', date: '2024-02-20', memo: '응용문제 보충필요', created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z', student: { id: 'student-002', user: { name: '이영희' } } },
]

export async function getGrades(filter: { studentId?: string; subject?: string; examType?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockGrades]
    if (filter.studentId) f = f.filter(x => x.student_id === filter.studentId)
    if (filter.subject) f = f.filter(x => x.subject === filter.subject)
    if (filter.examType) f = f.filter(x => x.exam_type === filter.examType)
    if (filter.dateFrom) f = f.filter(x => x.date >= filter.dateFrom!)
    if (filter.dateTo) f = f.filter(x => x.date <= filter.dateTo!)
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 50)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('grades').select('*, student:students(id, user:profiles(name))', { count: 'exact' })
  if (filter.studentId) q = q.eq('student_id', filter.studentId)
  if (filter.subject) q = q.eq('subject', filter.subject)
  if (filter.examType) q = q.eq('exam_type', filter.examType)
  if (filter.dateFrom) q = q.gte('date', filter.dateFrom)
  if (filter.dateTo) q = q.lte('date', filter.dateTo)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 50) - 1).order('date', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as GradeWithStudent[], total: count || 0 }
}

export async function getGrade(id: string) {
  if (!isSupabaseConfigured()) return { data: mockGrades.find(g => g.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('grades').select('*, student:students(id, user:profiles(name))').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as GradeWithStudent }
}

export async function createGrade(grade: GradeInsert) {
  if (!isSupabaseConfigured()) return { data: { id: `grade-${Date.now()}`, ...grade, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Grade }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('grades') as any).insert(grade).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function createGrades(grades: GradeInsert[]) {
  if (!isSupabaseConfigured()) return { data: grades.map((g, i) => ({ id: `grade-${Date.now()}-${i}`, ...g, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })) as Grade[] }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('grades') as any).insert(grades).select()
  return error ? { data: [], error: error.message } : { data: data || [] }
}

export async function updateGrade(id: string, updates: GradeUpdate) {
  if (!isSupabaseConfigured()) { const g = mockGrades.find(x => x.id === id); return g ? { data: { ...g, ...updates } as Grade } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('grades') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteGrade(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('grades') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

// 통계
export async function getGradeStats(studentId: string) {
  const { data } = await getGrades({ studentId, limit: 1000 })
  const bySubject: Record<string, { total: number; count: number; avg: number }> = {}
  data.forEach(g => {
    if (!bySubject[g.subject]) bySubject[g.subject] = { total: 0, count: 0, avg: 0 }
    bySubject[g.subject].total += (g.score / g.max_score) * 100
    bySubject[g.subject].count++
  })
  Object.keys(bySubject).forEach(s => { bySubject[s].avg = Math.round(bySubject[s].total / bySubject[s].count) })
  return { data: bySubject }
}

export async function getGradeTrend(studentId: string, subject: string, limit = 10) {
  const { data } = await getGrades({ studentId, subject, limit })
  return { data: data.reverse().map(g => ({ date: g.date, score: Math.round((g.score / g.max_score) * 100), unit: g.unit })) }
}
