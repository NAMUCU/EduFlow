/**
 * Few-shot 샘플 API
 * GET: 목록 조회 (필터링 지원)
 * POST: 새 샘플 생성
 * DELETE: 샘플 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getFewshotExamples,
  saveFewshotExample,
  deleteFewshotExample,
  deleteFewshotExamples,
  getFewshotStats,
  getUnitList
} from '@/lib/services/fewshot'
import type { ProblemDifficulty } from '@/types/database'

/**
 * GET /api/fewshot
 * 쿼리 파라미터:
 * - subject: 과목 필터
 * - grade: 학년 필터
 * - unit: 단원 필터
 * - difficulty: 난이도 필터
 * - search: 검색어
 * - isActive: 활성화 여부 (true/false)
 * - limit: 개수 제한
 * - offset: 시작 위치
 * - action: 특수 액션 (stats, units)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // 통계 조회
    if (action === 'stats') {
      const academyId = searchParams.get('academyId') || undefined
      const { data, error } = await getFewshotStats(academyId)

      if (error) {
        return NextResponse.json({ success: false, error }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // 단원 목록 조회
    if (action === 'units') {
      const subject = searchParams.get('subject') || undefined
      const grade = searchParams.get('grade') || undefined
      const { data, error } = await getUnitList(subject, grade)

      if (error) {
        return NextResponse.json({ success: false, error }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // 일반 목록 조회
    const filter = {
      subject: searchParams.get('subject') || undefined,
      grade: searchParams.get('grade') || undefined,
      unit: searchParams.get('unit') || undefined,
      difficulty: searchParams.get('difficulty') as ProblemDifficulty | undefined,
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true :
                searchParams.get('isActive') === 'false' ? false : undefined,
      academyId: searchParams.get('academyId') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    const { data, total, error } = await getFewshotExamples(filter)

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      total,
      limit: filter.limit,
      offset: filter.offset
    })
  } catch (error) {
    console.error('Few-shot 샘플 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/fewshot
 * Body:
 * - subject: 과목 (필수)
 * - grade: 학년 (필수)
 * - unit: 단원 (필수)
 * - difficulty: 난이도 (필수)
 * - question: 문제 내용 (필수)
 * - answer: 정답 (필수)
 * - solution: 풀이 (선택)
 * - tags: 태그 배열 또는 쉼표 구분 문자열 (선택)
 * - is_active: 활성화 여부 (선택, 기본 true)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      subject,
      grade,
      unit,
      difficulty,
      question,
      answer,
      solution,
      tags,
      is_active = true,
      academy_id,
      created_by
    } = body

    // 필수 필드 검증
    if (!subject || !grade || !unit || !difficulty || !question || !answer) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
          required: ['subject', 'grade', 'unit', 'difficulty', 'question', 'answer']
        },
        { status: 400 }
      )
    }

    // 난이도 검증
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 난이도입니다. (easy, medium, hard)' },
        { status: 400 }
      )
    }

    // 태그 처리 (문자열이면 배열로 변환)
    const processedTags = Array.isArray(tags)
      ? tags
      : (tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [])

    const { data, error } = await saveFewshotExample({
      subject,
      grade,
      unit,
      difficulty,
      question,
      answer,
      solution: solution || null,
      tags: processedTags,
      is_active,
      academy_id: academy_id || null,
      created_by: created_by || null
    })

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Few-shot 샘플 생성 오류:', error)
    return NextResponse.json(
      { success: false, error: '샘플 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/fewshot
 * Body:
 * - id: 수정할 샘플 ID (필수)
 * - 나머지 필드는 선택적으로 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '샘플 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 태그 처리
    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    }

    const { data, error } = await saveFewshotExample(updates, id)

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Few-shot 샘플 수정 오류:', error)
    return NextResponse.json(
      { success: false, error: '샘플 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/fewshot
 * Body:
 * - id: 삭제할 샘플 ID (단일 삭제)
 * - ids: 삭제할 샘플 ID 배열 (다중 삭제)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ids } = body

    if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: '삭제할 샘플 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 다중 삭제
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const { success, error } = await deleteFewshotExamples(ids)

      if (!success) {
        return NextResponse.json({ success: false, error }, { status: 500 })
      }

      return NextResponse.json({ success: true, deletedCount: ids.length })
    }

    // 단일 삭제
    const { success, error } = await deleteFewshotExample(id)

    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('Few-shot 샘플 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '샘플 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
