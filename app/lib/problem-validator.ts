/**
 * 문제 검수(Validation) 라이브러리
 *
 * PRD F1. 멀티 LLM 검수 기능 구현
 * 생성된 문제를 여러 LLM(Gemini, GPT, Claude)으로 검수합니다.
 *
 * 주요 기능:
 * - 각 LLM에 문제 검증 요청
 * - 정확성, 수정 제안, 난이도 적절성 평가
 * - 결과 통합 및 합의 도출
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import type {
  GeneratedProblem,
  ValidatorType,
  ValidationResult,
  ValidateProblemInput,
  ValidateProblemOutput,
  BatchValidateProblemInput,
  BatchValidateProblemOutput,
} from '@/types/validation'

// ============================================
// AI 클라이언트 초기화
// ============================================

// Claude (Anthropic)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Gemini (Google)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '')

// GPT (OpenAI)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// ============================================
// 검수 프롬프트 생성
// ============================================

/**
 * 검수용 프롬프트 생성
 * 모든 LLM에 공통으로 사용되는 검수 지침
 */
function createValidationPrompt(
  problem: GeneratedProblem,
  subject?: string,
  grade?: string
): string {
  const difficultyLabel = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  }[problem.difficulty]

  const typeLabel = {
    multiple_choice: '객관식',
    short_answer: '주관식',
    true_false: 'O/X',
    essay: '서술형',
  }[problem.type]

  // 객관식 보기 문자열 생성
  let optionsText = ''
  if (problem.type === 'multiple_choice' && problem.options) {
    optionsText = problem.options
      .map((opt) => `  ${opt.id}. ${opt.text}`)
      .join('\n')
  }

  return `당신은 ${grade || ''} ${subject || problem.subject || ''} 문제 검수 전문가입니다.
다음 문제를 철저히 검수하고 평가해주세요.

## 검수할 문제
- 문제 ID: ${problem.id}
- 문제 유형: ${typeLabel}
- 난이도: ${difficultyLabel}
${problem.unit ? `- 단원: ${problem.unit}` : ''}
${problem.subject ? `- 과목: ${problem.subject}` : ''}
${problem.grade ? `- 학년: ${problem.grade}` : ''}

### 문제 내용
${problem.question}

${optionsText ? `### 보기\n${optionsText}\n` : ''}
### 정답
${problem.answer}

### 풀이/해설
${problem.solution || '(제공되지 않음)'}

## 검수 항목
1. **정답 검증**: 제시된 정답이 올바른지 확인하세요.
2. **해설 정확성**: 풀이 과정이 논리적이고 정확한지 확인하세요.
3. **난이도 적절성**: 명시된 난이도(${difficultyLabel})에 적합한 문제인지 평가하세요.
4. **문제 완성도**: 문제에 오류, 모호한 표현, 누락된 정보가 있는지 확인하세요.
5. **개선 제안**: 문제, 정답, 풀이를 개선할 수 있는 방법을 제안하세요.

## 출력 형식 (반드시 아래 JSON 형식으로만 출력하세요)
{
  "accuracy": <0-100 사이 정수, 전체 정확도 점수>,
  "isValid": <true/false, 정확도 80점 이상이면 true>,
  "difficultyMatch": <true/false, 난이도가 적절하면 true>,
  "difficultyComment": "<난이도에 대한 코멘트>",
  "errors": [<발견된 오류/문제점 문자열 배열, 없으면 빈 배열>],
  "suggestions": [<개선 제안 문자열 배열, 없으면 빈 배열>],
  "correctedAnswer": "<수정이 필요한 경우 수정된 정답, 불필요하면 null>",
  "correctedSolution": "<수정이 필요한 경우 수정된 풀이, 불필요하면 null>"
}

