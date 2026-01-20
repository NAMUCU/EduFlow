/**
 * EduFlow 자동 채점 API 엔드포인트
 *
 * POST: 학생 답안 제출 및 자동 채점
 * - 문제 ID, 학생 ID, 답안 배열을 받아서 채점 결과 반환
 * - 객관식, 단답형, O/X: 즉시 자동 채점
 * - 서술형: Gemini AI를 활용한 AI 채점
 * - 부분 점수 지원
 *
 * Vercel Best Practices 적용:
 * - async-parallel: 여러 문제 병렬 채점 (Promise.all)
 * - server-cache-react: 문제 정보 캐싱
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  getProblemById,
  getProblemsById,
  gradeSingleProblem,
  gradeMultipleProblems,
  calculateGradingSummary,
  saveGradingResults,
  getDefaultGradingOptions,
} from '@/lib/grading'
import type {
  GradingRequest,
  GradingResponse,
  GradingResultData,
  ProblemWithAnswer,
  StudentAnswerInput,
} from '@/types/grading'

/**
 * POST /api/grading
 * 학생 답안 제출 및 자동 채점
 */
export async function POST(request: NextRequest): Promise<NextResponse<GradingResponse>> {
  const startTime = Date.now()

  try {
    // 1. 요청 본문 파싱
    const body: GradingRequest = await request.json()
    const { assignment_id, student_id, answers, options = {} } = body

    // 2. 필수 파라미터 검증
    if (!student_id) {
      return NextResponse.json(
        { success: false, error: '학생 ID(student_id)는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: '답안 배열(answers)은 필수이며, 최소 1개 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 3. 답안 형식 검증
    const validationError = validateAnswers(answers)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      )
    }

    // 4. 학생 존재 여부 확인
    const supabase = createServerSupabaseClient()
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 학생 ID입니다.' },
        { status: 404 }
      )
    }

    // 5. 문제 ID 목록 추출 및 중복 제거
    const problemIds = [...new Set(answers.map(a => a.problem_id))]

    // 6. 문제 정보 병렬 조회 (캐싱 적용)
    const problemsMap = await getProblemsById(problemIds)

    // 7. 누락된 문제 확인
    const missingProblems = problemIds.filter(id => !problemsMap.has(id))
    if (missingProblems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `다음 문제를 찾을 수 없습니다: ${missingProblems.join(', ')}`,
        },
        { status: 404 }
      )
    }

    // 8. 채점 옵션 병합
    const gradingOptions = { ...getDefaultGradingOptions(), ...options }

    // 9. 채점할 문제-답안 쌍 준비
    const problemsWithAnswers = answers.map(answer => ({
      problem: problemsMap.get(answer.problem_id)!,
      studentAnswer: answer.answer,
    }))

    // 10. 병렬 채점 실행 (Promise.all 사용)
    const gradingResults = await gradeMultipleProblems(problemsWithAnswers, gradingOptions)

    // 11. 채점 요약 통계 계산
    const summary = calculateGradingSummary(gradingResults, problemsMap)

    // 12. 과제 기반 채점인 경우 결과 저장
    if (assignment_id) {
      try {
        // student_assignment 조회
        const { data: studentAssignment } = await supabase
          .from('student_assignments')
          .select('id')
          .eq('assignment_id', assignment_id)
          .eq('student_id', student_id)
          .single() as { data: { id: string } | null; error: unknown }

        if (studentAssignment) {
          await saveGradingResults(studentAssignment.id, gradingResults, summary)
        }
      } catch (saveError) {
        console.error('채점 결과 저장 실패 (계속 진행):', saveError)
        // 저장 실패해도 채점 결과는 반환
      }
    }

    // 13. 전체 소요 시간 계산
    const totalGradingTimeMs = Date.now() - startTime

    // 14. 응답 데이터 구성
    const responseData: GradingResultData = {
      student_id,
      assignment_id,
      results: gradingResults,
      summary,
      graded_at: new Date().toISOString(),
      total_grading_time_ms: totalGradingTimeMs,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error: any) {
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
        error: error.message || '채점 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * 답안 배열 형식 검증
 */
function validateAnswers(answers: StudentAnswerInput[]): string | null {
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i]

    if (!answer.problem_id) {
      return `answers[${i}]: problem_id는 필수입니다.`
    }

    if (typeof answer.problem_id !== 'string') {
      return `answers[${i}]: problem_id는 문자열이어야 합니다.`
    }

    if (answer.answer === undefined || answer.answer === null) {
      return `answers[${i}]: answer는 필수입니다.`
    }

    if (typeof answer.answer !== 'string') {
      return `answers[${i}]: answer는 문자열이어야 합니다.`
    }
  }

  return null
}

/**
 * GET /api/grading
 * API 정보 및 사용법 안내
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'EduFlow 자동 채점 API',
    version: '1.0.0',
    description: '학생 답안을 자동으로 채점하는 API입니다.',
    endpoints: {
      'POST /api/grading': {
        description: '학생 답안 제출 및 자동 채점',
        body: {
          student_id: '(필수) 학생 ID',
          assignment_id: '(선택) 과제 ID - 결과 저장 시 필요',
          answers: [
            {
              problem_id: '(필수) 문제 ID',
              answer: '(필수) 학생의 답안',
            },
          ],
          options: {
            allow_partial_credit: '(선택) 부분 점수 허용 여부 (기본값: true)',
            use_ai_for_essay: '(선택) 서술형 AI 채점 사용 여부 (기본값: true)',
            case_sensitive: '(선택) 대소문자 구분 여부 (기본값: false)',
            ignore_whitespace: '(선택) 공백 무시 여부 (기본값: true)',
            generate_feedback: '(선택) 피드백 생성 여부 (기본값: true)',
            essay_detail_level: "(선택) 서술형 채점 상세도 ('basic' | 'detailed')",
          },
        },
        response: {
          success: 'boolean',
          data: {
            student_id: 'string',
            assignment_id: 'string | undefined',
            results: '개별 문제 채점 결과 배열',
            summary: '채점 요약 통계',
            graded_at: 'ISO 8601 형식의 채점 완료 시간',
            total_grading_time_ms: '전체 채점 소요 시간 (ms)',
          },
        },
      },
    },
    supported_problem_types: {
      multiple_choice: '객관식 - 자동 채점',
      short_answer: '단답형 - 자동 채점 (부분 점수 지원)',
      true_false: 'O/X - 자동 채점',
      essay: '서술형 - Gemini AI 채점',
    },
    example: {
      request: {
        student_id: 'student-uuid-here',
        assignment_id: 'assignment-uuid-here',
        answers: [
          { problem_id: 'problem-1', answer: 'A' },
          { problem_id: 'problem-2', answer: '42' },
          { problem_id: 'problem-3', answer: 'O' },
          { problem_id: 'problem-4', answer: '이 문제의 답은...' },
        ],
      },
    },
  })
}
