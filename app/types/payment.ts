/**
 * EduFlow 결제 관련 타입 정의
 *
 * 학원 플랜 결제와 관련된 모든 타입을 정의합니다.
 */

// 플랜 타입
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

// 결제 상태
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// 결제 방법
export type PaymentMethod = 'card' | 'bank_transfer' | 'kakao_pay' | 'naver_pay' | 'toss';

// 플랜 정보
export interface Plan {
  type: PlanType;
  name: string;
  description: string;
  price: number;                    // 월 요금 (원)
  yearlyPrice?: number;             // 연 요금 (원)
  features: string[];               // 포함 기능 목록
  maxStudents: number | null;       // 최대 학생 수 (null = 무제한)
  maxTeachers: number | null;       // 최대 강사 수 (null = 무제한)
  maxProblemsPerMonth: number | null; // 월 최대 문제 생성 수 (null = 무제한)
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

// 결제 정보
export interface Payment {
  id: string;
  academyId: string;
  planType: PlanType;
  amount: number;                   // 결제 금액 (원)
  currency: string;                 // 통화 (KRW)
  status: PaymentStatus;
  method?: PaymentMethod;
  billingPeriod: 'monthly' | 'yearly';
  startDate: string;                // 플랜 시작일
  endDate: string;                  // 플랜 종료일
  paidAt?: string;                  // 결제 완료 시각
  transactionId?: string;           // 외부 결제 트랜잭션 ID
  receiptUrl?: string;              // 영수증 URL
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// 결제 생성 입력
export interface CreatePaymentInput {
  academyId: string;
  planType: PlanType;
  amount: number;
  billingPeriod?: 'monthly' | 'yearly';
  metadata?: Record<string, unknown>;
}

// 결제 처리 입력
export interface ProcessPaymentInput {
  paymentId: string;
  method: PaymentMethod;
  cardInfo?: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolderName: string;
  };
  bankInfo?: {
    bankCode: string;
    accountNumber: string;
    depositorName: string;
  };
}

// 결제 결과
export interface PaymentResult {
  success: boolean;
  payment?: Payment;
  error?: string;
  transactionId?: string;
  receiptUrl?: string;
}

// 웹훅 이벤트 타입
export type WebhookEventType =
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'
  | 'subscription.renewed'
  | 'subscription.cancelled';

// 웹훅 페이로드
export interface WebhookPayload {
  eventType: WebhookEventType;
  paymentId: string;
  transactionId?: string;
  status: PaymentStatus;
  amount?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
  signature?: string;
}

// 결제 내역 조회 필터
export interface PaymentHistoryFilter {
  academyId: string;
  status?: PaymentStatus;
  planType?: PlanType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// 결제 내역 응답
export interface PaymentHistoryResponse {
  success: boolean;
  data?: {
    payments: Payment[];
    total: number;
  };
  error?: string;
}

// 현재 구독 정보
export interface Subscription {
  id: string;
  academyId: string;
  planType: PlanType;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
export interface PaymentApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
