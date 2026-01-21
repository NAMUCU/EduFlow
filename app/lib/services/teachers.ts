/**
 * 강사 관리 서비스 - Supabase teachers 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Teacher, TeacherInsert, TeacherUpdate } from '@/types/database'

export interface TeacherWithProfile extends Teacher {
  user?: { id: string; name: string; email: string; phone: string | null; avatar_url: string | null; role: string }
  classes?: Array<{ id: string; name: string }>
}

const mockTeachers: TeacherWithProfile[] = [
  { id: 'teacher-001', user_id: 'user-t001', academy_id: 'academy-001', subjects: ['수학'], bio: '10년 경력', created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z', user: { id: 'user-t001', name: '김수학', email: 'kim@test.com', phone: '010-1234-5678', avatar_url: null, role: 'teacher' }, classes: [{ id: 'class-001', name: '중3 심화반' }] },
  { id: 'teacher-002', user_id: 'user-t002', academy_id: 'academy-001', subjects: ['영어'], bio: '원어민급', created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z', user: { id: 'user-t002', name: '이영어', email: 'lee@test.com', phone: '010-2345-6789', avatar_url: null, role: 'teacher' }, classes: [{ id: 'class-002', name: '중2 영어반' }] },
]

export async function getTeachers(filter: { academyId: string; search?: string; subject?: string; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockTeachers]
    if (filter.search) { const s = filter.search.toLowerCase(); f = f.filter(x => x.user?.name.toLowerCase().includes(s)) }
    if (filter.subject) f = f.filter(x => x.subjects.includes(filter.subject!))
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('teachers').select('*, user:profiles!teachers_user_id_fkey(id,name,email,phone,avatar_url,role), classes(id,name)', { count: 'exact' }).eq('academy_id', filter.academyId)
  if (filter.search) q = q.ilike('user.name', `%${filter.search}%`)
  if (filter.subject) q = q.contains('subjects', [filter.subject])
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('created_at', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as TeacherWithProfile[], total: count || 0 }
}

export async function getTeacher(id: string) {
  if (!isSupabaseConfigured()) return { data: mockTeachers.find(t => t.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('teachers').select('*, user:profiles!teachers_user_id_fkey(id,name,email,phone,avatar_url,role), classes(id,name)').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as TeacherWithProfile }
}

export async function createTeacher(teacher: TeacherInsert) {
  if (!isSupabaseConfigured()) return { data: { id: `teacher-${Date.now()}`, ...teacher, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Teacher }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('teachers') as any).insert(teacher).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateTeacher(id: string, updates: TeacherUpdate) {
  if (!isSupabaseConfigured()) { const t = mockTeachers.find(x => x.id === id); return t ? { data: { ...t, ...updates } as Teacher } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('teachers') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteTeacher(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('teachers') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}
