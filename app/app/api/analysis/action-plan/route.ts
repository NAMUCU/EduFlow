/**
 * Action Plan (실천 가이드) API
 *
 * GET: 학생별 실천 가이드 조회
 * POST: Gemini AI로 맞춤형 학습 추천 생성
 *
 * Vercel Best Practices:
 * - async-parallel: 분석과 플랜 생성을 병렬 처리 가능할 때 활용
 * - server-serialization: 클라이언트로 전달하는 데이터 최소화
 */

import { NextRequest, NextResponse } from 'next/server'
import { runFullAnalysis, generateActionPlan } from '@/lib/analysis'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { ActionPlanRequest, ActionPlan } from '@/types/analysis'

/** API 응답 타입 */
interface ApiSuccessResponse {
  success: true
  data: ActionPlan
}

interface ApiErrorResponse {
  success: false
  error: string
}

/** 학생 조회 결과 타입 */
interface StudentWithUser {
  id: string
  users: {
    name: string
  } | null
}

// 메모리 캐시 (실제 환경에서는 Redis 등 사용 권장)
const actionPlanCache = new Map<string, { plan: ActionPlan; cachedAt: Date }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1시간

/**
 * 캐시에서 Action Plan 조회
 */
function getCachedPlan(studentId: string): ActionPlan | null {
  const cached = actionPlanCache.get(studentId)
  if (!cached) return null

  const now = new Date()
  if (now.getTime() - cached.cachedAt.getTime() > CACHE_TTL_MS) {
    actionPlanCache.delete(studentId)
    return null
  }

  return cached.plan
}

/**
 * Action Plan 캐시 저장
 */
function cachePlan(studentId: string, plan: ActionPlan): void {
  actionPlanCache.set(studentId, { plan, cachedAt: new Date() })
}

/**
 * GET /api/analysis/action-plan
 *
 * 학생별 실천 가이드 조회
 *
 * Query Parameters:
 * - studentId: 학생 ID (필수)
 * - refresh: 캐시 무시하고 새로 생성 (선택, 기본값: false)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const refresh = searchParams.get('refresh') === 'true'

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

    // 학생 존재 여부 및 정보 조회
    const supabase = createServerSupabaseClient()
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        users!inner (
          name
        )
      `)
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

    const typedStudent = student as unknown as StudentWithUser
    const studentName = typedStudent.users?.name || '학생'

    // 캐시 확인 (refresh가 아닌 경우)
    if (!refresh) {
      const cachedPlan = getCachedPlan(studentId)
      if (cachedPlan) {
        return NextResponse.json({
          success: true,
          data: serializeActionPlan(cachedPlan),
        })
      }
    }

    // 취약점 분석 실행
    const analysis = await runFullAnalysis(studentId, {
      includeAiSummary: true,
    })

    // 분석 결과가 없는 경우
    if (analysis.totalProblems === 0) {
      return NextResponse.json({
        success: true,
        data: createEmptyPlan(studentId, studentName),
      })
    }

    // Action Plan 생성
    const actionPlan = await generateActionPlan(studentId, studentName, analysis, {
      planWeeks: 4,
      dailyStudyTime: 60,
    })

    // 캐시 저장
    cachePlan(studentId, actionPlan)

    // server-serialization: 필요한 데이터만 반환
    return NextResponse.json({
      success: true,
      data: serializeActionPlan(actionPlan),
    })
  } catch (error) {
    console.error('Action Plan 조회 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Action Plan 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analysis/action-plan
 *
 * Gemini AI로 맞춤형 학습 추천 생성
 *
 * Request Body:
 * {
 *   studentId: string,         // 학생 ID (필수)
 *   planWeeks?: number,        // 계획 기간 (주 단위, 기본값: 4)
 *   dailyStudyTime?: number,   // 일일 학습 시간 (분, 기본값: 60)
 *   focusSubjects?: string[],  // 집중할 과목들
 *   analysisId?: string        // 참고할 분석 ID
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  try {
    const body: ActionPlanRequest = await request.json()

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

    // 파라미터 검증
    if (body.planWeeks !== undefined) {
      if (body.planWeeks < 1 || body.planWeeks > 12) {
        return NextResponse.json(
          {
            success: false,
            error: '계획 기간은 1주에서 12주 사이여야 합니다.',
          },
          { status: 400 }
        )
      }
    }

    if (body.dailyStudyTime !== undefined) {
      if (body.dailyStudyTime < 15 || body.dailyStudyTime > 240) {
        return NextResponse.json(
          {
            success: false,
            error: '일일 학습 시간은 15분에서 240분(4시간) 사이여야 합니다.',
          },
          { status: 400 }
        )
      }
    }

    // 학생 존재 여부 및 정보 조회
    const supabase = createServerSupabaseClient()
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        users!inner (
          name
        )
      `)
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

    const typedStudentPost = student as unknown as StudentWithUser
    const studentName = typedStudentPost.users?.name || '학생'

    // 취약점 분석 실행
    const analysis = await runFullAnalysis(body.studentId, {
      subjects: body.focusSubjects,
      includeAiSummary: true,
    })

    // 분석 결과가 없는 경우
    if (analysis.totalProblems === 0) {
      return NextResponse.json({
        success: true,
        data: createEmptyPlan(body.studentId, studentName),
      })
    }

    // Action Plan 생성
    const actionPlan = await generateActionPlan(body.studentId, studentName, analysis, {
      planWeeks: body.planWeeks || 4,
      dailyStudyTime: body.dailyStudyTime || 60,
      focusSubjects: body.focusSubjects,
    })

    // 캐시 저장
    cachePlan(body.studentId, actionPlan)

    return NextResponse.json({
      success: true,
      data: serializeActionPlan(actionPlan),
    })
  } catch (error) {
    console.error('Action Plan 생성 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Action Plan 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * Action Plan 직렬화 (server-serialization)
 * 클라이언트에 필요한 데이터만 포함하여 페이로드 최소화
 */
