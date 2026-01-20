/**
 * EduFlow 자동 채점 유틸리티
 *
 * 이 파일은 다양한 문제 유형에 대한 채점 로직을 제공합니다.
 * - 객관식, 단답형, O/X, 서술형 문제 채점
 * - Gemini AI를 활용한 서술형 답안 평가
 * - 부분 점수 지원
 *
 * Vercel Best Practices 적용:
 * - async-parallel: 여러 문제 채점 시 Promise.all 사용
 * - server-cache-react: 동일 문제 정답 조회 캐싱
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { cache } from 'react'
import { createServerSupabaseClient } from './supabase'
import type {
  ProblemType,
  ProblemDifficulty,
  Problem,
} from '@/types/database'
import type {
  GradingOptions,
  GradingContext,
  ProblemGradingResult,
  ProblemWithAnswer,
  AIEssayEvaluation,
  EssayCriteriaScore,
  EssayCriteria,
  GradingSummary,
  TypeAccuracy,
  DifficultyAccuracy,
  DEFAULT_GRADING_OPTIONS,
  DEFAULT_SCORES_BY_TYPE,
  DIFFICULTY_SCORE_MULTIPLIER,
  ESSAY_CRITERIA_WEIGHTS,
} from '@/types/grading'

// Gemini AI 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ============================================
// 캐싱된 문제 조회 함수 (React Server Cache)
// ============================================

/**
 * 문제 조회 결과 타입 (Supabase 쿼리용)
 */
interface ProblemQueryResult {
  id: string
  type: string
  difficulty: string
  question: string
  answer: string
  solution: string | null
  options: { id: string; text: string; is_correct?: boolean }[] | null
}

/**
 * 문제 ID로 문제 정보 조회 (캐싱됨)
 * React의 cache() 함수를 사용하여 동일한 요청 내에서 중복 조회 방지
 */
export const getProblemById = cache(async (problemId: string): Promise<ProblemWithAnswer | null> => {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('problems')
    .select('id, type, difficulty, question, answer, solution, options')
    .eq('id', problemId)
    .single() as { data: ProblemQueryResult | null; error: unknown }

  if (error || !data) {
    console.error(`문제 조회 실패 (ID: ${problemId}):`, error)
    return null
  }

  // 문제 유형과 난이도에 따른 배점 계산
  const baseScore = getDefaultScoreByType(data.type as ProblemType)
  const multiplier = getDifficultyMultiplier(data.difficulty as ProblemDifficulty)
  const maxScore = Math.round(baseScore * multiplier)

  return {
    id: data.id,
    type: data.type as ProblemType,
    difficulty: data.difficulty as ProblemDifficulty,
    question: data.question,
    answer: data.answer,
    solution: data.solution,
    options: data.options as ProblemWithAnswer['options'],
    max_score: maxScore,
  }
})

/**
 * 여러 문제를 병렬로 조회 (Promise.all 사용)
 */
export async function getProblemsById(problemIds: string[]): Promise<Map<string, ProblemWithAnswer>> {
  const problemMap = new Map<string, ProblemWithAnswer>()

  // 병렬로 문제 조회
  const problems = await Promise.all(
    problemIds.map(id => getProblemById(id))
  )

  // Map에 저장
  problems.forEach((problem, index) => {
    if (problem) {
      problemMap.set(problemIds[index], problem)
    }
  })

  return problemMap
}

// ============================================
// 문제 유형별 채점 함수
// ============================================

/**
 * 객관식 문제 채점
 * 보기 번호(1, 2, 3, 4 또는 A, B, C, D)를 비교하여 정답 여부 판정
 */
function gradeMultipleChoice(
  context: GradingContext
): Omit<ProblemGradingResult, 'grading_time_ms'> {
  const { problem, student_answer, options } = context

  // 답안 정규화 (공백 제거, 대문자 변환)
  const normalizedStudentAnswer = normalizeAnswer(student_answer, options)
  const normalizedCorrectAnswer = normalizeAnswer(problem.answer, options)

  const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer
  const score = isCorrect ? problem.max_score : 0

  // 피드백 생성
  let feedback = ''
  if (options.generate_feedback) {
    if (isCorrect) {
      feedback = '정답입니다!'
    } else {
      feedback = `오답입니다. 정답은 ${problem.answer}입니다.`
      if (problem.solution) {
        feedback += ` 풀이: ${problem.solution}`
      }
    }
  }

  return {
    problem_id: problem.id,
    problem_type: problem.type,
    is_correct: isCorrect,
    score,
    max_score: problem.max_score,
    score_percentage: Math.round((score / problem.max_score) * 100),
    correct_answer: problem.answer,
    student_answer,
    feedback,
  }
}

