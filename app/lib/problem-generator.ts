/**
 * AI 문제 생성 모듈 (PRD F1. AI 문제 자동 생성)
 *
 * Gemini 3.0 Pro API를 사용하여 한국어 수학/교과 문제를 자동 생성합니다.
 * 입력된 과목, 단원, 난이도, 문제 유형에 맞는 문제를 생성하고
 * 정답과 상세 해설을 함께 제공합니다.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  GenerateProblemInput,
  GeneratedProblem,
  GenerateProblemsResponse,
} from '@/types/problem'

// Gemini API 클라이언트 초기화
// 환경변수: GOOGLE_GEMINI_API_KEY
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }
  return new GoogleGenerativeAI(apiKey)
}

// 난이도 한국어 매핑
const difficultyMap: Record<string, string> = {
  easy: '쉬움 (기초 개념 확인)',
  medium: '보통 (응용 문제)',
  hard: '어려움 (심화/복합 문제)',
}

// 문제 유형 한국어 매핑
const problemTypeMap: Record<string, string> = {
  multiple_choice: '객관식 (5지선다)',
  short_answer: '단답형',
  essay: '서술형',
}

// 배점 기본값 (난이도별)
const defaultPoints: Record<string, number> = {
  easy: 2,
  medium: 3,
  hard: 5,
}

/**
 * 문제 생성 프롬프트 생성
 */
function buildPrompt(input: GenerateProblemInput): string {
  const {
    subject,
    unit,
    difficulty,
    problemType,
    count,
    schoolGrade,
    region,
    additionalRequests,
  } = input

  const difficultyLabel = difficultyMap[difficulty] || difficulty
  const typeLabel = problemTypeMap[problemType] || problemType

  // 객관식일 경우 보기 형식 안내
  const optionsInstruction =
    problemType === 'multiple_choice'
      ? `
- 각 문제마다 반드시 5개의 보기(options)를 제공하세요
- 보기는 ["① 답1", "② 답2", "③ 답3", "④ 답4", "⑤ 답5"] 형식으로 작성
- 정답(answer)은 "① 답1" 처럼 번호와 내용을 함께 작성`
      : ''

  // 서술형/단답형 안내
  const answerInstruction =
    problemType === 'essay'
      ? '- 정답은 예시 답안 형태로 작성하고, 채점 기준도 해설에 포함'
      : problemType === 'short_answer'
        ? '- 정답은 간단한 단어나 수식으로 작성'
        : ''

  const prompt = `
당신은 한국의 ${schoolGrade || ''} ${subject} 전문 교사입니다.
다음 조건에 맞는 ${subject} 문제를 ${count}개 생성해주세요.

## 출제 조건
- 과목: ${subject}
- 단원: ${unit}
- 난이도: ${difficultyLabel}
- 문제 유형: ${typeLabel}
- 문제 수: ${count}개
${schoolGrade ? `- 대상 학년: ${schoolGrade}` : ''}
${region ? `- 지역: ${region} (해당 지역 교육과정 반영)` : ''}
${additionalRequests ? `- 추가 요청: ${additionalRequests}` : ''}

## 중요 지침
- 모든 문제는 한국어로 작성
- 문제는 해당 단원의 핵심 개념을 평가할 수 있어야 함
- 해설은 학생이 이해하기 쉽게 단계별로 상세히 작성
- 난이도 "${difficultyLabel}"에 맞는 적절한 복잡도 유지
${optionsInstruction}
${answerInstruction}

## 출력 형식 (JSON 배열)
반드시 아래 형식의 JSON 배열만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.
마크다운 코드블록(\`\`\`)도 사용하지 마세요.

[
  {
    "question": "문제 내용 (수식은 LaTeX 형식으로)",
    ${problemType === 'multiple_choice' ? '"options": ["① 보기1", "② 보기2", "③ 보기3", "④ 보기4", "⑤ 보기5"],' : ''}
    "answer": "정답",
    "explanation": "상세 해설 (풀이 과정 포함)",
    "difficulty": "${difficulty}",
    "points": ${defaultPoints[difficulty]}
  }
]

JSON 배열만 출력하세요.
`

  return prompt
}

