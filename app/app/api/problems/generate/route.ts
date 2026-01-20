/**
 * AI 문제 생성 API 라우트 (PRD F1. AI 문제 자동 생성)
 *
 * POST /api/problems/generate
 *
 * 입력:
 * - subject: 과목 (필수)
 * - unit: 단원 (필수)
 * - difficulty: 난이도 - easy | medium | hard (필수)
 * - problemType: 문제 유형 - multiple_choice | short_answer | essay (필수)
 * - count: 생성할 문제 수 (필수, 1-20)
 * - schoolGrade: 학교/학년 (선택)
 * - region: 지역 (선택)
 * - additionalRequests: 추가 요청사항 (선택)
 *
 * 출력:
 * - success: 성공 여부
 * - problems: 생성된 문제 목록
 * - error: 에러 메시지 (실패 시)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateProblems,
  generateMockProblems,
} from '@/lib/problem-generator'
import type { GenerateProblemInput } from '@/types/problem'

// 유효한 난이도 값
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
type Difficulty = (typeof VALID_DIFFICULTIES)[number]

// 유효한 문제 유형
const VALID_PROBLEM_TYPES = [
  'multiple_choice',
  'short_answer',
  'essay',
] as const
type ProblemType = (typeof VALID_PROBLEM_TYPES)[number]

/**
 * 요청 본문 검증
 */
function validateRequest(body: unknown): {
  valid: boolean
  error?: string
  data?: GenerateProblemInput
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '요청 본문이 비어있습니다.' }
  }

  const data = body as Record<string, unknown>

  // 필수 필드 검증
  if (!data.subject || typeof data.subject !== 'string') {
    return { valid: false, error: '과목(subject)은 필수 항목입니다.' }
  }

  if (!data.unit || typeof data.unit !== 'string') {
    return { valid: false, error: '단원(unit)은 필수 항목입니다.' }
  }

  if (!data.difficulty || typeof data.difficulty !== 'string') {
    return { valid: false, error: '난이도(difficulty)는 필수 항목입니다.' }
  }

  if (!VALID_DIFFICULTIES.includes(data.difficulty as Difficulty)) {
    return {
      valid: false,
      error: `난이도는 ${VALID_DIFFICULTIES.join(', ')} 중 하나여야 합니다.`,
    }
  }

  if (!data.problemType || typeof data.problemType !== 'string') {
    return { valid: false, error: '문제 유형(problemType)은 필수 항목입니다.' }
  }

  if (!VALID_PROBLEM_TYPES.includes(data.problemType as ProblemType)) {
    return {
      valid: false,
      error: `문제 유형은 ${VALID_PROBLEM_TYPES.join(', ')} 중 하나여야 합니다.`,
    }
  }

  if (data.count === undefined || typeof data.count !== 'number') {
    return { valid: false, error: '문제 수(count)는 필수 항목입니다.' }
  }

  if (data.count < 1 || data.count > 20) {
    return {
      valid: false,
      error: '문제 수는 1개 이상 20개 이하로 설정해주세요.',
    }
  }

  return {
    valid: true,
    data: {
      subject: data.subject as string,
      unit: data.unit as string,
      difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
      problemType: data.problemType as
        | 'multiple_choice'
        | 'short_answer'
        | 'essay',
      count: data.count as number,
      schoolGrade: data.schoolGrade as string | undefined,
      region: data.region as string | undefined,
      additionalRequests: data.additionalRequests as string | undefined,
    },
  }
}

/**
 * POST /api/problems/generate
 * AI를 활용하여 문제 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()

    // 요청 검증
    const validation = validateRequest(body)
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    const input = validation.data

    // API 키 확인 (없으면 Mock 모드)
    const apiKey =
      process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

    let result

    if (!apiKey) {
      // Mock 모드로 테스트 데이터 반환
      console.log('[문제 생성] Mock 모드로 실행 (API 키 미설정)')
      result = generateMockProblems(input)
    } else {
      // 실제 Gemini API 호출
      console.log(
        `[문제 생성] 요청: ${input.subject} - ${input.unit}, 난이도: ${input.difficulty}, 유형: ${input.problemType}, 수량: ${input.count}`
      )
      result = await generateProblems(input)
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      problems: result.problems,
      meta: {
        subject: input.subject,
        unit: input.unit,
        difficulty: input.difficulty,
        problemType: input.problemType,
        count: result.problems?.length || 0,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[문제 생성 API 오류]', error)

    // JSON 파싱 오류
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      )
    }

    // 기타 오류
    const errorMessage =
      error instanceof Error
        ? error.message
        : '문제 생성 중 오류가 발생했습니다.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET /api/problems/generate
 * API 정보 및 사용법 안내
 */
export async function GET() {
  return NextResponse.json({
    name: 'AI 문제 생성 API',
    version: '1.0.0',
    description: 'Gemini 3.0 Pro를 활용한 한국어 문제 자동 생성',
    endpoint: 'POST /api/problems/generate',
    parameters: {
      subject: {
        type: 'string',
        required: true,
        description: '과목 (예: 수학, 영어, 국어)',
      },
      unit: {
        type: 'string',
        required: true,
        description: '단원명 (예: 이차방정식, 삼각함수)',
      },
      difficulty: {
        type: 'string',
        required: true,
        enum: ['easy', 'medium', 'hard'],
        description: '난이도',
      },
      problemType: {
        type: 'string',
        required: true,
        enum: ['multiple_choice', 'short_answer', 'essay'],
        description: '문제 유형',
      },
      count: {
        type: 'number',
        required: true,
        min: 1,
        max: 20,
        description: '생성할 문제 수',
      },
      schoolGrade: {
        type: 'string',
        required: false,
        description: '학교/학년 (예: 중학교 2학년)',
      },
      region: {
        type: 'string',
        required: false,
        description: '지역 (예: 서울)',
      },
      additionalRequests: {
        type: 'string',
        required: false,
        description: '추가 요청사항',
      },
    },
    exampleRequest: {
      subject: '수학',
      unit: '이차방정식',
      difficulty: 'medium',
      problemType: 'multiple_choice',
      count: 5,
      schoolGrade: '중학교 3학년',
    },
  })
}
