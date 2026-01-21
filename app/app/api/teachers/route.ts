/**
 * 강사 관리 API
 *
 * GET: 강사 목록 조회
 * POST: 강사 추가
 */

import { NextRequest, NextResponse } from 'next/server'
import type { TeacherListItem, TeacherStatus, TeacherRole } from '@/types/teacher'

// Mock 강사 데이터
const mockTeachers: TeacherListItem[] = [
  {
    id: 'teacher-001',
    name: '김수학',
    email: 'kim.math@eduflow.com',
    phone: '010-1234-5678',
    subjects: ['수학'],
    classes: [
      { id: 'class-001', name: '중3 심화반' },
      { id: 'class-002', name: '고1 기초반' },
    ],
    status: 'active' as TeacherStatus,
    role: 'teacher' as TeacherRole,
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'teacher-002',
    name: '이영어',
    email: 'lee.english@eduflow.com',
    phone: '010-2345-6789',
    subjects: ['영어'],
    classes: [
      { id: 'class-003', name: '중2 영어반' },
    ],
    status: 'active' as TeacherStatus,
    role: 'teacher' as TeacherRole,
    created_at: '2024-02-20T10:00:00Z',
  },
  {
    id: 'teacher-003',
    name: '박국어',
    email: 'park.korean@eduflow.com',
    phone: '010-3456-7890',
    subjects: ['국어'],
    classes: [],
    status: 'inactive' as TeacherStatus,
    role: 'teacher' as TeacherRole,
    created_at: '2024-03-10T11:00:00Z',
  },
  {
    id: 'teacher-004',
    name: '최과학',
    email: 'choi.science@eduflow.com',
    phone: '010-4567-8901',
    subjects: ['과학', '수학'],
    classes: [
      { id: 'class-004', name: '고2 과학반' },
    ],
    status: 'active' as TeacherStatus,
    role: 'admin' as TeacherRole,
    created_at: '2024-01-05T08:00:00Z',
  },
  {
    id: 'teacher-005',
    name: '정사회',
    email: 'jung.social@eduflow.com',
    phone: '010-5678-9012',
    subjects: ['사회'],
    classes: [
      { id: 'class-005', name: '중1 사회반' },
      { id: 'class-006', name: '중2 사회반' },
    ],
    status: 'active' as TeacherStatus,
    role: 'teacher' as TeacherRole,
    created_at: '2024-04-01T09:30:00Z',
  },
]

/**
 * GET /api/teachers
 * 강사 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status') as TeacherStatus | null
    const role = searchParams.get('role') as TeacherRole | null
    const subject = searchParams.get('subject')

    let filtered = [...mockTeachers]

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.email.toLowerCase().includes(searchLower) ||
          t.phone.includes(search)
      )
    }

    // 상태 필터
    if (status) {
      filtered = filtered.filter((t) => t.status === status)
    }

    // 역할 필터
    if (role) {
      filtered = filtered.filter((t) => t.role === role)
    }

    // 과목 필터
    if (subject) {
      filtered = filtered.filter((t) => t.subjects.includes(subject))
    }

    return NextResponse.json({
      success: true,
      data: {
        teachers: filtered,
        total: filtered.length,
      },
    })
  } catch (error) {
    console.error('강사 목록 조회 실패:', error)
    return NextResponse.json(
      {
        success: false,
        error: '강사 목록을 불러오는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teachers
 * 강사 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newTeacher: TeacherListItem = {
      id: `teacher-${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      subjects: body.subjects || [],
      classes: [],
      status: 'active' as TeacherStatus,
      role: body.role || 'teacher',
      created_at: new Date().toISOString(),
    }

    // Mock: 실제로는 DB에 저장
    mockTeachers.push(newTeacher)

    return NextResponse.json({
      success: true,
      data: newTeacher,
    })
  } catch (error) {
    console.error('강사 추가 실패:', error)
    return NextResponse.json(
      {
        success: false,
        error: '강사 추가 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
