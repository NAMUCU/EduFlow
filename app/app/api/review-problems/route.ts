/**
 * AI 문제 검수 API
 *
 * POST /api/review-problems
 * 여러 AI 모델(Claude, Gemini, OpenAI)을 사용하여 문제를 검수합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  reviewProblems,
  calculateReviewStatistics,
} from '@/lib/review'
import {
  AIModel,
  ProblemForReview,
  ReviewRequest,
  ReviewResponse,
} from '@/types/review'

// 지원하는 AI 모델 목록
const SUPPORTED_MODELS: AIModel[] = ['claude', 'gemini', 'openai']

/**
 * 문제 검수 요청 처리
 *
 * 요청 본문:
 * - problems: 검수할 문제 배열
 * - models: 사용할 AI 모델 배열 (claude, gemini, openai)
 * - subject?: 과목 (선택)
 * - grade?: 학년 (선택)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: ReviewRequest = await request.json()
    const { problems, models, subject, grade } = body

    // 입력 유효성 검사
    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '검수할 문제가 없습니다. problems 배열을 제공해주세요.',
        } as ReviewResponse,
        { status: 400 }
      )
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            '검수에 사용할 AI 모델을 선택해주세요. models 배열을 제공해주세요.',
        } as ReviewResponse,
        { status: 400 }
      )
    }

    // 지원하지 않는 모델 확인
    const invalidModels = models.filter((m) => !SUPPORTED_MODELS.includes(m))
    if (invalidModels.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `지원하지 않는 AI 모델입니다: ${invalidModels.join(', ')}. 지원 모델: ${SUPPORTED_MODELS.join(', ')}`,
        } as ReviewResponse,
        { status: 400 }
      )
    }

    // 문제 형식 검증
    const validationErrors: string[] = []
    problems.forEach((problem: ProblemForReview, index: number) => {
      if (!problem.id && problem.id !== 0) {
        validationErrors.push(`문제 ${index + 1}: id가 필요합니다`)
      }
      if (!problem.question) {
        validationErrors.push(`문제 ${index + 1}: question이 필요합니다`)
      }
      if (!problem.answer) {
        validationErrors.push(`문제 ${index + 1}: answer가 필요합니다`)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `문제 형식 오류:\n${validationErrors.join('\n')}`,
        } as ReviewResponse,
        { status: 400 }
      )
    }

    // API 키 확인
    const missingKeys: string[] = []
    if (models.includes('claude') && !process.env.ANTHROPIC_API_KEY) {
      missingKeys.push('ANTHROPIC_API_KEY (Claude)')
    }
    if (models.includes('gemini') && !process.env.GEMINI_API_KEY) {
      missingKeys.push('GEMINI_API_KEY (Gemini)')
    }
    if (models.includes('openai') && !process.env.OPENAI_API_KEY) {
      missingKeys.push('OPENAI_API_KEY (OpenAI)')
    }

    if (missingKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `다음 API 키가 설정되지 않았습니다: ${missingKeys.join(', ')}`,
        } as ReviewResponse,
        { status: 500 }
      )
    }

    // 검수 실행
    console.log(
      `[검수 시작] ${problems.length}개 문제, 모델: ${models.join(', ')}`
    )

    const summaries = await reviewProblems(problems, models, subject, grade)
    const totalTime = Date.now() - startTime

    console.log(`[검수 완료] 소요 시간: ${totalTime}ms`)

    // 통계 계산
    const statistics = calculateReviewStatistics(summaries)

    return NextResponse.json({
      success: true,
      summaries,
      totalTime,
      statistics,
    })
  } catch (error: any) {
    console.error('[검수 API 에러]', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || '문제 검수 중 오류가 발생했습니다',
        summaries: [],
        totalTime: Date.now() - startTime,
      } as ReviewResponse,
      { status: 500 }
    )
  }
}

/**
 * 지원 정보 반환
 */
export async function GET() {
  return NextResponse.json({
    description: 'AI 문제 검수 API',
    supportedModels: SUPPORTED_MODELS,
    usage: {
      method: 'POST',
      body: {
        problems: [
          {
            id: 'number (필수)',
            question: 'string (필수)',
            answer: 'string (필수)',
            solution: 'string (선택)',
            difficulty: 'string (선택)',
            type: 'string (선택)',
            unit: 'string (선택)',
          },
        ],
        models: '["claude", "gemini", "openai"] 중 선택',
        subject: 'string (선택) - 과목',
        grade: 'string (선택) - 학년',
      },
    },
  })
}
