/**
 * 문제지 생성 API
 * POST: 문제 목록 → HTML 문제지/정답지 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateProblemSheet } from '@/lib/curriculum-svg-integration'

/**
 * POST /api/curriculum/problem-sheet
 * Body:
 * - problems: GeneratedProblem[] (필수)
 * - title: string (선택) - 문제지 제목
 * - includeAnswers: boolean (선택, 기본 true) - 정답지 포함 여부
 * - includeSolutions: boolean (선택, 기본 true) - 풀이 포함 여부
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      problems,
      title = '문제지',
      includeAnswers = true,
      includeSolutions = true
    } = body

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json(
        { success: false, error: '문제 목록이 필요합니다.' },
        { status: 400 }
      )
    }

    // 문제지 생성
    const result = await generateProblemSheet(problems, {
      title,
      includeAnswers,
      includeSolutions
    })

    return NextResponse.json({
      success: true,
      data: {
        problemsHtml: result.problemsHtml,
        answersHtml: result.answersHtml
      },
      stats: result.stats
    })
  } catch (error) {
    console.error('문제지 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '문제지 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
