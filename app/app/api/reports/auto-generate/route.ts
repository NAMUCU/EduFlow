/**
 * 학습 보고서 자동 생성 API
 *
 * POST /api/reports/auto-generate
 *
 * 여러 학생의 주간/월간 학습 보고서를 자동으로 생성합니다.
 * - 학부모용: 대화거리 중심, 긍정적인 피드백
 * - 강사용: 상세 데이터 중심, 수업 준비용
 *
 * Vercel Best Practices 적용:
 * - async-parallel: 여러 학생 보고서를 병렬 생성
 * - server-serialization: 필요한 데이터만 응답
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchStudentsByAcademy,
  generateReportsForStudents,
  createReportPeriod,
} from '@/lib/report-generator'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  AutoReportGenerateRequest,
  AutoReportGenerateResponse,
  ReportTargetType,
} from '@/types/report'

/**
 * POST /api/reports/auto-generate
 *
 * 요청 본문:
 * {
 *   studentIds?: string[]      // 특정 학생만 생성 (생략시 전체)
 *   periodType: 'weekly' | 'monthly'
 *   startDate: string          // YYYY-MM-DD
 *   endDate: string            // YYYY-MM-DD
 *   targetTypes: ('parent' | 'teacher')[]
 *   academyId: string
 * }
 *
 * 응답:
 * {
 *   success: boolean
 *   data?: {
 *     results: AutoReportGenerateResult[]
 *     totalStudents: number
 *     successCount: number
 *     failCount: number
 *     generatedAt: string
 *   }
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: AutoReportGenerateRequest = await request.json()
    const {
      studentIds,
      periodType,
      startDate,
      endDate,
      targetTypes,
      academyId,
    } = body

    // 필수 파라미터 검증
    if (!periodType || !startDate || !endDate || !targetTypes || !academyId) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다. (periodType, startDate, endDate, targetTypes, academyId)',
        } as AutoReportGenerateResponse,
        { status: 400 }
      )
    }

    // 기간 유형 검증
    if (periodType !== 'weekly' && periodType !== 'monthly') {
      return NextResponse.json(
        {
          success: false,
          error: '기간 유형은 weekly 또는 monthly만 가능합니다.',
        } as AutoReportGenerateResponse,
        { status: 400 }
      )
    }

    // 대상 유형 검증
    const validTargetTypes: ReportTargetType[] = ['parent', 'teacher']
    const invalidTypes = targetTypes.filter((t) => !validTargetTypes.includes(t))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `잘못된 대상 유형: ${invalidTypes.join(', ')}. parent 또는 teacher만 가능합니다.`,
        } as AutoReportGenerateResponse,
        { status: 400 }
      )
    }

    // 날짜 유효성 검증
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요.',
        } as AutoReportGenerateResponse,
        { status: 400 }
      )
    }

    if (start > end) {
      return NextResponse.json(
        {
          success: false,
          error: '시작일은 종료일보다 이전이어야 합니다.',
        } as AutoReportGenerateResponse,
        { status: 400 }
      )
    }

    // 학원 존재 여부 확인
    const supabase = createServerSupabaseClient()
    const { data: academy, error: academyError } = await supabase
      .from('academies')
      .select('id, name')
      .eq('id', academyId)
      .single()

    if (academyError || !academy) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 학원을 찾을 수 없습니다.',
        } as AutoReportGenerateResponse,
        { status: 404 }
      )
    }

    // 학생 목록 조회
    let students = await fetchStudentsByAcademy(academyId)

    // 특정 학생만 필터링
    if (studentIds && studentIds.length > 0) {
      students = students.filter((s) => studentIds.includes(s.id))

      if (students.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: '지정된 학생을 찾을 수 없습니다.',
          } as AutoReportGenerateResponse,
          { status: 404 }
        )
      }
    }

    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 학원에 등록된 학생이 없습니다.',
        } as AutoReportGenerateResponse,
        { status: 404 }
      )
    }

    // 리포트 기간 생성
    const period = createReportPeriod(periodType, startDate, endDate)

    // 보고서 생성 옵션 설정
    const generateParent = targetTypes.includes('parent')
    const generateTeacher = targetTypes.includes('teacher')

    // 보고서 병렬 생성 (기본 5개씩)
    const results = await generateReportsForStudents(students, period, {
      generateParent,
      generateTeacher,
      batchSize: 5, // CLAUDE.md 규칙: 병렬 작업은 기본 5개씩
    })

    // 결과 집계
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    const response: AutoReportGenerateResponse = {
      success: true,
      data: {
        results,
        totalStudents: students.length,
        successCount,
        failCount,
        generatedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('자동 보고서 생성 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '보고서 생성에 실패했습니다.',
      } as AutoReportGenerateResponse,
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports/auto-generate
 *
 * API 사용법 안내
 */
export async function GET() {
  return NextResponse.json({
    message: '학습 보고서 자동 생성 API입니다.',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        studentIds: '(선택) 특정 학생 ID 배열. 생략시 학원 전체 학생',
        periodType: '(필수) weekly 또는 monthly',
        startDate: '(필수) 시작일 YYYY-MM-DD',
        endDate: '(필수) 종료일 YYYY-MM-DD',
        targetTypes: '(필수) 생성할 보고서 유형 배열 ["parent", "teacher"]',
        academyId: '(필수) 학원 ID',
      },
      example: {
        periodType: 'weekly',
        startDate: '2025-01-13',
        endDate: '2025-01-19',
        targetTypes: ['parent', 'teacher'],
        academyId: 'academy_123',
      },
    },
    reportTypes: {
      parent: {
        description: '학부모용 보고서',
        focus: '대화거리 중심, 긍정적 피드백',
        includes: [
          '핵심 요약',
          '칭찬 포인트',
          '대화 주제',
          '격려 메시지',
          '다음 목표',
          '출석/성적 요약',
        ],
      },
      teacher: {
        description: '강사용 보고서',
        focus: '상세 데이터, 수업 준비용',
        includes: [
          '성적 상세 분석',
          '취약점 분석',
          '오답 패턴',
          '출결 상세',
          '과제 현황',
          '학습 추천',
          '다음 수업 준비 사항',
        ],
      },
    },
  })
}
