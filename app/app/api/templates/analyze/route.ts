/**
 * 문제 분석 API
 * POST: 문제 텍스트 분석 → 이미지 필요 여부 판단
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeQuickly, analyzeWithLLM, analyzeBatch } from '@/lib/image-analyzer'

/**
 * POST /api/templates/analyze
 * Body:
 * - text: 분석할 문제 텍스트 (필수)
 * - texts: 배치 분석할 문제 텍스트 배열 (선택, text 대신 사용)
 * - useLLM: LLM 정밀 분석 사용 여부 (선택, 기본 false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, texts, useLLM = false } = body

    // 배치 분석
    if (texts && Array.isArray(texts)) {
      if (texts.length > 50) {
        return NextResponse.json(
          { success: false, error: '한 번에 최대 50개까지 분석 가능합니다.' },
          { status: 400 }
        )
      }

      const results = await analyzeBatch(texts)
      return NextResponse.json({
        success: true,
        data: results,
        total: results.length,
        needingImage: results.filter(r => r.needed).length
      })
    }

    // 단일 분석
    if (!text) {
      return NextResponse.json(
        { success: false, error: '분석할 텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    const result = useLLM
      ? await analyzeWithLLM(text)
      : analyzeQuickly(text)

    return NextResponse.json({
      success: true,
      data: result,
      method: useLLM ? 'llm' : 'keyword'
    })
  } catch (error) {
    console.error('문제 분석 오류:', error)
    return NextResponse.json(
      { success: false, error: '문제 분석에 실패했습니다.' },
      { status: 500 }
    )
  }
}
