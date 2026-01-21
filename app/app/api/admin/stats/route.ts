/**
 * 슈퍼 어드민용 통계/대시보드 API
 *
 * GET /api/admin/stats - 전체 통계 조회 (학원수, 학생수, 강사수, 매출, 구독수, 문의수)
 * GET /api/admin/stats?recent=academies - 최근 가입 학원 목록
 * GET /api/admin/stats?recent=support - 최근 문의 목록
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// 타입 정의
// ============================================

/** 전체 통계 */
interface OverallStats {
  totalAcademies: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  totalSubscriptions: number;
  totalSupportTickets: number;
  // 증감률 (전월 대비 %)
  academiesGrowth: number;
  studentsGrowth: number;
  teachersGrowth: number;
  revenueGrowth: number;
  subscriptionsGrowth: number;
  supportTicketsGrowth: number;
}

/** 구독 플랜별 통계 */
interface PlanStats {
  free: number;
  basic: number;
  pro: number;
  enterprise: number;
}

/** 월별 매출 */
interface MonthlyRevenue {
  month: string;
  revenue: number;
}

/** 최근 가입 학원 */
interface RecentAcademy {
  id: string;
  name: string;
  ownerName: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  createdAt: string;
  studentCount: number;
  teacherCount: number;
}

/** 최근 문의 */
interface RecentSupport {
  id: string;
  academyName: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedTo: string | null;
}

/** 전체 통계 응답 */
interface StatsResponse {
  success: boolean;
  data?: {
    overall: OverallStats;
    planDistribution: PlanStats;
    monthlyRevenue: MonthlyRevenue[];
  };
  error?: string;
}

/** 최근 학원 응답 */
interface RecentAcademiesResponse {
  success: boolean;
  data?: RecentAcademy[];
  error?: string;
}

/** 최근 문의 응답 */
interface RecentSupportResponse {
  success: boolean;
  data?: RecentSupport[];
  error?: string;
}

// ============================================
// Mock 데이터
// ============================================

const mockOverallStats: OverallStats = {
  totalAcademies: 156,
  totalStudents: 4823,
  totalTeachers: 312,
  totalRevenue: 78500000, // 7,850만원
  totalSubscriptions: 142,
  totalSupportTickets: 28,
  // 전월 대비 증감률
  academiesGrowth: 12.5,
  studentsGrowth: 8.3,
  teachersGrowth: 5.2,
  revenueGrowth: 15.7,
  subscriptionsGrowth: 10.1,
  supportTicketsGrowth: -3.5, // 문의 감소는 좋은 신호
};

const mockPlanDistribution: PlanStats = {
  free: 45,
  basic: 52,
  pro: 38,
  enterprise: 21,
};

const mockMonthlyRevenue: MonthlyRevenue[] = [
  { month: '2024-07', revenue: 62000000 },
  { month: '2024-08', revenue: 65500000 },
  { month: '2024-09', revenue: 68200000 },
  { month: '2024-10', revenue: 71800000 },
  { month: '2024-11', revenue: 75300000 },
  { month: '2024-12', revenue: 78500000 },
];

const mockRecentAcademies: RecentAcademy[] = [
  {
    id: 'ACM156',
    name: '브라이트 수학 학원',
    ownerName: '김영수',
    plan: 'pro',
    createdAt: '2024-12-20T14:30:00Z',
    studentCount: 45,
    teacherCount: 3,
  },
  {
    id: 'ACM155',
    name: '스마트 영어 아카데미',
    ownerName: '이지은',
    plan: 'basic',
    createdAt: '2024-12-18T10:15:00Z',
    studentCount: 32,
    teacherCount: 2,
  },
  {
    id: 'ACM154',
    name: '명문 입시 학원',
    ownerName: '박민수',
    plan: 'enterprise',
    createdAt: '2024-12-15T16:45:00Z',
    studentCount: 120,
    teacherCount: 8,
  },
  {
    id: 'ACM153',
    name: '드림 과학 학원',
    ownerName: '최현정',
    plan: 'pro',
    createdAt: '2024-12-12T09:00:00Z',
    studentCount: 58,
    teacherCount: 4,
  },
  {
    id: 'ACM152',
    name: '퍼스트 국어 학원',
    ownerName: '정승호',
    plan: 'free',
    createdAt: '2024-12-10T11:30:00Z',
    studentCount: 18,
    teacherCount: 1,
  },
  {
    id: 'ACM151',
    name: '탑클래스 종합 학원',
    ownerName: '강민지',
    plan: 'enterprise',
    createdAt: '2024-12-08T13:20:00Z',
    studentCount: 95,
    teacherCount: 7,
  },
  {
    id: 'ACM150',
    name: '에듀윈 보습 학원',
    ownerName: '윤재혁',
    plan: 'basic',
    createdAt: '2024-12-05T15:00:00Z',
    studentCount: 42,
    teacherCount: 3,
  },
  {
    id: 'ACM149',
    name: '하이탑 수학 학원',
    ownerName: '송미래',
    plan: 'pro',
    createdAt: '2024-12-03T08:45:00Z',
    studentCount: 67,
    teacherCount: 5,
  },
  {
    id: 'ACM148',
    name: '스터디맥스 학원',
    ownerName: '한도현',
    plan: 'basic',
    createdAt: '2024-12-01T10:00:00Z',
    studentCount: 28,
    teacherCount: 2,
  },
  {
    id: 'ACM147',
    name: '엘리트 어학원',
    ownerName: '오수진',
    plan: 'pro',
    createdAt: '2024-11-28T14:15:00Z',
    studentCount: 54,
    teacherCount: 4,
  },
];

