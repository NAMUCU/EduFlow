/**
 * AI 문제 검수 클라이언트
 *
 * 이 모듈은 Claude, Gemini, OpenAI를 사용하여 문제를 검수하는 기능을 제공합니다.
 * 각 AI 모델은 문제의 정확성, 난이도 적절성, 풀이 정확성을 평가하고 개선 제안을 제공합니다.
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import {
  AIModel,
  ProblemForReview,
  ReviewResult,
  ProblemReviewSummary,
} from '@/types/review'

// AI 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

/**
 * 검수 프롬프트 생성
 * 모든 AI 모델에 공통으로 사용되는 검수 지침을 포함합니다.
 */
function createReviewPrompt(
  problem: ProblemForReview,
  subject?: string,
  grade?: string
): string {
  return `
당신은 ${grade || ''} ${subject || ''} 문제 검수 전문가입니다.
다음 문제를 철저히 검수하고 평가해주세요.

## 검수할 문제
- 문제 ID: ${problem.id}
- 문제: ${problem.question}
- 정답: ${problem.answer}
- 풀이: ${problem.solution}
- 난이도: ${problem.difficulty}
- 유형: ${problem.type}
${problem.unit ? `- 단원: ${problem.unit}` : ''}

## 검수 항목
1. **문제 정확성**: 문제에 오류가 있는지, 모호한 표현이 있는지 확인
2. **정답 정확성**: 정답이 맞는지 확인
3. **풀이 정확성**: 풀이 과정이 논리적이고 정확한지 확인
4. **난이도 적절성**: 명시된 난이도(${problem.difficulty})에 맞는지 평가
5. **개선 제안**: 문제, 정답, 풀이를 개선할 수 있는 방법 제안

## 출력 형식 (반드시 이 JSON 형식만 출력)
{
  "accuracy": <0-100 사이 정수, 문제 전체 정확도>,
  "issues": [<발견된 문제점 문자열 배열>],
  "suggestions": [<개선 제안 문자열 배열>],
  "correctedAnswer": "<수정이 필요한 경우 수정된 정답, 없으면 null>",
  "correctedSolution": "<수정이 필요한 경우 수정된 풀이, 없으면 null>",
  "difficultyScore": <0-100 사이 정수, 난이도 적절성 점수>,
  "difficultyComment": "<난이도에 대한 코멘트>"
}

## 주의사항
- 반드시 JSON 형식만 출력하세요 (마크다운 코드블록 없이)
- 한국어로 작성해주세요
- 정확도가 높을수록 좋은 문제입니다
- 문제점이 없으면 빈 배열을 반환하세요
- 수정이 필요 없으면 correctedAnswer, correctedSolution은 null로 반환하세요
`
}

/**
 * JSON 응답 파싱 헬퍼
 */
function parseReviewResponse(
  text: string,
  problemId: number,
  model: AIModel
): ReviewResult {
  try {
    // 마크다운 코드블록 제거
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const data = JSON.parse(cleanedText)

    return {
      problemId,
      model,
      accuracy: data.accuracy ?? 0,
      issues: data.issues ?? [],
      suggestions: data.suggestions ?? [],
      correctedAnswer: data.correctedAnswer || undefined,
      correctedSolution: data.correctedSolution || undefined,
      difficultyScore: data.difficultyScore,
      difficultyComment: data.difficultyComment,
    }
  } catch (error) {
    console.error(`${model} 응답 파싱 실패:`, text)
    return {
      problemId,
      model,
      accuracy: 0,
      issues: ['AI 응답 파싱 실패'],
      suggestions: [],
    }
  }
}

/**
 * Claude를 사용한 문제 검수
 */
export async function reviewWithClaude(
  problems: ProblemForReview[],
  subject?: string,
  grade?: string
): Promise<ReviewResult[]> {
  const results: ReviewResult[] = []

  for (const problem of problems) {
    const startTime = Date.now()
    const prompt = createReviewPrompt(problem, subject, grade)

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const text =
        message.content[0].type === 'text' ? message.content[0].text : ''
      const result = parseReviewResponse(text, problem.id, 'claude')
      result.reviewTime = Date.now() - startTime
      results.push(result)
    } catch (error: any) {
      console.error('Claude 검수 에러:', error)
      results.push({
        problemId: problem.id,
        model: 'claude',
        accuracy: 0,
        issues: [`Claude 검수 실패: ${error.message || '알 수 없는 오류'}`],
        suggestions: [],
        reviewTime: Date.now() - startTime,
      })
    }
  }

  return results
}

/**
 * Gemini를 사용한 문제 검수
 */
export async function reviewWithGemini(
  problems: ProblemForReview[],
  subject?: string,
  grade?: string
): Promise<ReviewResult[]> {
  const results: ReviewResult[] = []
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  for (const problem of problems) {
    const startTime = Date.now()
    const prompt = createReviewPrompt(problem, subject, grade)

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const reviewResult = parseReviewResponse(text, problem.id, 'gemini')
      reviewResult.reviewTime = Date.now() - startTime
      results.push(reviewResult)
    } catch (error: any) {
      console.error('Gemini 검수 에러:', error)
      results.push({
        problemId: problem.id,
        model: 'gemini',
        accuracy: 0,
        issues: [`Gemini 검수 실패: ${error.message || '알 수 없는 오류'}`],
        suggestions: [],
        reviewTime: Date.now() - startTime,
      })
    }
  }

  return results
}

/**
 * OpenAI (ChatGPT)를 사용한 문제 검수
 */