/**
 * O/X 문제 채점
 */
function gradeTrueFalse(
  context: GradingContext
): Omit<ProblemGradingResult, 'grading_time_ms'> {
  const { problem, student_answer, options } = context

  // O/X, true/false, T/F 등 다양한 형식 정규화
  const normalizedStudent = normalizeTrueFalse(student_answer)
  const normalizedCorrect = normalizeTrueFalse(problem.answer)

  const isCorrect = normalizedStudent === normalizedCorrect
  const score = isCorrect ? problem.max_score : 0

  let feedback = ''
  if (options.generate_feedback) {
    if (isCorrect) {
      feedback = '정답입니다!'
    } else {
      const answerText = normalizedCorrect === 'true' ? 'O (참)' : 'X (거짓)'
      feedback = `오답입니다. 정답은 ${answerText}입니다.`
      if (problem.solution) {
        feedback += ` 풀이: ${problem.solution}`
      }
    }
  }

  return {
    problem_id: problem.id,
    problem_type: problem.type,
    is_correct: isCorrect,
    score,
    max_score: problem.max_score,
    score_percentage: Math.round((score / problem.max_score) * 100),
    correct_answer: problem.answer,
    student_answer,
    feedback,
  }
}

/**
 * 단답형 문제 채점
 * 부분 점수 지원 (유사도 기반)
 */
function gradeShortAnswer(
  context: GradingContext
): Omit<ProblemGradingResult, 'grading_time_ms'> {
  const { problem, student_answer, options } = context

  // 답안 정규화
  let normalizedStudent = student_answer.trim()
  let normalizedCorrect = problem.answer.trim()

  if (options.ignore_whitespace) {
    normalizedStudent = normalizedStudent.replace(/\s+/g, '')
    normalizedCorrect = normalizedCorrect.replace(/\s+/g, '')
  }

  if (!options.case_sensitive) {
    normalizedStudent = normalizedStudent.toLowerCase()
    normalizedCorrect = normalizedCorrect.toLowerCase()
  }

  // 정답 비교 (쉼표로 구분된 복수 정답 지원)
  const correctAnswers = normalizedCorrect.split(',').map(a => a.trim())
  const isExactMatch = correctAnswers.some(correct =>
    normalizedStudent === correct
  )

  let score: number
  let isCorrect: boolean
  let scorePercentage: number

  if (isExactMatch) {
    // 완전 일치
    isCorrect = true
    score = problem.max_score
    scorePercentage = 100
  } else if (options.allow_partial_credit) {
    // 부분 점수 계산 (유사도 기반)
    const maxSimilarity = Math.max(
      ...correctAnswers.map(correct => calculateSimilarity(normalizedStudent, correct))
    )

    if (maxSimilarity >= 0.8) {
      // 80% 이상 유사 - 부분 점수
      isCorrect = false
      scorePercentage = Math.round(maxSimilarity * 80) // 최대 80% 점수
      score = Math.round((scorePercentage / 100) * problem.max_score)
    } else {
      // 유사도 낮음 - 0점
      isCorrect = false
      score = 0
      scorePercentage = 0
    }
  } else {
    // 부분 점수 미지원 - 0점
    isCorrect = false
    score = 0
    scorePercentage = 0
  }

  // 피드백 생성
  let feedback = ''
  if (options.generate_feedback) {
    if (isCorrect) {
      feedback = '정답입니다!'
    } else if (score > 0) {
      feedback = `부분 정답입니다. 정답은 "${problem.answer}"입니다.`
    } else {
      feedback = `오답입니다. 정답은 "${problem.answer}"입니다.`
    }
    if (!isCorrect && problem.solution) {
      feedback += ` 풀이: ${problem.solution}`
    }
  }

  return {
    problem_id: problem.id,
    problem_type: problem.type,
    is_correct: isCorrect,
    score,
    max_score: problem.max_score,
    score_percentage: scorePercentage,
    correct_answer: problem.answer,
    student_answer,
    feedback,
  }
}

