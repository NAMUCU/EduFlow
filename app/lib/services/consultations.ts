/**
 * 상담 관리 서비스 - Supabase consultations 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Consultation, ConsultationInsert, ConsultationUpdate, ConsultationType, ConsultationStatus } from '@/types/database'

export interface ConsultationWithDetails extends Consultation {
  parent?: { id: string; name: string; phone: string | null }
  teacher?: { id: string; user: { name: string } }
  student?: { id: string; user: { name: string } }
}

const mockConsultations: ConsultationWithDetails[] = [
  { id: 'consult-001', parent_id: 'parent-001', teacher_id: 'teacher-001', student_id: 'student-001', type: 'in_person', date: '2024-02-20T14:00:00Z', duration: 30, topic: '성적 상담', notes: '수학 성적 향상 방안 논의', status: 'completed', created_at: '2024-02-15T09:00:00Z', updated_at: '2024-02-20T14:30:00Z', parent: { id: 'parent-001', name: '김학부모', phone: '010-1234-5678' }, teacher: { id: 'teacher-001', user: { name: '김수학' } }, student: { id: 'student-001', user: { name: '김민수' } } },
  { id: 'consult-002', parent_id: 'parent-002', teacher_id: 'teacher-002', student_id: 'student-002', type: 'phone', date: '2024-02-25T15:00:00Z', duration: 20, topic: '진로 상담', notes: null, status: 'scheduled', created_at: '2024-02-18T10:00:00Z', updated_at: '2024-02-18T10:00:00Z', parent: { id: 'parent-002', name: '이학부모', phone: '010-2345-6789' }, teacher: { id: 'teacher-002', user: { name: '이영어' } }, student: { id: 'student-002', user: { name: '이영희' } } },
]

export async function getConsultations(filter: { academyId?: string; parentId?: string; teacherId?: string; studentId?: string; status?: ConsultationStatus; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockConsultations]
    if (filter.parentId) f = f.filter(x => x.parent_id === filter.parentId)
    if (filter.teacherId) f = f.filter(x => x.teacher_id === filter.teacherId)
    if (filter.studentId) f = f.filter(x => x.student_id === filter.studentId)
    if (filter.status) f = f.filter(x => x.status === filter.status)
    if (filter.dateFrom) f = f.filter(x => x.date >= filter.dateFrom!)
    if (filter.dateTo) f = f.filter(x => x.date <= filter.dateTo!)
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('consultations').select('*, parent:profiles!consultations_parent_id_fkey(id, name, phone), teacher:teachers(id, user:profiles(name)), student:students(id, user:profiles(name))', { count: 'exact' })
  if (filter.parentId) q = q.eq('parent_id', filter.parentId)
  if (filter.teacherId) q = q.eq('teacher_id', filter.teacherId)
  if (filter.studentId) q = q.eq('student_id', filter.studentId)
  if (filter.status) q = q.eq('status', filter.status)
  if (filter.dateFrom) q = q.gte('date', filter.dateFrom)
  if (filter.dateTo) q = q.lte('date', filter.dateTo)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('date', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as ConsultationWithDetails[], total: count || 0 }
}

export async function getConsultation(id: string) {
  if (!isSupabaseConfigured()) return { data: mockConsultations.find(c => c.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('consultations').select('*, parent:profiles!consultations_parent_id_fkey(id, name, phone), teacher:teachers(id, user:profiles(name)), student:students(id, user:profiles(name))').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as ConsultationWithDetails }
}

export async function createConsultation(consultation: ConsultationInsert) {
  if (!isSupabaseConfigured()) return { data: { id: `consult-${Date.now()}`, ...consultation, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Consultation }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('consultations') as any).insert(consultation).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateConsultation(id: string, updates: ConsultationUpdate) {
  if (!isSupabaseConfigured()) { const c = mockConsultations.find(x => x.id === id); return c ? { data: { ...c, ...updates } as Consultation } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('consultations') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteConsultation(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('consultations') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

export async function completeConsultation(id: string, notes: string) {
  return updateConsultation(id, { status: 'completed', notes })
}

export async function cancelConsultation(id: string) {
  return updateConsultation(id, { status: 'cancelled' })
}
