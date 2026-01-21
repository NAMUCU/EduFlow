/**
 * Few-shot 템플릿 통합 export
 */

export { TRIANGLE_TEMPLATES } from './triangles'
export { QUADRILATERAL_TEMPLATES } from './quadrilaterals'
export { CIRCLE_TEMPLATES } from './circles'
export { GRAPH_TEMPLATES } from './graphs'
export { COORDINATE_TEMPLATES } from './coordinates'
export { ILLUSTRATION_TEMPLATES, ILLUSTRATION_PROMPTS, findIllustrationPrompt, toDALLERequest } from './illustrations'

import { TRIANGLE_TEMPLATES } from './triangles'
import { QUADRILATERAL_TEMPLATES } from './quadrilaterals'
import { CIRCLE_TEMPLATES } from './circles'
import { GRAPH_TEMPLATES } from './graphs'
import { COORDINATE_TEMPLATES } from './coordinates'
import { ILLUSTRATION_TEMPLATES } from './illustrations'
import { FewshotSample, FewshotCategory } from '@/types/fewshot'

// 모든 템플릿 통합
export const ALL_TEMPLATES = [
  ...TRIANGLE_TEMPLATES,
  ...QUADRILATERAL_TEMPLATES,
  ...CIRCLE_TEMPLATES,
  ...GRAPH_TEMPLATES,
  ...COORDINATE_TEMPLATES,
]

// 카테고리별 템플릿 맵
export const TEMPLATES_BY_CATEGORY: Record<FewshotCategory, Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>[]> = {
  triangle: TRIANGLE_TEMPLATES,
  quadrilateral: QUADRILATERAL_TEMPLATES,
  circle: CIRCLE_TEMPLATES,
  graph: GRAPH_TEMPLATES,
  coordinate: COORDINATE_TEMPLATES,
  illustration: [], // DALL-E로 생성
  other: [],
}

// 키워드로 템플릿 찾기
export function findTemplateByKeywords(keywords: string[]): Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'> | null {
  const keywordSet = new Set(keywords.map(k => k.toLowerCase()))

  // 키워드 매핑
  const categoryMap: Record<string, FewshotCategory> = {
    '삼각형': 'triangle',
    '삼각': 'triangle',
    '사각형': 'quadrilateral',
    '사각': 'quadrilateral',
    '평행사변형': 'quadrilateral',
    '직사각형': 'quadrilateral',
    '정사각형': 'quadrilateral',
    '마름모': 'quadrilateral',
    '사다리꼴': 'quadrilateral',
    '원': 'circle',
    '현': 'circle',
    '접선': 'circle',
    '호': 'circle',
    '부채꼴': 'circle',
    '함수': 'graph',
    '그래프': 'graph',
    '일차함수': 'graph',
    '이차함수': 'graph',
    '삼각함수': 'graph',
    '지수함수': 'graph',
    '로그함수': 'graph',
    '좌표': 'coordinate',
    '좌표평면': 'coordinate',
    '점': 'coordinate',
    '직선': 'coordinate',
    '거리': 'coordinate',
    '중점': 'coordinate',
  }

  const subcategoryMap: Record<string, string> = {
    '높이': 'height',
    '외심': 'circumcenter',
    '내심': 'incenter',
    '무게중심': 'centroid',
    '수심': 'orthocenter',
    '닮음': 'similarity',
    '합동': 'congruence',
    '피타고라스': 'pythagorean',
    '삼각비': 'trigonometry',
    '평행사변형': 'parallelogram',
    '직사각형': 'rectangle',
    '정사각형': 'square',
    '마름모': 'rhombus',
    '사다리꼴': 'trapezoid',
    '대각선': 'diagonal',
    '현': 'chord',
    '접선': 'tangent',
    '내접': 'inscribed',
    '외접': 'circumscribed',
    '호': 'arc',
    '부채꼴': 'sector',
    '일차': 'linear',
    '이차': 'quadratic',
    '삼차': 'cubic',
    '삼각함수': 'trigonometric',
    '지수': 'exponential',
    '로그': 'logarithmic',
  }

  // 카테고리 찾기
  let category: FewshotCategory | null = null
  let subcategory: string | null = null

  for (const keyword of keywords) {
    if (categoryMap[keyword]) {
      category = categoryMap[keyword]
    }
    if (subcategoryMap[keyword]) {
      subcategory = subcategoryMap[keyword]
    }
  }

  if (!category) return null

  const templates = TEMPLATES_BY_CATEGORY[category]

  // 서브카테고리가 있으면 매칭
  if (subcategory) {
    const found = templates.find(t => t.subcategory === subcategory)
    if (found) return found
  }

  // 기본 템플릿 반환
  return templates.find(t => t.subcategory === 'basic') || templates[0] || null
}

// 카테고리와 서브카테고리로 템플릿 찾기
export function getTemplate(
  category: FewshotCategory,
  subcategory?: string
): Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'> | null {
  const templates = TEMPLATES_BY_CATEGORY[category]

  if (subcategory) {
    return templates.find(t => t.subcategory === subcategory) || null
  }

  return templates.find(t => t.subcategory === 'basic') || templates[0] || null
}
