/**
 * SVG 템플릿 API
 * GET: 템플릿 목록 조회
 * POST: 템플릿에서 SVG 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { ALL_TEMPLATES, TEMPLATES_BY_CATEGORY, getTemplate, findTemplateByKeywords } from '@/data/fewshot'
import { analyzeQuickly } from '@/lib/image-analyzer'
import { matchTemplate } from '@/lib/template-matcher'
import { processContent, mergedContentToHtml, mergedContentToMarkdown } from '@/lib/content-merger'
import type { FewshotCategory } from '@/types/fewshot'

/**
 * GET /api/templates
 * 쿼리 파라미터:
 * - category: 카테고리 필터 (triangle, quadrilateral, circle, graph, coordinate)
 * - subcategory: 서브카테고리 필터
 * - keywords: 키워드 검색 (쉼표 구분)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as FewshotCategory | null
    const subcategory = searchParams.get('subcategory')
    const keywords = searchParams.get('keywords')

    // 특정 템플릿 조회
    if (category && subcategory) {
      const template = getTemplate(category, subcategory)
      if (template) {
        return NextResponse.json({ success: true, data: template })
      }
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 키워드로 검색
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim())
      const template = findTemplateByKeywords(keywordList)
      if (template) {
        return NextResponse.json({ success: true, data: template })
      }
      return NextResponse.json(
        { success: false, error: '매칭되는 템플릿이 없습니다.' },
        { status: 404 }
      )
    }

    // 카테고리별 목록
    if (category) {
      const templates = TEMPLATES_BY_CATEGORY[category] || []
      return NextResponse.json({
        success: true,
        data: templates,
        total: templates.length
      })
    }

    // 전체 목록
    return NextResponse.json({
      success: true,
      data: ALL_TEMPLATES,
      total: ALL_TEMPLATES.length,
      categories: Object.keys(TEMPLATES_BY_CATEGORY).map(cat => ({
        category: cat,
        count: TEMPLATES_BY_CATEGORY[cat as FewshotCategory].length
      }))
    })
  } catch (error) {
    console.error('템플릿 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates
 * Body:
 * - problemText: 문제 텍스트 (필수)
 * - format: 출력 형식 (html, markdown, raw) (선택, 기본 raw)
 * - forceTemplate: 강제로 사용할 템플릿 이름 (선택)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { problemText, format = 'raw', forceTemplate } = body

    if (!problemText) {
      return NextResponse.json(
        { success: false, error: '문제 텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    // 강제 템플릿이 지정된 경우
    if (forceTemplate) {
      const template = ALL_TEMPLATES.find(t => t.name === forceTemplate)
      if (!template) {
        return NextResponse.json(
          { success: false, error: '지정한 템플릿을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          text: problemText,
          images: [{
            position: 0,
            svg: template.svg_code,
            caption: template.description
          }],
          template: template.name,
          analysis: { forced: true }
        }
      })
    }

    // 자동 분석 및 매칭
    const analysis = analyzeQuickly(problemText)
    const matchResult = matchTemplate(analysis)

    // 콘텐츠 처리
    const merged = await processContent(problemText)

    // 형식에 따른 출력
    let output: string | object
    switch (format) {
      case 'html':
        output = mergedContentToHtml(merged)
        break
      case 'markdown':
        output = mergedContentToMarkdown(merged)
        break
      default:
        output = merged
    }

    return NextResponse.json({
      success: true,
      data: output,
      analysis: {
        needed: analysis.needed,
        category: analysis.category,
        subcategory: analysis.subcategory,
        tags: analysis.tags
      },
      match: {
        template: matchResult.template?.name || null,
        score: matchResult.score,
        reason: matchResult.reason
      }
    })
  } catch (error) {
    console.error('템플릿 처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '템플릿 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
