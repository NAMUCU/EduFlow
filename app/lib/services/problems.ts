/**
 * 문제 관리 서비스 - Supabase problems 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Problem, ProblemInsert, ProblemUpdate, ProblemType, ProblemDifficulty } from '@/types/database'

// 확장된 문제 타입 (정답률, 출처 등 추가)
export interface ProblemExtended extends Problem {
  problem_number?: string      // 문제 보유번호
  sub_unit?: string            // 세부 단원
  source?: string              // 출처 (2024 수능, 교과서 등)
  source_year?: number         // 출처 연도
  correct_rate?: number        // 정답률 (0~100)
  is_few_shot_sample?: boolean // Few-shot 학습용 샘플
}

const mockProblems: ProblemExtended[] = [
  { id: 'problem-001', problem_number: 'M-2024-001', subject: '수학', grade: '중3', unit: '이차방정식', sub_unit: '인수분해', question: 'x² - 5x + 6 = 0을 풀어라', answer: 'x=2,3', solution: '인수분해', difficulty: 'medium', type: 'short_answer', options: null, image_url: null, tags: ['이차방정식'], source: '2024 중3 모의고사', source_year: 2024, correct_rate: 72.5, is_few_shot_sample: true, academy_id: 'academy-001', created_by: 'teacher-001', is_public: false, ai_generated: true, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-01-15T09:00:00Z' },
  { id: 'problem-002', problem_number: 'E-2024-001', subject: '영어', grade: '고1', unit: '문법', sub_unit: '시제', question: 'She ___ to school.', answer: 'B', solution: '3인칭 단수', difficulty: 'easy', type: 'multiple_choice', options: [{ id: 'A', text: 'go' }, { id: 'B', text: 'goes', is_correct: true }], image_url: null, tags: ['현재시제'], source: '교과서', source_year: 2024, correct_rate: 89.2, is_few_shot_sample: false, academy_id: 'academy-001', created_by: 'teacher-002', is_public: true, ai_generated: false, created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z' },
  { id: 'problem-003', problem_number: 'M-2023-015', subject: '수학', grade: '고2', unit: '삼각함수', sub_unit: '삼각비', question: 'sin 30° + cos 60° 의 값은?', answer: '1', solution: 'sin30°=1/2, cos60°=1/2', difficulty: 'easy', type: 'short_answer', options: null, image_url: null, tags: ['삼각비'], source: '2023 수능', source_year: 2023, correct_rate: 95.1, is_few_shot_sample: true, academy_id: null, created_by: null, is_public: true, ai_generated: false, created_at: '2023-11-15T09:00:00Z', updated_at: '2023-11-15T09:00:00Z' },
]

export interface ProblemFilter {
  academyId?: string
  subject?: string
  grade?: string
  unit?: string
  type?: ProblemType
  difficulty?: ProblemDifficulty
  search?: string
  problemNumber?: string     // 문제번호로 빠른 검색
  source?: string            // 출처 필터
  sourceYear?: number        // 출처 연도
  correctRateMin?: number    // 최소 정답률
  correctRateMax?: number    // 최대 정답률
  isFewShotSample?: boolean  // Few-shot 샘플만
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export async function getProblems(filter: ProblemFilter) {
  if (!isSupabaseConfigured()) {
    let f = [...mockProblems]
    if (filter.subject) f = f.filter(x => x.subject === filter.subject)
    if (filter.grade) f = f.filter(x => x.grade === filter.grade)
    if (filter.type) f = f.filter(x => x.type === filter.type)
    if (filter.difficulty) f = f.filter(x => x.difficulty === filter.difficulty)
    if (filter.search) { const s = filter.search.toLowerCase(); f = f.filter(x => x.question.toLowerCase().includes(s)) }
    if (filter.dateFrom) f = f.filter(x => x.created_at >= filter.dateFrom!)
    if (filter.dateTo) f = f.filter(x => x.created_at <= filter.dateTo!)
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('problems').select('*', { count: 'exact' })
  if (filter.academyId) q = q.or(`is_public.eq.true,academy_id.eq.${filter.academyId}`)
  if (filter.subject) q = q.eq('subject', filter.subject)
  if (filter.grade) q = q.eq('grade', filter.grade)
  if (filter.type) q = q.eq('type', filter.type)
  if (filter.difficulty) q = q.eq('difficulty', filter.difficulty)
  if (filter.search) q = q.ilike('question', `%${filter.search}%`)
  if (filter.dateFrom) q = q.gte('created_at', filter.dateFrom)
  if (filter.dateTo) q = q.lte('created_at', filter.dateTo)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('created_at', { ascending: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data || [], total: count || 0 }
}

export async function getProblem(id: string) {
  if (!isSupabaseConfigured()) return { data: mockProblems.find(p => p.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('problems').select('*').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data }
}

export async function createProblem(problem: ProblemInsert) {
  if (!isSupabaseConfigured()) return { data: { id: `problem-${Date.now()}`, ...problem, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Problem }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('problems') as any).insert(problem).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function createProblems(problems: ProblemInsert[]) {
  if (!isSupabaseConfigured()) return { data: problems.map((p, i) => ({ id: `problem-${Date.now()}-${i}`, ...p, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })) as Problem[] }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('problems') as any).insert(problems).select()
  return error ? { data: [], error: error.message } : { data: data || [] }
}

export async function updateProblem(id: string, updates: ProblemUpdate) {
  if (!isSupabaseConfigured()) { const p = mockProblems.find(x => x.id === id); return p ? { data: { ...p, ...updates } as Problem } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('problems') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteProblem(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('problems') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

export async function deleteProblems(ids: string[]) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('problems') as any).delete().in('id', ids)
  return error ? { success: false, error: error.message } : { success: true }
}
