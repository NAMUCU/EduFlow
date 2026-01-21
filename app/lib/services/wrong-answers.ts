/**
 * 오답노트 서비스 - 학생의 오답 관리 및 유사 문제 생성
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { Problem, ProblemOption, ProblemDifficulty, ProblemType } from '@/types/database'

// ============================================
// 타입 정의
// ============================================

/** 오답 문제 */
export interface WrongAnswer {
  id: string
  student_id: string
  problem_id: string
  assignment_id: string | null
  subject: string
  chapter: string
  question: string
  type: ProblemType
  options?: ProblemOption[] | null
  my_answer: string | number
  correct_answer: string | number
  explanation: string | null
  related_concept: string | null
  difficulty: ProblemDifficulty
  wrong_date: string
  reviewed: boolean
  resolved: boolean
  retry_count: number
  last_retry_date: string | null
  created_at: string
  updated_at: string
}

/** 오답 필터 */
export interface WrongAnswerFilter {
  studentId: string
  subject?: string
  chapter?: string
  difficulty?: ProblemDifficulty
  reviewed?: boolean
  resolved?: boolean
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'wrong_date' | 'subject' | 'difficulty'
  sortDirection?: 'asc' | 'desc'
}

/** 복습 완료 결과 */
export interface ResolveResult {
  success: boolean
  error?: string
}

/** AI 생성 유사 문제 */
export interface SimilarProblem extends Omit<Problem, 'id' | 'academy_id' | 'created_by' | 'is_public' | 'created_at' | 'updated_at'> {
  original_problem_id: string
  similarity_reason: string
}

/** 오답 통계 */
export interface WrongAnswerStats {
  total: number
  bySubject: Record<string, number>
  byDifficulty: Record<ProblemDifficulty, number>
  reviewed: number
  notReviewed: number
  resolved: number
}

// ============================================
// Mock 데이터
// ============================================