export async function reviewWithOpenAI(
  problems: ProblemForReview[],
  subject?: string,
  grade?: string
): Promise<ReviewResult[]> {
  const results: ReviewResult[] = []

  for (const problem of problems) {
    const startTime = Date.now()
    const prompt = createReviewPrompt(problem, subject, grade)

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1024,
      })

      const text = completion.choices[0]?.message?.content || ''
      const reviewResult = parseReviewResponse(text, problem.id, 'openai')
      reviewResult.reviewTime = Date.now() - startTime
      results.push(reviewResult)
    } catch (error: any) {
      console.error('OpenAI 검수 에러:', error)
      results.push({
        problemId: problem.id,
        model: 'openai',
        accuracy: 0,
        issues: [`OpenAI 검수 실패: ${error.message || '알 수 없는 오류'}`],
        suggestions: [],
        reviewTime: Date.now() - startTime,
      })
    }
  }

  return results
}

/**
 * 여러 AI 모델로 문제 검수 (통합 함수)
 *
 * @param problems - 검수할 문제 목록
 * @param models - 사용할 AI 모델 목록
 * @param subject - 과목 (선택)
 * @param grade - 학년 (선택)
 * @returns 문제별 검수 요약
 */
export async function reviewProblems(
  problems: ProblemForReview[],
  models: AIModel[],
  subject?: string,
  grade?: string
): Promise<ProblemReviewSummary[]> {
  // 각 모델별 검수 실행 (병렬 처리)
  const reviewPromises: Promise<ReviewResult[]>[] = []

  for (const model of models) {
    switch (model) {
      case 'claude':
        reviewPromises.push(reviewWithClaude(problems, subject, grade))
        break
      case 'gemini':
        reviewPromises.push(reviewWithGemini(problems, subject, grade))
        break
      case 'openai':
        reviewPromises.push(reviewWithOpenAI(problems, subject, grade))
        break
    }
  }

  // 모든 검수 결과 수집
  const allResults = await Promise.all(reviewPromises)
  const flatResults = allResults.flat()

  // js-set-map-lookups 규칙: O(n²) → O(n) 최적화
  // 문제 ID별로 미리 그룹화하여 반복 filter 방지
  const reviewsByProblemId = new Map<number, ReviewResult[]>()
  flatResults.forEach((result) => {
    const existing = reviewsByProblemId.get(result.problemId) || []
    existing.push(result)
    reviewsByProblemId.set(result.problemId, existing)
  })

  // 문제별로 결과 그룹화
  const summaries: ProblemReviewSummary[] = problems.map((problem) => {
    const problemReviews = reviewsByProblemId.get(problem.id) || []

    // 평균 정확도 계산
    const accuracies = problemReviews.map((r) => r.accuracy)
    const averageAccuracy =
      accuracies.length > 0
        ? Math.round(
            accuracies.reduce((a, b) => a + b, 0) / accuracies.length
          )
        : 0

    // 합의된 문제점 찾기 (2개 이상의 AI가 동의)
    const allIssues = problemReviews.flatMap((r) => r.issues)
    const issueCount = new Map<string, number>()
    allIssues.forEach((issue) => {
      // 유사한 문제점 그룹화를 위해 정규화
      const normalized = issue.toLowerCase().trim()
      issueCount.set(normalized, (issueCount.get(normalized) || 0) + 1)
    })
    const consensusIssues = Array.from(issueCount.entries())
      .filter(([, count]) => count >= 2 || models.length === 1)
      .map(([issue]) => issue)

    // 합의된 개선 제안 찾기
    const allSuggestions = problemReviews.flatMap((r) => r.suggestions)
    const suggestionCount = new Map<string, number>()
    allSuggestions.forEach((suggestion) => {
      const normalized = suggestion.toLowerCase().trim()
      suggestionCount.set(normalized, (suggestionCount.get(normalized) || 0) + 1)
    })
    const consensusSuggestions = Array.from(suggestionCount.entries())
      .filter(([, count]) => count >= 2 || models.length === 1)
      .map(([suggestion]) => suggestion)

    return {
      problemId: problem.id,
      originalProblem: problem,
      reviews: problemReviews,
      averageAccuracy,
      consensusIssues,
      consensusSuggestions,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    }
  })

  return summaries
}

/**
 * 검수 통계 계산
 */
export function calculateReviewStatistics(
  summaries: ProblemReviewSummary[]
): {
  totalProblems: number
  averageAccuracy: number
  problemsWithIssues: number
  modelAccuracies: Record<AIModel, number>
  topIssues: { issue: string; count: number }[]
} {
  const totalProblems = summaries.length

  // 전체 평균 정확도
  const averageAccuracy =
    totalProblems > 0
      ? Math.round(
          summaries.reduce((acc, s) => acc + s.averageAccuracy, 0) /
            totalProblems
        )
      : 0

  // 문제점이 있는 문제 수
  const problemsWithIssues = summaries.filter(
    (s) => s.consensusIssues.length > 0
  ).length

  // 모델별 평균 정확도
  const modelResults = new Map<AIModel, number[]>()
  summaries.forEach((s) => {
    s.reviews.forEach((r) => {
      const scores = modelResults.get(r.model) || []
      scores.push(r.accuracy)
      modelResults.set(r.model, scores)
    })
  })

  const modelAccuracies: Record<AIModel, number> = {
    claude: 0,
    gemini: 0,
    openai: 0,
  }

  modelResults.forEach((scores, model) => {
    if (scores.length > 0) {
      modelAccuracies[model] = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      )
    }
  })

  // 가장 흔한 문제점 (상위 5개)
  const issueCount = new Map<string, number>()
  summaries.forEach((s) => {
    s.reviews.forEach((r) => {
      r.issues.forEach((issue) => {
        issueCount.set(issue, (issueCount.get(issue) || 0) + 1)
      })
    })
  })

  const topIssues = Array.from(issueCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }))

  return {
    totalProblems,
    averageAccuracy,
    problemsWithIssues,
    modelAccuracies,
    topIssues,
  }
}
