/**
 * 출결 관리 서비스 - Supabase attendance 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Attendance, AttendanceInsert, AttendanceUpdate, AttendanceStatus } from '@/types/database'

export interface AttendanceWithStudent extends Attendance {
  student?: { id: string; user: { name: string } }
}

const mockAttendance: AttendanceWithStudent[] = [
  { id: 'att-001', student_id: 'student-001', date: '2024-02-15', status: 'present', check_in_time: '14:00:00', check_out_time: '17:00:00', note: null, created_at: '2024-02-15T14:00:00Z', updated_at: '2024-02-15T17:00:00Z', student: { id: 'student-001', user: { name: '김민수' } } },
  { id: 'att-002', student_id: 'student-002', date: '2024-02-15', status: 'late', check_in_time: '14:30:00', check_out_time: '17:00:00', note: '30분 지각', created_at: '2024-02-15T14:30:00Z', updated_at: '2024-02-15T17:00:00Z', student: { id: 'student-002', user: { name: '이영희' } } },
  { id: 'att-003', student_id: 'student-001', date: '2024-02-16', status: 'absent', check_in_time: null, check_out_time: null, note: '병결', created_at: '2024-02-16T09:00:00Z', updated_at: '2024-02-16T09:00:00Z', student: { id: 'student-001', user: { name: '김민수' } } },
]

export async function getAttendance(filter: { academyId?: string; studentId?: string; date?: string; dateFrom?: string; dateTo?: string; status?: AttendanceStatus; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockAttendance]
    if (filter.studentId) f = f.filter(x => x.student_id === filter.studentId)
    if (filter.date) f = f.filter(x => x.date === filter.date)
    if (filter.dateFrom) f = f.filter(x => x.date >= filter.dateFrom!)
    if (filter.dateTo) f = f.filter(x => x.date <= filter.dateTo!)
    if (filter.status) f = f.filter(x => x.status === filter.status)
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 50)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('attendance').select('*, student:students(id, user:profiles(name))', { count: 'exact' })
  if (filter.studentId) q = q.eq('student_id', filter.studentId)
  if (filter.date) q = q.eq('date', filter.date)
  if (filter.dateFrom) q = q.gte('date', filter.dateFrom)
  if (filter.dateTo) q = q.lte('date', filter.dateTo)
  if (filter.status) q = q.eq('status', filter.status)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 50) - 1).order('date', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as AttendanceWithStudent[], total: count || 0 }
}

export async function getAttendanceByDate(date: string, academyId: string) {
  return getAttendance({ academyId, date })
}

export async function checkIn(studentId: string, date: string, time: string) {
  if (!isSupabaseConfigured()) return { data: { id: `att-${Date.now()}`, student_id: studentId, date, status: 'present' as AttendanceStatus, check_in_time: time, check_out_time: null, note: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Attendance }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('attendance') as any).upsert({ student_id: studentId, date, status: 'present', check_in_time: time, updated_at: new Date().toISOString() }, { onConflict: 'student_id,date' }).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function checkOut(studentId: string, date: string, time: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('attendance') as any).update({ check_out_time: time, updated_at: new Date().toISOString() }).eq('student_id', studentId).eq('date', date)
  return error ? { success: false, error: error.message } : { success: true }
}

export async function markAbsent(studentId: string, date: string, note?: string) {
  if (!isSupabaseConfigured()) return { data: { id: `att-${Date.now()}`, student_id: studentId, date, status: 'absent' as AttendanceStatus, check_in_time: null, check_out_time: null, note, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Attendance }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('attendance') as any).upsert({ student_id: studentId, date, status: 'absent', note, updated_at: new Date().toISOString() }, { onConflict: 'student_id,date' }).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateAttendance(id: string, updates: AttendanceUpdate) {
  if (!isSupabaseConfigured()) { const a = mockAttendance.find(x => x.id === id); return a ? { data: { ...a, ...updates } as Attendance } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('attendance') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function getAttendanceStats(studentId: string, dateFrom: string, dateTo: string) {
  const { data } = await getAttendance({ studentId, dateFrom, dateTo, limit: 1000 })
  const stats = { present: 0, absent: 0, late: 0, early_leave: 0, total: data.length }
  data.forEach(a => { stats[a.status]++ })
  return { data: stats }
}
