/**
 * 문제 세트 관리 서비스
 * 과제/수업/시험별 문제 묶음 관리
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export type ProblemSetType = 'assignment' | 'lesson' | 'exam' | 'custom'

export interface ProblemSet {
  id: string
  name: string
  type: ProblemSetType
  description: string | null
  academy_id: string
  teacher_id: string
  class_id: string | null
  assignment_id: string | null
  use_date: string | null
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface ProblemSetItem {
  id: string
  problem_set_id: string
  problem_id: string
  order_index: number
  points: number
  created_at: string
}

export interface ProblemSetWithDetails extends ProblemSet {
  teacher?: { id: string; user: { name: string } }
  class?: { id: string; name: string }
  items?: Array<ProblemSetItem & { problem: { id: string; question: string; subject: string; difficulty: string } }>
  problemCount?: number
}

// Mock 데이터
const mockProblemSets: ProblemSetWithDetails[] = [
  {
    id: 'pset-001',
    name: '2/15 중3 수학 과제',
    type: 'assignment',
    description: '이차방정식 연습문제',
    academy_id: 'academy-001',
    teacher_id: 'teacher-001',
    class_id: 'class-001',
    assignment_id: 'assign-001',
    use_date: '2024-02-15',
    is_template: false,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2024-02-15T09:00:00Z',
    teacher: { id: 'teacher-001', user: { name: '김수학' } },
    class: { id: 'class-001', name: '중3 심화반' },
    problemCount: 5,
  },
  {
    id: 'pset-002',
    name: '2/16 고1 영어 수업',
    type: 'lesson',
    description: '문법 수업 자료',
    academy_id: 'academy-001',
    teacher_id: 'teacher-002',
    class_id: 'class-002',
    assignment_id: null,
    use_date: '2024-02-16',
    is_template: false,
    created_at: '2024-02-16T10:00:00Z',
    updated_at: '2024-02-16T10:00:00Z',
    teacher: { id: 'teacher-002', user: { name: '이영어' } },
    class: { id: 'class-002', name: '고1 기초반' },
    problemCount: 3,
  },
  {
    id: 'pset-003',
    name: '이차방정식 기본 세트',
    type: 'custom',
    description: '재사용 가능한 템플릿',
    academy_id: 'academy-001',
    teacher_id: 'teacher-001',
    class_id: null,
    assignment_id: null,
    use_date: null,
    is_template: true,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    teacher: { id: 'teacher-001', user: { name: '김수학' } },
    problemCount: 10,
  },
]

export interface ProblemSetFilter {
  academyId: string
  teacherId?: string
  type?: ProblemSetType
  classId?: string
  dateFrom?: string
  dateTo?: string
  isTemplate?: boolean
  search?: string
  limit?: number
  offset?: number
}

/**
 * 문제 세트 목록 조회 (선생님별/날짜별)
 */
export async function getProblemSets(filter: ProblemSetFilter): Promise<{
  data: ProblemSetWithDetails[]
  total: number
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    let f = [...mockProblemSets]
    if (filter.teacherId) f = f.filter(x => x.teacher_id === filter.teacherId)
    if (filter.type) f = f.filter(x => x.type === filter.type)
    if (filter.classId) f = f.filter(x => x.class_id === filter.classId)
    if (filter.isTemplate !== undefined) f = f.filter(x => x.is_template === filter.isTemplate)
    if (filter.dateFrom) f = f.filter(x => x.use_date && x.use_date >= filter.dateFrom!)
    if (filter.dateTo) f = f.filter(x => x.use_date && x.use_date <= filter.dateTo!)
    if (filter.search) {
      const s = filter.search.toLowerCase()
      f = f.filter(x => x.name.toLowerCase().includes(s))
    }
    f.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }

  try {
    const supabase = createServerSupabaseClient()
    let q = (supabase.from('problem_sets') as any).select(`
      *,
      teacher:teachers(id, user:profiles(name)),
      class:classes(id, name),
      items:problem_set_items(count)
    `, { count: 'exact' }).eq('academy_id', filter.academyId)

    if (filter.teacherId) q = q.eq('teacher_id', filter.teacherId)
    if (filter.type) q = q.eq('type', filter.type)
    if (filter.classId) q = q.eq('class_id', filter.classId)
    if (filter.isTemplate !== undefined) q = q.eq('is_template', filter.isTemplate)
    if (filter.dateFrom) q = q.gte('use_date', filter.dateFrom)
    if (filter.dateTo) q = q.lte('use_date', filter.dateTo)
    if (filter.search) q = q.ilike('name', `%${filter.search}%`)

    const { data, count, error } = await q
      .range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], total: count || 0 }
  } catch (error) {
    console.error('문제 세트 목록 조회 실패:', error)
    return { data: [], total: 0, error: error instanceof Error ? error.message : '조회 실패' }
  }
}

/**
 * 날짜별 문제 세트 조회 (선생님 메인 화면용)
 */
