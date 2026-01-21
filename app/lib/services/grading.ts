/**
 * 일반 자동 채점 서비스
 *
 * 간단한 채점 로직을 제공하는 서비스입니다.
 * - 객관식 채점
 * - 단답형 채점 (유사도 포함)
 * - 서술형 채점 (AI 평가)
 *
 * Mock 모드 지원: isConfigured() 패턴 사용
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// ============================================
// 타입 정의
// ============================================

export interface MultipleChoiceResult {
  isCorrect: boolean
  score: number
}

export interface ShortAnswerResult {
  isCorrect: boolean
  score: number
  similarity: number
}

export interface EssayResult {
  score: number
  feedback: string
  details: {
    accuracy: number      // 정확성 (0-100)
    completeness: number  // 완성도 (0-100)
    logic: number         // 논리성 (0-100)
    expression: number    // 표현력 (0-100)
  }
}

export interface GradingRubric {
  criteria: string
  maxScore: number
  keyPoints?: string[]
}

// ============================================
// 설정 확인 함수
// ============================================

/**
 * Gemini API가 설정되어 있는지 확인
 */
export const isConfigured = (): boolean => {
  return !!process.env.GEMINI_API_KEY
}

let genAIClient: GoogleGenerativeAI | null = null

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  }
  return genAIClient
}

// ============================================
// Mock 데이터
// ============================================

const mockEssayResult: EssayResult = {
  score: 75,
  feedback: '핵심 개념을 잘 이해하고 있습니다. 논리적 전개를 좀 더 명확하게 하면 좋겠습니다.',
  details: {
    accuracy: 80,
    completeness: 70,
    logic: 75,
    expression: 75
  }
}

// ============================================
// 채점 함수
// ============================================

/**
 * 객관식 문제 채점
 *
 * @param studentAnswer - 학생 답안 (예: "A", "1", "①")
 * @param correctAnswer - 정답 (예: "A", "1", "①")
 * @returns 채점 결과 { isCorrect, score }
 */
export function gradeMultipleChoice(
  studentAnswer: string,
  correctAnswer: string
): MultipleChoiceResult {
  // 답안 정규화
  const normalizedStudent = normalizeMultipleChoiceAnswer(studentAnswer)
  const normalizedCorrect = normalizeMultipleChoiceAnswer(correctAnswer)

  const isCorrect = normalizedStudent === normalizedCorrect

  return {
    isCorrect,
    score: isCorrect ? 100 : 0
  }
}

/**
 * 단답형 문제 채점
 *
 * @param studentAnswer - 학생 답안
 * @param correctAnswer - 정답 (쉼표로 구분된 복수 정답 가능)
 * @returns 채점 결과 { isCorrect, score, similarity }
 */
export function gradeShortAnswer(
  studentAnswer: string,
  correctAnswer: string
): ShortAnswerResult {
  // 정답 목록 (쉼표 구분)
  const correctAnswers = correctAnswer.split(',').map(a => a.trim().toLowerCase())
  const normalizedStudent = studentAnswer.trim().toLowerCase().replace(/\s+/g, '')

  // 정확히 일치하는지 확인
  const exactMatch = correctAnswers.some(correct => {
    const normalizedCorrect = correct.replace(/\s+/g, '')
    return normalizedStudent === normalizedCorrect
  })

  if (exactMatch) {
    return {
      isCorrect: true,
      score: 100,
      similarity: 1.0
    }
  }

  // 유사도 계산
  const maxSimilarity = Math.max(
    ...correctAnswers.map(correct =>
      calculateLevenshteinSimilarity(normalizedStudent, correct.replace(/\s+/g, ''))
    )
  )

  // 유사도에 따른 점수 계산
  let score = 0
  if (maxSimilarity >= 0.9) {
    score = 90  // 90% 이상 유사 -> 90점
  } else if (maxSimilarity >= 0.8) {
    score = 70  // 80% 이상 유사 -> 70점
  } else if (maxSimilarity >= 0.6) {
    score = 40  // 60% 이상 유사 -> 40점
  }

  return {
    isCorrect: false,
    score,
    similarity: maxSimilarity
  }
}

