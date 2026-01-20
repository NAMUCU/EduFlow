/**
 * 문제 목록 조회 및 저장 API
 *
 * GET: 문제 목록 조회 (필터, 페이지네이션, 정렬 지원)
 * POST: 새 문제 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type {
  ProblemStore,
  SavedProblem,
  ProblemFilter,
  CreateProblemRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/problem'

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'saved-problems.json')

/**
 * 데이터 파일 읽기
 */
async function readProblemsData(): Promise<ProblemStore> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as ProblemStore
  } catch (error) {
    // 파일이 없으면 빈 데이터 반환
    return {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      problems: [],
    }
  }
}

/**
 * 데이터 파일 쓰기
 */
async function writeProblemsData(store: ProblemStore): Promise<void> {
  store.lastModified = new Date().toISOString()
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8')
}

/**
 * 필터 적용
 */
function applyFilters(problems: SavedProblem[], filter: ProblemFilter): SavedProblem[] {
  return problems.filter((problem) => {
    // 과목 필터
    if (filter.subject && problem.subject !== filter.subject) {
      return false
    }

    // 학년 필터
    if (filter.grade && problem.grade !== filter.grade) {
      return false
    }

    // 단원 필터
    if (filter.unit && problem.unit !== filter.unit) {
      return false
    }

    // 난이도 필터
    if (filter.difficulty && problem.difficulty !== filter.difficulty) {
      return false
    }

    // 문제 유형 필터
    if (filter.type && problem.type !== filter.type) {
      return false
    }

    // AI 생성 여부 필터
    if (filter.aiGenerated !== undefined && problem.ai_generated !== filter.aiGenerated) {
      return false
    }

    // 태그 필터 (하나 이상 일치)
    if (filter.tags && filter.tags.length > 0) {
      const problemTags = problem.tags || []
      const hasMatchingTag = filter.tags.some((tag) => problemTags.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    // 검색어 필터 (문제 내용, 정답, 해설에서 검색)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const matchesQuestion = problem.question.toLowerCase().includes(searchLower)
      const matchesAnswer = problem.answer.toLowerCase().includes(searchLower)
      const matchesSolution = problem.solution?.toLowerCase().includes(searchLower) || false
      if (!matchesQuestion && !matchesAnswer && !matchesSolution) {
        return false
      }
    }

    // 생성일 필터
    if (filter.createdAfter) {
      if (new Date(problem.created_at) < new Date(filter.createdAfter)) {
        return false
      }
    }

    if (filter.createdBefore) {
      if (new Date(problem.created_at) > new Date(filter.createdBefore)) {
        return false
      }
    }

    return true
  })
}

/**
 * 정렬 적용
 */
function applySort(
  problems: SavedProblem[],
  field: string = 'created_at',
  direction: 'asc' | 'desc' = 'desc'
): SavedProblem[] {
  return [...problems].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    switch (field) {
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case 'updated_at':
        aValue = new Date(a.updated_at).getTime()
        bValue = new Date(b.updated_at).getTime()
        break
      case 'subject':
        aValue = a.subject
        bValue = b.subject
        break
      case 'grade':
        aValue = a.grade
        bValue = b.grade
        break
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
        aValue = difficultyOrder[a.difficulty]
        bValue = difficultyOrder[b.difficulty]
        break
      default:
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
    }

    if (direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
}

/**
 * GET: 문제 목록 조회
 *
 * Query Parameters:
 * - subject: 과목 필터
 * - grade: 학년 필터
 * - unit: 단원 필터
 * - difficulty: 난이도 필터 (easy, medium, hard)
 * - type: 문제 유형 필터
 * - aiGenerated: AI 생성 여부 (true/false)
 * - tags: 태그 (쉼표로 구분)
 * - search: 검색어
 * - page: 페이지 번호 (기본: 1)
 * - limit: 페이지당 항목 수 (기본: 10)
 * - sortField: 정렬 필드
 * - sortDirection: 정렬 방향 (asc/desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 필터 파라미터 파싱
    const filter: ProblemFilter = {}

    if (searchParams.get('subject')) {
      filter.subject = searchParams.get('subject')!
    }
    if (searchParams.get('grade')) {
      filter.grade = searchParams.get('grade')!
    }
    if (searchParams.get('unit')) {
      filter.unit = searchParams.get('unit')!
    }
    if (searchParams.get('difficulty')) {
      filter.difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard'
    }
    if (searchParams.get('type')) {
      filter.type = searchParams.get('type') as 'multiple_choice' | 'short_answer' | 'true_false' | 'essay'
    }
    if (searchParams.get('aiGenerated')) {
      filter.aiGenerated = searchParams.get('aiGenerated') === 'true'
    }
    if (searchParams.get('tags')) {
      filter.tags = searchParams.get('tags')!.split(',').map((t) => t.trim())
    }
    if (searchParams.get('search')) {
      filter.search = searchParams.get('search')!
    }
    if (searchParams.get('createdAfter')) {
      filter.createdAfter = searchParams.get('createdAfter')!
    }
    if (searchParams.get('createdBefore')) {
      filter.createdBefore = searchParams.get('createdBefore')!
    }

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // 정렬 파라미터
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'

    // 데이터 읽기
    const store = await readProblemsData()

    // 필터 적용
    let filteredProblems = applyFilters(store.problems, filter)

    // 정렬 적용
    filteredProblems = applySort(filteredProblems, sortField, sortDirection)

    // 전체 개수
    const total = filteredProblems.length
    const totalPages = Math.ceil(total / limit)

    // 페이지네이션 적용
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProblems = filteredProblems.slice(startIndex, endIndex)

    // 응답 생성
    const response: PaginatedResponse<SavedProblem> = {
      data: paginatedProblems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<SavedProblem>>>({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('문제 목록 조회 오류:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: '문제 목록을 불러오는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

/**
 * POST: 새 문제 저장
 *
 * Request Body: CreateProblemRequest
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProblemRequest = await request.json()

    // 필수 필드 검증
    if (!body.subject || !body.grade || !body.question || !body.answer || !body.difficulty || !body.type) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
          details: 'subject, grade, question, answer, difficulty, type은 필수입니다.',
        },
        { status: 400 }
      )
    }

    // 객관식인데 보기가 없는 경우
    if (body.type === 'multiple_choice' && (!body.options || body.options.length < 2)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: '객관식 문제는 보기가 필수입니다.',
          details: '최소 2개 이상의 보기를 제공해주세요.',
        },
        { status: 400 }
      )
    }

    // 데이터 읽기
    const store = await readProblemsData()

    // 새 문제 생성
    const now = new Date().toISOString()
    const newProblem: SavedProblem = {
      id: `saved-${uuidv4()}`,
      subject: body.subject,
      grade: body.grade,
      unit: body.unit || null,
      question: body.question,
      answer: body.answer,
      solution: body.solution || null,
      difficulty: body.difficulty,
      type: body.type,
      options: body.options || null,
      image_url: body.image_url || null,
      tags: body.tags || null,
      academy_id: null, // TODO: 세션에서 학원 ID 가져오기
      created_by: null, // TODO: 세션에서 사용자 ID 가져오기
      is_public: body.is_public ?? false,
      ai_generated: body.ai_generated ?? false,
      created_at: now,
      updated_at: now,
      saved_at: now,
      last_used_at: undefined,
      use_count: 0,
    }

    // 문제 추가
    store.problems.unshift(newProblem)

    // 저장
    await writeProblemsData(store)

    return NextResponse.json<ApiResponse<SavedProblem>>(
      {
        success: true,
        data: newProblem,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('문제 저장 오류:', error)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: '문제를 저장하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
