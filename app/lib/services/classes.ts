/**
 * 반 관리 서비스 - Supabase classes 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export interface Class {
  id: string
  name: string
  academy_id: string
  teacher_id: string | null
  subject: string | null
  grade: string | null
  description: string | null
  schedule: Record<string, unknown>
  max_students: number
  created_at: string
  updated_at: string
}

export interface ClassWithDetails extends Class {
  teacher?: { id: string; user: { name: string } }
  studentCount?: number
}

const mockClasses: ClassWithDetails[] = [
  { id: 'class-001', name: '중3 심화반', academy_id: 'academy-001', teacher_id: 'teacher-001', subject: '수학', grade: '중3', description: '심화 수학', schedule: { mon: '14:00-16:00', wed: '14:00-16:00' }, max_students: 15, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', teacher: { id: 'teacher-001', user: { name: '김수학' } }, studentCount: 10 },
  { id: 'class-002', name: '고1 기초반', academy_id: 'academy-001', teacher_id: 'teacher-001', subject: '수학', grade: '고1', description: '기초 수학', schedule: { tue: '16:00-18:00', thu: '16:00-18:00' }, max_students: 20, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', teacher: { id: 'teacher-001', user: { name: '김수학' } }, studentCount: 15 },
  { id: 'class-003', name: '중2 영어반', academy_id: 'academy-001', teacher_id: 'teacher-002', subject: '영어', grade: '중2', description: '영어 회화', schedule: { mon: '16:00-18:00', fri: '16:00-18:00' }, max_students: 12, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z', teacher: { id: 'teacher-002', user: { name: '이영어' } }, studentCount: 8 },
]

export async function getClasses(filter: { academyId: string; teacherId?: string; subject?: string; grade?: string; search?: string; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockClasses]
    if (filter.teacherId) f = f.filter(x => x.teacher_id === filter.teacherId)
    if (filter.subject) f = f.filter(x => x.subject === filter.subject)
    if (filter.grade) f = f.filter(x => x.grade === filter.grade)
    if (filter.search) { const s = filter.search.toLowerCase(); f = f.filter(x => x.name.toLowerCase().includes(s)) }
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('classes').select('*, teacher:teachers(id, user:profiles(name))', { count: 'exact' }).eq('academy_id', filter.academyId)
  if (filter.teacherId) q = q.eq('teacher_id', filter.teacherId)
  if (filter.subject) q = q.eq('subject', filter.subject)
  if (filter.grade) q = q.eq('grade', filter.grade)
  if (filter.search) q = q.ilike('name', `%${filter.search}%`)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('name')
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as ClassWithDetails[], total: count || 0 }
}

export async function getClass(id: string) {
  if (!isSupabaseConfigured()) return { data: mockClasses.find(c => c.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('classes').select('*, teacher:teachers(id, user:profiles(name))').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as ClassWithDetails }
}

export async function createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) {
  if (!isSupabaseConfigured()) return { data: { id: `class-${Date.now()}`, ...classData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Class }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('classes') as any).insert(classData).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateClass(id: string, updates: Partial<Class>) {
  if (!isSupabaseConfigured()) { const c = mockClasses.find(x => x.id === id); return c ? { data: { ...c, ...updates } as Class } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('classes') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteClass(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('classes') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

// 학생 등록/해제
export async function addStudentToClass(classId: string, studentId: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('class_students') as any).insert({ class_id: classId, student_id: studentId })
  return error ? { success: false, error: error.message } : { success: true }
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('class_students') as any).delete().eq('class_id', classId).eq('student_id', studentId)
  return error ? { success: false, error: error.message } : { success: true }
}

export async function getClassStudents(classId: string) {
  if (!isSupabaseConfigured()) return { data: [] }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('class_students') as any).select('student:students(*, user:profiles(id, name, email, phone))').eq('class_id', classId)
  if (error) return { data: [], error: error.message }
  return { data: data?.map((d: any) => d.student) || [] }
}
