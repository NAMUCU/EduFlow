/**
 * 커리큘럼 문제 생성 API (SVG 이미지 포함)
 * POST: 문제 생성 + 자동 SVG 템플릿 매칭
 */

import { NextRequest, NextResponse } from 'next/server'
import { enhanceProblemsWithSvg, getDefaultTemplateForUnit } from '@/lib/curriculum-svg-integration'

interface GeneratedProblem {
  text: string
  answer: string
  solution?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * POST /api/curriculum/generate-with-svg
 * Body:
 * - problems: GeneratedProblem[] (필수) - 생성된 문제 목록
 * - unit: string (선택) - 단원 이름 (기본 템플릿 조회용)
 * - useLLM: boolean (선택) - LLM 분석 사용 여부
 * - forceTemplate: string (선택) - 강제 사용할 템플릿 이름
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { problems, unit, useLLM = false, forceTemplate } = body

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return NextResponse.json(
        { success: false, error: '문제 목록이 필요합니다.' },
        { status: 400 }
      )
    }

    // 단원별 기본 템플릿 조회
    let templateToUse = forceTemplate
    if (!templateToUse && unit) {
      templateToUse = getDefaultTemplateForUnit(unit) || undefined
    }

    // 문제 강화 (SVG 추가)
    const enhancedProblems = await enhanceProblemsWithSvg(
      problems as GeneratedProblem[],
      {
        useLLM,
        // forceTemplate은 각 문제마다 적용되지 않고, 개별 처리 필요 시 별도 구현
      }
    )

    // 통계 계산
    const stats = {
      total: enhancedProblems.length,
      withImages: enhancedProblems.filter(p => p.hasImage).length,
      templatesUsed: {} as Record<string, number>
    }

    for (const p of enhancedProblems) {
      if (p.templateUsed) {
        stats.templatesUsed[p.templateUsed] = (stats.templatesUsed[p.templateUsed] || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      data: enhancedProblems.map(p => ({
        text: p.text,
        answer: p.answer,
        solution: p.solution,
        difficulty: p.difficulty,
        html: p.html,
        hasImage: p.hasImage,
        templateUsed: p.templateUsed,
        images: p.mergedContent.images
      })),
      stats,
      defaultTemplate: templateToUse || null
    })
  } catch (error) {
    console.error('SVG 문제 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: 'SVG 문제 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
