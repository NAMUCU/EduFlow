/**
 * 문제 검수 API
 *
 * PRD F1. 멀티 LLM 검수 기능
 * 생성된 문제를 여러 LLM(Gemini, GPT, Claude)으로 검수합니다.
 *
 * POST /api/problems/validate
 * - 단일 문제 검수: { problem, validators }
 * - 여러 문제 일괄 검수: { problems, validators }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  validateProblem,
  batchValidateProblems,
  validateProblemMock,
  checkApiKeys,
  getAvailableValidators,
} from '@/lib/problem-validator'
import type {
  GeneratedProblem,
  ValidatorType,
  ValidateProblemInput,
  ValidateProblemOutput,
  BatchValidateProblemInput,
  BatchValidateProblemOutput,
  ValidationApiResponse,
} from '@/types/validation'

// ============================================
// 입력 검증
// ============================================

/**
 * 문제 데이터 유효성 검사
 */
function validateProblemData(problem: unknown): problem is GeneratedProblem {
  if (!problem || typeof problem !== 'object') return false

  const p = problem as Record<string, unknown>

  // 필수 필드 검사
  if (!p.id) return false
  if (typeof p.question !== 'string' || p.question.trim() === '') return false
  if (typeof p.answer !== 'string' || p.answer.trim() === '') return false
  if (!['easy', 'medium', 'hard'].includes(p.difficulty as string)) return false
  if (
    !['multiple_choice', 'short_answer', 'true_false', 'essay'].includes(
      p.type as string
    )
  )
    return false

  // 객관식인 경우 보기 검사
  if (p.type === 'multiple_choice') {
    if (!Array.isArray(p.options) || p.options.length < 2) return false
  }

  return true
}

/**
 * 검수기 목록 유효성 검사
 */
function validateValidators(validators: unknown): validators is ValidatorType[] {
  if (!Array.isArray(validators) || validators.length === 0) return false

  const validTypes: ValidatorType[] = ['gemini', 'gpt', 'claude']
  return validators.every((v) => validTypes.includes(v as ValidatorType))
}

// ============================================
// API 핸들러
// ============================================

/**
 * POST: 문제 검수
 *
 * Request Body (단일 문제):
 * {
 *   problem: GeneratedProblem,
 *   validators: ValidatorType[],
 *   subject?: string,
 *   grade?: string
 * }
 *
 * Request Body (여러 문제):
 * {
 *   problems: GeneratedProblem[],
 *   validators: ValidatorType[],
 *   subject?: string,
 *   grade?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 검수기 목록 검증
    if (!validateValidators(body.validators)) {
      return NextResponse.json<ValidationApiResponse<null>>(
        {
          success: false,
          error: '유효하지 않은 검수기 목록입니다.',
          details:
            "validators 필드에 'gemini', 'gpt', 'claude' 중 하나 이상을 배열로 제공해주세요.",
        },
        { status: 400 }
      )
    }

    const validators = body.validators as ValidatorType[]

    // API 키 확인
    const apiKeys = checkApiKeys()
    const unavailableValidators = validators.filter((v) => !apiKeys[v])

    if (unavailableValidators.length > 0) {
      // Mock 모드 사용 여부 확인
      const useMock = body.useMock === true

      if (!useMock) {
        return NextResponse.json<ValidationApiResponse<null>>(
          {
            success: false,
            error: `다음 검수기의 API 키가 설정되지 않았습니다: ${unavailableValidators.join(', ')}`,
            details: `사용 가능한 검수기: ${getAvailableValidators().join(', ') || '없음'}. 테스트용으로 useMock: true를 추가하면 Mock 모드를 사용할 수 있습니다.`,
          },
          { status: 400 }
        )
      }
    }

    // 여러 문제 일괄 검수
    if (Array.isArray(body.problems)) {
      // 모든 문제 유효성 검사
      const invalidProblems = body.problems.filter(
        (p: unknown) => !validateProblemData(p)
      )
      if (invalidProblems.length > 0) {
        return NextResponse.json<ValidationApiResponse<null>>(
          {
            success: false,
            error: `${invalidProblems.length}개의 문제가 유효하지 않습니다.`,
            details:
              '각 문제에 id, question, answer, difficulty, type 필드가 필요합니다.',
          },
          { status: 400 }
        )
      }

      const input: BatchValidateProblemInput = {
        problems: body.problems as GeneratedProblem[],
        validators,
        subject: body.subject,
        grade: body.grade,
      }

      const result = await batchValidateProblems(input)

      return NextResponse.json<ValidationApiResponse<BatchValidateProblemOutput>>({
        success: true,
        data: result,
      })
    }

    // 단일 문제 검수
    if (body.problem) {
      if (!validateProblemData(body.problem)) {
        return NextResponse.json<ValidationApiResponse<null>>(
          {
            success: false,
            error: '유효하지 않은 문제 데이터입니다.',
            details:
              'problem 필드에 id, question, answer, difficulty, type이 포함되어야 합니다.',
          },
          { status: 400 }
        )
      }

      const input: ValidateProblemInput = {
        problem: body.problem as GeneratedProblem,
        validators,
        subject: body.subject,
        grade: body.grade,
      }

      // Mock 모드 또는 실제 API 호출
      const useMock = body.useMock === true && unavailableValidators.length > 0
      const result = useMock
        ? await validateProblemMock(input)
        : await validateProblem(input)

      return NextResponse.json<ValidationApiResponse<ValidateProblemOutput>>({
        success: true,
        data: result,
      })
    }

    // 문제 데이터 누락
    return NextResponse.json<ValidationApiResponse<null>>(
      {
        success: false,
        error: '검수할 문제가 제공되지 않았습니다.',
        details:
          "단일 문제는 'problem' 필드로, 여러 문제는 'problems' 배열로 제공해주세요.",
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('문제 검수 API 오류:', error)
    return NextResponse.json<ValidationApiResponse<null>>(
      {
        success: false,
        error: '문제 검수 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

/**
 * GET: 사용 가능한 검수기 목록 조회
 *
 * 현재 API 키가 설정된 검수기 목록을 반환합니다.
 */
export async function GET() {
  try {
    const apiKeys = checkApiKeys()
    const available = getAvailableValidators()

    return NextResponse.json<
      ValidationApiResponse<{
        available: ValidatorType[]
        status: Record<ValidatorType, boolean>
      }>
    >({
      success: true,
      data: {
        available,
        status: apiKeys,
      },
    })
  } catch (error) {
    console.error('검수기 목록 조회 오류:', error)
    return NextResponse.json<ValidationApiResponse<null>>(
      {
        success: false,
        error: '검수기 목록을 조회하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}
