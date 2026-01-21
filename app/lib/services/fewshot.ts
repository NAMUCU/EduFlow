/**
 * Few-shot 예시 관리 서비스 - Supabase fewshot_examples 테이블 CRUD
 *
 * AI 문제 생성 시 참고할 예시 문제들을 관리합니다.
 * 과목/단원/난이도별로 분류하여 문제 생성 품질을 향상시킵니다.
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { ProblemDifficulty } from '@/types/database'

// ============================================
// 타입 정의
// ============================================

/**
 * Few-shot 예시 타입
 */
export interface FewshotExample {
  id: string
  subject: string                   // 과목 (수학, 영어, 과학 등)
  grade: string                     // 학년 (중1, 중2, 고1 등)
  unit: string                      // 단원명
  difficulty: ProblemDifficulty     // 난이도
  question: string                  // 문제 내용 (LaTeX 지원)
  answer: string                    // 정답
  solution: string | null           // 풀이 과정
  tags: string[]                    // 태그 목록
  usage_count: number               // 사용 횟수
  is_active: boolean                // 활성화 여부
  academy_id: string | null         // 학원 ID (null = 공용)
  created_by: string | null         // 생성자 ID
  created_at: string                // 생성 일시
  updated_at: string                // 수정 일시
}

/**
 * Few-shot 예시 삽입용 타입
 */
export type FewshotExampleInsert = Omit<FewshotExample, 'id' | 'usage_count' | 'created_at' | 'updated_at'> & {
  id?: string
  usage_count?: number
  created_at?: string
  updated_at?: string
}

/**
 * Few-shot 예시 수정용 타입
 */
export type FewshotExampleUpdate = Partial<FewshotExampleInsert>

/**
 * 필터 옵션
 */
export interface FewshotFilter {
  subject?: string
  grade?: string
  unit?: string
  difficulty?: ProblemDifficulty
  search?: string
  tags?: string[]
  isActive?: boolean
  academyId?: string
  limit?: number
  offset?: number
}

// ============================================
// Mock 데이터
// ============================================

const mockFewshotExamples: FewshotExample[] = [
  {
    id: 'fs-001',
    subject: '수학',
    grade: '중2',
    unit: '일차함수',
    difficulty: 'easy',
    question: '일차함수 $y = 3x - 2$의 기울기와 $y$절편을 각각 구하시오.',
    answer: '기울기: 3, y절편: -2',
    solution: '일차함수 $y = ax + b$에서 $a$는 기울기, $b$는 $y$절편이다. 따라서 기울기는 3, $y$절편은 -2이다.',
    tags: ['기울기', 'y절편', '기본'],
    usage_count: 45,
    is_active: true,
    academy_id: null,
    created_by: null,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z'
  },
  {
    id: 'fs-002',
    subject: '수학',
    grade: '중2',
    unit: '일차함수',
    difficulty: 'medium',
    question: '두 점 $A(1, 4)$, $B(3, 10)$을 지나는 직선의 방정식을 구하시오.',
    answer: '$y = 3x + 1$',
    solution: '기울기 $= \\frac{10-4}{3-1} = \\frac{6}{2} = 3$\n점 $(1, 4)$를 지나므로 $4 = 3 \\times 1 + b$, $b = 1$\n따라서 $y = 3x + 1$',
    tags: ['기울기', '직선의 방정식', '두 점'],
    usage_count: 32,
    is_active: true,
    academy_id: null,
    created_by: null,
    created_at: '2026-01-14T10:00:00Z',
    updated_at: '2026-01-14T10:00:00Z'
  },
  {
    id: 'fs-003',
    subject: '수학',
    grade: '중3',
    unit: '이차방정식',
    difficulty: 'hard',
    question: '이차방정식 $x^2 - 5x + 6 = 0$의 두 근을 $\\alpha$, $\\beta$라 할 때, $\\alpha^2 + \\beta^2$의 값을 구하시오.',
    answer: '13',
    solution: '근과 계수의 관계에 의해 $\\alpha + \\beta = 5$, $\\alpha\\beta = 6$\n$\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 25 - 12 = 13$',
    tags: ['근과 계수의 관계', '이차방정식', '심화'],
    usage_count: 28,
    is_active: true,
    academy_id: null,
    created_by: null,
    created_at: '2026-01-13T11:00:00Z',
    updated_at: '2026-01-13T11:00:00Z'
  },
  {
    id: 'fs-004',
    subject: '수학',
    grade: '고1',
    unit: '다항식',
    difficulty: 'medium',
    question: '다항식 $P(x) = x^3 - 3x^2 + 2x + 1$을 $x - 2$로 나눈 나머지를 구하시오.',
    answer: '1',
    solution: '나머지 정리에 의해 $P(2) = 8 - 12 + 4 + 1 = 1$',
    tags: ['나머지 정리', '다항식'],
    usage_count: 19,
    is_active: true,
    academy_id: null,
    created_by: null,
    created_at: '2026-01-12T14:00:00Z',
    updated_at: '2026-01-12T14:00:00Z'
  },
  {
    id: 'fs-005',
    subject: '영어',
    grade: '중2',
    unit: '현재완료',
    difficulty: 'easy',
    question: '다음 문장의 빈칸에 알맞은 말을 쓰시오.\nI _____ (live) in Seoul for 10 years.',
    answer: 'have lived',
    solution: '현재완료 시제는 "have/has + 과거분사" 형태입니다. 주어가 I이므로 have를 사용하고, live의 과거분사는 lived입니다.',
    tags: ['현재완료', '시제', '기본'],
    usage_count: 22,
    is_active: true,
    academy_id: null,
    created_by: null,
    created_at: '2026-01-11T09:00:00Z',
    updated_at: '2026-01-11T09:00:00Z'
  }
]

