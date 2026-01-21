/**
 * 문제 세트 상세 API
 * GET: 상세 조회 (포함된 문제 목록 포함)
 * PUT: 수정
 * DELETE: 삭제
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock 데이터
const mockProblemSetDetail = {
  id: '1',
  name: '중2 일차함수 기본',
  type: 'assignment',
  subject: '수학',
  grade: '중2',
  description: '일차함수의 그래프와 기울기를 이해하는 문제 세트입니다.',
  createdAt: '2026-01-21',
  updatedAt: '2026-01-21',
  problems: [
    { id: 'p1', number: 1, question: '일차함수 y = 2x + 3의 기울기는?', answer: '2', difficulty: 'easy', unit: '일차함수', type: '객관식' },
    { id: 'p2', number: 2, question: '일차함수 y = -x + 5가 y축과 만나는 점의 좌표는?', answer: '(0, 5)', difficulty: 'easy', unit: '일차함수', type: '단답형' },
    { id: 'p3', number: 3, question: '두 점 (1, 3), (3, 7)을 지나는 직선의 기울기를 구하시오.', answer: '2', difficulty: 'medium', unit: '일차함수', type: '서술형' },
  ]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // TODO: Supabase 연동 시 실제 조회
    if (id === '1' || id === mockProblemSetDetail.id) {
      return NextResponse.json({ success: true, data: mockProblemSetDetail })
    }

    return NextResponse.json({ success: false, error: '문제 세트를 찾을 수 없습니다' }, { status: 404 })
  } catch (error) {
    console.error('문제 세트 조회 오류:', error)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, problemIds } = body

    // TODO: Supabase 연동 시 실제 수정
    const updated = {
      ...mockProblemSetDetail,
      id,
      name: name || mockProblemSetDetail.name,
      description: description || mockProblemSetDetail.description,
      problemCount: problemIds?.length || mockProblemSetDetail.problems.length,
      updatedAt: new Date().toISOString().split('T')[0]
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('문제 세트 수정 오류:', error)
    return NextResponse.json({ success: false, error: '수정 실패' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // TODO: Supabase 연동 시 실제 삭제
    console.log('문제 세트 삭제:', id)

    return NextResponse.json({ success: true, message: '삭제되었습니다' })
  } catch (error) {
    console.error('문제 세트 삭제 오류:', error)
    return NextResponse.json({ success: false, error: '삭제 실패' }, { status: 500 })
  }
}