const mockWrongAnswers: WrongAnswer[] = [
  {
    id: 'wrong-001',
    student_id: 'student-001',
    problem_id: 'problem-001',
    assignment_id: 'assignment-001',
    subject: '수학',
    chapter: '이차함수',
    question: '이차함수 y = 2x² - 4x + 3 의 꼭짓점의 좌표를 구하시오.',
    type: 'multiple_choice',
    options: [
      { id: '1', text: '(1, 1)' },
      { id: '2', text: '(1, 2)' },
      { id: '3', text: '(2, 1)' },
      { id: '4', text: '(2, 3)' },
    ],
    my_answer: 3,
    correct_answer: 1,
    explanation: '주어진 이차함수를 완전제곱식으로 변형하면 y = 2(x-1)² + 1 이 됩니다. 따라서 꼭짓점의 좌표는 (1, 1)입니다.',
    related_concept: '이차함수의 표준형 y = a(x-p)² + q 에서 꼭짓점은 (p, q)입니다.',
    difficulty: 'medium',
    wrong_date: '2024-01-18',
    reviewed: false,
    resolved: false,
    retry_count: 0,
    last_retry_date: null,
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z',
  },
  {
    id: 'wrong-002',
    student_id: 'student-001',
    problem_id: 'problem-002',
    assignment_id: 'assignment-001',
    subject: '수학',
    chapter: '인수분해',
    question: 'x² - 5x + 6 을 인수분해 하시오.',
    type: 'short_answer',
    options: null,
    my_answer: '(x-2)(x-4)',
    correct_answer: '(x-2)(x-3)',
    explanation: '상수항 6을 두 수의 곱으로 나타내면 1×6, 2×3이 있고, 이 중 합이 -5가 되는 조합은 (-2)+(-3)=-5 입니다.',
    related_concept: 'x² + (a+b)x + ab = (x+a)(x+b) 공식을 활용합니다.',
    difficulty: 'easy',
    wrong_date: '2024-01-15',
    reviewed: true,
    resolved: false,
    retry_count: 1,
    last_retry_date: '2024-01-17',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'wrong-003',
    student_id: 'student-001',
    problem_id: 'problem-003',
    assignment_id: 'assignment-002',
    subject: '영어',
    chapter: '관계대명사',
    question: '다음 빈칸에 알맞은 관계대명사를 넣으시오: The man _____ I met yesterday is my teacher.',
    type: 'multiple_choice',
    options: [
      { id: '1', text: 'who' },
      { id: '2', text: 'whom' },
      { id: '3', text: 'which' },
      { id: '4', text: 'whose' },
    ],
    my_answer: 1,
    correct_answer: 2,
    explanation: '관계대명사가 목적어 역할을 할 때는 whom을 사용합니다. "I met the man"에서 the man은 목적어이므로 whom이 정답입니다.',
    related_concept: '관계대명사 who는 주격, whom은 목적격으로 사용됩니다.',
    difficulty: 'medium',
    wrong_date: '2024-01-17',
    reviewed: false,
    resolved: false,
    retry_count: 0,
    last_retry_date: null,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'wrong-004',
    student_id: 'student-001',
    problem_id: 'problem-004',
    assignment_id: 'assignment-003',
    subject: '국어',
    chapter: '비문학 독해',
    question: '다음 글의 중심 내용으로 가장 적절한 것은?',
    type: 'multiple_choice',
    options: [
      { id: '1', text: '환경 보호의 중요성' },
      { id: '2', text: '경제 발전의 필요성' },
      { id: '3', text: '기술 혁신의 가치' },
      { id: '4', text: '지속 가능한 발전' },
    ],
    my_answer: 1,
    correct_answer: 4,
    explanation: '글에서는 환경 보호와 경제 발전이 조화를 이루는 "지속 가능한 발전"의 개념을 설명하고 있습니다.',
    related_concept: '비문학 독해에서 중심 내용 파악하기',
    difficulty: 'hard',
    wrong_date: '2024-01-14',
    reviewed: false,
    resolved: false,
    retry_count: 0,
    last_retry_date: null,
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'wrong-005',
    student_id: 'student-001',
    problem_id: 'problem-005',
    assignment_id: null,
    subject: '수학',
    chapter: '삼각함수',
    question: 'sin 60° × cos 30° 의 값을 구하시오.',
    type: 'short_answer',
    options: null,
    my_answer: '1/2',
    correct_answer: '3/4',
    explanation: 'sin 60° = √3/2, cos 30° = √3/2 이므로, (√3/2) × (√3/2) = 3/4 입니다.',
    related_concept: '특수각의 삼각비 값: sin 60° = √3/2, cos 30° = √3/2',
    difficulty: 'medium',
    wrong_date: '2024-01-20',
    reviewed: false,
    resolved: true,
    retry_count: 2,
    last_retry_date: '2024-01-22',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z',
  },
]

// ============================================
// 서비스 함수
// ============================================

/**
 * 오답 목록 조회
 */
