/**
 * 학생 취약점 분석 API
 *
 * GET: 학생별 취약점 분석 결과 조회
 * POST: 새로운 분석 실행 (채점 결과 기반)
 *
 * Claude API를 사용하여 AI 기반 분석 및 학습 추천을 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeWeakness, getWeaknessSummary } from '@/lib/services/weakness-analysis'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { WeaknessAnalysisRequest, WeaknessReport, WeakUnit, WeakConcept } from '@/types/weakness'

/** 간략 취약점 요약 데이터 */
interface WeaknessSummaryData {
  weakUnits: Pick<WeakUnit, 'unit' | 'subject' | 'correctRate' | 'weaknessLevel'>[]
  weakConcepts: Pick<WeakConcept, 'concept' | 'subject' | 'correctRate' | 'weaknessLevel'>[]
  lastAnalyzedAt?: string
}

/** API 응답 타입 */
type ApiResponse = {
  success: true
  data: WeaknessReport | WeaknessSummaryData
} | {
  success: false
  error: string
}

/**
 * GET /api/analysis/weakness
 *
 * 학생별 취약점 분석 결과 조회
 *
 * Query Parameters:
 * - studentId: 학생 ID (필수)
 * - summary: 'true'인 경우 간략 버전 반환 (선택)
 * - periodStart: 분석 기간 시작 (선택, YYYY-MM-DD)
 * - periodEnd: 분석 기간 종료 (선택, YYYY-MM-DD)
 * - subjects: 분석할 과목들 (선택, 쉼표로 구분)
 * - includeAiAnalysis: AI 분석 포함 여부 (선택, 기본값: true)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const summary = searchParams.get('summary') === 'true'
    const periodStart = searchParams.get('periodStart') || undefined
    const periodEnd = searchParams.get('periodEnd') || undefined
    const subjectsParam = searchParams.get('subjects')
    const includeAiAnalysis = searchParams.get('includeAiAnalysis') !== 'false'

    // 학생 ID 검증
    if (!studentId) {
      return NextResponse.json({
        success: false as const,
        error: 'studentId는 필수 파라미터입니다.',
      }, { status: 400 })
    }

    // 학생 정보 조회 (Supabase 연결 시)
    let studentName: string | undefined

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient()
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, user:profiles!students_user_id_fkey(name)')
        .eq('id', studentId)
        .single()

      if (studentError || !student) {
        return NextResponse.json({
          success: false as const,
          error: '존재하지 않는 학생입니다.',
        }, { status: 404 })
      }

      studentName = (student as unknown as { user: { name: string } | null })?.user?.name
    }

    // 간략 버전 요청 시
    if (summary) {
      const data = await getWeaknessSummary(studentId)
      return NextResponse.json({
        success: true as const,
        data,
      })
    }

    // 과목 파라미터 파싱
    const subjects = subjectsParam
      ? subjectsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    // 전체 분석 실행
    const report = await analyzeWeakness(studentId, undefined, {
      periodStart,
      periodEnd,
      subjects,
      includeAiAnalysis,
      studentName,
    })

    // 응답 데이터 최적화 (상위 항목만 반환)
    const optimizedReport: WeaknessReport = {
      ...report,
      weakUnits: report.weakUnits.slice(0, 10),
      weakConcepts: report.weakConcepts.slice(0, 10),
      errorPatterns: report.errorPatterns.slice(0, 5),
      recommendations: report.recommendations.slice(0, 5),
    }

    return NextResponse.json({
      success: true as const,
      data: optimizedReport,
    })
  } catch (error) {
    console.error('취약점 분석 조회 실패:', error)

    return NextResponse.json({
      success: false as const,
      error: error instanceof Error ? error.message : '분석 조회 중 오류가 발생했습니다.',
    }, { status: 500 })
  }
}

/**
 * POST /api/analysis/weakness
 *
 * 새로운 취약점 분석 실행
 *
 * Request Body:
 * {
 *   studentId: string,          // 학생 ID (필수)
 *   periodStart?: string,       // 분석 기간 시작 (YYYY-MM-DD)
 *   periodEnd?: string,         // 분석 기간 종료 (YYYY-MM-DD)
 *   subjects?: string[],        // 분석할 과목들
 *   includeAiAnalysis?: boolean, // AI 분석 포함 여부 (기본값: true)
 *   gradingResults?: GradingResult[] // 직접 전달하는 채점 결과 (선택)
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body: WeaknessAnalysisRequest = await request.json()

    // 필수 파라미터 검증
    if (!body.studentId) {
      return NextResponse.json({
        success: false as const,
        error: 'studentId는 필수입니다.',
      }, { status: 400 })
    }

    // 학생 정보 조회 (Supabase 연결 시)
    let studentName: string | undefined

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient()
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, user:profiles!students_user_id_fkey(name)')
        .eq('id', body.studentId)
        .single()

      if (studentError || !student) {
        return NextResponse.json({
          success: false as const,
          error: '존재하지 않는 학생입니다.',
        }, { status: 404 })
      }

      studentName = (student as unknown as { user: { name: string } | null })?.user?.name
    }

    // 기간 검증
    if (body.periodStart && body.periodEnd) {
      const start = new Date(body.periodStart)
      const end = new Date(body.periodEnd)

      if (start > end) {
        return NextResponse.json({
          success: false as const,
          error: '시작일이 종료일보다 클 수 없습니다.',
        }, { status: 400 })
      }

      // 최대 1년 제한
      const oneYear = 365 * 24 * 60 * 60 * 1000
      if (end.getTime() - start.getTime() > oneYear) {
        return NextResponse.json({
          success: false as const,
          error: '분석 기간은 최대 1년입니다.',
        }, { status: 400 })
      }
    }

    // 채점 결과 검증 (직접 전달된 경우)
    if (body.gradingResults) {
      if (!Array.isArray(body.gradingResults)) {
        return NextResponse.json({
          success: false as const,
          error: 'gradingResults는 배열이어야 합니다.',
        }, { status: 400 })
      }

      // 필수 필드 검증
      for (const result of body.gradingResults) {
        if (!result.problemId || !result.subject || !result.unit) {
          return NextResponse.json({
            success: false as const,
            error: '채점 결과에 필수 필드(problemId, subject, unit)가 누락되었습니다.',
          }, { status: 400 })
        }
      }
    }

    // 분석 실행
    const report = await analyzeWeakness(body.studentId, body.gradingResults, {
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      subjects: body.subjects,
      includeAiAnalysis: body.includeAiAnalysis ?? true,
      studentName,
    })

    // 분석 결과가 없는 경우
    if (report.summary.totalProblems === 0) {
      return NextResponse.json({
        success: true as const,
        data: {
          ...report,
          aiSummary: '분석할 채점 결과가 없습니다. 과제를 제출한 후 다시 분석해주세요.',
        },
      })
    }

    return NextResponse.json({
      success: true as const,
      data: report,
    })
  } catch (error) {
    console.error('취약점 분석 실행 실패:', error)

    return NextResponse.json({
      success: false as const,
      error: error instanceof Error ? error.message : '분석 실행 중 오류가 발생했습니다.',
    }, { status: 500 })
  }
}