/**
 * Gemini API 응답에서 JSON 배열 추출 및 파싱
 */
function parseGeminiResponse(text: string): GeneratedProblem[] {
  // 마크다운 코드블록 제거
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // JSON 배열 시작/끝 찾기
  const startIndex = cleaned.indexOf('[')
  const endIndex = cleaned.lastIndexOf(']')

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('응답에서 JSON 배열을 찾을 수 없습니다.')
  }

  cleaned = cleaned.slice(startIndex, endIndex + 1)

  // JSON 파싱
  const problems = JSON.parse(cleaned)

  if (!Array.isArray(problems)) {
    throw new Error('응답이 배열 형식이 아닙니다.')
  }

  // 필수 필드 검증 및 정규화
  return problems.map((p, index) => {
    if (!p.question || !p.answer || !p.explanation) {
      throw new Error(`${index + 1}번째 문제에 필수 필드가 누락되었습니다.`)
    }

    return {
      question: String(p.question),
      options: p.options ? p.options.map(String) : undefined,
      answer: String(p.answer),
      explanation: String(p.explanation),
      difficulty: String(p.difficulty || 'medium'),
      points: Number(p.points) || 3,
    }
  })
}

/**
 * AI 문제 생성 메인 함수
 *
 * @param input - 문제 생성 입력 파라미터
 * @returns 생성된 문제 목록 또는 에러 정보
 */
export async function generateProblems(
  input: GenerateProblemInput
): Promise<GenerateProblemsResponse> {
  try {
    // 입력값 검증
    if (!input.subject || !input.unit) {
      return {
        success: false,
        error: '과목과 단원은 필수 입력 항목입니다.',
      }
    }

    if (input.count < 1 || input.count > 20) {
      return {
        success: false,
        error: '문제 수는 1개 이상 20개 이하로 설정해주세요.',
      }
    }

    // Gemini API 클라이언트 초기화
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

    // 프롬프트 생성
    const prompt = buildPrompt(input)

    // Gemini API 호출
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // 응답 파싱
    const problems = parseGeminiResponse(text)

    return {
      success: true,
      problems,
    }
  } catch (error) {
    console.error('[문제 생성 오류]', error)

    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Mock 문제 생성 (개발/테스트용)
 * API 키가 없을 때 테스트용 더미 데이터 반환
 */
export function generateMockProblems(
  input: GenerateProblemInput
): GenerateProblemsResponse {
  const { subject, unit, difficulty, problemType, count } = input

  const mockProblems: GeneratedProblem[] = []

  for (let i = 0; i < count; i++) {
    const problem: GeneratedProblem = {
      question:
        problemType === 'multiple_choice'
          ? `[${subject} - ${unit}] 다음 중 올바른 것을 고르시오. (테스트 문제 ${i + 1})`
          : `[${subject} - ${unit}] 다음을 풀이하시오. (테스트 문제 ${i + 1})`,
      answer:
        problemType === 'multiple_choice'
          ? '③ 정답 예시'
          : '정답 예시입니다.',
      explanation: `이 문제는 ${unit} 단원의 핵심 개념을 확인하는 문제입니다.\n\n[풀이 과정]\n1. 먼저 주어진 조건을 확인합니다.\n2. 관련 공식을 적용합니다.\n3. 계산하여 답을 구합니다.`,
      difficulty,
      points: defaultPoints[difficulty],
    }

    if (problemType === 'multiple_choice') {
      problem.options = [
        '① 보기 1',
        '② 보기 2',
        '③ 정답 예시',
        '④ 보기 4',
        '⑤ 보기 5',
      ]
    }

    mockProblems.push(problem)
  }

  return {
    success: true,
    problems: mockProblems,
  }
}