export async function getWrongAnswers(filter: WrongAnswerFilter): Promise<{
  data: WrongAnswer[]
  total: number
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    // Mock 데이터 필터링
    let filtered = mockWrongAnswers.filter(w => w.student_id === filter.studentId)

    if (filter.subject) {
      filtered = filtered.filter(w => w.subject === filter.subject)
    }
    if (filter.chapter) {
      filtered = filtered.filter(w => w.chapter === filter.chapter)
    }
    if (filter.difficulty) {
      filtered = filtered.filter(w => w.difficulty === filter.difficulty)
    }
    if (filter.reviewed !== undefined) {
      filtered = filtered.filter(w => w.reviewed === filter.reviewed)
    }
    if (filter.resolved !== undefined) {
      filtered = filtered.filter(w => w.resolved === filter.resolved)
    }
    if (filter.dateFrom) {
      filtered = filtered.filter(w => w.wrong_date >= filter.dateFrom!)
    }
    if (filter.dateTo) {
      filtered = filtered.filter(w => w.wrong_date <= filter.dateTo!)
    }
    if (filter.search) {
      const s = filter.search.toLowerCase()
      filtered = filtered.filter(w =>
        w.question.toLowerCase().includes(s) ||
        w.chapter.toLowerCase().includes(s) ||
        w.subject.toLowerCase().includes(s)
      )
    }

    // 정렬
    const sortBy = filter.sortBy || 'wrong_date'
    const sortDir = filter.sortDirection || 'desc'
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortBy] as string
      let bVal: string | number = b[sortBy] as string

      if (sortBy === 'difficulty') {
        const diffOrder = { easy: 1, medium: 2, hard: 3 }
        aVal = diffOrder[a.difficulty]
        bVal = diffOrder[b.difficulty]
      }

      if (sortDir === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    })

    const total = filtered.length
    const offset = filter.offset || 0
    const limit = filter.limit || 20
    const data = filtered.slice(offset, offset + limit)

    return { data, total }
  }

  const supabase = createServerSupabaseClient()
  let query = supabase.from('wrong_answers').select('*', { count: 'exact' })

  query = query.eq('student_id', filter.studentId)

  if (filter.subject) query = query.eq('subject', filter.subject)
  if (filter.chapter) query = query.eq('chapter', filter.chapter)
  if (filter.difficulty) query = query.eq('difficulty', filter.difficulty)
  if (filter.reviewed !== undefined) query = query.eq('reviewed', filter.reviewed)
  if (filter.resolved !== undefined) query = query.eq('resolved', filter.resolved)
  if (filter.dateFrom) query = query.gte('wrong_date', filter.dateFrom)
  if (filter.dateTo) query = query.lte('wrong_date', filter.dateTo)
  if (filter.search) query = query.ilike('question', `%${filter.search}%`)

  const sortBy = filter.sortBy || 'wrong_date'
  const sortDir = filter.sortDirection === 'asc'
  query = query.order(sortBy, { ascending: sortDir })

  const offset = filter.offset || 0
  const limit = filter.limit || 20
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return { data: [], total: 0, error: error.message }
  }

  return { data: (data || []) as WrongAnswer[], total: count || 0 }
}

/**
 * 오답 단건 조회
 */
