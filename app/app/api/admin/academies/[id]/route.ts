/**
 * 슈퍼 어드민 - 학원 상세 API
 *
 * GET /api/admin/academies/[id] - 학원 상세 정보 조회 (통계, 강사 목록, 활동 로그 포함)
 * PATCH /api/admin/academies/[id] - 학원 정보 수정
 * DELETE /api/admin/academies/[id] - 학원 삭제
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// 타입 정의
// ============================================

// 학원 상태
type AcademyStatus = 'active' | 'inactive' | 'suspended' | 'trial';

// 구독 플랜
type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';

// 강사 정보
interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  role: 'admin' | 'teacher' | 'assistant';
  status: 'active' | 'inactive';
  joinedAt: string;
  lastActiveAt: string;
}

// 활동 로그
interface ActivityLog {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
}

// 학원 통계
interface AcademyStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalProblemsGenerated: number;
  totalAssignments: number;
  averageAttendanceRate: number;
  monthlyActiveUsers: number;
  storageUsedMB: number;
  apiCallsThisMonth: number;
}

// 학원 상세 정보
interface AcademyDetail {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  businessNumber: string;
  status: AcademyStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxStudents: number;
  maxTeachers: number;
  maxStorage: number; // MB
  createdAt: string;
  updatedAt: string;
  stats: AcademyStats;
  teachers: Teacher[];
  recentActivityLogs: ActivityLog[];
  settings: {
    allowStudentSelfRegistration: boolean;
    enableSmsNotifications: boolean;
    enableKakaoNotifications: boolean;
    defaultLanguage: string;
    timezone: string;
  };
}

// 학원 수정 입력
interface UpdateAcademyInput {
  name?: string;
  ownerName?: string;
  ownerEmail?: string;
  phone?: string;
  address?: string;
  status?: AcademyStatus;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionEndDate?: string;
  maxStudents?: number;
  maxTeachers?: number;
  maxStorage?: number;
  settings?: {
    allowStudentSelfRegistration?: boolean;
    enableSmsNotifications?: boolean;
    enableKakaoNotifications?: boolean;
    defaultLanguage?: string;
    timezone?: string;
  };
}

// API 응답 타입
interface AcademyDetailResponse {
  success: boolean;
  data?: AcademyDetail;
  error?: string;
}

interface AcademyUpdateResponse {
  success: boolean;
  data?: AcademyDetail;
  error?: string;
}

interface AcademyDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================
// Mock 데이터
// ============================================

const mockAcademies: Record<string, AcademyDetail> = {
  'ACADEMY001': {
    id: 'ACADEMY001',
    name: '청담수학학원',
    ownerName: '김원장',
    ownerEmail: 'owner@cheongdam-math.kr',
    phone: '02-1234-5678',
    address: '서울시 강남구 청담동 123-45 청담빌딩 3층',
    businessNumber: '123-45-67890',
    status: 'active',
    subscriptionPlan: 'professional',
    subscriptionStartDate: '2024-01-01',
    subscriptionEndDate: '2025-12-31',
    maxStudents: 200,
    maxTeachers: 10,
    maxStorage: 10240, // 10GB
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
    stats: {
      totalStudents: 156,
      activeStudents: 142,
      totalTeachers: 8,
      totalClasses: 12,
      totalProblemsGenerated: 4523,
      totalAssignments: 892,
      averageAttendanceRate: 94.5,
      monthlyActiveUsers: 148,
      storageUsedMB: 3245,
      apiCallsThisMonth: 12450,
    },
    teachers: [
      {
        id: 'TEACHER001',
        name: '박수학',
        email: 'park@cheongdam-math.kr',
        phone: '010-1111-2222',
        subjects: ['수학', '수학(상)', '수학(하)'],
        role: 'admin',
        status: 'active',
        joinedAt: '2024-01-01',
        lastActiveAt: '2025-01-21T10:30:00Z',
      },
      {
        id: 'TEACHER002',
        name: '이영희',
        email: 'lee@cheongdam-math.kr',
        phone: '010-2222-3333',
        subjects: ['수학', '미적분'],
        role: 'teacher',
        status: 'active',
        joinedAt: '2024-02-15',
        lastActiveAt: '2025-01-21T09:45:00Z',
      },
      {
        id: 'TEACHER003',
        name: '최민준',
        email: 'choi@cheongdam-math.kr',
        phone: '010-3333-4444',
        subjects: ['수학', '확률과 통계'],
        role: 'teacher',
        status: 'active',
        joinedAt: '2024-03-10',
        lastActiveAt: '2025-01-20T18:20:00Z',
      },
      {
        id: 'TEACHER004',
        name: '정서연',
        email: 'jung@cheongdam-math.kr',
        phone: '010-4444-5555',
        subjects: ['수학', '기하'],
        role: 'teacher',
        status: 'active',
        joinedAt: '2024-05-01',
        lastActiveAt: '2025-01-21T11:00:00Z',
      },
      {
        id: 'TEACHER005',
        name: '김조교',
        email: 'kim.ta@cheongdam-math.kr',
        phone: '010-5555-6666',
        subjects: [],
        role: 'assistant',
        status: 'active',
        joinedAt: '2024-06-01',
        lastActiveAt: '2025-01-21T08:30:00Z',
      },
    ],
    recentActivityLogs: [
      {
        id: 'LOG001',
        action: 'PROBLEM_GENERATED',
        description: '수학(상) 이차함수 문제 20개 생성',
        performedBy: '박수학',
        performedAt: '2025-01-21T10:30:00Z',
        metadata: { problemCount: 20, subject: '수학(상)', topic: '이차함수' },
      },
      {
        id: 'LOG002',
        action: 'ASSIGNMENT_CREATED',
        description: '고1-A반 주간 과제 생성',
        performedBy: '이영희',
        performedAt: '2025-01-21T09:45:00Z',
        metadata: { className: '고1-A반', assignmentType: 'weekly' },
      },
      {
        id: 'LOG003',
        action: 'STUDENT_ENROLLED',
        description: '신규 학생 등록: 홍길동',
        performedBy: '박수학',
        performedAt: '2025-01-20T16:00:00Z',
        metadata: { studentName: '홍길동', grade: '고1' },
      },
      {
        id: 'LOG004',
        action: 'SMS_SENT',
        description: '출결 알림 문자 발송 (42명)',
        performedBy: '시스템',
        performedAt: '2025-01-20T14:00:00Z',
        metadata: { recipientCount: 42, type: 'attendance' },
      },
      {
        id: 'LOG005',
        action: 'REPORT_GENERATED',
        description: '월간 학습 보고서 생성 (12건)',
        performedBy: '시스템',
        performedAt: '2025-01-19T22:00:00Z',
        metadata: { reportCount: 12, period: '2025-01' },
      },
      {
        id: 'LOG006',
        action: 'TEACHER_ADDED',
        description: '신규 강사 등록: 정서연',
        performedBy: '김원장',
        performedAt: '2024-05-01T10:00:00Z',
        metadata: { teacherName: '정서연', subjects: ['수학', '기하'] },
      },
      {
        id: 'LOG007',
        action: 'SUBSCRIPTION_UPGRADED',
        description: 'Basic에서 Professional 플랜으로 업그레이드',
        performedBy: '김원장',
        performedAt: '2024-06-15T11:30:00Z',
        metadata: { fromPlan: 'basic', toPlan: 'professional' },
      },
      {
        id: 'LOG008',
        action: 'SETTINGS_UPDATED',
        description: '카카오 알림톡 설정 활성화',
        performedBy: '박수학',
        performedAt: '2024-07-01T09:00:00Z',
        metadata: { setting: 'enableKakaoNotifications', value: true },
      },
    ],
    settings: {
      allowStudentSelfRegistration: false,
      enableSmsNotifications: true,
      enableKakaoNotifications: true,
      defaultLanguage: 'ko',
      timezone: 'Asia/Seoul',
    },
  },
  'ACADEMY002': {
    id: 'ACADEMY002',
    name: '명문영어학원',
    ownerName: '이대표',
    ownerEmail: 'owner@myungmoon-english.kr',
    phone: '02-9876-5432',
    address: '서울시 서초구 서초동 456-78 명문빌딩 5층',
    businessNumber: '234-56-78901',
    status: 'active',
    subscriptionPlan: 'basic',
    subscriptionStartDate: '2024-06-01',
    subscriptionEndDate: '2025-05-31',
    maxStudents: 100,
    maxTeachers: 5,
    maxStorage: 5120, // 5GB
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2025-01-10T09:15:00Z',
    stats: {
      totalStudents: 78,
      activeStudents: 72,
      totalTeachers: 4,
      totalClasses: 6,
      totalProblemsGenerated: 1234,
      totalAssignments: 345,
      averageAttendanceRate: 91.2,
      monthlyActiveUsers: 74,
      storageUsedMB: 1845,
      apiCallsThisMonth: 5670,
    },
    teachers: [
      {
        id: 'TEACHER010',
        name: '김영어',
        email: 'kim@myungmoon-english.kr',
        phone: '010-6666-7777',
        subjects: ['영어', '영문법', '영어회화'],
        role: 'admin',
        status: 'active',
        joinedAt: '2024-06-01',
        lastActiveAt: '2025-01-21T10:00:00Z',
      },
      {
        id: 'TEACHER011',
        name: '박원어민',
        email: 'native@myungmoon-english.kr',
        phone: '010-7777-8888',
        subjects: ['영어회화', 'TOEFL Speaking'],
        role: 'teacher',
        status: 'active',
        joinedAt: '2024-07-01',
        lastActiveAt: '2025-01-20T17:30:00Z',
      },
    ],
    recentActivityLogs: [
      {
        id: 'LOG101',
        action: 'PROBLEM_GENERATED',
        description: '영문법 관계대명사 문제 15개 생성',
        performedBy: '김영어',
        performedAt: '2025-01-21T10:00:00Z',
        metadata: { problemCount: 15, subject: '영문법', topic: '관계대명사' },
      },
      {
        id: 'LOG102',
        action: 'CLASS_CREATED',
        description: '신규 반 생성: 중3-토플반',
        performedBy: '김영어',
        performedAt: '2025-01-18T11:00:00Z',
        metadata: { className: '중3-토플반' },
      },
    ],
    settings: {
      allowStudentSelfRegistration: true,
      enableSmsNotifications: true,
      enableKakaoNotifications: false,
      defaultLanguage: 'ko',
      timezone: 'Asia/Seoul',
    },
  },
  'ACADEMY003': {
    id: 'ACADEMY003',
    name: '테스트학원',
    ownerName: '테스트',
    ownerEmail: 'test@test.com',
    phone: '02-0000-0000',
    address: '서울시 종로구 테스트동 1-1',
    businessNumber: '000-00-00000',
    status: 'trial',
    subscriptionPlan: 'free',
    subscriptionStartDate: '2025-01-15',
    subscriptionEndDate: '2025-02-14',
    maxStudents: 10,
    maxTeachers: 2,
    maxStorage: 512, // 512MB
    createdAt: '2025-01-15T14:00:00Z',
    updatedAt: '2025-01-15T14:00:00Z',
    stats: {
      totalStudents: 3,
      activeStudents: 3,
      totalTeachers: 1,
      totalClasses: 1,
      totalProblemsGenerated: 12,
      totalAssignments: 2,
      averageAttendanceRate: 100,
      monthlyActiveUsers: 3,
      storageUsedMB: 25,
      apiCallsThisMonth: 45,
    },
    teachers: [
      {
        id: 'TEACHER020',
        name: '테스트강사',
        email: 'teacher@test.com',
        phone: '010-0000-0000',
        subjects: ['수학'],
        role: 'admin',
        status: 'active',
        joinedAt: '2025-01-15',
        lastActiveAt: '2025-01-21T08:00:00Z',
      },
    ],
    recentActivityLogs: [
      {
        id: 'LOG201',
        action: 'ACADEMY_CREATED',
        description: '학원 등록 완료 (체험판)',
        performedBy: '시스템',
        performedAt: '2025-01-15T14:00:00Z',
        metadata: { plan: 'free', trialDays: 30 },
      },
    ],
    settings: {
      allowStudentSelfRegistration: false,
      enableSmsNotifications: false,
      enableKakaoNotifications: false,
      defaultLanguage: 'ko',
      timezone: 'Asia/Seoul',
    },
  },
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/academies/[id]
 * 학원 상세 정보 조회 (통계, 강사 목록, 활동 로그 포함)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // TODO: 슈퍼 어드민 권한 검증
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'super_admin') {
    //   return NextResponse.json(
    //     { success: false, error: '권한이 없습니다.' },
    //     { status: 403 }
    //   );
    // }

    const academy = mockAcademies[id];

    if (!academy) {
      return NextResponse.json(
        { success: false, error: '학원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const response: AcademyDetailResponse = {
      success: true,
      data: academy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학원 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/academies/[id]
 * 학원 정보 수정
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateAcademyInput = await request.json();

    // TODO: 슈퍼 어드민 권한 검증
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'super_admin') {
    //   return NextResponse.json(
    //     { success: false, error: '권한이 없습니다.' },
    //     { status: 403 }
    //   );
    // }

    const academy = mockAcademies[id];

    if (!academy) {
      return NextResponse.json(
        { success: false, error: '학원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 학원 정보 업데이트 (Mock)
    const updatedAcademy: AcademyDetail = {
      ...academy,
      ...(body.name && { name: body.name }),
      ...(body.ownerName && { ownerName: body.ownerName }),
      ...(body.ownerEmail && { ownerEmail: body.ownerEmail }),
      ...(body.phone && { phone: body.phone }),
      ...(body.address && { address: body.address }),
      ...(body.status && { status: body.status }),
      ...(body.subscriptionPlan && { subscriptionPlan: body.subscriptionPlan }),
      ...(body.subscriptionEndDate && { subscriptionEndDate: body.subscriptionEndDate }),
      ...(body.maxStudents !== undefined && { maxStudents: body.maxStudents }),
      ...(body.maxTeachers !== undefined && { maxTeachers: body.maxTeachers }),
      ...(body.maxStorage !== undefined && { maxStorage: body.maxStorage }),
      ...(body.settings && {
        settings: {
          ...academy.settings,
          ...body.settings,
        },
      }),
      updatedAt: new Date().toISOString(),
    };

    // Mock 데이터 업데이트
    mockAcademies[id] = updatedAcademy;

    // 활동 로그 추가
    const newLog: ActivityLog = {
      id: `LOG${Date.now()}`,
      action: 'ACADEMY_UPDATED',
      description: `학원 정보 수정: ${Object.keys(body).join(', ')}`,
      performedBy: '슈퍼 어드민',
      performedAt: new Date().toISOString(),
      metadata: { updatedFields: Object.keys(body) },
    };
    updatedAcademy.recentActivityLogs = [newLog, ...updatedAcademy.recentActivityLogs.slice(0, 9)];

    const response: AcademyUpdateResponse = {
      success: true,
      data: updatedAcademy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학원 정보 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 정보 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/academies/[id]
 * 학원 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // TODO: 슈퍼 어드민 권한 검증
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'super_admin') {
    //   return NextResponse.json(
    //     { success: false, error: '권한이 없습니다.' },
    //     { status: 403 }
    //   );
    // }

    const academy = mockAcademies[id];

    if (!academy) {
      return NextResponse.json(
        { success: false, error: '학원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 활성 학생이 있는 경우 삭제 불가
    if (academy.stats.activeStudents > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `활성 학생이 ${academy.stats.activeStudents}명 있습니다. 모든 학생을 먼저 비활성화하거나 다른 학원으로 이동해주세요.`,
        },
        { status: 400 }
      );
    }

    // Mock 데이터에서 삭제
    delete mockAcademies[id];

    const response: AcademyDeleteResponse = {
      success: true,
      message: `학원 '${academy.name}'이(가) 성공적으로 삭제되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학원 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