/**
 * 서술형 문제 채점 (AI 사용)
 * Gemini AI를 활용하여 답안의 정확성, 완성도, 논리성, 표현력 평가
 */
async function gradeEssay(
  context: GradingContext
): Promise<Omit<ProblemGradingResult, 'grading_time_ms'>> {
  const { problem, student_answer, options } = context

  // AI 채점 비활성화 시 기본 처리
  if (!options.use_ai_for_essay) {
    return {
      problem_id: problem.id,
      problem_type: problem.type,
      is_correct: false,
      score: 0,
      max_score: problem.max_score,
      score_percentage: 0,
      correct_answer: problem.answer,
      student_answer,
      feedback: '서술형 문제는 AI 채점이 비활성화되어 수동 채점이 필요합니다.',
    }
  }

  // 답안이 너무 짧은 경우
  if (student_answer.trim().length < 10) {
    return {
      problem_id: problem.id,
      problem_type: problem.type,
      is_correct: false,
      score: 0,
      max_score: problem.max_score,
      score_percentage: 0,
      correct_answer: problem.answer,
      student_answer,
      feedback: '답안이 너무 짧습니다. 문제에서 요구하는 내용을 충분히 작성해주세요.',
    }
  }

  try {
    // AI 서술형 평가 실행
    const aiEvaluation = await evaluateEssayWithAI(
      problem.question,
      problem.answer,
      student_answer,
      problem.solution,
      options.essay_detail_level || 'detailed'
    )

    // 점수 계산 (AI 점수를 배점에 맞게 변환)
    const scorePercentage = aiEvaluation.overall_score
    const score = Math.round((scorePercentage / 100) * problem.max_score)
    const isCorrect = scorePercentage >= 80 // 80% 이상이면 정답으로 간주

    // 피드백 생성
    let feedback = aiEvaluation.overall_feedback
    if (options.generate_feedback && aiEvaluation.improvements.length > 0) {
      feedback += '\n\n개선점:\n' + aiEvaluation.improvements.map(i => `- ${i}`).join('\n')
    }

    return {
      problem_id: problem.id,
      problem_type: problem.type,
      is_correct: isCorrect,
      score,
      max_score: problem.max_score,
      score_percentage: scorePercentage,
      correct_answer: problem.answer,
      student_answer,
      feedback,
      ai_evaluation: aiEvaluation,
    }
  } catch (error) {
    console.error('AI 서술형 채점 실패:', error)
    return {
      problem_id: problem.id,
      problem_type: problem.type,
      is_correct: false,
      score: 0,
      max_score: problem.max_score,
      score_percentage: 0,
      correct_answer: problem.answer,
      student_answer,
      feedback: 'AI 채점 중 오류가 발생했습니다. 수동 채점이 필요합니다.',
    }
  }
}

/**
 * Gemini AI를 사용한 서술형 답안 평가
 */
async function evaluateEssayWithAI(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  solution: string | null,
  detailLevel: 'basic' | 'detailed'
): Promise<AIEssayEvaluation> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const prompt = `
당신은 학생의 서술형 답안을 채점하는 전문 교사입니다.

## 문제
${question}

## 모범 답안
${correctAnswer}

${solution ? `## 풀이 과정\n${solution}` : ''}

## 학생 답안
${studentAnswer}

## 평가 기준
1. 정확성 (40%): 핵심 개념을 정확히 이해하고 있는가?
2. 완성도 (30%): 문제에서 요구하는 모든 내용을 포함하고 있는가?
3. 논리성 (20%): 논리적으로 일관성 있게 전개하고 있는가?
4. 표현력 (10%): 적절한 용어와 표현을 사용하고 있는가?

## 출력 형식 (JSON)
반드시 아래 형식의 JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.

{
  "overall_score": <0-100 사이 정수>,
  "criteria_scores": [
    {"criteria": "accuracy", "score": <0-100>, "feedback": "<정확성 평가>"},
    {"criteria": "completeness", "score": <0-100>, "feedback": "<완성도 평가>"},
    {"criteria": "logic", "score": <0-100>, "feedback": "<논리성 평가>"},
    {"criteria": "expression", "score": <0-100>, "feedback": "<표현력 평가>"}
  ],
  "overall_feedback": "<종합 피드백 - 한두 문장>",
  "strengths": ["<강점1>", "<강점2>"],
  "improvements": ["<개선점1>", "<개선점2>"],
  "confidence": <0.0-1.0 사이 소수>
}

