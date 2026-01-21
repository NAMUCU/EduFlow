/**
 * 오답노트 API
 *
 * GET: 오답 목록 조회
 * PATCH: 복습 완료/해결 처리
 * POST: 유사 문제 생성 또는 오답 추가
 */

import { NextRequest, NextResponse } from 'next/server'
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

    if (!action || !['generate-similar', 'generate-explanation', 'add'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action은 generate-similar, generate-explanation, add 중 하나여야 합니다.' },
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
