/**
 * AI 문제 검수 API (개선 버전)
 *
 * POST /api/problems/review
 * 여러 AI 모델(Claude, Gemini, OpenAI)을 사용하여 문제를 검수합니다.
 *
 * 주요 기능:
 * - 멀티 LLM 검수 (Claude, Gemini, ChatGPT)
 * - 검수 결과 합의 도출
 * - 검수 통계 제공
 * - 오류/경고/제안 분류
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
  ReviewStatistics,
} from '@/types/review'

// 지원하는 AI 모델 목록
const SUPPORTED_MODELS: AIModel[] = ['claude', 'gemini', 'openai']

// 모델별 필요한 API 키 환경변수 이름
const MODEL_API_KEYS: Record<AIModel, string> = {
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
}

/**
 * 문제 형식 검증
 */
function validateProblem(
  problem: ProblemForReview,
  index: number
): string | null {
  if (problem.id === undefined && problem.id !== 0) {
    return `문제 ${index + 1}: id가 필요합니다`
  }
  if (!problem.question || typeof problem.question !== 'string') {
    return `문제 ${index + 1}: question이 필요합니다`
  }
  if (!problem.answer || typeof problem.answer !== 'string') {
    return `문제 ${index + 1}: answer가 필요합니다`
  }
  return null
}

/**
 * API 키 확인
 */
function checkApiKeys(models: AIModel[]): {
  available: AIModel[]
  missing: { model: AIModel; envVar: string }[]
} {
  const available: AIModel[] = []
  const missing: { model: AIModel; envVar: string }[] = []

  models.forEach((model) => {
    const envVar = MODEL_API_KEYS[model]
    if (process.env[envVar]) {
      available.push(model)
    } else {
      missing.push({ model, envVar })
    }
  })

  return { available, missing }
}