function serializeActionPlan(plan: ActionPlan): ActionPlan {
  return {
    id: plan.id,
    studentId: plan.studentId,
    studentName: plan.studentName,
    createdAt: plan.createdAt,
    validFrom: plan.validFrom,
    validTo: plan.validTo,
    overallGoal: plan.overallGoal,
    aiAdvice: plan.aiAdvice,
    recommendations: plan.recommendations.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      targetArea: r.targetArea,
      priority: r.priority,
      estimatedTime: r.estimatedTime,
      reason: r.reason,
      relatedWeaknesses: r.relatedWeaknesses,
    })),
    weeklyPlans: plan.weeklyPlans.map((wp) => ({
      week: wp.week,
      startDate: wp.startDate,
      endDate: wp.endDate,
      goal: wp.goal,
      dailyPlans: wp.dailyPlans.map((dp) => ({
        dayOfWeek: dp.dayOfWeek,
        date: dp.date,
        items: dp.items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          targetArea: item.targetArea,
          priority: item.priority,
          estimatedTime: item.estimatedTime,
          reason: item.reason,
          relatedWeaknesses: item.relatedWeaknesses,
        })),
        totalTime: dp.totalTime,
      })),
    })),
    basedOnAnalysisId: plan.basedOnAnalysisId,
    progress: plan.progress,
    completedRecommendations: plan.completedRecommendations,
  }
}

/**
 * 빈 Action Plan 생성 (데이터가 없을 때)
 */
function createEmptyPlan(studentId: string, studentName: string): ActionPlan {
  const now = new Date()
  const fourWeeksLater = new Date(now.getTime() + 4 * 7 * 24 * 60 * 60 * 1000)

  return {
    id: `plan_empty_${Date.now()}`,
    studentId,
    studentName,
    createdAt: now.toISOString(),
    validFrom: now.toISOString().split('T')[0],
    validTo: fourWeeksLater.toISOString().split('T')[0],
    overallGoal: '과제 제출 기록이 없어 분석할 수 없습니다.',
    aiAdvice: `${studentName} 학생의 학습 데이터가 아직 충분하지 않습니다. 과제를 제출하면 맞춤형 학습 계획을 받을 수 있습니다. 먼저 선생님이 부여한 과제를 풀고 제출해보세요!`,
    recommendations: [
      {
        id: 'rec_start',
        type: 'practice_problems',
        title: '첫 과제 도전하기',
        description: '선생님이 부여한 과제를 확인하고 문제를 풀어보세요.',
        targetArea: '전체',
        priority: 1,
        estimatedTime: 30,
        reason: '학습 데이터 수집을 위해 과제 제출이 필요합니다.',
        relatedWeaknesses: [],
      },
    ],
    weeklyPlans: [],
    progress: 0,
    completedRecommendations: [],
  }
}
