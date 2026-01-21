/**
 * 문제 분석 → 이미지 필요 여부 판단 로직
 */

import { ImageRequirement, FewshotCategory, FewshotTag } from '@/types/fewshot'

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.5-flash' // 빠른 판단용

// 이미지 필요 여부 키워드
const IMAGE_KEYWORDS = {
  // 도형 관련 - 이미지 필요
  geometry: [
    '삼각형', '사각형', '원', '다각형', '직선', '선분', '각',
    '평행', '수직', '대각선', '높이', '넓이', '둘레',
    '외심', '내심', '무게중심', '수심', '외접', '내접',
    '피타고라스', '삼각비', '닮음', '합동',
    '현', '접선', '호', '부채꼴', '중심각', '원주각',
  ],
  // 그래프 관련 - 이미지 필요
  graph: [
    '그래프', '함수', '좌표', '좌표평면',
    '기울기', 'y절편', 'x절편', '교점',
    '이차함수', '일차함수', '삼각함수', '지수함수', '로그함수',
    '포물선', '쌍곡선', '타원',
    '최댓값', '최솟값', '꼭짓점', '축',
  ],
  // 삽화 관련 - DALL-E 필요
  illustration: [
    '실생활', '응용', '활용',
    '거리', '속력', '시간', '농도', '비율',
    '통계', '확률', '표본', '평균',
  ],
  // 이미지 불필요
  noImage: [
    '계산', '식을 간단히', '인수분해', '전개',
    '방정식의 해', '부등식의 해', '풀어라',
    '증명', '설명', '이유',
  ],
}

// 카테고리 매핑
const CATEGORY_MAPPING: Record<string, FewshotCategory> = {
  '삼각형': 'triangle',
  '삼각': 'triangle',
  '피타고라스': 'triangle',
  '삼각비': 'triangle',
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
  '내접': 'circle',
  '외접': 'circle',
  '함수': 'graph',
  '그래프': 'graph',
  '좌표': 'coordinate',
  '좌표평면': 'coordinate',
  '실생활': 'illustration',
  '응용': 'illustration',
  '통계': 'illustration',
  '확률': 'illustration',
}

// 서브카테고리 매핑
const SUBCATEGORY_MAPPING: Record<string, string> = {
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
  '일차함수': 'linear',
  '이차함수': 'quadratic',
  '삼차함수': 'cubic',
  '삼각함수': 'trigonometric',
  '지수함수': 'exponential',
  '로그함수': 'logarithmic',
  '점': 'point',
  '직선': 'line',
  '거리': 'distance',
  '중점': 'midpoint',
  '영역': 'region',
}

// 태그 매핑
const TAG_KEYWORDS: Record<string, FewshotTag> = {
  '점선': 'dotted_line',
  '보조선': 'auxiliary_line',
  '높이': 'height_line',
  '각도': 'angle_mark',
  '직각': 'right_angle',
  '평행': 'parallel_mark',
  '같은': 'equal_mark',
  '화살표': 'arrow',
  '음영': 'shading',
  '격자': 'grid',
  '축': 'axis',
}

/**
 * 키워드 기반 빠른 분석 (LLM 호출 없이)
 */
export function analyzeQuickly(problemText: string): ImageRequirement {
  const text = problemText.toLowerCase()

  // 이미지 불필요 키워드 체크
  for (const keyword of IMAGE_KEYWORDS.noImage) {
    if (text.includes(keyword)) {
      // 도형/그래프 키워드도 있으면 이미지 필요
      const hasGeometry = IMAGE_KEYWORDS.geometry.some(k => text.includes(k))
      const hasGraph = IMAGE_KEYWORDS.graph.some(k => text.includes(k))
      if (!hasGeometry && !hasGraph) {
        return { needed: false }
      }
    }
  }

  // 카테고리 찾기
  let category: FewshotCategory | undefined
  let subcategory: string | undefined
  const tags: FewshotTag[] = []

  for (const [keyword, cat] of Object.entries(CATEGORY_MAPPING)) {
    if (text.includes(keyword)) {
      category = cat
      break
    }
  }

  for (const [keyword, subcat] of Object.entries(SUBCATEGORY_MAPPING)) {
    if (text.includes(keyword)) {
      subcategory = subcat
      break
    }
  }

  for (const [keyword, tag] of Object.entries(TAG_KEYWORDS)) {
    if (text.includes(keyword)) {
      tags.push(tag)
    }
  }

  // 도형/그래프 키워드가 있으면 이미지 필요
  const hasGeometry = IMAGE_KEYWORDS.geometry.some(k => text.includes(k))
  const hasGraph = IMAGE_KEYWORDS.graph.some(k => text.includes(k))
  const hasIllustration = IMAGE_KEYWORDS.illustration.some(k => text.includes(k))

  if (hasGeometry || hasGraph || hasIllustration) {
    return {
      needed: true,
      category,
      subcategory,
      tags: tags.length > 0 ? tags : undefined,
      description: problemText.slice(0, 100),
    }
  }

  return { needed: false }
}

/**
 * LLM 기반 정밀 분석
 */
export async function analyzeWithLLM(problemText: string): Promise<ImageRequirement> {
  // 먼저 빠른 분석
  const quickResult = analyzeQuickly(problemText)

  // 이미지가 확실히 불필요하면 LLM 호출 생략
  if (!quickResult.needed && !problemText.includes('그림') && !problemText.includes('도형')) {
    return quickResult
  }

  // LLM 호출
  if (!GEMINI_API_KEY) {
    return quickResult // API 키 없으면 빠른 분석 결과 반환
  }

  try {
    const prompt = `다음 수학 문제를 분석하여 이미지/도형이 필요한지 판단하세요.

문제: ${problemText}

다음 JSON 형식으로 응답:
{
  "needed": true/false,
  "category": "triangle" | "quadrilateral" | "circle" | "graph" | "coordinate" | "illustration" | null,
  "subcategory": "height" | "circumcenter" | "linear" | "quadratic" 등 또는 null,
  "tags": ["dotted_line", "angle_mark", "auxiliary_line"] 등 또는 [],
  "description": "필요한 이미지 설명 (50자 이내)"
}

판단 기준:
- 도형 문제 (삼각형, 사각형, 원 등) → needed: true
- 그래프 문제 (함수, 좌표 등) → needed: true
- 실생활 응용 문제 → needed: true (illustration)
- 단순 계산, 방정식 풀이 → needed: false`

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    if (!response.ok) {
      return quickResult
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        needed: parsed.needed ?? false,
        category: parsed.category || undefined,
        subcategory: parsed.subcategory || undefined,
        tags: parsed.tags || undefined,
        description: parsed.description || undefined,
      }
    }

    return quickResult
  } catch (error) {
    console.error('LLM 분석 오류:', error)
    return quickResult
  }
}

/**
 * 배치 분석 (여러 문제 동시 분석)
 */
export async function analyzeBatch(problems: string[]): Promise<ImageRequirement[]> {
  const results = await Promise.all(
    problems.map(p => analyzeQuickly(p)) // 빠른 분석 사용
  )
  return results
}