/**
 * POST: 문제 검수
 *
 * Request Body:
 * {
 *   problems: ProblemForReview[],
 *   models: AIModel[],
 *   subject?: string,
 *   grade?: string,
 *   autoReview?: boolean  // 자동 검수 모드 (생성 직후)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   summaries: ProblemReviewSummary[],
 *   statistics: ReviewStatistics,
 *   totalTime: number,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: ReviewRequest & { autoReview?: boolean } = await request.json()
    const { problems, models, subject, grade, autoReview } = body

    // === 입력 유효성 검사 ===

    // 문제 목록 확인
    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '검수할 문제가 없습니다.',
          details: 'problems 배열을 제공해주세요.',
          summaries: [],
          totalTime: Date.now() - startTime,
        } as ReviewResponse & { details?: string },
        { status: 400 }
      )
    }

    // 모델 목록 확인
    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '검수에 사용할 AI 모델을 선택해주세요.',
          details: `지원 모델: ${SUPPORTED_MODELS.join(', ')}`,
          summaries: [],
          totalTime: Date.now() - startTime,
        } as ReviewResponse & { details?: string },
        { status: 400 }
      )
    }

    // 지원하지 않는 모델 확인
    const invalidModels = models.filter((m) => !SUPPORTED_MODELS.includes(m))
    if (invalidModels.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `지원하지 않는 AI 모델: ${invalidModels.join(', ')}`,
          details: `지원 모델: ${SUPPORTED_MODELS.join(', ')}`,
          summaries: [],
          totalTime: Date.now() - startTime,
        } as ReviewResponse & { details?: string },
        { status: 400 }
      )
    }

    // 문제 형식 검증
    const validationErrors: string[] = []
    problems.forEach((problem: ProblemForReview, index: number) => {
      const error = validateProblem(problem, index)
      if (error) {
        validationErrors.push(error)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '문제 형식 오류',
          details: validationErrors.join('\n'),
          summaries: [],
          totalTime: Date.now() - startTime,
        } as ReviewResponse & { details?: string },
        { status: 400 }
      )
    }

    // === API 키 확인 ===
    const apiKeyStatus = checkApiKeys(models)

    if (apiKeyStatus.missing.length > 0) {
      // Mock 모드 사용 여부 확인
      const useMock = process.env.NODE_ENV === 'development'

      if (!useMock && apiKeyStatus.available.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `모든 AI 모델의 API 키가 설정되지 않았습니다.`,
            details: apiKeyStatus.missing
              .map((m) => `${m.model}: ${m.envVar}`)
              .join(', '),
            summaries: [],
            totalTime: Date.now() - startTime,
          } as ReviewResponse & { details?: string },
          { status: 500 }
        )
      }

      // 사용 가능한 모델로만 진행
      if (apiKeyStatus.available.length > 0) {
        console.warn(
          `[검수 경고] 일부 API 키 누락: ${apiKeyStatus.missing.map((m) => m.model).join(', ')}. 사용 가능한 모델로 진행: ${apiKeyStatus.available.join(', ')}`
        )
      }
    }

    // === 검수 실행 ===
    const modelsToUse =
      apiKeyStatus.available.length > 0 ? apiKeyStatus.available : models

    console.log(
      `[검수 시작] ${problems.length}개 문제, 모델: ${modelsToUse.join(', ')}${autoReview ? ' (자동검수)' : ''}`
    )

    const summaries = await reviewProblems(problems, modelsToUse, subject, grade)
    const totalTime = Date.now() - startTime

    console.log(`[검수 완료] 소요 시간: ${totalTime}ms`)

    // 통계 계산
    const statistics = calculateReviewStatistics(summaries)

    // === 응답 반환 ===
    return NextResponse.json({
      success: true,
      summaries,
      statistics,
      totalTime,
      modelsUsed: modelsToUse,
      // 누락된 모델 정보 (디버깅용)
      ...(apiKeyStatus.missing.length > 0 && {
        skippedModels: apiKeyStatus.missing.map((m) => m.model),
      }),
    })
  } catch (error: unknown) {
    console.error('[검수 API 에러]', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'

    return NextResponse.json(
      {
        success: false,
        error: '문제 검수 중 오류가 발생했습니다',
        details: errorMessage,
        summaries: [],
        totalTime: Date.now() - startTime,
      } as ReviewResponse & { details?: string },
      { status: 500 }
    )
  }
}

/**
 * GET: API 정보 및 사용 가능한 모델 반환
 */
export async function GET() {
  // 현재 설정된 API 키 확인
  const apiKeyStatus = checkApiKeys(SUPPORTED_MODELS)

  return NextResponse.json({
    description: 'AI 문제 검수 API (개선 버전)',
    version: '2.0',
    supportedModels: SUPPORTED_MODELS,
    availableModels: apiKeyStatus.available,
    usage: {
      method: 'POST',
      endpoint: '/api/problems/review',
      body: {
        problems: [
          {
            id: 'number (필수) - 문제 ID',
            question: 'string (필수) - 문제 내용',
            answer: 'string (필수) - 정답',
            solution: 'string (선택) - 풀이',
            difficulty: 'string (선택) - 난이도 (하/중/상)',
            type: 'string (선택) - 문제 유형',
            unit: 'string (선택) - 단원명',
          },
        ],
        models: '["claude", "gemini", "openai"] 중 선택',
        subject: 'string (선택) - 과목',
        grade: 'string (선택) - 학년',
        autoReview: 'boolean (선택) - 자동 검수 모드',
      },
      response: {
        success: 'boolean',
        summaries: 'ProblemReviewSummary[]',
        statistics: 'ReviewStatistics',
        totalTime: 'number (ms)',
        modelsUsed: 'string[]',
        skippedModels: 'string[] (선택) - 누락된 모델',
      },
    },
    features: [
      '멀티 LLM 검수 (Claude, Gemini, ChatGPT)',
      '검수 결과 합의 도출 (2개 이상 AI 동의)',
      '오류/경고/제안 분류',
      '수정 제안 제공',
      '난이도 적절성 평가',
      '검수 통계 대시보드',
    ],
  })
}
