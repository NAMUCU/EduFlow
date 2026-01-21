/**
 * 수학 풀이 채점 API
 * - 원본 문제지 이미지와 제출 이미지를 비교하여 풀이 부분 추출
 * - Claude Vision으로 풀이 분석 및 채점
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  extractSolutionFromImages,
  base64ToBuffer,
  bufferToBase64,
  cropToSolutionArea,
  getImageDiffWithMetadata,
} from '@/lib/image-diff'

// Claude 클라이언트 초기화
const isConfigured = () => !!process.env.ANTHROPIC_API_KEY
let client: Anthropic | null = null
const getClient = () => client || (client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }))

export interface MathGradingRequest {
  originalImage: string // Base64 인코딩된 원본 문제지 이미지
  submittedImage: string // Base64 인코딩된 제출 이미지 (풀이 포함)
  problem?: {
    question: string
    answer: string
    solution?: string
  }
  options?: {
    extractOnly?: boolean // 풀이 추출만 수행 (채점 없이)
    includeStepAnalysis?: boolean // 단계별 분석 포함
    includeVisualization?: boolean // diff 이미지 포함
  }
}

export interface GradingStep {
  step: number
  content: string
  isCorrect: boolean
  feedback?: string
}

export interface MathGradingResponse {
  success: boolean
  data?: {
    isCorrect: boolean
    score: number
    steps: GradingStep[]
    feedback: string
    weakPoints: string[]
    recommendations: string[]
    diffImage?: string // Base64 인코딩된 diff 이미지
    diffPercentage?: number
  }
  error?: string
}

// Mock 응답 데이터 (API 키 없을 때)
const mockGradingData = {
  isCorrect: true,
  score: 85,
  steps: [
    { step: 1, content: '문제 이해 및 식 정리', isCorrect: true, feedback: '정확하게 문제를 파악했습니다' },
    { step: 2, content: '인수분해 적용', isCorrect: true, feedback: '올바른 인수분해를 수행했습니다' },
    { step: 3, content: '근의 계산', isCorrect: true, feedback: '계산이 정확합니다' },
    { step: 4, content: '최종 답 도출', isCorrect: false, feedback: '단위 표기가 누락되었습니다' },
  ] as GradingStep[],
  feedback: '전반적으로 풀이 과정이 논리적이며, 수학적 개념을 잘 이해하고 있습니다. 다만 최종 답에 단위를 명시하면 더 좋겠습니다.',
  weakPoints: ['단위 표기 누락', '중간 과정 정리 미흡'],
  recommendations: ['답에 항상 단위를 포함하세요', '풀이 과정을 더 깔끔하게 정리하는 연습을 해보세요'],
}

export async function POST(request: NextRequest): Promise<NextResponse<MathGradingResponse>> {
  try {
    const body: MathGradingRequest = await request.json()

    // 필수 필드 검증
    if (!body.originalImage || !body.submittedImage) {
      return NextResponse.json(
        { success: false, error: '원본 이미지와 제출 이미지가 모두 필요합니다' },
        { status: 400 }
      )
    }

    // Base64 이미지를 Buffer로 변환
    const originalBuffer = base64ToBuffer(body.originalImage)
    const submittedBuffer = base64ToBuffer(body.submittedImage)

    // 이미지 diff 수행하여 풀이 부분 추출
    let diffImage: Buffer
    let diffPercentage: number | undefined

    if (body.options?.includeVisualization) {
      const diffResult = await getImageDiffWithMetadata(originalBuffer, submittedBuffer)
      diffImage = await cropToSolutionArea(diffResult.diffImage)
      diffPercentage = diffResult.diffPercentage
    } else {
      const rawDiff = await extractSolutionFromImages(originalBuffer, submittedBuffer)
      diffImage = await cropToSolutionArea(rawDiff)
    }

    // 풀이 추출만 요청한 경우
    if (body.options?.extractOnly) {
      return NextResponse.json({
        success: true,
        data: {
          isCorrect: false,
          score: 0,
          steps: [],
          feedback: '',
          weakPoints: [],
          recommendations: [],
          diffImage: bufferToBase64(diffImage),
          diffPercentage,
        },
      })
    }

    // API 키 없으면 Mock 응답
    if (!isConfigured()) {
      return NextResponse.json({
        success: true,
        data: {
          ...mockGradingData,
          diffImage: body.options?.includeVisualization ? bufferToBase64(diffImage) : undefined,
          diffPercentage,
        },
      } as MathGradingResponse)
    }

    // Claude Vision으로 풀이 분석
    const diffImageBase64 = diffImage.toString('base64')

    const systemPrompt = `당신은 수학 교육 전문가입니다. 학생이 작성한 수학 풀이를 분석하고 채점해주세요.

채점 기준:
1. 수학적 정확성: 계산과 논리가 올바른지
2. 풀이 과정: 단계별로 논리적인지
3. 표현의 명확성: 수학적 표현이 적절한지
4. 완성도: 최종 답이 명확하게 제시되었는지

응답은 반드시 다음 JSON 형식으로 제공해주세요:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "steps": [
    {
      "step": number,
      "content": "단계 설명",
      "isCorrect": boolean,
      "feedback": "피드백"
    }
  ],
  "feedback": "전체 피드백",
  "weakPoints": ["약점1", "약점2"],
  "recommendations": ["추천사항1", "추천사항2"]
}`

    const userPrompt = body.problem
      ? `문제: ${body.problem.question}
정답: ${body.problem.answer}
${body.problem.solution ? `모범 풀이: ${body.problem.solution}` : ''}

위 문제에 대한 학생의 풀이 이미지를 분석하고 채점해주세요.`
      : '첨부된 이미지는 학생이 작성한 수학 풀이입니다. 풀이 과정을 분석하고 채점해주세요.'

    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: diffImageBase64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    // 응답 파싱
    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('Claude 응답 파싱 실패:', responseText)
      return NextResponse.json(
        { success: false, error: '채점 결과 파싱에 실패했습니다' },
        { status: 500 }
      )
    }

    const gradingResult = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      data: {
        isCorrect: gradingResult.isCorrect ?? false,
        score: gradingResult.score ?? 0,
        steps: gradingResult.steps ?? [],
        feedback: gradingResult.feedback ?? '',
        weakPoints: gradingResult.weakPoints ?? [],
        recommendations: gradingResult.recommendations ?? [],
        diffImage: body.options?.includeVisualization ? bufferToBase64(diffImage) : undefined,
        diffPercentage,
      },
    } as MathGradingResponse)
  } catch (error) {
    console.error('수학 채점 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '채점 중 오류가 발생했습니다',
      },
      { status: 500 }
    )
  }
}

/**
 * GET: API 상태 확인
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: '수학 풀이 채점 API',
    configured: isConfigured(),
    features: [
      '이미지 diff를 통한 풀이 추출',
      'Claude Vision 기반 풀이 분석',
      '단계별 채점 및 피드백',
      '약점 분석 및 학습 추천',
    ],
  })
}
