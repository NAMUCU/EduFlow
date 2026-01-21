/**
 * 문제 세트 API
 * GET: 목록 조회 (필터링 지원)
 * POST: 새 문제 세트 생성
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock 데이터
const mockProblemSets = [
  { id: '1', name: '중2 일차함수 기본', type: 'assignment', subject: '수학', grade: '중2', problemCount: 10, createdAt: '2026-01-21', assignmentId: 'a1' },
  { id: '2', name: '중3 이차방정식 심화', type: 'class', subject: '수학', grade: '중3', problemCount: 15, createdAt: '2026-01-20' },
  { id: '3', name: '고1 수학 모의고사', type: 'exam', subject: '수학', grade: '고1', problemCount: 30, createdAt: '2026-01-19' },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const grade = searchParams.get('grade')
    const date = searchParams.get('date')
    const assignmentId = searchParams.get('assignmentId')
    const search = searchParams.get('search')

    let filtered = [...mockProblemSets]

    // 필터링
    if (type && type !== 'all') {
      filtered = filtered.filter(ps => ps.type === type)
    }
    if (grade) {
      filtered = filtered.filter(ps => ps.grade === grade)
    }
    if (date) {
      filtered = filtered.filter(ps => ps.createdAt.startsWith(date))
    }
    if (assignmentId) {
      filtered = filtered.filter(ps => ps.assignmentId === assignmentId)
    }
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(ps =>
        ps.name.toLowerCase().includes(query) ||
        ps.grade.toLowerCase().includes(query)
      )
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length
    })
  } catch (error) {
    console.error('문제 세트 목록 조회 오류:', error)
    return NextResponse.json({ success: false, error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, subject, grade, description, problemIds } = body

    if (!name || !type || !grade) {
      return NextResponse.json({ success: false, error: '필수 필드 누락' }, { status: 400 })
    }

    // TODO: Supabase 연동 시 실제 저장
    const newProblemSet = {
      id: `ps_${Date.now()}`,
      name,
      type,
      subject: subject || '수학',
      grade,
      description,
      problemCount: problemIds?.length || 0,
      createdAt: new Date().toISOString().split('T')[0]
    }

    return NextResponse.json({ success: true, data: newProblemSet }, { status: 201 })
  } catch (error) {
    console.error('문제 세트 생성 오류:', error)
    return NextResponse.json({ success: false, error: '생성 실패' }, { status: 500 })
  }
}