const mockRecentSupport: RecentSupport[] = [
  {
    id: 'SUP028',
    academyName: '브라이트 수학 학원',
    subject: '결제 오류 문의',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-12-21T09:30:00Z',
    assignedTo: null,
  },
  {
    id: 'SUP027',
    academyName: '스마트 영어 아카데미',
    subject: '학생 데이터 마이그레이션 요청',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-12-20T15:45:00Z',
    assignedTo: '관리자A',
  },
  {
    id: 'SUP026',
    academyName: '명문 입시 학원',
    subject: 'API 연동 기술 지원',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-12-19T11:20:00Z',
    assignedTo: '기술팀B',
  },
  {
    id: 'SUP025',
    academyName: '드림 과학 학원',
    subject: '리포트 출력 오류',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2024-12-18T14:00:00Z',
    assignedTo: '관리자A',
  },
  {
    id: 'SUP024',
    academyName: '퍼스트 국어 학원',
    subject: '요금제 업그레이드 문의',
    status: 'pending',
    priority: 'low',
    createdAt: '2024-12-17T10:30:00Z',
    assignedTo: null,
  },
  {
    id: 'SUP023',
    academyName: '탑클래스 종합 학원',
    subject: '다중 지점 관리 기능 요청',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-12-16T16:15:00Z',
    assignedTo: '기획팀C',
  },
  {
    id: 'SUP022',
    academyName: '에듀윈 보습 학원',
    subject: '출석 체크 앱 오류',
    status: 'resolved',
    priority: 'high',
    createdAt: '2024-12-15T09:45:00Z',
    assignedTo: '기술팀B',
  },
  {
    id: 'SUP021',
    academyName: '하이탑 수학 학원',
    subject: '계정 권한 설정 문의',
    status: 'closed',
    priority: 'low',
    createdAt: '2024-12-14T13:00:00Z',
    assignedTo: '관리자A',
  },
  {
    id: 'SUP020',
    academyName: '스터디맥스 학원',
    subject: '문자 발송 실패 문의',
    status: 'resolved',
    priority: 'urgent',
    createdAt: '2024-12-13T08:00:00Z',
    assignedTo: '기술팀B',
  },
  {
    id: 'SUP019',
    academyName: '엘리트 어학원',
    subject: '커스텀 리포트 템플릿 요청',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-12-12T11:30:00Z',
    assignedTo: '기획팀C',
  },
];

// ============================================
// GET: 통계 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recent = searchParams.get('recent');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 최근 가입 학원 조회
    if (recent === 'academies') {
      const response: RecentAcademiesResponse = {
        success: true,
        data: mockRecentAcademies.slice(0, limit),
      };
      return NextResponse.json(response);
    }

    // 최근 문의 조회
    if (recent === 'support') {
      const response: RecentSupportResponse = {
        success: true,
        data: mockRecentSupport.slice(0, limit),
      };
      return NextResponse.json(response);
    }

    // 전체 통계 조회
    const response: StatsResponse = {
      success: true,
      data: {
        overall: mockOverallStats,
        planDistribution: mockPlanDistribution,
        monthlyRevenue: mockMonthlyRevenue,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('슈퍼 어드민 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