// Mock 데이터 저장소 (메모리)
let mockStorage = [...mockFewshotExamples]

// ============================================
// 서비스 함수
// ============================================

/**
 * Few-shot 예시 목록 조회
 */
export async function getFewshotExamples(filter: FewshotFilter = {}) {
  if (!isSupabaseConfigured()) {
    // Mock 모드
    let filtered = [...mockStorage]

    if (filter.subject) {
      filtered = filtered.filter(x => x.subject === filter.subject)
    }
    if (filter.grade) {
      filtered = filtered.filter(x => x.grade === filter.grade)
    }
    if (filter.unit) {
      filtered = filtered.filter(x => x.unit === filter.unit)
    }
    if (filter.difficulty) {
      filtered = filtered.filter(x => x.difficulty === filter.difficulty)
    }
    if (filter.isActive !== undefined) {
      filtered = filtered.filter(x => x.is_active === filter.isActive)
    }
    if (filter.search) {
      const query = filter.search.toLowerCase()
      filtered = filtered.filter(x =>
        x.question.toLowerCase().includes(query) ||
        x.tags.some(t => t.toLowerCase().includes(query))
      )
    }
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(x =>
        filter.tags!.some(tag => x.tags.includes(tag))
      )
    }

    const total = filtered.length
    const offset = filter.offset || 0
    const limit = filter.limit || 50

    return {
      data: filtered.slice(offset, offset + limit),
      total,
      error: null
    }
  }

  // Supabase 모드
  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('fewshot_examples')
    .select('*', { count: 'exact' })

  if (filter.subject) {
    query = query.eq('subject', filter.subject)
  }
  if (filter.grade) {
    query = query.eq('grade', filter.grade)
  }
  if (filter.unit) {
    query = query.eq('unit', filter.unit)
  }
  if (filter.difficulty) {
    query = query.eq('difficulty', filter.difficulty)
  }
  if (filter.isActive !== undefined) {
    query = query.eq('is_active', filter.isActive)
  }
  if (filter.search) {
    query = query.or(`question.ilike.%${filter.search}%`)
  }
  if (filter.academyId) {
    query = query.or(`academy_id.is.null,academy_id.eq.${filter.academyId}`)
  }

  const offset = filter.offset || 0
  const limit = filter.limit || 50

  const { data, count, error } = await query
    .range(offset, offset + limit - 1)
    .order('usage_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: [], total: 0, error: error.message }
  }

  return { data: data || [], total: count || 0, error: null }
}

/**
 * 특정 Few-shot 예시 조회
 */
export async function getFewshotExample(id: string) {
  if (!isSupabaseConfigured()) {
    const example = mockStorage.find(x => x.id === id)
    return { data: example || null, error: example ? null : '예시를 찾을 수 없습니다.' }
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('fewshot_examples')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error: error?.message || null }
}

/**
 * Few-shot 예시 저장 (생성/수정)
 */
