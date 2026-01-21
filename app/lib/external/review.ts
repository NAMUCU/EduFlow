/**
 * 멀티 LLM 문제 검수 통합 서비스
 * Claude, Gemini, ChatGPT 중 선택하여 검수
 */

import * as claude from './claude'
import * as gemini from './gemini'
import * as openai from './openai'

export type ReviewProvider = 'claude' | 'gemini' | 'openai'

export interface ReviewInput {
  problem: { question: string; answer: string; solution: string; options?: string[] }
  providers: ReviewProvider[]
  criteria?: string[]
}

export interface ReviewResult {
  provider: ReviewProvider
  isValid: boolean
  score: number
  issues: Array<{ type: 'error' | 'warning' | 'suggestion'; message: string }>
  error?: string
}

export interface AggregatedReviewResult {
  results: ReviewResult[]
  consensus: { isValid: boolean; averageScore: number; allIssues: Array<{ provider: ReviewProvider; type: string; message: string }> }
  recommendation: 'approve' | 'revise' | 'reject'
}

export async function reviewWithProvider(provider: ReviewProvider, input: Omit<ReviewInput, 'providers'>): Promise<ReviewResult> {
  const reviewFn = { claude: claude.reviewProblem, gemini: gemini.reviewProblem, openai: openai.reviewProblem }[provider]
  const result = await reviewFn({ problem: input.problem, criteria: input.criteria })
  if (result.error || !result.data) return { provider, isValid: false, score: 0, issues: [], error: result.error || '검수 실패' }
  return { provider, ...result.data }
}

export async function reviewWithMultipleProviders(input: ReviewInput): Promise<AggregatedReviewResult> {
  const results = await Promise.all(input.providers.map(provider => reviewWithProvider(provider, input)))

  const validResults = results.filter(r => !r.error)
  const isValid = validResults.length > 0 && validResults.filter(r => r.isValid).length > validResults.length / 2
  const averageScore = validResults.length > 0 ? Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length) : 0
  const allIssues = results.flatMap(r => r.issues.map(i => ({ provider: r.provider, type: i.type, message: i.message })))

  let recommendation: 'approve' | 'revise' | 'reject' = 'approve'
  if (averageScore < 60 || allIssues.some(i => i.type === 'error')) recommendation = 'reject'
  else if (averageScore < 80 || allIssues.some(i => i.type === 'warning')) recommendation = 'revise'

  return { results, consensus: { isValid, averageScore, allIssues }, recommendation }
}

export async function quickReview(problem: { question: string; answer: string; solution: string }): Promise<{ isValid: boolean; score: number; message: string }> {
  const result = await reviewWithProvider('claude', { problem })
  if (result.error) return { isValid: false, score: 0, message: result.error }
  const mainIssue = result.issues[0]?.message || (result.isValid ? '문제 없음' : '검토 필요')
  return { isValid: result.isValid, score: result.score, message: mainIssue }
}

export async function fullReview(problem: { question: string; answer: string; solution: string }, criteria?: string[]): Promise<AggregatedReviewResult> {
  return reviewWithMultipleProviders({ problem, providers: ['claude', 'gemini', 'openai'], criteria })
}
