/**
 * 템플릿 미리보기 API
 * GET: 템플릿 이름으로 SVG 미리보기 이미지 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { ALL_TEMPLATES } from '@/data/fewshot'
import { normalizeSvg } from '@/lib/svg-renderer'

/**
 * GET /api/templates/preview?name={templateName}
 * SVG 이미지를 직접 반환 (이미지 태그 src로 사용 가능)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const width = parseInt(searchParams.get('width') || '200')
    const height = parseInt(searchParams.get('height') || '200')

    if (!name) {
      return NextResponse.json(
        { error: '템플릿 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    const template = ALL_TEMPLATES.find(t => t.name === name)

    if (!template || !template.svg_code) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // SVG 정규화
    const normalizedSvg = normalizeSvg(template.svg_code, { width, height })

    // SVG 이미지로 반환
    return new NextResponse(normalizedSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('템플릿 미리보기 오류:', error)
    return NextResponse.json(
      { error: '미리보기 생성 실패' },
      { status: 500 }
    )
  }
}
