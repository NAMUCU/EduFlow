/**
 * 과제 관리 서비스 - Supabase assignments 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Assignment, AssignmentInsert, AssignmentUpdate, StudentAssignment, StudentAssignmentInsert, AssignmentStatus } from '@/types/database'

export interface AssignmentWithDetails extends Assignment {
  teacher?: { id: string; name: string }
  problemCount?: number
  submittedCount?: number
  totalStudents?: number
}

const mockAssignments: AssignmentWithDetails[] = [
  { id: 'assign-001', title: '중3 수학 과제', description: '이차방정식 연습', academy_id: 'academy-001', teacher_id: 'teacher-001', problems: ['problem-001'], due_date: '2024-03-01T23:59:59Z', time_limit: 60, is_active: true, created_at: '2024-02-15T09:00:00Z', updated_at: '2024-02-15T09:00:00Z', teacher: { id: 'teacher-001', name: '김수학' }, problemCount: 1, submittedCount: 5, totalStudents: 10 },
  { id: 'assign-002', title: '고1 영어 과제', description: '문법 문제', academy_id: 'academy-001', teacher_id: 'teacher-002', problems: ['problem-002'], due_date: '2024-03-05T23:59:59Z', time_limit: 30, is_active: true, created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z', teacher: { id: 'teacher-002', name: '이영어' }, problemCount: 1, submittedCount: 3, totalStudents: 8 },
]

const mockStudentAssignments: StudentAssignment[] = [
  { id: 'sa-001', assignment_id: 'assign-001', student_id: 'student-001', status: 'submitted', score: 85, answers: [{ problem_id: 'problem-001', answer: 'x=2,3', is_correct: true }], feedback: '잘했어요', started_at: '2024-02-16T10:00:00Z', submitted_at: '2024-02-16T10:30:00Z', graded_at: '2024-02-17T09:00:00Z', created_at: '2024-02-16T10:00:00Z', updated_at: '2024-02-17T09:00:00Z' },
]

export async function getAssignments(filter: { academyId: string; teacherId?: string; isActive?: boolean; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockAssignments]
    if (filter.teacherId) f = f.filter(x => x.teacher_id === filter.teacherId)
    if (filter.isActive !== undefined) f = f.filter(x => x.is_active === filter.isActive)
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('assignments').select('*, teacher:teachers(id, user:profiles(name))', { count: 'exact' }).eq('academy_id', filter.academyId)
  if (filter.teacherId) q = q.eq('teacher_id', filter.teacherId)
  if (filter.isActive !== undefined) q = q.eq('is_active', filter.isActive)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('created_at', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as AssignmentWithDetails[], total: count || 0 }
}

export async function getAssignment(id: string) {
  if (!isSupabaseConfigured()) return { data: mockAssignments.find(a => a.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('assignments').select('*, teacher:teachers(id, user:profiles(name))').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as AssignmentWithDetails }
}

export async function createAssignment(assignment: AssignmentInsert) {
  if (!isSupabaseConfigured()) return { data: { id: `assign-${Date.now()}`, ...assignment, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Assignment }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('assignments') as any).insert(assignment).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateAssignment(id: string, updates: AssignmentUpdate) {
  if (!isSupabaseConfigured()) { const a = mockAssignments.find(x => x.id === id); return a ? { data: { ...a, ...updates } as Assignment } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('assignments') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteAssignment(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('assignments') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

// 학생 과제 관련
export async function getStudentAssignments(filter: { studentId?: string; assignmentId?: string; status?: AssignmentStatus }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockStudentAssignments]
    if (filter.studentId) f = f.filter(x => x.student_id === filter.studentId)
    if (filter.assignmentId) f = f.filter(x => x.assignment_id === filter.assignmentId)
    if (filter.status) f = f.filter(x => x.status === filter.status)
    return { data: f }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('student_assignments').select('*, assignment:assignments(id, title, due_date)')
  if (filter.studentId) q = q.eq('student_id', filter.studentId)
  if (filter.assignmentId) q = q.eq('assignment_id', filter.assignmentId)
  if (filter.status) q = q.eq('status', filter.status)
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) return { data: [], error: error.message }
  return { data: data || [] }
}

export async function submitAssignment(inputData: { assignmentId: string; studentId: string; answers: Array<{ problem_id: string; answer: string }> }) {
  if (!isSupabaseConfigured()) return { data: { id: `sa-${Date.now()}`, assignment_id: inputData.assignmentId, student_id: inputData.studentId, status: 'submitted' as AssignmentStatus, answers: inputData.answers, submitted_at: new Date().toISOString() } as StudentAssignment }
  const supabase = createServerSupabaseClient()
  const { data: result, error } = await (supabase.from('student_assignments') as any).upsert({ assignment_id: inputData.assignmentId, student_id: inputData.studentId, status: 'submitted', answers: inputData.answers, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'assignment_id,student_id' }).select().single()
  return error ? { data: null, error: error.message } : { data: result }
}

export async function gradeAssignment(id: string, score: number, feedback?: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('student_assignments') as any).update({ status: 'graded', score, feedback, graded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}
