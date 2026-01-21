/**
 * 슈퍼 어드민용 강사 관리 API
 *
 * GET: 전체 강사 목록 조회 (검색, 학원 필터)
 *
 * 슈퍼 어드민은 모든 학원의 강사를 조회할 수 있습니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { TeacherStatus, TeacherRole, AssignedClass } from '@/types/teacher'
import type { SubscriptionPlan } from '@/types/academy'

// ============================================
// 슈퍼 어드민용 강사 타입 정의
// ============================================

/** 학원 정보 (간략) */
interface AcademyInfo {
  id: string
  name: string
  plan: SubscriptionPlan
}

/** 슈퍼 어드민용 강사 목록 아이템 */
interface AdminTeacherListItem {
  id: string
  name: string
  email: string
  phone: string
  subjects: string[]
  classes: AssignedClass[]
  status: TeacherStatus
  role: TeacherRole
  academy: AcademyInfo
  created_at: string
  last_login_at?: string
}

// ============================================
// Mock 데이터
// ============================================

/** Mock 학원 데이터 */
const mockAcademies: AcademyInfo[] = [
  { id: 'academy-001', name: '서울수학학원', plan: 'pro' },
  { id: 'academy-002', name: '강남영어학원', plan: 'basic' },
  { id: 'academy-003', name: '대치종합학원', plan: 'enterprise' },
  { id: 'academy-004', name: '분당과학학원', plan: 'free' },
]

/** Mock 강사 데이터 */
const mockAdminTeachers: AdminTeacherListItem[] = [
  // 서울수학학원 강사들
  {
    id: 'teacher-001',
    name: '김수학',
    email: 'kim.math@seoul-academy.com',
    phone: '010-1234-5678',
    subjects: ['수학'],
    classes: [
      { id: 'class-001', name: '중3 심화반' },
      { id: 'class-002', name: '고1 기초반' },
    ],
    status: 'active',
    role: 'admin',
    academy: mockAcademies[0],
    created_at: '2024-01-15T09:00:00Z',
    last_login_at: '2025-01-20T14:30:00Z',
  },
  {
    id: 'teacher-002',
    name: '박정수',
    email: 'park.js@seoul-academy.com',
    phone: '010-2222-3333',
    subjects: ['수학', '과학'],
    classes: [
      { id: 'class-003', name: '중2 수학반' },
    ],
    status: 'active',
    role: 'teacher',
    academy: mockAcademies[0],
    created_at: '2024-03-10T10:00:00Z',
    last_login_at: '2025-01-19T16:45:00Z',
  },
  // 강남영어학원 강사들
  {
    id: 'teacher-003',
    name: '이영어',
    email: 'lee.english@gangnam-academy.com',
    phone: '010-3333-4444',
    subjects: ['영어'],
    classes: [
      { id: 'class-004', name: '중2 영어반' },
      { id: 'class-005', name: '고1 영어반' },
    ],
    status: 'active',
    role: 'admin',
    academy: mockAcademies[1],
    created_at: '2024-02-20T10:00:00Z',
    last_login_at: '2025-01-21T09:15:00Z',
  },
  {
    id: 'teacher-004',
    name: '최민지',
    email: 'choi.mj@gangnam-academy.com',
    phone: '010-4444-5555',
    subjects: ['영어'],
    classes: [],
    status: 'inactive',
    role: 'teacher',
    academy: mockAcademies[1],
    created_at: '2024-05-15T11:00:00Z',
    last_login_at: '2024-12-01T10:00:00Z',
  },
  // 대치종합학원 강사들
  {
    id: 'teacher-005',
    name: '정국어',
    email: 'jung.korean@daechi-academy.com',
    phone: '010-5555-6666',
    subjects: ['국어'],
    classes: [
      { id: 'class-006', name: '중1 국어반' },
      { id: 'class-007', name: '중2 국어반' },
      { id: 'class-008', name: '중3 국어반' },
    ],
    status: 'active',
    role: 'admin',
    academy: mockAcademies[2],
    created_at: '2024-01-05T08:00:00Z',
    last_login_at: '2025-01-21T08:00:00Z',
  },
  {
    id: 'teacher-006',
    name: '한과학',
    email: 'han.science@daechi-academy.com',
    phone: '010-6666-7777',
    subjects: ['과학', '수학'],
    classes: [
      { id: 'class-009', name: '고2 과학반' },
    ],
    status: 'active',
    role: 'teacher',
    academy: mockAcademies[2],
    created_at: '2024-04-01T09:30:00Z',
    last_login_at: '2025-01-20T17:20:00Z',
  },
  {
    id: 'teacher-007',
    name: '윤사회',
    email: 'yoon.social@daechi-academy.com',
    phone: '010-7777-8888',
    subjects: ['사회', '역사'],
    classes: [
      { id: 'class-010', name: '중3 사회반' },
    ],
    status: 'active',
    role: 'teacher',
    academy: mockAcademies[2],
    created_at: '2024-06-15T10:00:00Z',
    last_login_at: '2025-01-18T11:30:00Z',
  },
  // 분당과학학원 강사들
  {
    id: 'teacher-008',
    name: '송과학',
    email: 'song.science@bundang-academy.com',
    phone: '010-8888-9999',
    subjects: ['과학'],
    classes: [
      { id: 'class-011', name: '중1 과학반' },
    ],
    status: 'active',
    role: 'admin',
    academy: mockAcademies[3],
    created_at: '2024-07-01T09:00:00Z',
    last_login_at: '2025-01-21T10:45:00Z',
  },
  {
    id: 'teacher-009',
    name: '임수학',
    email: 'lim.math@bundang-academy.com',
    phone: '010-9999-0000',
    subjects: ['수학'],
    classes: [],
    status: 'inactive',
    role: 'teacher',
    academy: mockAcademies[3],
    created_at: '2024-08-15T14:00:00Z',
    last_login_at: '2024-11-20T09:00:00Z',
  },
]