${detailLevel === 'basic' ? '간략하게 평가해주세요.' : '상세하게 평가해주세요.'}
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  // JSON 파싱
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleanedText)

  return {
    overall_score: parsed.overall_score,
    criteria_scores: parsed.criteria_scores as EssayCriteriaScore[],
    overall_feedback: parsed.overall_feedback,
    strengths: parsed.strengths || [],
    improvements: parsed.improvements || [],
    model_used: 'gemini-1.5-pro',
    confidence: parsed.confidence || 0.8,
  }
}

// ============================================
// 메인 채점 함수
// ============================================

/**
 * 단일 문제 채점
 */
export async function gradeSingleProblem(
  problem: ProblemWithAnswer,
  studentAnswer: string,
  options: GradingOptions
): Promise<ProblemGradingResult> {
  const startTime = Date.now()

  const context: GradingContext = {
    problem,
    student_answer: studentAnswer,
    options: { ...getDefaultGradingOptions(), ...options },
  }

  let result: Omit<ProblemGradingResult, 'grading_time_ms'>

  // 문제 유형에 따른 채점
  switch (problem.type) {
    case 'multiple_choice':
      result = gradeMultipleChoice(context)
      break
    case 'true_false':
      result = gradeTrueFalse(context)
      break
    case 'short_answer':
      result = gradeShortAnswer(context)
      break
    case 'essay':
      result = await gradeEssay(context)
      break
    default:
      result = {
        problem_id: problem.id,
        problem_type: problem.type,
        is_correct: false,
        score: 0,
        max_score: problem.max_score,
        score_percentage: 0,
        correct_answer: problem.answer,
        student_answer: studentAnswer,
        feedback: '지원하지 않는 문제 유형입니다.',
      }
  }

  const gradingTimeMs = Date.now() - startTime

  return {
    ...result,
    grading_time_ms: gradingTimeMs,
  }
}

/**
 * 여러 문제 병렬 채점 (Promise.all 사용)
 * Vercel Best Practice: async-parallel 패턴 적용
 */
export async function gradeMultipleProblems(
  problemsWithAnswers: Array<{ problem: ProblemWithAnswer; studentAnswer: string }>,
  options: GradingOptions
): Promise<ProblemGradingResult[]> {
  // 병렬로 채점 실행
  const results = await Promise.all(
    problemsWithAnswers.map(({ problem, studentAnswer }) =>
      gradeSingleProblem(problem, studentAnswer, options)
    )
  )

  return results
}

/**
 * 채점 결과 요약 통계 생성
 */