/**
 * 서술형 문제 채점 (AI 사용)
 *
 * @param studentAnswer - 학생 답안
 * @param correctAnswer - 모범 답안
 * @param rubric - 채점 기준 (선택)
 * @returns 채점 결과 { score, feedback, details }
 */
export async function gradeEssay(
  studentAnswer: string,
  correctAnswer: string,
  rubric?: string
): Promise<EssayResult> {
  // API가 설정되지 않은 경우 Mock 데이터 반환
  if (!isConfigured()) {
    // Mock 모드: 답안 길이에 따른 기본 점수 계산
    const lengthRatio = Math.min(studentAnswer.length / correctAnswer.length, 1.5)
    const baseScore = Math.round(50 + (lengthRatio * 30))

    return {
      ...mockEssayResult,
      score: Math.min(baseScore, 95),
      feedback: `[Mock 모드] ${mockEssayResult.feedback}`
    }
  }

  // 답안이 너무 짧은 경우
  if (studentAnswer.trim().length < 10) {
    return {
      score: 0,
      feedback: '답안이 너무 짧습니다. 충분한 내용을 작성해주세요.',
      details: {
        accuracy: 0,
        completeness: 0,
        logic: 0,
        expression: 0
      }
    }
  }

  try {
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
당신은 서술형 답안을 채점하는 전문 교사입니다.

## 모범 답안
${correctAnswer}

${rubric ? `## 채점 기준\n${rubric}` : ''}

## 학생 답안
${studentAnswer}

## 평가 기준
- accuracy (정확성, 40%): 핵심 개념 이해도
- completeness (완성도, 30%): 요구 내용 포함 여부
- logic (논리성, 20%): 논리적 전개
- expression (표현력, 10%): 용어 및 문장 표현

아래 JSON 형식으로만 응답하세요:
{
  "score": <0-100 정수>,
  "feedback": "<종합 피드백 1-2문장>",
  "details": {
    "accuracy": <0-100>,
    "completeness": <0-100>,
    "logic": <0-100>,
    "expression": <0-100>
  }
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 파싱
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    return {
      score: parsed.score,
      feedback: parsed.feedback,
      details: {
        accuracy: parsed.details.accuracy,
        completeness: parsed.details.completeness,
        logic: parsed.details.logic,
        expression: parsed.details.expression
      }
    }
  } catch (error) {
    console.error('서술형 채점 오류:', error)

    // 오류 시 기본 응답
    return {
      score: 0,
      feedback: 'AI 채점 중 오류가 발생했습니다. 수동 채점이 필요합니다.',
      details: {
        accuracy: 0,
        completeness: 0,
        logic: 0,
        expression: 0
      }
    }
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 객관식 답안 정규화
 * 다양한 형식의 답안을 통일된 형식으로 변환
 */
function normalizeMultipleChoiceAnswer(answer: string): string {
  const normalized = answer.trim().toLowerCase()

  // 숫자/기호 -> 알파벳 변환 맵
  const conversionMap: Record<string, string> = {
    '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e',
    '①': 'a', '②': 'b', '③': 'c', '④': 'd', '⑤': 'e',
    '가': 'a', '나': 'b', '다': 'c', '라': 'd', '마': 'e'
  }

  return conversionMap[normalized] || normalized
}

/**
 * Levenshtein Distance 기반 문자열 유사도 계산
 * @returns 0~1 사이 유사도 (1 = 완전 일치)
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0

  // DP 테이블 생성
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Levenshtein Distance 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 삭제
        matrix[i][j - 1] + 1,      // 삽입
        matrix[i - 1][j - 1] + cost // 대체
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLength = Math.max(len1, len2)

  return 1 - distance / maxLength
}