export async function getProblemSetsByDate(teacherId: string, date: string): Promise<{
  data: ProblemSetWithDetails[]
  error?: string
}> {
  const result = await getProblemSets({
    academyId: 'academy-001', // TODO: 실제 academyId
    teacherId,
    dateFrom: date,
    dateTo: date,
    isTemplate: false,
  })
  return { data: result.data, error: result.error }
}

/**
 * 문제 세트 상세 조회 (문제 목록 포함)
 */
export async function getProblemSet(id: string): Promise<{
  data: ProblemSetWithDetails | null
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    const set = mockProblemSets.find(s => s.id === id)
    if (set) {
      return {
        data: {
          ...set,
          items: [
            { id: 'psi-001', problem_set_id: id, problem_id: 'problem-001', order_index: 0, points: 10, created_at: '', problem: { id: 'problem-001', question: 'x² - 5x + 6 = 0을 풀어라', subject: '수학', difficulty: 'medium' } },
            { id: 'psi-002', problem_set_id: id, problem_id: 'problem-002', order_index: 1, points: 10, created_at: '', problem: { id: 'problem-002', question: 'She ___ to school.', subject: '영어', difficulty: 'easy' } },
          ],
        },
      }
    }
    return { data: null }
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await (supabase.from('problem_sets') as any).select(`
      *,
      teacher:teachers(id, user:profiles(name)),
      class:classes(id, name),
      items:problem_set_items(
        id, problem_set_id, problem_id, order_index, points, created_at,
        problem:problems(id, question, subject, difficulty, type, answer)
      )
    `).eq('id', id).single()

    if (error) throw error
    return { data }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '조회 실패' }
  }
}

/**
 * 문제 세트 생성
 */
export async function createProblemSet(data: {
  name: string
  type: ProblemSetType
  description?: string
  academyId: string
  teacherId: string
  classId?: string
  assignmentId?: string
  useDate?: string
  isTemplate?: boolean
  problemIds?: string[]
}): Promise<{ data: ProblemSet | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    const newSet: ProblemSet = {
      id: `pset-${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description || null,
      academy_id: data.academyId,
      teacher_id: data.teacherId,
      class_id: data.classId || null,
      assignment_id: data.assignmentId || null,
      use_date: data.useDate || null,
      is_template: data.isTemplate || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return { data: newSet }
  }

  try {
    const supabase = createServerSupabaseClient()

    // 1. 세트 생성
    const { data: set, error: setError } = await (supabase.from('problem_sets') as any).insert({
      name: data.name,
      type: data.type,
      description: data.description,
      academy_id: data.academyId,
      teacher_id: data.teacherId,
      class_id: data.classId,
      assignment_id: data.assignmentId,
      use_date: data.useDate,
      is_template: data.isTemplate || false,
    }).select().single()

    if (setError) throw setError

    // 2. 문제 연결
    if (data.problemIds && data.problemIds.length > 0) {
      const items = data.problemIds.map((pid, idx) => ({
        problem_set_id: set.id,
        problem_id: pid,
        order_index: idx,
        points: 10,
      }))
      await (supabase.from('problem_set_items') as any).insert(items)
    }

    return { data: set }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : '생성 실패' }
  }
}

/**
 * 문제 세트에 문제 추가
 */
export async function addProblemToSet(problemSetId: string, problemId: string, points = 10): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true }

  try {
    const supabase = createServerSupabaseClient()

    // 현재 최대 order_index 조회
    const { data: existing } = await (supabase.from('problem_set_items') as any)
      .select('order_index')
      .eq('problem_set_id', problemSetId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

    const { error } = await (supabase.from('problem_set_items') as any).insert({
      problem_set_id: problemSetId,
      problem_id: problemId,
      order_index: nextOrder,
      points,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '추가 실패' }
  }
}

/**
 * 문제 세트에서 문제 제거
 */
export async function removeProblemFromSet(problemSetId: string, problemId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await (supabase.from('problem_set_items') as any)
      .delete()
      .eq('problem_set_id', problemSetId)
      .eq('problem_id', problemId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '제거 실패' }
  }
}

/**
 * 문제 세트 삭제
 */
export async function deleteProblemSet(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await (supabase.from('problem_sets') as any).delete().eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '삭제 실패' }
  }
}

/**
 * 문제 세트 복제 (템플릿에서 새 세트 생성)
 */
export async function cloneProblemSet(sourceId: string, newData: {
  name: string
  teacherId: string
  classId?: string
  useDate?: string
}): Promise<{ data: ProblemSet | null; error?: string }> {
  const { data: source, error: sourceError } = await getProblemSet(sourceId)
  if (sourceError || !source) return { data: null, error: sourceError || '원본 세트 없음' }

  const problemIds = source.items?.map(item => item.problem_id) || []

  return createProblemSet({
    name: newData.name,
    type: source.type,
    description: source.description || undefined,
    academyId: source.academy_id,
    teacherId: newData.teacherId,
    classId: newData.classId,
    useDate: newData.useDate,
    isTemplate: false,
    problemIds,
  })
}