export function calculateGradingSummary(
  results: ProblemGradingResult[],
  problems: Map<string, ProblemWithAnswer>
): GradingSummary {
  const totalProblems = results.length
  let correctCount = 0
  let partialCount = 0
  let incorrectCount = 0
  let totalScore = 0
  let maxTotalScore = 0

  // 유형별 통계 초기화
  const accuracyByType: Record<ProblemType, TypeAccuracy> = {
    multiple_choice: { count: 0, correct: 0, percentage: 0 },
    short_answer: { count: 0, correct: 0, percentage: 0 },
    true_false: { count: 0, correct: 0, percentage: 0 },
    essay: { count: 0, correct: 0, percentage: 0 },
  }

  // 난이도별 통계 초기화
  const accuracyByDifficulty: Record<ProblemDifficulty, DifficultyAccuracy> = {
    easy: { count: 0, correct: 0, percentage: 0 },
    medium: { count: 0, correct: 0, percentage: 0 },
    hard: { count: 0, correct: 0, percentage: 0 },
  }

  // 결과 집계
  for (const result of results) {
    totalScore += result.score
    maxTotalScore += result.max_score

    if (result.is_correct) {
      correctCount++
    } else if (result.score > 0) {
      partialCount++
    } else {
      incorrectCount++
    }

    // 유형별 집계
    const typeStats = accuracyByType[result.problem_type]
    typeStats.count++
    if (result.is_correct) typeStats.correct++

    // 난이도별 집계
    const problem = problems.get(result.problem_id)
    if (problem) {
      const diffStats = accuracyByDifficulty[problem.difficulty]
      diffStats.count++
      if (result.is_correct) diffStats.correct++
    }
  }

  // 백분율 계산
  const scorePercentage = maxTotalScore > 0
    ? Math.round((totalScore / maxTotalScore) * 100)
    : 0

  for (const type of Object.keys(accuracyByType) as ProblemType[]) {
    const stats = accuracyByType[type]
    stats.percentage = stats.count > 0
      ? Math.round((stats.correct / stats.count) * 100)
      : 0
  }

  for (const diff of Object.keys(accuracyByDifficulty) as ProblemDifficulty[]) {
    const stats = accuracyByDifficulty[diff]
    stats.percentage = stats.count > 0
      ? Math.round((stats.correct / stats.count) * 100)
      : 0
  }

  return {
    total_problems: totalProblems,
    correct_count: correctCount,
    partial_count: partialCount,
    incorrect_count: incorrectCount,
    total_score: totalScore,
    max_total_score: maxTotalScore,
    score_percentage: scorePercentage,
    accuracy_by_type: accuracyByType,
    accuracy_by_difficulty: accuracyByDifficulty,
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 기본 채점 옵션 반환
 */
export function getDefaultGradingOptions(): Required<GradingOptions> {
  return {
    allow_partial_credit: true,
    use_ai_for_essay: true,
    case_sensitive: false,
    ignore_whitespace: true,
    generate_feedback: true,
    essay_detail_level: 'detailed',
  }
}

/**
 * 문제 유형별 기본 배점 반환
 */
function getDefaultScoreByType(type: ProblemType): number {
  const scores: Record<ProblemType, number> = {
    multiple_choice: 10,
    short_answer: 10,
    true_false: 5,
    essay: 20,
  }
  return scores[type]
}

/**
 * 난이도별 배점 가중치 반환
 */
function getDifficultyMultiplier(difficulty: ProblemDifficulty): number {
  const multipliers: Record<ProblemDifficulty, number> = {
    easy: 0.8,
    medium: 1.0,
    hard: 1.3,
  }
  return multipliers[difficulty]
}

/**
 * 답안 정규화 (객관식, 단답형용)
 */
function normalizeAnswer(answer: string, options: GradingOptions): string {
  let normalized = answer.trim()

  if (options.ignore_whitespace) {
    normalized = normalized.replace(/\s+/g, '')
  }

  if (!options.case_sensitive) {
    normalized = normalized.toLowerCase()
  }

  // 객관식 번호 정규화 (1,2,3,4 -> a,b,c,d)
  const numberToLetter: Record<string, string> = {
    '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e',
    '①': 'a', '②': 'b', '③': 'c', '④': 'd', '⑤': 'e',
  }
  if (numberToLetter[normalized]) {
    normalized = numberToLetter[normalized]
  }

  return normalized
}

/**
 * O/X 답안 정규화
 */
function normalizeTrueFalse(answer: string): 'true' | 'false' | 'unknown' {
  const normalized = answer.trim().toLowerCase()

  const trueValues = ['o', 'true', 't', '참', '예', 'yes', 'y', '1', '맞음']
  const falseValues = ['x', 'false', 'f', '거짓', '아니오', 'no', 'n', '0', '틀림']

  if (trueValues.includes(normalized)) return 'true'
  if (falseValues.includes(normalized)) return 'false'

  return 'unknown'
}

/**
 * 문자열 유사도 계산 (Levenshtein Distance 기반)
 * 반환값: 0~1 사이의 유사도 (1이 완전 일치)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0

  // Levenshtein Distance 계산
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

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

/**
 * 채점 결과를 Supabase에 저장
 */
export async function saveGradingResults(
  studentAssignmentId: string,
  results: ProblemGradingResult[],
  summary: GradingSummary
): Promise<void> {
  const supabase = createServerSupabaseClient()

  // student_assignments 테이블에 결과 업데이트
  const answers = results.map(r => ({
    problem_id: r.problem_id,
    answer: r.student_answer,
    is_correct: r.is_correct,
    score: r.score,
  }))

  // any 타입으로 캐스팅하여 Supabase 타입 문제 우회
  // eslint-disable-next-line
  const { error } = await (supabase as any)
    .from('student_assignments')
    .update({
      status: 'graded',
      score: summary.total_score,
      answers: answers,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentAssignmentId)

  if (error) {
    console.error('채점 결과 저장 실패:', error)
    throw new Error('채점 결과 저장에 실패했습니다.')
  }
}
