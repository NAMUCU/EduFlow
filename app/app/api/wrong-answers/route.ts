/**
 * 오답노트 API
 *
 * GET: 오답 목록 조회
 * PATCH: 복습 완료/해결 처리
 * POST: 유사 문제 생성, AI 분석, 오답 추가
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getWrongAnswers,
  getWrongAnswer,
  markAsReviewed,
  markAsResolved,
  incrementRetryCount,
  generateSimilarProblem,
  generateAIExplanation,
  getWrongAnswerStats,
  addWrongAnswer,
  deleteWrongAnswer,
  type WrongAnswerFilter,
  type WrongAnswer,
} from '@/lib/services/wrong-answers'

// ============================================
// GET: 오답 목록 조회
// ============================================

/**
 * GET /api/wrong-answers
 *
 * Query Parameters:
 * - studentId: 학생 ID (필수)
 * - subject: 과목 필터
 * - chapter: 단원 필터
 * - difficulty: 난이도 필터 (easy, medium, hard)
 * - reviewed: 복습 완료 여부 (true/false)
 * - resolved: 해결 여부 (true/false)
 * - dateFrom: 시작 날짜 (YYYY-MM-DD)
 * - dateTo: 종료 날짜 (YYYY-MM-DD)
 * - search: 검색어
 * - sortBy: 정렬 기준 (wrong_date, subject, difficulty)
 * - sortDirection: 정렬 방향 (asc, desc)
 * - page: 페이지 번호 (기본: 1)
 * - limit: 페이지당 항목 수 (기본: 20)
 * - stats: 통계만 조회 (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'studentId는 필수입니다.' },
        { status: 400 }
      )
    }

    // 통계만 조회
    if (searchParams.get('stats') === 'true') {
      const { data: stats, error } = await getWrongAnswerStats(studentId)

      if (error) {
        return NextResponse.json(
          { success: false, error },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: stats })
    }

    // 단건 조회
    const wrongAnswerId = searchParams.get('id')
    if (wrongAnswerId) {
      const { data, error } = await getWrongAnswer(wrongAnswerId)

      if (error) {
        return NextResponse.json(
          { success: false, error },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { success: false, error: '오답을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    // 필터 파라미터 파싱
    const filter: WrongAnswerFilter = {
      studentId,
    }

    if (searchParams.get('subject')) {
      filter.subject = searchParams.get('subject')!
    }
    if (searchParams.get('chapter')) {
      filter.chapter = searchParams.get('chapter')!
    }
    if (searchParams.get('difficulty')) {
      filter.difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard'
    }
    if (searchParams.get('reviewed')) {
      filter.reviewed = searchParams.get('reviewed') === 'true'
    }
    if (searchParams.get('resolved')) {
      filter.resolved = searchParams.get('resolved') === 'true'
    }
    if (searchParams.get('dateFrom')) {
      filter.dateFrom = searchParams.get('dateFrom')!
    }
    if (searchParams.get('dateTo')) {
      filter.dateTo = searchParams.get('dateTo')!
    }
    if (searchParams.get('search')) {
      filter.search = searchParams.get('search')!
    }
    if (searchParams.get('sortBy')) {
      filter.sortBy = searchParams.get('sortBy') as 'wrong_date' | 'subject' | 'difficulty'
    }
    if (searchParams.get('sortDirection')) {
      filter.sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc'
    }

    // 페이지네이션
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    filter.offset = (page - 1) * limit
    filter.limit = limit

    const { data, total, error } = await getWrongAnswers(filter)

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    console.error('오답 목록 조회 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '오답 목록을 불러오는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH: 복습 완료/해결/재시도 처리
// ============================================

/**
 * PATCH /api/wrong-answers
 *
 * Request Body:
 * - id: 오답 ID (필수)
 * - action: 'review' | 'resolve' | 'retry' (필수)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!action || !['review', 'resolve', 'retry'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action은 review, resolve, retry 중 하나여야 합니다.' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'review':
        result = await markAsReviewed(id)
        break
      case 'resolve':
        result = await markAsResolved(id)
        break
      case 'retry':
        result = await incrementRetryCount(id)
        break
      default:
        return NextResponse.json(
          { success: false, error: '알 수 없는 action입니다.' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: action === 'review' ? '복습 완료 처리되었습니다.' :
               action === 'resolve' ? '해결 완료 처리되었습니다.' :
               '재시도 기록이 저장되었습니다.',
    })
  } catch (error) {
    console.error('오답 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '오답 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

// ============================================
// POST: 유사 문제 생성 / AI 해설 / 오답 추가
// ============================================

/**
 * POST /api/wrong-answers
 *
 * Request Body:
 * - action: 'generate-similar' | 'generate-explanation' | 'add' (필수)
 *
 * For 'generate-similar' and 'generate-explanation':
 * - problemId: 문제 ID (필수)
 *
 * For 'add':
 * - wrongAnswer: 오답 데이터 (필수)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (!action || !['generate-similar', 'generate-explanation', 'add', 'analyze'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action은 generate-similar, generate-explanation, add, analyze 중 하나여야 합니다.' },
        { status: 400 }
      )
    }

    // 유사 문제 생성
    if (action === 'generate-similar') {
      const { problemId } = body

      if (!problemId) {
        return NextResponse.json(
          { success: false, error: 'problemId는 필수입니다.' },
          { status: 400 }
        )
      }

      const { data, error } = await generateSimilarProblem(problemId)

      if (error) {
        return NextResponse.json(
          { success: false, error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data,
        message: '유사 문제가 생성되었습니다.',
      })
    }

    // AI 해설 생성
    if (action === 'generate-explanation') {
      const { problemId } = body

      if (!problemId) {
        return NextResponse.json(
          { success: false, error: 'problemId는 필수입니다.' },
          { status: 400 }
        )
      }

      const { data, error } = await generateAIExplanation(problemId)

      if (error) {
        return NextResponse.json(
          { success: false, error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'AI 해설이 생성되었습니다.',
      })
    }

    // 오답 분석 (Gemini API)
    if (action === 'analyze') {
      const { studentId, subject, dateFrom, dateTo } = body

      if (!studentId) {
        return NextResponse.json(
          { success: false, error: 'studentId는 필수입니다.' },
          { status: 400 }
        )
      }

      // 횟수 제한 체크 (하루 3회)
      const rateLimitKey = `analyze_${studentId}_${new Date().toISOString().split('T')[0]}`
      const rateLimitCount = parseInt(
        (request.headers.get('x-analyze-count') || '0'),
        10
      )

      // 실제 구현에서는 Redis나 DB에서 횟수를 관리
      // 여기서는 클라이언트에서 관리하는 카운트를 신뢰 (개선 필요)
      if (rateLimitCount >= 3) {
        return NextResponse.json(
          { success: false, error: '일일 분석 횟수를 초과했습니다. (하루 3회 제한)' },
          { status: 429 }
        )
      }

      // 필터 조건으로 오답 조회
      const filter: WrongAnswerFilter = {
        studentId,
        limit: 50, // 분석에 사용할 최대 문제 수
      }

      if (subject && subject !== 'all') {
        filter.subject = subject
      }
      if (dateFrom) {
        filter.dateFrom = dateFrom
      }
      if (dateTo) {
        filter.dateTo = dateTo
      }

      const { data: wrongAnswersData, error: fetchError } = await getWrongAnswers(filter)

      if (fetchError) {
        return NextResponse.json(
          { success: false, error: fetchError },
          { status: 500 }
        )
      }

      if (!wrongAnswersData || wrongAnswersData.length === 0) {
        return NextResponse.json(
          { success: false, error: '분석할 오답이 없습니다.' },
          { status: 400 }
        )
      }

      // Gemini API로 분석 요청
      const analysisResult = await analyzeWrongAnswersWithGemini(wrongAnswersData, subject)

      if (!analysisResult.success) {
        return NextResponse.json(
          { success: false, error: analysisResult.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          analysis: analysisResult.data,
          analyzedCount: wrongAnswersData.length,
          period: { from: dateFrom || '전체', to: dateTo || '전체' },
          subject: subject || '전체 과목',
        },
        message: '오답 분석이 완료되었습니다.',
      })
    }

    // 오답 추가
    if (action === 'add') {
      const { wrongAnswer } = body as { wrongAnswer: Omit<WrongAnswer, 'id' | 'created_at' | 'updated_at'> }

      if (!wrongAnswer) {
        return NextResponse.json(
          { success: false, error: 'wrongAnswer 데이터는 필수입니다.' },
          { status: 400 }
        )
      }

      // 필수 필드 검증
      const requiredFields = ['student_id', 'problem_id', 'subject', 'chapter', 'question', 'my_answer', 'correct_answer', 'difficulty', 'wrong_date']
      const missingFields = requiredFields.filter(field => !(field in wrongAnswer))

      if (missingFields.length > 0) {
        return NextResponse.json(
          { success: false, error: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}` },
          { status: 400 }
        )
      }

      const { data, error } = await addWrongAnswer(wrongAnswer)

      if (error) {
        return NextResponse.json(
          { success: false, error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data,
        message: '오답이 추가되었습니다.',
      }, { status: 201 })
    }

    return NextResponse.json(
      { success: false, error: '알 수 없는 action입니다.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('오답 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '오답 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE: 오답 삭제
// ============================================

/**
 * DELETE /api/wrong-answers?id={id}
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id는 필수입니다.' },
        { status: 400 }
      )
    }

    const result = await deleteWrongAnswer(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '오답이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('오답 삭제 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '오답 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    )
  }
}

// ============================================
// Gemini API를 사용한 오답 분석
// ============================================

interface AnalysisResult {
  success: boolean
  data?: {
    summary: string
    weakPoints: Array<{
      area: string
      description: string
      frequency: number
      recommendations: string[]
    }>
    conceptGaps: string[]
    studyRecommendations: string[]
    encouragement: string
  }
  error?: string
}

async function analyzeWrongAnswersWithGemini(
  wrongAnswers: WrongAnswer[],
  subject?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'Gemini API 키가 설정되지 않았습니다.',
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // 오답 데이터를 분석용 텍스트로 변환
    const wrongAnswersSummary = wrongAnswers.map((wa, idx) => {
      return `문제 ${idx + 1}:
- 과목: ${wa.subject}
- 단원: ${wa.chapter}
- 난이도: ${wa.difficulty}
- 문제: ${wa.question.slice(0, 200)}${wa.question.length > 200 ? '...' : ''}
- 내 답: ${wa.my_answer}
- 정답: ${wa.correct_answer}
- 틀린 날짜: ${wa.wrong_date}
- 재시도 횟수: ${wa.retry_count}`
    }).join('\n\n')

    // 과목별 통계
    const subjectStats = wrongAnswers.reduce((acc, wa) => {
      acc[wa.subject] = (acc[wa.subject] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 단원별 통계
    const chapterStats = wrongAnswers.reduce((acc, wa) => {
      const key = `${wa.subject} - ${wa.chapter}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const prompt = `당신은 학생의 학습 분석 전문가입니다. 아래 오답 데이터를 분석하여 학생의 약점과 개선점을 파악해주세요.

## 분석 대상 정보
- 총 오답 문제 수: ${wrongAnswers.length}개
${subject && subject !== 'all' ? `- 분석 과목: ${subject}` : '- 분석 과목: 전체'}
- 과목별 오답 수: ${JSON.stringify(subjectStats)}
- 단원별 오답 수: ${JSON.stringify(chapterStats)}

## 오답 목록
${wrongAnswersSummary}

## 요청 사항
위 데이터를 분석하여 다음 JSON 형식으로 응답해주세요:
{
  "summary": "전체적인 분석 요약 (2-3문장)",
  "weakPoints": [
    {
      "area": "취약한 영역/단원명",
      "description": "왜 이 영역이 취약한지 설명",
      "frequency": 해당 영역의 오답 빈도 (숫자),
      "recommendations": ["구체적인 학습 방법 1", "학습 방법 2"]
    }
  ],
  "conceptGaps": ["이해가 부족한 개념 1", "개념 2"],
  "studyRecommendations": ["전반적인 학습 추천 사항 1", "추천 사항 2", "추천 사항 3"],
  "encouragement": "학생에게 보내는 따뜻한 격려 메시지"
}

응답은 반드시 유효한 JSON 형식이어야 합니다. 마크다운이나 다른 포맷 없이 JSON만 반환하세요.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // JSON 파싱 시도
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('JSON 파싱 실패:', text)
      return {
        success: false,
        error: 'AI 응답 형식이 올바르지 않습니다.',
      }
    }

    const analysisData = JSON.parse(jsonMatch[0])

    return {
      success: true,
      data: analysisData,
    }
  } catch (error) {
    console.error('Gemini API 분석 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.',
    }
  }
}
