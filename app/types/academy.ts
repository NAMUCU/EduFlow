/**
 * 학원 정보 관련 타입 정의
 * PRD F6: 학원 정보 관리
 */

// 운영 시간 타입
export interface OperatingTime {
  start: string; // HH:mm 형식
  end: string;   // HH:mm 형식
}

// 운영 시간 설정 타입
export interface OperatingHours {
  weekdays: OperatingTime;
  saturday?: OperatingTime;
  sunday?: OperatingTime;
}

// 구독 플랜 타입
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

// 구독 정보 타입
export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  expiresAt: string;
  features?: string[];
}

// 학원 통계 타입
export interface AcademyStats {
  studentCount: number;
  teacherCount: number;
  classCount: number;
}

// 학원 정보 타입
export interface Academy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  operatingHours: OperatingHours;
  subscription: SubscriptionInfo;
  stats: AcademyStats;
  createdAt?: string;
  updatedAt?: string;
}

// 학원 정보 수정 입력 타입
export interface UpdateAcademyInput {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  operatingHours?: OperatingHours;
}

// 로고 업로드 결과 타입
export interface LogoUploadResult {
  success: boolean;
  logoUrl?: string;
  error?: string;
}

// 플랜별 기능 정보
export const PLAN_FEATURES: Record<SubscriptionPlan, { name: string; features: string[]; price: string }> = {
  free: {
    name: 'Free',
    features: ['학생 10명까지', '월 50문제 생성', '기본 리포트'],
    price: '무료',
  },
  basic: {
    name: 'Basic',
    features: ['학생 30명까지', '월 300문제 생성', '기본 리포트', '이메일 지원'],
    price: '월 29,000원',
  },
  pro: {
    name: 'Pro',
    features: ['학생 100명까지', '월 1,000문제 생성', '상세 리포트', 'SMS 발송', '우선 지원'],
    price: '월 79,000원',
  },
  enterprise: {
    name: 'Enterprise',
    features: ['무제한 학생', '무제한 문제 생성', '맞춤형 리포트', '전담 매니저', 'API 연동'],
    price: '별도 문의',
  },
};

// 플랜별 색상 스타일
export const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  free: 'bg-gray-100 text-gray-600',
  basic: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};
