/**
 * SVG 생성 서비스
 * - 동적 SVG 생성
 * - 템플릿 변수 치환
 * - DALL-E 연동 (삽화용)
 */

import { ALL_TEMPLATES, getTemplate } from '@/data/fewshot'
import { findIllustrationPrompt, toDALLERequest } from '@/data/fewshot/illustrations'
import { analyzeQuickly } from '@/lib/image-analyzer'
import { matchTemplate } from '@/lib/template-matcher'
import type { FewshotCategory, MergedContent } from '@/types/fewshot'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

/**
 * 문제 텍스트로부터 적절한 SVG 생성
 */
export async function generateSvgForProblem(
  problemText: string,
  options: {
    forceTemplate?: string
    forceCategory?: FewshotCategory
    variables?: Record<string, string>
  } = {}
): Promise<{ svg: string | null; templateUsed?: string; source: 'template' | 'generated' | 'dalle' | 'none' }> {
  const { forceTemplate, forceCategory, variables = {} } = options

  // 1. 강제 템플릿 지정된 경우
  if (forceTemplate) {
    const template = ALL_TEMPLATES.find(t => t.name === forceTemplate)
    if (template?.svg_code) {
      const svg = applyVariables(template.svg_code, variables)
      return { svg, templateUsed: template.name, source: 'template' }
    }
  }

  // 2. 강제 카테고리 지정된 경우
  if (forceCategory) {
    const template = getTemplate(forceCategory)
    if (template?.svg_code) {
      const svg = applyVariables(template.svg_code, variables)
      return { svg, templateUsed: template.name, source: 'template' }
    }
  }

  // 3. 자동 분석
  const analysis = analyzeQuickly(problemText)

  if (!analysis.needed) {
    return { svg: null, source: 'none' }
  }

  // 4. 삽화가 필요한 경우 (DALL-E 사용)
  if (analysis.category === 'illustration') {
    const keywords = problemText.split(/\s+/).filter(w => w.length > 1)
    const illustrationPrompt = findIllustrationPrompt(keywords)

    if (illustrationPrompt && OPENAI_API_KEY) {
      try {
        const imageUrl = await generateDALLEImage(illustrationPrompt.dallePrompt)
        // 이미지 URL 반환 (SVG가 아님)
        return { svg: imageUrl, source: 'dalle' }
      } catch (error) {
        console.error('DALL-E 생성 실패:', error)
      }
    }

    return { svg: null, source: 'none' }
  }

  // 5. 템플릿 매칭
  const matchResult = matchTemplate(analysis)

  if (matchResult.template?.svg_code) {
    const svg = applyVariables(matchResult.template.svg_code, variables)
    return { svg, templateUsed: matchResult.template.name, source: 'template' }
  }

  return { svg: null, source: 'none' }
}

/**
 * SVG 템플릿에 변수 적용
 */
function applyVariables(svgCode: string, variables: Record<string, string>): string {
  let result = svgCode

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  return result
}

/**
 * DALL-E로 이미지 생성
 */
async function generateDALLEImage(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    return null
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      })
    })

    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.[0]?.url || null
  } catch (error) {
    console.error('DALL-E 이미지 생성 오류:', error)
    return null
  }
}

/**
 * 여러 문제에 대해 일괄 SVG 생성
 */
export async function generateSvgBatch(
  problems: string[],
  options: { concurrency?: number } = {}
): Promise<Array<{ svg: string | null; templateUsed?: string; source: string }>> {
  const { concurrency = 5 } = options
  const results: Array<{ svg: string | null; templateUsed?: string; source: string }> = []

  for (let i = 0; i < problems.length; i += concurrency) {
    const batch = problems.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(p => generateSvgForProblem(p))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * 동적 SVG 생성 (값 기반)
 */
export function generateDynamicSvg(
  type: 'triangle' | 'quadrilateral' | 'circle' | 'graph' | 'coordinate',
  params: Record<string, number | string>
): string {
  switch (type) {
    case 'triangle':
      return generateTriangleSvg(params)
    case 'quadrilateral':
      return generateQuadrilateralSvg(params)
    case 'circle':
      return generateCircleSvg(params)
    case 'graph':
      return generateGraphSvg(params)
    case 'coordinate':
      return generateCoordinateSvg(params)
    default:
      return ''
  }
}

// 동적 삼각형 SVG 생성
function generateTriangleSvg(params: Record<string, number | string>): string {
  const {
    ax = 100, ay = 20,
    bx = 20, by = 160,
    cx = 180, cy = 160,
    labelA = 'A', labelB = 'B', labelC = 'C',
    color = '#333'
  } = params

  return `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${ax},${ay} ${bx},${by} ${cx},${cy}" fill="none" stroke="${color}" stroke-width="2"/>
  <text x="${ax}" y="${Number(ay) - 5}" text-anchor="middle" font-size="12">${labelA}</text>
  <text x="${Number(bx) - 10}" y="${by}" text-anchor="middle" font-size="12">${labelB}</text>
  <text x="${Number(cx) + 10}" y="${cy}" text-anchor="middle" font-size="12">${labelC}</text>
</svg>`
}

// 동적 사각형 SVG 생성
function generateQuadrilateralSvg(params: Record<string, number | string>): string {
  const {
    ax = 30, ay = 30,
    bx = 170, by = 30,
    cx = 170, cy = 150,
    dx = 30, dy = 150,
    color = '#333'
  } = params

  return `<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${ax},${ay} ${bx},${by} ${cx},${cy} ${dx},${dy}" fill="none" stroke="${color}" stroke-width="2"/>
  <text x="${Number(ax) - 10}" y="${ay}" font-size="12">A</text>
  <text x="${Number(bx) + 5}" y="${by}" font-size="12">B</text>
  <text x="${Number(cx) + 5}" y="${cy}" font-size="12">C</text>
  <text x="${Number(dx) - 10}" y="${dy}" font-size="12">D</text>
</svg>`
}

// 동적 원 SVG 생성
function generateCircleSvg(params: Record<string, number | string>): string {
  const {
    cx = 100, cy = 100, r = 60,
    color = '#333',
    showCenter = true
  } = params

  let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2"/>`

  if (showCenter) {
    svg += `<circle cx="${cx}" cy="${cy}" r="3" fill="${color}"/>
  <text x="${Number(cx) + 8}" y="${Number(cy) + 4}" font-size="12">O</text>`
  }

  svg += `</svg>`
  return svg
}

// 동적 그래프 SVG 생성
function generateGraphSvg(params: Record<string, number | string>): string {
  const { xMin = -5, xMax = 5, yMin = -5, yMax = 5 } = params

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead)"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
</svg>`
}

// 동적 좌표평면 SVG 생성
function generateCoordinateSvg(params: Record<string, number | string>): string {
  const { showGrid = false } = params

  let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>`

  if (showGrid) {
    for (let i = 20; i <= 180; i += 20) {
      svg += `<line x1="${i}" y1="20" x2="${i}" y2="180" stroke="#eee" stroke-width="1"/>`
      svg += `<line x1="20" y1="${i}" x2="180" y2="${i}" stroke="#eee" stroke-width="1"/>`
    }
  }

  svg += `
  <line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="100" y1="180" x2="100" y2="20" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="185" y="105" font-size="12">x</text>
  <text x="105" y="18" font-size="12">y</text>
  <text x="92" y="115" font-size="10">O</text>
</svg>`

  return svg
}