export async function getWrongAnswer(id: string): Promise<{
  data: WrongAnswer | null
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    const found = mockWrongAnswers.find(w => w.id === id)
    return { data: found || null }
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('wrong_answers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as WrongAnswer }
}

/**
 * 복습 완료 처리
 */
export async function markAsReviewed(wrongAnswerId: string): Promise<ResolveResult> {
  if (!isSupabaseConfigured()) {
    const found = mockWrongAnswers.find(w => w.id === wrongAnswerId)
    if (found) {
      found.reviewed = true
      found.updated_at = new Date().toISOString()
      return { success: true }
    }
    return { success: false, error: '오답을 찾을 수 없습니다.' }
  }

  const supabase = createServerSupabaseClient()
  const { error } = await (supabase as any)
    .from('wrong_answers')
    .update({
      reviewed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wrongAnswerId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * 완전 해결 처리 (다시 풀어서 맞춤)
 */
export async function markAsResolved(wrongAnswerId: string): Promise<ResolveResult> {
  if (!isSupabaseConfigured()) {
    const found = mockWrongAnswers.find(w => w.id === wrongAnswerId)
    if (found) {
      found.resolved = true
      found.reviewed = true
      found.retry_count += 1
      found.last_retry_date = new Date().toISOString().split('T')[0]
      found.updated_at = new Date().toISOString()
      return { success: true }
    }
    return { success: false, error: '오답을 찾을 수 없습니다.' }
  }

  const supabase = createServerSupabaseClient()

  // 먼저 현재 retry_count 조회
  const { data: current } = await (supabase as any)
    .from('wrong_answers')
    .select('retry_count')
    .eq('id', wrongAnswerId)
    .single()

  const { error } = await (supabase as any)
    .from('wrong_answers')
    .update({
      resolved: true,
      reviewed: true,
      retry_count: (current?.retry_count || 0) + 1,
      last_retry_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', wrongAnswerId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * 재시도 횟수 증가
 */
export async function incrementRetryCount(wrongAnswerId: string): Promise<ResolveResult> {
  if (!isSupabaseConfigured()) {
    const found = mockWrongAnswers.find(w => w.id === wrongAnswerId)
    if (found) {
      found.retry_count += 1
      found.last_retry_date = new Date().toISOString().split('T')[0]
      found.updated_at = new Date().toISOString()
      return { success: true }
    }
    return { success: false, error: '오답을 찾을 수 없습니다.' }
  }

  const supabase = createServerSupabaseClient()

  // 먼저 현재 값을 가져온 후 증가
  const { data: current, error: fetchError } = await (supabase as any)
    .from('wrong_answers')
    .select('retry_count')
    .eq('id', wrongAnswerId)
    .single() as { data: { retry_count: number } | null, error: any }

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  const { error } = await (supabase as any)
    .from('wrong_answers')
    .update({
      retry_count: (current?.retry_count || 0) + 1,
      last_retry_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', wrongAnswerId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * AI 유사 문제 생성
 */
export async function generateSimilarProblem(problemId: string): Promise<{
  data: SimilarProblem | null
  error?: string
}> {
  // 원본 문제 조회
  const wrongAnswer = mockWrongAnswers.find(w => w.problem_id === problemId)

  if (!wrongAnswer) {
    // Mock 유사 문제 생성
    return {
      data: {
        original_problem_id: problemId,
        subject: '수학',
        grade: '중3',
        unit: '이차함수',
        question: '이차함수 y = 3x² - 6x + 5 의 꼭짓점의 좌표를 구하시오.',
        answer: '(1, 2)',
        solution: '주어진 이차함수를 완전제곱식으로 변형하면 y = 3(x-1)² + 2 이 됩니다. 따라서 꼭짓점의 좌표는 (1, 2)입니다.',
        difficulty: 'medium',
        type: 'short_answer',
        options: null,
        image_url: null,
        tags: ['이차함수', '꼭짓점'],
        ai_generated: true,
        similarity_reason: '같은 유형의 이차함수 꼭짓점 문제이며, 계수만 다르게 변형했습니다.',
      },
    }
  }

  // Gemini API를 통한 유사 문제 생성
  const isGeminiConfigured = !!process.env.GEMINI_API_KEY

  if (!isGeminiConfigured) {
    // Mock 유사 문제 생성
    const similarProblems: Record<string, SimilarProblem> = {
      'problem-001': {
        original_problem_id: 'problem-001',
        subject: '수학',
        grade: '중3',
        unit: '이차함수',
        question: '이차함수 y = -x² + 4x - 1 의 꼭짓점의 좌표를 구하시오.',
        answer: '(2, 3)',
        solution: '주어진 이차함수를 완전제곱식으로 변형하면 y = -(x-2)² + 3 이 됩니다. 따라서 꼭짓점의 좌표는 (2, 3)입니다.',
        difficulty: 'medium',
        type: 'multiple_choice',
        options: [
          { id: '1', text: '(2, 3)' },
          { id: '2', text: '(2, -3)' },
          { id: '3', text: '(-2, 3)' },
          { id: '4', text: '(-2, -1)' },
        ],
        image_url: null,
        tags: ['이차함수', '꼭짓점', '완전제곱식'],
        ai_generated: true,
        similarity_reason: '같은 유형의 이차함수 꼭짓점 문제이며, 최고차항의 계수가 음수인 경우를 연습할 수 있습니다.',
      },
      'problem-002': {
        original_problem_id: 'problem-002',
        subject: '수학',
        grade: '중3',
        unit: '인수분해',
        question: 'x² - 7x + 12 를 인수분해 하시오.',
        answer: '(x-3)(x-4)',
        solution: '상수항 12를 두 수의 곱으로 나타내면 1×12, 2×6, 3×4가 있고, 이 중 합이 -7이 되는 조합은 (-3)+(-4)=-7 입니다.',
        difficulty: 'easy',
        type: 'short_answer',
        options: null,
        image_url: null,
        tags: ['인수분해', '이차식'],
        ai_generated: true,
        similarity_reason: '같은 유형의 이차식 인수분해 문제입니다. 숫자만 변경하여 연습할 수 있습니다.',
      },
      'problem-003': {
        original_problem_id: 'problem-003',
        subject: '영어',
        grade: '중2',
        unit: '관계대명사',
        question: '다음 빈칸에 알맞은 관계대명사를 넣으시오: The book _____ I bought yesterday is very interesting.',
        answer: 'which/that',
        solution: '관계대명사가 목적어 역할을 하고, 선행사가 사물(book)이므로 which 또는 that이 정답입니다.',
        difficulty: 'medium',
        type: 'multiple_choice',
        options: [
          { id: '1', text: 'who' },
          { id: '2', text: 'whom' },
          { id: '3', text: 'which' },
          { id: '4', text: 'whose' },
        ],
        image_url: null,
        tags: ['관계대명사', '목적격'],
        ai_generated: true,
        similarity_reason: '같은 유형의 관계대명사 문제이며, 선행사가 사물인 경우를 연습할 수 있습니다.',
      },
    }

    const similar = similarProblems[problemId]
    if (similar) {
      return { data: similar }
    }

    // 기본 유사 문제
    return {
      data: {
        original_problem_id: problemId,
        subject: wrongAnswer.subject,
        grade: '중3',
        unit: wrongAnswer.chapter,
        question: `[유사 문제] ${wrongAnswer.question.replace(/\d+/g, (match) => String(parseInt(match) + 1))}`,
        answer: wrongAnswer.correct_answer.toString(),
        solution: wrongAnswer.explanation || '풀이를 참고하세요.',
        difficulty: wrongAnswer.difficulty,
        type: wrongAnswer.type,
        options: wrongAnswer.options || null,
        image_url: null,
        tags: [wrongAnswer.chapter],
        ai_generated: true,
        similarity_reason: '원본 문제와 같은 개념을 다루는 유사 문제입니다.',
      },
    }
  }

  // 실제 Gemini API 호출
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `다음 문제와 유사한 새로운 문제를 만들어주세요. 같은 개념을 다루되 숫자나 상황만 변경해주세요.

원본 문제:
- 과목: ${wrongAnswer.subject}
- 단원: ${wrongAnswer.chapter}
- 문제: ${wrongAnswer.question}
- 정답: ${wrongAnswer.correct_answer}
- 해설: ${wrongAnswer.explanation}

JSON 형식으로 응답해주세요:
{
  "question": "새로운 문제",
  "answer": "정답",
  "solution": "풀이",
  "similarity_reason": "유사성 설명"
}`,
            }],
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        data: {
          original_problem_id: problemId,
          subject: wrongAnswer.subject,
          grade: '중3',
          unit: wrongAnswer.chapter,
          question: parsed.question,
          answer: parsed.answer,
          solution: parsed.solution,
          difficulty: wrongAnswer.difficulty,
          type: wrongAnswer.type,
          options: wrongAnswer.type === 'multiple_choice' ? (wrongAnswer.options || null) : null,
          image_url: null,
          tags: [wrongAnswer.chapter],
          ai_generated: true,
          similarity_reason: parsed.similarity_reason,
        },
      }
    }

    throw new Error('응답 파싱 실패')
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : '유사 문제 생성에 실패했습니다.',
    }
  }
}

/**
 * 오답 통계 조회
 */
export async function getWrongAnswerStats(studentId: string): Promise<{
  data: WrongAnswerStats
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    const studentWrongAnswers = mockWrongAnswers.filter(w => w.student_id === studentId)

    const bySubject: Record<string, number> = {}
    const byDifficulty: Record<ProblemDifficulty, number> = { easy: 0, medium: 0, hard: 0 }

    studentWrongAnswers.forEach(w => {
      bySubject[w.subject] = (bySubject[w.subject] || 0) + 1
      byDifficulty[w.difficulty] += 1
    })

    return {
      data: {
        total: studentWrongAnswers.length,
        bySubject,
        byDifficulty,
        reviewed: studentWrongAnswers.filter(w => w.reviewed).length,
        notReviewed: studentWrongAnswers.filter(w => !w.reviewed).length,
        resolved: studentWrongAnswers.filter(w => w.resolved).length,
      },
    }
  }

  const supabase = createServerSupabaseClient()
  const { data: rawData, error } = await (supabase as any)
    .from('wrong_answers')
    .select('subject, difficulty, reviewed, resolved')
    .eq('student_id', studentId)

  if (error) {
    return {
      data: { total: 0, bySubject: {}, byDifficulty: { easy: 0, medium: 0, hard: 0 }, reviewed: 0, notReviewed: 0, resolved: 0 },
      error: error.message,
    }
  }

  type WrongAnswerStat = { subject: string; difficulty: ProblemDifficulty; reviewed: boolean; resolved: boolean }
  const data = rawData as WrongAnswerStat[] | null

  const bySubject: Record<string, number> = {}
  const byDifficulty: Record<ProblemDifficulty, number> = { easy: 0, medium: 0, hard: 0 }

  ;(data || []).forEach((w) => {
    bySubject[w.subject] = (bySubject[w.subject] || 0) + 1
    byDifficulty[w.difficulty] += 1
  })

  return {
    data: {
      total: (data || []).length,
      bySubject,
      byDifficulty,
      reviewed: (data || []).filter((w) => w.reviewed).length,
      notReviewed: (data || []).filter((w) => !w.reviewed).length,
      resolved: (data || []).filter((w) => w.resolved).length,
    },
  }
}

/**
 * 오답 추가 (과제 제출 시 자동 호출)
 */
export async function addWrongAnswer(wrongAnswer: Omit<WrongAnswer, 'id' | 'created_at' | 'updated_at'>): Promise<{
  data: WrongAnswer | null
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    const newWrongAnswer: WrongAnswer = {
      ...wrongAnswer,
      id: `wrong-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockWrongAnswers.push(newWrongAnswer)
    return { data: newWrongAnswer }
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('wrong_answers') as unknown as {
    insert: (data: Omit<WrongAnswer, 'id' | 'created_at' | 'updated_at'>) => {
      select: () => { single: () => Promise<{ data: WrongAnswer | null; error: { message: string } | null }> }
    }
  })
    .insert(wrongAnswer)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data }
}

/**
 * 오답 삭제 (해결된 오답 정리용)
 */
export async function deleteWrongAnswer(id: string): Promise<ResolveResult> {
  if (!isSupabaseConfigured()) {
    const idx = mockWrongAnswers.findIndex(w => w.id === id)
    if (idx !== -1) {
      mockWrongAnswers.splice(idx, 1)
      return { success: true }
    }
    return { success: false, error: '오답을 찾을 수 없습니다.' }
  }

  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('wrong_answers') as unknown as {
    delete: () => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> }
  }).delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * AI 해설 생성
 */
export async function generateAIExplanation(problemId: string): Promise<{
  data: { explanation: string; relatedConcept: string } | null
  error?: string
}> {
  const wrongAnswer = mockWrongAnswers.find(w => w.problem_id === problemId)

  if (!wrongAnswer) {
    return { data: null, error: '문제를 찾을 수 없습니다.' }
  }

  const isGeminiConfigured = !!process.env.GEMINI_API_KEY

  if (!isGeminiConfigured) {
    // Mock 해설 반환
    return {
      data: {
        explanation: wrongAnswer.explanation || '해설이 없습니다.',
        relatedConcept: wrongAnswer.related_concept || '관련 개념이 없습니다.',
      },
    }
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `다음 문제에 대한 상세한 해설과 관련 개념을 설명해주세요.

문제: ${wrongAnswer.question}
정답: ${wrongAnswer.correct_answer}
학생 답안: ${wrongAnswer.my_answer}

JSON 형식으로 응답해주세요:
{
  "explanation": "왜 학생이 틀렸는지, 올바른 풀이 과정을 단계별로 설명",
  "relatedConcept": "이 문제와 관련된 핵심 개념 설명"
}`,
            }],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        data: {
          explanation: parsed.explanation,
          relatedConcept: parsed.relatedConcept,
        },
      }
    }

    throw new Error('응답 파싱 실패')
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'AI 해설 생성에 실패했습니다.',
    }
  }
}