// ============================================
// API 핸들러
// ============================================

/**
 * GET /api/admin/teachers
 * 슈퍼 어드민용 전체 강사 목록 조회
 *
 * Query Parameters:
 * - search: 검색어 (이름, 이메일, 연락처)
 * - academy_id: 학원 ID 필터
 * - status: 강사 상태 필터 (active | inactive)
 * - role: 역할 필터 (admin | teacher)
 * - subject: 과목 필터
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터 파싱
    const search = searchParams.get('search')
    const academyId = searchParams.get('academy_id')
    const status = searchParams.get('status') as TeacherStatus | null
    const role = searchParams.get('role') as TeacherRole | null
    const subject = searchParams.get('subject')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10)

    let filtered = [...mockAdminTeachers]

    // 검색 필터 (이름, 이메일, 연락처)
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchLower) ||
          teacher.email.toLowerCase().includes(searchLower) ||
          teacher.phone.includes(search)
      )
    }

    // 학원 ID 필터
    if (academyId) {
      filtered = filtered.filter((teacher) => teacher.academy.id === academyId)
    }

    // 상태 필터
    if (status) {
      filtered = filtered.filter((teacher) => teacher.status === status)
    }

    // 역할 필터
    if (role) {
      filtered = filtered.filter((teacher) => teacher.role === role)
    }

    // 과목 필터
    if (subject) {
      filtered = filtered.filter((teacher) => teacher.subjects.includes(subject))
    }

    // 전체 개수 (페이징 전)
    const total = filtered.length

    // 페이징 적용
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTeachers = filtered.slice(startIndex, endIndex)

    // 학원 목록 (필터용)
    const academies = mockAcademies.map((academy) => ({
      id: academy.id,
      name: academy.name,
    }))

    // 통계 정보
    const stats = {
      total_teachers: mockAdminTeachers.length,
      active_teachers: mockAdminTeachers.filter((t) => t.status === 'active').length,
      inactive_teachers: mockAdminTeachers.filter((t) => t.status === 'inactive').length,
      admin_count: mockAdminTeachers.filter((t) => t.role === 'admin').length,
      teacher_count: mockAdminTeachers.filter((t) => t.role === 'teacher').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        teachers: paginatedTeachers,
        total,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(total / pageSize),
        academies,
        stats,
      },
    })
  } catch (error) {
    console.error('슈퍼 어드민 강사 목록 조회 실패:', error)
    return NextResponse.json(
      {
        success: false,
        error: '강사 목록을 불러오는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