export async function saveFewshotExample(example: FewshotExampleInsert, id?: string) {
  if (!isSupabaseConfigured()) {
    // Mock 모드
    const now = new Date().toISOString()

    if (id) {
      // 수정
      const index = mockStorage.findIndex(x => x.id === id)
      if (index === -1) {
        return { data: null, error: '예시를 찾을 수 없습니다.' }
      }

      const updated: FewshotExample = {
        ...mockStorage[index],
        ...example,
        updated_at: now
      }
      mockStorage[index] = updated
      return { data: updated, error: null }
    } else {
      // 생성
      const newExample: FewshotExample = {
        id: `fs-${Date.now()}`,
        subject: example.subject,
        grade: example.grade,
        unit: example.unit,
        difficulty: example.difficulty,
        question: example.question,
        answer: example.answer,
        solution: example.solution || null,
        tags: example.tags || [],
        usage_count: 0,
        is_active: example.is_active ?? true,
        academy_id: example.academy_id || null,
        created_by: example.created_by || null,
        created_at: now,
        updated_at: now
      }
      mockStorage.unshift(newExample)
      return { data: newExample, error: null }
    }
  }

  // Supabase 모드
  const supabase = createServerSupabaseClient()
  const now = new Date().toISOString()

  if (id) {
    // 수정
    const { data, error } = await (supabase
      .from('fewshot_examples') as any)
      .update({ ...example, updated_at: now })
      .eq('id', id)
      .select()
      .single()

    return { data, error: error?.message || null }
  } else {
    // 생성
    const { data, error } = await (supabase
      .from('fewshot_examples') as any)
      .insert({
        ...example,
        usage_count: 0,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    return { data, error: error?.message || null }
  }
}

/**
 * Few-shot 예시 삭제
 */
export async function deleteFewshotExample(id: string) {
  if (!isSupabaseConfigured()) {
    const index = mockStorage.findIndex(x => x.id === id)
    if (index === -1) {
      return { success: false, error: '예시를 찾을 수 없습니다.' }
    }
    mockStorage.splice(index, 1)
    return { success: true, error: null }
  }

  const supabase = createServerSupabaseClient()
  const { error } = await (supabase
    .from('fewshot_examples') as any)
    .delete()
    .eq('id', id)

  return { success: !error, error: error?.message || null }
}

/**
 * 여러 Few-shot 예시 삭제
 */
export async function deleteFewshotExamples(ids: string[]) {
  if (!isSupabaseConfigured()) {
    mockStorage = mockStorage.filter(x => !ids.includes(x.id))
    return { success: true, error: null }
  }

  const supabase = createServerSupabaseClient()
  const { error } = await (supabase
    .from('fewshot_examples') as any)
    .delete()
    .in('id', ids)

  return { success: !error, error: error?.message || null }
}

/**
 * Few-shot 예시 사용 횟수 증가
 * AI 문제 생성 시 예시가 사용될 때마다 호출
 */
export async function incrementUsageCount(id: string) {
  if (!isSupabaseConfigured()) {
    const example = mockStorage.find(x => x.id === id)
    if (example) {
      example.usage_count += 1
    }
    return { success: true, error: null }
  }

  const supabase = createServerSupabaseClient()
  // RPC 함수 호출 - 타입은 실제 Supabase 스키마에서 생성
  const { error } = await (supabase as any).rpc('increment_fewshot_usage', { example_id: id })

  return { success: !error, error: error?.message || null }
}

/**
 * AI 문제 생성용 Few-shot 예시 조회
 * 과목/단원/난이도에 맞는 활성화된 예시만 반환
 */
export async function getFewshotExamplesForGeneration(
  subject: string,
  unit?: string,
  difficulty?: ProblemDifficulty,
  limit: number = 3
): Promise<FewshotExample[]> {
  const { data } = await getFewshotExamples({
    subject,
    unit,
    difficulty,
    isActive: true,
    limit
  })

  return data
}

/**
 * 단원 목록 조회 (필터용)
 */
export async function getUnitList(subject?: string, grade?: string) {
  if (!isSupabaseConfigured()) {
    let filtered = mockStorage
    if (subject) {
      filtered = filtered.filter(x => x.subject === subject)
    }
    if (grade) {
      filtered = filtered.filter(x => x.grade === grade)
    }
    const units = [...new Set(filtered.map(x => x.unit))]
    return { data: units, error: null }
  }

  const supabase = createServerSupabaseClient()
  let query = (supabase as any)
    .from('fewshot_examples')
    .select('unit')

  if (subject) {
    query = query.eq('subject', subject)
  }
  if (grade) {
    query = query.eq('grade', grade)
  }

  const { data, error } = await query as { data: { unit: string }[] | null, error: any }

  if (error) {
    return { data: [], error: error.message }
  }

  const units = [...new Set(data?.map(x => x.unit) || [])]
  return { data: units, error: null }
}

/**
 * 통계 조회
 */
export async function getFewshotStats(academyId?: string) {
  if (!isSupabaseConfigured()) {
    const filtered = academyId
      ? mockStorage.filter(x => x.academy_id === academyId || x.academy_id === null)
      : mockStorage

    return {
      data: {
        total: filtered.length,
        byDifficulty: {
          easy: filtered.filter(x => x.difficulty === 'easy').length,
          medium: filtered.filter(x => x.difficulty === 'medium').length,
          hard: filtered.filter(x => x.difficulty === 'hard').length
        },
        bySubject: filtered.reduce((acc, x) => {
          acc[x.subject] = (acc[x.subject] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        totalUsage: filtered.reduce((sum, x) => sum + x.usage_count, 0)
      },
      error: null
    }
  }

  // Supabase 모드에서는 집계 쿼리 사용
  const supabase = createServerSupabaseClient()
  const { data: rawData, error } = await (supabase as any)
    .from('fewshot_examples')
    .select('difficulty, subject, usage_count')

  if (error) {
    return { data: null, error: error.message }
  }

  const data = rawData as { difficulty: string, subject: string, usage_count: number }[] | null

  const stats = {
    total: data?.length || 0,
    byDifficulty: {
      easy: data?.filter(x => x.difficulty === 'easy').length || 0,
      medium: data?.filter(x => x.difficulty === 'medium').length || 0,
      hard: data?.filter(x => x.difficulty === 'hard').length || 0
    },
    bySubject: data?.reduce((acc, x) => {
      acc[x.subject] = (acc[x.subject] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {},
    totalUsage: data?.reduce((sum, x) => sum + (x.usage_count || 0), 0) || 0
  }

  return { data: stats, error: null }
}