## 주의사항
- 반드시 JSON 형식만 출력하세요 (마크다운 코드블록 없이)
- 한국어로 작성해주세요
- 객관적이고 구체적인 평가를 해주세요
- 정확도가 높을수록 좋은 문제입니다`
}

// ============================================
// JSON 응답 파싱
// ============================================

/**
 * AI 응답에서 JSON 추출 및 파싱
 */
function parseValidationResponse(
  text: string,
  validator: ValidatorType
): Omit<ValidationResult, 'validator' | 'reviewTime'> {
  try {
    // 마크다운 코드블록 제거
    let cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // JSON 시작/끝 찾기
    const jsonStart = cleanedText.indexOf('{')
    const jsonEnd = cleanedText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1)
    }

    const data = JSON.parse(cleanedText)

    return {
      isValid: data.isValid ?? data.accuracy >= 80,
      accuracy: Math.min(100, Math.max(0, data.accuracy ?? 0)),
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      difficultyMatch: data.difficultyMatch ?? true,
      errors: Array.isArray(data.errors) ? data.errors : [],
      correctedAnswer: data.correctedAnswer || undefined,
      correctedSolution: data.correctedSolution || undefined,
      difficultyComment: data.difficultyComment || undefined,
    }
  } catch (error) {
    console.error(`${validator} 응답 파싱 실패:`, text.substring(0, 200))
    return {
      isValid: false,
      accuracy: 0,
      suggestions: [],
      difficultyMatch: false,
      errors: [`${validator} 응답 파싱 실패`],
    }
  }
}

// ============================================
// 개별 검수기 구현
// ============================================

/**
 * Claude를 사용한 문제 검수
 */
async function validateWithClaude(
  problem: GeneratedProblem,
  subject?: string,
  grade?: string
): Promise<ValidationResult> {
  const startTime = Date.now()
  const prompt = createValidationPrompt(problem, subject, grade)

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

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = parseValidationResponse(text, 'claude')

    return {
      validator: 'claude',
      ...parsed,
      reviewTime: Date.now() - startTime,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('Claude 검수 에러:', errorMessage)
    return {
      validator: 'claude',
      isValid: false,
      accuracy: 0,
      suggestions: [],
      difficultyMatch: false,
      errors: [`Claude 검수 실패: ${errorMessage}`],
      reviewTime: Date.now() - startTime,
    }
  }
}

/**
 * Gemini를 사용한 문제 검수
 */
async function validateWithGemini(
  problem: GeneratedProblem,
  subject?: string,
  grade?: string
): Promise<ValidationResult> {
  const startTime = Date.now()
  const prompt = createValidationPrompt(problem, subject, grade)

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const parsed = parseValidationResponse(text, 'gemini')

    return {
      validator: 'gemini',
      ...parsed,
      reviewTime: Date.now() - startTime,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('Gemini 검수 에러:', errorMessage)
    return {
      validator: 'gemini',
      isValid: false,
      accuracy: 0,
      suggestions: [],
      difficultyMatch: false,
      errors: [`Gemini 검수 실패: ${errorMessage}`],
      reviewTime: Date.now() - startTime,
    }
  }
}

/**
 * GPT를 사용한 문제 검수
 */
async function validateWithGPT(
  problem: GeneratedProblem,
  subject?: string,
  grade?: string
): Promise<ValidationResult> {
  const startTime = Date.now()
  const prompt = createValidationPrompt(problem, subject, grade)

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
    const parsed = parseValidationResponse(text, 'gpt')

    return {
      validator: 'gpt',
      ...parsed,
      reviewTime: Date.now() - startTime,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('GPT 검수 에러:', errorMessage)
    return {
      validator: 'gpt',
      isValid: false,
      accuracy: 0,
      suggestions: [],
      difficultyMatch: false,
      errors: [`GPT 검수 실패: ${errorMessage}`],
      reviewTime: Date.now() - startTime,
    }
  }
}

// ============================================
// 검수 실행 함수
// ============================================

/**
 * 단일 검수기로 검수 실행
 */
async function runValidator(
  validator: ValidatorType,
  problem: GeneratedProblem,
  subject?: string,
  grade?: string
): Promise<ValidationResult> {
  switch (validator) {
    case 'claude':
      return validateWithClaude(problem, subject, grade)
    case 'gemini':
      return validateWithGemini(problem, subject, grade)
    case 'gpt':
      return validateWithGPT(problem, subject, grade)
    default:
      return {
        validator,
        isValid: false,
        accuracy: 0,
        suggestions: [],
        difficultyMatch: false,
        errors: [`지원하지 않는 검수기: ${validator}`],
      }
  }
}

/**
 * 합의된 항목 찾기 (2개 이상의 검수기가 동의하는 항목)
 */
function findConsensusItems(
  results: ValidationResult[],
  field: 'suggestions' | 'errors'
): string[] {
  const itemCount = new Map<string, number>()

  results.forEach((result) => {
    const items = result[field] || []
    items.forEach((item) => {
      // 유사한 항목 그룹화를 위해 정규화
      const normalized = item.toLowerCase().trim()
      itemCount.set(normalized, (itemCount.get(normalized) || 0) + 1)
    })
  })

  // 2개 이상 동의하거나, 검수기가 1개뿐이면 모두 포함
  const threshold = results.length === 1 ? 1 : 2
  return Array.from(itemCount.entries())
    .filter(([, count]) => count >= threshold)
    .map(([item]) => item)
}

// ============================================
// 메인 검수 함수
// ============================================

/**
 * 단일 문제 검수
 *
 * 여러 LLM을 사용하여 문제를 검수하고 결과를 통합합니다.
 *
 * @param input - 검수 입력 (문제, 검수기 목록)
 * @returns 통합된 검수 결과
 */
export async function validateProblem(
  input: ValidateProblemInput
): Promise<ValidateProblemOutput> {
  const { problem, validators, subject, grade } = input
  const startTime = Date.now()

  // 모든 검수기 병렬 실행
  const validationPromises = validators.map((validator) =>
    runValidator(validator, problem, subject || problem.subject, grade || problem.grade)
  )

  const results = await Promise.all(validationPromises)

  // 종합 점수 계산 (평균)
  const accuracies = results.map((r) => r.accuracy)
  const finalScore =
    accuracies.length > 0
      ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
      : 0

  // 모든 검수자 동의 여부
  const consensus = results.every((r) => r.isValid)

  // 합의된 제안 및 오류
  const consensusSuggestions = findConsensusItems(results, 'suggestions')
  const consensusErrors = findConsensusItems(results, 'errors')

  return {
    results,
    consensus,
    finalScore,
    consensusSuggestions: consensusSuggestions.length > 0 ? consensusSuggestions : undefined,
    consensusErrors: consensusErrors.length > 0 ? consensusErrors : undefined,
    totalTime: Date.now() - startTime,
  }
}

/**
 * 여러 문제 일괄 검수
 *
 * 여러 문제를 동시에 검수합니다. 각 문제마다 선택된 모든 LLM을 사용합니다.
 *
 * @param input - 일괄 검수 입력 (문제 목록, 검수기 목록)
 * @returns 문제별 검수 결과 및 통계
 */
export async function batchValidateProblems(
  input: BatchValidateProblemInput
): Promise<BatchValidateProblemOutput> {
  const { problems, validators, subject, grade } = input
  const startTime = Date.now()

  // 모든 문제 병렬 검수
  const validationPromises = problems.map((problem) =>
    validateProblem({
      problem,
      validators,
      subject,
      grade,
    })
  )

  const outputs = await Promise.all(validationPromises)

  // 결과 매핑
  const results: Record<string | number, ValidateProblemOutput> = {}
  problems.forEach((problem, index) => {
    results[problem.id] = outputs[index]
  })

  // 통계 계산
  const passed = outputs.filter((o) => o.consensus).length
  const failed = outputs.length - passed
  const averageScore =
    outputs.length > 0
      ? Math.round(outputs.reduce((acc, o) => acc + o.finalScore, 0) / outputs.length)
      : 0

  // 검수기별 평균 점수
  const validatorScores: Record<ValidatorType, number> = {
    gemini: 0,
    gpt: 0,
    claude: 0,
  }

  const validatorCounts: Record<ValidatorType, number> = {
    gemini: 0,
    gpt: 0,
    claude: 0,
  }

  outputs.forEach((output) => {
    output.results.forEach((result) => {
      validatorScores[result.validator] += result.accuracy
      validatorCounts[result.validator]++
    })
  })

  // 평균 계산
  for (const validator of validators) {
    if (validatorCounts[validator] > 0) {
      validatorScores[validator] = Math.round(
        validatorScores[validator] / validatorCounts[validator]
      )
    }
  }

  return {
    results,
    summary: {
      total: problems.length,
      passed,
      failed,
      averageScore,
      validatorScores,
    },
    totalTime: Date.now() - startTime,
  }
}

// ============================================
// Mock 검수 함수 (테스트/개발용)
// ============================================

/**
 * Mock 검수 결과 생성 (API 키 없이 테스트용)
 */
export function createMockValidationResult(
  validator: ValidatorType,
  problem: GeneratedProblem
): ValidationResult {
  // 문제 내용 기반 점수 생성 (일관성 있는 테스트를 위해)
  const baseScore = 70 + (problem.question.length % 30)
  const accuracy = Math.min(100, baseScore + Math.floor(Math.random() * 10))

  return {
    validator,
    isValid: accuracy >= 80,
    accuracy,
    suggestions:
      accuracy < 90
        ? ['풀이 과정을 더 상세히 설명하면 좋겠습니다.', '예시를 추가하면 이해도가 높아집니다.']
        : [],
    difficultyMatch: Math.random() > 0.2,
    difficultyComment:
      accuracy >= 80 ? '난이도가 적절합니다.' : '난이도 조정이 필요할 수 있습니다.',
    errors: accuracy < 80 ? ['정답 확인이 필요합니다.'] : [],
    reviewTime: 500 + Math.floor(Math.random() * 1000),
  }
}

/**
 * Mock 단일 문제 검수 (API 키 없이 테스트용)
 */
export async function validateProblemMock(
  input: ValidateProblemInput
): Promise<ValidateProblemOutput> {
  const { problem, validators } = input
  const startTime = Date.now()

  // 약간의 지연 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 500))

  const results = validators.map((validator) =>
    createMockValidationResult(validator, problem)
  )

  const accuracies = results.map((r) => r.accuracy)
  const finalScore = Math.round(
    accuracies.reduce((a, b) => a + b, 0) / accuracies.length
  )
  const consensus = results.every((r) => r.isValid)

  return {
    results,
    consensus,
    finalScore,
    consensusSuggestions: results
      .flatMap((r) => r.suggestions)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .slice(0, 3),
    totalTime: Date.now() - startTime,
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * API 키 유효성 확인
 */
export function checkApiKeys(): Record<ValidatorType, boolean> {
  return {
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    gemini: Boolean(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
    gpt: Boolean(process.env.OPENAI_API_KEY),
  }
}

/**
 * 사용 가능한 검수기 목록 반환
 */
export function getAvailableValidators(): ValidatorType[] {
  const keys = checkApiKeys()
  return (['gemini', 'gpt', 'claude'] as ValidatorType[]).filter((v) => keys[v])
}
