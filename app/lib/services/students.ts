/**
 * 학생 관리 서비스 - Supabase students 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Student, StudentInsert, StudentUpdate } from '@/types/database'

export interface StudentWithProfile extends Student {
  user?: { id: string; name: string; email: string; phone: string | null; avatar_url: string | null }
  parent?: { id: string; name: string; phone: string | null }
}

const mockStudents: StudentWithProfile[] = [
  { id: 'student-001', user_id: 'user-001', academy_id: 'academy-001', grade: '중3', parent_id: 'parent-001', school_name: '서울중학교', class_name: '3-2', memo: '수학 집중', created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z', user: { id: 'user-001', name: '김민수', email: 'minsu@test.com', phone: '010-1111-2222', avatar_url: null }, parent: { id: 'parent-001', name: '김학부모', phone: '010-1234-5678' } },
  { id: 'student-002', user_id: 'user-002', academy_id: 'academy-001', grade: '고1', parent_id: 'parent-002', school_name: '서울고등학교', class_name: '1-5', memo: null, created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z', user: { id: 'user-002', name: '이영희', email: 'yh@test.com', phone: '010-2222-3333', avatar_url: null }, parent: { id: 'parent-002', name: '이학부모', phone: '010-2345-6789' } },
]

export async function getStudents(filter: { academyId: string; search?: string; grade?: string; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockStudents]
    if (filter.search) { const s = filter.search.toLowerCase(); f = f.filter(x => x.user?.name.toLowerCase().includes(s)) }
    if (filter.grade) f = f.filter(x => x.grade === filter.grade)
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('students').select('*, user:profiles!students_user_id_fkey(id,name,email,phone,avatar_url), parent:profiles!students_parent_id_fkey(id,name,phone)', { count: 'exact' }).eq('academy_id', filter.academyId)
  if (filter.search) q = q.ilike('user.name', `%${filter.search}%`)
  if (filter.grade) q = q.eq('grade', filter.grade)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('created_at', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as StudentWithProfile[], total: count || 0 }
}

export async function getStudent(id: string) {
  if (!isSupabaseConfigured()) return { data: mockStudents.find(s => s.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('students').select('*, user:profiles!students_user_id_fkey(id,name,email,phone,avatar_url), parent:profiles!students_parent_id_fkey(id,name,phone)').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as StudentWithProfile }
}

export async function createStudent(student: StudentInsert) {
  if (!isSupabaseConfigured()) return { data: { id: `student-${Date.now()}`, ...student, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Student }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('students') as any).insert(student).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateStudent(id: string, updates: StudentUpdate) {
  if (!isSupabaseConfigured()) { const s = mockStudents.find(x => x.id === id); return s ? { data: { ...s, ...updates } as Student } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('students') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteStudent(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('students') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}
