/**
 * 태그 매칭 → 템플릿 선택 로직
 */

import { ImageRequirement, FewshotSample, FewshotCategory, FewshotTag } from '@/types/fewshot'
import {
  findTemplateByKeywords,
  getTemplate,
  TEMPLATES_BY_CATEGORY,
  ALL_TEMPLATES
} from '@/data/fewshot'

interface MatchResult {
  template: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'> | null
  score: number
  reason: string
}

/**
 * ImageRequirement에서 템플릿 찾기
 */
export function matchTemplate(requirement: ImageRequirement): MatchResult {
  if (!requirement.needed) {
    return {
      template: null,
      score: 0,
      reason: '이미지가 필요하지 않음',
    }
  }

  // 카테고리가 illustration이면 템플릿 없음 (DALL-E 사용)
  if (requirement.category === 'illustration') {
    return {
      template: null,
      score: 0,
      reason: '삽화는 DALL-E로 생성 필요',
    }
  }

  // 카테고리 + 서브카테고리로 직접 매칭
  if (requirement.category && requirement.subcategory) {
    const template = getTemplate(requirement.category, requirement.subcategory)
    if (template) {
      return {
        template,
        score: 1.0,
        reason: `정확히 매칭: ${requirement.category}/${requirement.subcategory}`,
      }
    }
  }

  // 카테고리만으로 매칭
  if (requirement.category) {
    const template = getTemplate(requirement.category)
    if (template) {
      return {
        template,
        score: 0.7,
        reason: `카테고리 매칭: ${requirement.category}`,
      }
    }
  }

  // 태그로 매칭
  if (requirement.tags && requirement.tags.length > 0) {
    const matchedTemplate = findTemplateByTags(requirement.tags)
    if (matchedTemplate) {
      return {
        template: matchedTemplate.template,
        score: matchedTemplate.score,
        reason: `태그 매칭: ${requirement.tags.join(', ')}`,
      }
    }
  }

  // 설명에서 키워드 추출하여 매칭
  if (requirement.description) {
    const keywords = extractKeywords(requirement.description)
    const template = findTemplateByKeywords(keywords)
    if (template) {
      return {
        template,
        score: 0.5,
        reason: `키워드 매칭: ${keywords.join(', ')}`,
      }
    }
  }

  return {
    template: null,
    score: 0,
    reason: '매칭되는 템플릿 없음',
  }
}

/**
 * 태그로 템플릿 찾기
 */
function findTemplateByTags(tags: FewshotTag[]): { template: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>; score: number } | null {
  let bestMatch: { template: Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'>; score: number } | null = null

  for (const template of ALL_TEMPLATES) {
    const templateTags = template.tags as FewshotTag[]
    const matchCount = tags.filter(t => templateTags.includes(t)).length
    const score = matchCount / Math.max(tags.length, templateTags.length)

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { template, score }
    }
  }

  return bestMatch
}

/**
 * 텍스트에서 키워드 추출
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = []

  const keywordPatterns = [
    '삼각형', '사각형', '원', '직선', '선분',
    '평행사변형', '직사각형', '정사각형', '마름모', '사다리꼴',
    '높이', '외심', '내심', '무게중심', '닮음', '합동',
    '현', '접선', '호', '부채꼴',
    '함수', '그래프', '좌표',
    '일차', '이차', '삼각함수', '지수', '로그',
  ]

  for (const keyword of keywordPatterns) {
    if (text.includes(keyword)) {
      keywords.push(keyword)
    }
  }

  return keywords
}

/**
 * 여러 요구사항에 대해 배치 매칭
 */
export function matchTemplates(requirements: ImageRequirement[]): MatchResult[] {
  return requirements.map(req => matchTemplate(req))
}

/**
 * 카테고리별 사용 가능한 템플릿 목록
 */
export function getAvailableTemplates(category?: FewshotCategory): string[] {
  if (category) {
    return TEMPLATES_BY_CATEGORY[category].map(t => t.name)
  }
  return ALL_TEMPLATES.map(t => t.name)
}

/**
 * 템플릿 이름으로 직접 가져오기
 */
export function getTemplateByName(name: string): Omit<FewshotSample, 'id' | 'created_at' | 'updated_at'> | null {
  return ALL_TEMPLATES.find(t => t.name === name) || null
}
