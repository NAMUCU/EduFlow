/**
 * 커리큘럼 생성기 + SVG 템플릿 시스템 통합
 * - 문제 생성 시 자동으로 SVG 도형 추가
 * - 템플릿 매칭 기반 이미지 생성
 */

import { analyzeQuickly, analyzeWithLLM } from './image-analyzer'
import { matchTemplate, getTemplateByName } from './template-matcher'
import { processContent, mergeContentWithImage, processBatch } from './content-merger'
import { svgToPdfImage, mergedContentToPdfHtml } from './pdf-svg-converter'
import type { MergedContent, ImageRequirement } from '@/types/fewshot'

interface GeneratedProblem {
  text: string
  answer: string
  solution?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface EnhancedProblem extends GeneratedProblem {
  mergedContent: MergedContent
  html: string
  hasImage: boolean
  templateUsed?: string
}

/**
 * 단일 문제에 SVG 이미지 추가
 */
export async function enhanceProblemWithSvg(
  problem: GeneratedProblem,
  options: {
    useLLM?: boolean
    forceTemplate?: string
  } = {}
): Promise<EnhancedProblem> {
  const { useLLM = false, forceTemplate } = options

  // 강제 템플릿 사용
  if (forceTemplate) {
    const template = getTemplateByName(forceTemplate)
    if (template && template.svg_code) {
      const mergedContent = mergeContentWithImage(
        problem.text,
        template.svg_code,
        null,
        { imagePosition: 'before', addCaption: true }
      )

      return {
        ...problem,
        mergedContent,
        html: mergedContentToPdfHtml(mergedContent),
        hasImage: true,
        templateUsed: template.name
      }
    }
  }

  // 자동 분석 및 템플릿 매칭
  const analysis = useLLM
    ? await analyzeWithLLM(problem.text)
    : analyzeQuickly(problem.text)

  if (!analysis.needed) {
    return {
      ...problem,
      mergedContent: { text: problem.text, images: [] },
      html: `<div>${problem.text}</div>`,
      hasImage: false
    }
  }

  const mergedContent = await processContent(problem.text)
  const matchResult = matchTemplate(analysis)

  return {
    ...problem,
    mergedContent,
    html: mergedContentToPdfHtml(mergedContent),
    hasImage: mergedContent.images.length > 0,
    templateUsed: matchResult.template?.name
  }
}

/**
 * 여러 문제에 SVG 이미지 일괄 추가
 * Best Practice: Promise.all()로 병렬 처리
 */
export async function enhanceProblemsWithSvg(
  problems: GeneratedProblem[],
  options: {
    useLLM?: boolean
    concurrency?: number
  } = {}
): Promise<EnhancedProblem[]> {
  const { concurrency = 10 } = options

  // Best Practice 1.4: Promise.all() for Independent Operations
  // 병렬 처리 (concurrency 단위로 배치)
  const results: EnhancedProblem[] = []

  for (let i = 0; i < problems.length; i += concurrency) {
    const batch = problems.slice(i, i + concurrency)
    // 각 배치 내에서 완전 병렬 실행
    const batchResults = await Promise.all(
      batch.map(p => enhanceProblemWithSvg(p, options))
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * 문제 유형별 권장 템플릿 조회
 */
export function getRecommendedTemplates(problemText: string): {
  analysis: ImageRequirement
  recommendations: Array<{ name: string; score: number; reason: string }>
} {
  const analysis = analyzeQuickly(problemText)

  if (!analysis.needed) {
    return {
      analysis,
      recommendations: []
    }
  }

  const matchResult = matchTemplate(analysis)
  const recommendations = []

  if (matchResult.template) {
    recommendations.push({
      name: matchResult.template.name,
      score: matchResult.score,
      reason: matchResult.reason
    })
  }

  return {
    analysis,
    recommendations
  }
}

/**
 * 커리큘럼 단원별 기본 템플릿 매핑
 */
export const UNIT_TEMPLATE_MAP: Record<string, string> = {
  // 중1
  '기본 도형': '삼각형-기본',
  '작도와 합동': '삼각형-합동',
  '평면도형의 성질': '삼각형-기본',
  '입체도형의 성질': '삼각형-기본',

  // 중2
  '삼각형의 성질': '삼각형-높이',
  '사각형의 성질': '사각형-기본',
  '도형의 닮음': '삼각형-닮음',
  '피타고라스 정리': '삼각형-피타고라스',

  // 중3
  '삼각비': '삼각형-삼각비',
  '원의 성질': '원-기본',

  // 고등 수학
  '도형의 방정식': '좌표평면-점',
  '직선의 방정식': '좌표평면-직선',
  '원의 방정식': '원-좌표',
  '도형의 이동': '좌표평면-점',

  // 수학 I
  '삼각함수': '그래프-삼각함수',
  '등차수열과 등비수열': '그래프-기본',

  // 수학 II
  '함수의 극한': '그래프-기본',
  '다항함수의 미분': '그래프-이차함수',
  '다항함수의 적분': '그래프-이차함수',

  // 미적분
  '수열의 극한': '그래프-기본',
  '여러 가지 함수의 미분': '그래프-삼각함수',
  '여러 가지 적분법': '그래프-삼각함수',

  // 기하
  '이차곡선': '좌표평면-영역',
  '평면벡터': '좌표평면-거리',
  '공간도형과 공간좌표': '삼각형-기본',
}

/**
 * 단원 이름으로 기본 템플릿 가져오기
 */
export function getDefaultTemplateForUnit(unitName: string): string | null {
  // 정확한 매칭
  if (UNIT_TEMPLATE_MAP[unitName]) {
    return UNIT_TEMPLATE_MAP[unitName]
  }

  // 부분 매칭
  for (const [key, template] of Object.entries(UNIT_TEMPLATE_MAP)) {
    if (unitName.includes(key) || key.includes(unitName)) {
      return template
    }
  }

  return null
}

/**
 * 문제지 생성 (SVG 포함)
 */
export async function generateProblemSheet(
  problems: GeneratedProblem[],
  options: {
    title?: string
    includeAnswers?: boolean
    includeSolutions?: boolean
  } = {}
): Promise<{
  problemsHtml: string
  answersHtml?: string
  stats: {
    total: number
    withImages: number
    templatesUsed: Record<string, number>
  }
}> {
  const { title = '문제지', includeAnswers = true, includeSolutions = true } = options

  // 문제 강화
  const enhanced = await enhanceProblemsWithSvg(problems)

  // 통계
  const stats = {
    total: enhanced.length,
    withImages: enhanced.filter(p => p.hasImage).length,
    templatesUsed: {} as Record<string, number>
  }

  for (const p of enhanced) {
    if (p.templateUsed) {
      stats.templatesUsed[p.templateUsed] = (stats.templatesUsed[p.templateUsed] || 0) + 1
    }
  }

  // 문제지 HTML 생성
  let problemsHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .problem { margin: 30px 0; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; }
    .problem-number { font-weight: bold; color: #2563eb; font-size: 16px; margin-bottom: 10px; }
    .difficulty { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 10px; }
    .easy { background: #dcfce7; color: #166534; }
    .medium { background: #fef9c3; color: #854d0e; }
    .hard { background: #fee2e2; color: #991b1b; }
    @media print { .problem { border: none; border-bottom: 1px solid #ddd; } }
  </style>
</head>
<body>
<h1>${title}</h1>
`

  const difficultyLabels = { easy: '쉬움', medium: '보통', hard: '어려움' }

  enhanced.forEach((p, i) => {
    problemsHtml += `
<div class="problem">
  <div class="problem-number">
    ${i + 1}번
    <span class="difficulty ${p.difficulty}">${difficultyLabels[p.difficulty]}</span>
  </div>
  ${p.html}
</div>
`
  })

  problemsHtml += '</body></html>'

  // 정답지 HTML 생성
  let answersHtml: string | undefined
  if (includeAnswers) {
    answersHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - 정답</title>
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; }
    .answer { margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
    .answer-num { font-weight: bold; color: #2563eb; }
    .answer-val { color: #16a34a; font-weight: bold; margin-left: 10px; }
    .solution { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd; color: #666; font-size: 13px; }
  </style>
</head>
<body>
<h1>${title} - 정답 및 풀이</h1>
`

    enhanced.forEach((p, i) => {
      answersHtml += `
<div class="answer">
  <span class="answer-num">${i + 1}번</span>
  <span class="answer-val">${p.answer}</span>
  ${includeSolutions && p.solution ? `<div class="solution">${p.solution}</div>` : ''}
</div>
`
    })

    answersHtml += '</body></html>'
  }

  return {
    problemsHtml,
    answersHtml,
    stats
  }
}
