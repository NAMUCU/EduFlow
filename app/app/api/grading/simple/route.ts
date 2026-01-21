/**
 * 일반 자동 채점 API 엔드포인트
 *
 * POST: 문제 유형별 간단한 채점 요청
 * - multiple_choice: 객관식 채점
 * - short_answer: 단답형 채점 (유사도 포함)
 * - essay: 서술형 채점 (AI 사용)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  gradeMultipleChoice,
  gradeShortAnswer,
  gradeEssay,
  isConfigured,
  type MultipleChoiceResult,
  type ShortAnswerResult,
  type EssayResult
} from '@/lib/services/grading'

// ============================================
// 타입 정의
// ============================================

type ProblemType = 'multiple_choice' | 'short_answer' | 'essay'

interface GradingRequestBody {
  problemType: ProblemType
  studentAnswer: string
  correctAnswer: string
  rubric?: string  // 서술형 채점 기준 (선택)
}

interface GradingSuccessResponse {
  success: true
  data: {
    problemType: ProblemType
    result: MultipleChoiceResult | ShortAnswerResult | EssayResult
    isConfigured: boolean  // AI 설정 여부
    gradedAt: string
  }
}

interface GradingErrorResponse {
  success: false
  error: string
}

type GradingResponse = GradingSuccessResponse | GradingErrorResponse

// ============================================
// POST 핸들러
// ============================================

/**
 * POST /api/grading/simple
 * 문제 유형별 간단한 채점 수행
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<GradingResponse>> {
  try {
    // 1. 요청 본문 파싱
    const body: GradingRequestBody = await request.json()
    const { problemType, studentAnswer, correctAnswer, rubric } = body

    // 2. 필수 파라미터 검증
    if (!problemType) {
      return NextResponse.json(
        { success: false, error: 'problemType은 필수입니다.' },
        { status: 400 }
      )
    }

    if (!['multiple_choice', 'short_answer', 'essay'].includes(problemType)) {
      return NextResponse.json(
        {
          success: false,
          error: `지원하지 않는 문제 유형입니다: ${problemType}. 지원 유형: multiple_choice, short_answer, essay`
        },
        { status: 400 }
      )
    }

    if (studentAnswer === undefined || studentAnswer === null) {
      return NextResponse.json(
        { success: false, error: 'studentAnswer는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!correctAnswer) {
      return NextResponse.json(
        { success: false, error: 'correctAnswer는 필수입니다.' },
        { status: 400 }
      )
    }

    // 3. 문제 유형별 채점 실행
    let result: MultipleChoiceResult | ShortAnswerResult | EssayResult

    switch (problemType) {
      case 'multiple_choice':
        result = gradeMultipleChoice(studentAnswer, correctAnswer)
        break

      case 'short_answer':
        result = gradeShortAnswer(studentAnswer, correctAnswer)
        break

      case 'essay':
        result = await gradeEssay(studentAnswer, correctAnswer, rubric)
        break

      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 문제 유형입니다.' },
          { status: 400 }
        )
    }

    // 4. 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        problemType,
        result,
        isConfigured: isConfigured(),
        gradedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('채점 API 오류:', error)

    // JSON 파싱 오류
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: '잘못된 JSON 형식입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '채점 중 오류가 발생했습니다.'
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET 핸들러 - API 정보
// ============================================

/**
 * GET /api/grading/simple
 * API 정보 및 사용법 안내
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'EduFlow 일반 자동 채점 API',
    version: '1.0.0',
    description: '문제 유형별 간단한 자동 채점을 수행하는 API입니다.',
    isConfigured: isConfigured(),
    endpoint: {
      method: 'POST',
      path: '/api/grading/simple',
      body: {
        problemType: '(필수) 문제 유형: multiple_choice | short_answer | essay',
        studentAnswer: '(필수) 학생의 답안',
        correctAnswer: '(필수) 정답 또는 모범 답안',
        rubric: '(선택) 서술형 채점 기준'
      }
    },
    problemTypes: {
      multiple_choice: {
        description: '객관식 문제 채점',
        supportedFormats: 'A, B, C, D, 1, 2, 3, 4, ①, ②, ③, ④, 가, 나, 다, 라',
        result: '{ isCorrect: boolean, score: number }'
      },
      short_answer: {
        description: '단답형 문제 채점 (유사도 기반 부분 점수 지원)',
        note: '정답은 쉼표로 구분하여 복수 정답 지정 가능',
        result: '{ isCorrect: boolean, score: number, similarity: number }'
      },
      essay: {
        description: '서술형 문제 채점 (Gemini AI 사용)',
        note: 'API 키 미설정 시 Mock 모드로 동작',
        result: '{ score: number, feedback: string, details: {...} }'
      }
    },
    examples: [
      {
        name: '객관식 채점',
        request: {
          problemType: 'multiple_choice',
          studentAnswer: 'B',
          correctAnswer: '2'
        },
        response: {
          success: true,
          data: {
            problemType: 'multiple_choice',
            result: { isCorrect: true, score: 100 }
          }
        }
      },
      {
        name: '단답형 채점',
        request: {
          problemType: 'short_answer',
          studentAnswer: '대한민국',
          correctAnswer: '대한민국, 한국'
        },
        response: {
          success: true,
          data: {
            problemType: 'short_answer',
            result: { isCorrect: true, score: 100, similarity: 1.0 }
          }
        }
      },
      {
        name: '서술형 채점',
        request: {
          problemType: 'essay',
          studentAnswer: '광합성은 식물이 빛 에너지를 이용하여 이산화탄소와 물로 포도당을 합성하는 과정입니다.',
          correctAnswer: '광합성은 식물 세포의 엽록체에서 일어나며, 빛 에너지를 화학 에너지로 전환하여 포도당을 합성하는 과정이다.',
          rubric: '핵심 개념: 빛 에너지, 이산화탄소, 물, 포도당, 엽록체'
        },
        response: {
          success: true,
          data: {
            problemType: 'essay',
            result: {
              score: 75,
              feedback: '핵심 개념을 잘 이해하고 있습니다.',
              details: { accuracy: 80, completeness: 70, logic: 75, expression: 75 }
            }
          }
        }
      }
    ]
  })
}
