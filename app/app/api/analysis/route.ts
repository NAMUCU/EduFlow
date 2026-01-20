/**
 * 학생 취약점 분석 API
 *
 * GET: 학생별 취약점 분석 조회
 * POST: 분석 실행 (제출 기록 기반)
 *
 * Vercel Best Practices:
 * - async-parallel: 여러 분석을 병렬 실행
 * - server-serialization: 클라이언트로 전달하는 데이터 최소화
 */

import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis } from '@/lib/analysis'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { AnalysisRequest } from '@/types/analysis'

/** API 응답 타입 */
interface ApiSuccessResponse {
  success: true
  data: Record<string, unknown>
}

interface ApiErrorResponse {
  success: false
  error: string
}

/**
 * GET /api/analysis
 *
 * 학생별 취약점 분석 조회
 *
 * Query Parameters:
 * - studentId: 학생 ID (필수)
 * - periodStart: 분석 기간 시작 (선택, YYYY-MM-DD)
 * - periodEnd: 분석 기간 종료 (선택, YYYY-MM-DD)
 * - subjects: 분석할 과목들 (선택, 쉼표로 구분)
 * - includeAiSummary: AI 요약 포함 여부 (선택, 기본값: true)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const periodStart = searchParams.get('periodStart') || undefined
    const periodEnd = searchParams.get('periodEnd') || undefined
    const subjectsParam = searchParams.get('subjects')
    const includeAiSummary = searchParams.get('includeAiSummary') !== 'false'

    // 학생 ID 검증
    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId는 필수 파라미터입니다.',
        },
        { status: 400 }
      )
    }

    // 학생 존재 여부 확인
    const supabase = createServerSupabaseClient()
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        {
          success: false,
          error: '존재하지 않는 학생입니다.',
        },
        { status: 404 }
      )
    }

    // 과목 파라미터 파싱
    const subjects = subjectsParam
      ? subjectsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    // 분석 실행
    const analysis = await runFullAnalysis(studentId, {
      periodStart,
      periodEnd,
      subjects,
      includeAiSummary,
    })

    // server-serialization: 필요한 데이터만 반환
    return NextResponse.json({
      success: true,
      data: {
        studentId: analysis.studentId,
        studentName: analysis.studentName,
        periodStart: analysis.periodStart,
        periodEnd: analysis.periodEnd,
        analyzedAt: analysis.analyzedAt,
        totalProblems: analysis.totalProblems,
        totalWrong: analysis.totalWrong,
        overallCorrectRate: analysis.overallCorrectRate,
        // 상위 데이터만 반환하여 페이로드 최소화
        unitWeaknesses: analysis.unitWeaknesses.slice(0, 10).map((u) => ({
          unit: u.unit,
          subject: u.subject,
          totalProblems: u.totalProblems,
          wrongCount: u.wrongCount,
          correctRate: u.correctRate,
          weaknessLevel: u.weaknessLevel,
          mainPatterns: u.mainPatterns,
          // wrongAnswers는 상세 조회 시에만 포함
        })),
        conceptWeaknesses: analysis.conceptWeaknesses.slice(0, 10).map((c) => ({
          concept: c.concept,
          subject: c.subject,
          relatedUnits: c.relatedUnits,
          totalProblems: c.totalProblems,
          wrongCount: c.wrongCount,
          correctRate: c.correctRate,
          weaknessLevel: c.weaknessLevel,
          mainPatterns: c.mainPatterns,
        })),
        difficultyDistribution: analysis.difficultyDistribution,
        topPatterns: analysis.topPatterns.slice(0, 5).map((p) => ({
          id: p.id,
          type: p.type,
          description: p.description,
          frequency: p.frequency,
          severity: p.severity,
          // relatedWrongAnswers는 상세 조회 시에만 포함
        })),
        aiSummary: analysis.aiSummary,
      },
    })
  } catch (error) {
    console.error('취약점 분석 조회 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '분석 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analysis
 *
 * 분석 실행 (제출 기록 기반)
 *
 * Request Body:
 * {
 *   studentId: string,       // 학생 ID (필수)
 *   periodStart?: string,    // 분석 기간 시작 (YYYY-MM-DD)
 *   periodEnd?: string,      // 분석 기간 종료 (YYYY-MM-DD)
 *   subjects?: string[],     // 분석할 과목들
 *   includeAiSummary?: boolean // AI 요약 포함 여부 (기본값: true)
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  try {
    const body: AnalysisRequest = await request.json()

    // 필수 파라미터 검증
    if (!body.studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId는 필수입니다.',
        },
        { status: 400 }
      )
    }

    // 학생 존재 여부 확인
    const supabase = createServerSupabaseClient()
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', body.studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        {
          success: false,
          error: '존재하지 않는 학생입니다.',
        },
        { status: 404 }
      )
    }

    // 기간 검증
    if (body.periodStart && body.periodEnd) {
      const start = new Date(body.periodStart)
      const end = new Date(body.periodEnd)

      if (start > end) {
        return NextResponse.json(
          {
            success: false,
            error: '시작일이 종료일보다 클 수 없습니다.',
          },
          { status: 400 }
        )
      }

      // 최대 1년 제한
      const oneYear = 365 * 24 * 60 * 60 * 1000
      if (end.getTime() - start.getTime() > oneYear) {
        return NextResponse.json(
          {
            success: false,
            error: '분석 기간은 최대 1년입니다.',
          },
          { status: 400 }
        )
      }
    }

    // 분석 실행
    const analysis = await runFullAnalysis(body.studentId, {
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      subjects: body.subjects,
      includeAiSummary: body.includeAiSummary ?? true,
    })

    // 분석 결과가 없는 경우
    if (analysis.totalProblems === 0) {
      return NextResponse.json({
        success: true,
        data: {
          ...analysis,
          aiSummary: '분석할 과제 제출 기록이 없습니다. 과제를 제출한 후 다시 분석해주세요.',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: analysis as unknown as Record<string, unknown>,
    })
  } catch (error) {
    console.error('취약점 분석 실행 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '분석 실행 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
