/**
 * 결제 관리 서비스 - 학원 플랜 결제 및 구독 관리
 *
 * Mock 모드와 Supabase 연동 모드를 모두 지원합니다.
 */

import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Payment,
  PaymentStatus,
  PlanType,
  Plan,
  CreatePaymentInput,
  ProcessPaymentInput,
  PaymentResult,
  PaymentHistoryFilter,
  PaymentMethod,
  Subscription,
  WebhookPayload,
} from '@/types/payment';

// 플랜 정보 정의
export const PLANS: Record<PlanType, Plan> = {
  free: {
    type: 'free',
    name: '무료',
    description: '소규모 학원을 위한 기본 플랜',
    price: 0,
    features: [
      '학생 10명까지 관리',
      '강사 2명까지',
      '월 50문제 생성',
      '기본 리포트',
      '커뮤니티 지원',
    ],
    maxStudents: 10,
    maxTeachers: 2,
    maxProblemsPerMonth: 50,
    supportLevel: 'community',
  },
  basic: {
    type: 'basic',
    name: '베이직',
    description: '성장하는 학원을 위한 플랜',
    price: 99000,
    yearlyPrice: 990000,
    features: [
      '학생 50명까지 관리',
      '강사 5명까지',
      '월 500문제 생성',
      '상세 리포트',
      '이메일 지원',
      'SMS 알림 기능',
    ],
    maxStudents: 50,
    maxTeachers: 5,
    maxProblemsPerMonth: 500,
    supportLevel: 'email',
  },
  pro: {
    type: 'pro',
    name: '프로',
    description: '전문 학원을 위한 고급 플랜',
    price: 199000,
    yearlyPrice: 1990000,
    features: [
      '학생 200명까지 관리',
      '강사 20명까지',
      '무제한 문제 생성',
      '고급 분석 리포트',
      '우선 지원',
      'AI 맞춤 학습 분석',
      '학부모 앱 연동',
    ],
    maxStudents: 200,
    maxTeachers: 20,
    maxProblemsPerMonth: null,
    supportLevel: 'priority',
  },
  enterprise: {
    type: 'enterprise',
    name: '엔터프라이즈',
    description: '대형 학원 및 프랜차이즈를 위한 맞춤 플랜',
    price: 499000,
    yearlyPrice: 4990000,
    features: [
      '무제한 학생 관리',
      '무제한 강사',
      '무제한 문제 생성',
      '맞춤형 리포트',
      '전담 매니저',
      'API 연동',
      '화이트라벨링',
      'SLA 보장',
    ],
    maxStudents: null,
    maxTeachers: null,
    maxProblemsPerMonth: null,
    supportLevel: 'dedicated',
  },
};

// Mock 데이터
const mockPayments: Payment[] = [
  {
    id: 'payment-001',
    academyId: 'academy-001',
    planType: 'basic',
    amount: 99000,
    currency: 'KRW',
    status: 'completed',
    method: 'card',
    billingPeriod: 'monthly',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-01T00:00:00Z',
    paidAt: '2024-01-01T10:30:00Z',
    transactionId: 'TXN-20240101-001',
    receiptUrl: 'https://example.com/receipt/001',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:30:00Z',
  },
  {
    id: 'payment-002',
    academyId: 'academy-001',
    planType: 'basic',
    amount: 99000,
    currency: 'KRW',
    status: 'completed',
    method: 'card',
    billingPeriod: 'monthly',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-03-01T00:00:00Z',
    paidAt: '2024-02-01T10:00:00Z',
    transactionId: 'TXN-20240201-001',
    receiptUrl: 'https://example.com/receipt/002',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
];

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-001',
    academyId: 'academy-001',
    planType: 'basic',
    status: 'active',
    currentPeriodStart: '2024-02-01T00:00:00Z',
    currentPeriodEnd: '2024-03-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
];

/**
 * 결제 생성
 */
export async function createPayment(
  academyId: string,
  planType: PlanType,
  amount: number,
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
): Promise<PaymentResult> {
  const plan = PLANS[planType];
  if (!plan) {
    return { success: false, error: '유효하지 않은 플랜입니다.' };
  }

  const now = new Date();
  const endDate = new Date(now);
  if (billingPeriod === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const newPayment: Payment = {
    id: `payment-${Date.now()}`,
    academyId,
    planType,
    amount,
    currency: 'KRW',
    status: 'pending',
    billingPeriod,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (!isSupabaseConfigured()) {
    // Mock 모드
    mockPayments.push(newPayment);
    return { success: true, payment: newPayment };
  }

  // Supabase 모드
  const supabase = createServerSupabaseClient();
  const { data, error } = await (supabase.from('payments') as any)
    .insert({
      academy_id: academyId,
      plan_type: planType,
      amount,
      currency: 'KRW',
      status: 'pending',
      billing_period: billingPeriod,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    payment: mapDbToPayment(data),
  };
}

/**
 * 결제 처리
 */
export async function processPayment(
  paymentId: string,
  method: PaymentMethod
): Promise<PaymentResult> {
  if (!isSupabaseConfigured()) {
    // Mock 모드
    const paymentIndex = mockPayments.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) {
      return { success: false, error: '결제를 찾을 수 없습니다.' };
    }

    const payment = mockPayments[paymentIndex];
    if (payment.status !== 'pending') {
      return { success: false, error: '이미 처리된 결제입니다.' };
    }

    // 결제 처리 시뮬레이션 (실제로는 PG 연동)
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const receiptUrl = `https://example.com/receipt/${transactionId}`;

    const updatedPayment: Payment = {
      ...payment,
      status: 'completed',
      method,
      paidAt: new Date().toISOString(),
      transactionId,
      receiptUrl,
      updatedAt: new Date().toISOString(),
    };

    mockPayments[paymentIndex] = updatedPayment;

    // 구독 정보 업데이트
    updateMockSubscription(payment.academyId, payment.planType, payment.startDate, payment.endDate);

    return {
      success: true,
      payment: updatedPayment,
      transactionId,
      receiptUrl,
    };
  }

  // Supabase 모드
  const supabase = createServerSupabaseClient();

  // 결제 정보 조회
  const { data: existingPayment, error: fetchError } = await (supabase.from('payments') as any)
    .select('*')
    .eq('id', paymentId)
    .single();

  if (fetchError || !existingPayment) {
    return { success: false, error: '결제를 찾을 수 없습니다.' };
  }

  if (existingPayment.status !== 'pending') {
    return { success: false, error: '이미 처리된 결제입니다.' };
  }

  // 결제 처리 (실제로는 PG 연동)
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const receiptUrl = `https://example.com/receipt/${transactionId}`;

  const { data: updated, error: updateError } = await (supabase.from('payments') as any)
    .update({
      status: 'completed',
      method,
      paid_at: new Date().toISOString(),
      transaction_id: transactionId,
      receipt_url: receiptUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 구독 정보 업데이트
  await updateSubscription(
    existingPayment.academy_id,
    existingPayment.plan_type,
    existingPayment.start_date,
    existingPayment.end_date
  );

  return {
    success: true,
    payment: mapDbToPayment(updated),
    transactionId,
    receiptUrl,
  };
}

/**
 * 결제 내역 조회
 */
export async function getPaymentHistory(
  academyId: string,
  filter?: Partial<PaymentHistoryFilter>
): Promise<{ data: Payment[]; total: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Mock 모드
    let filtered = mockPayments.filter((p) => p.academyId === academyId);

    if (filter?.status) {
      filtered = filtered.filter((p) => p.status === filter.status);
    }
    if (filter?.planType) {
      filtered = filtered.filter((p) => p.planType === filter.planType);
    }
    if (filter?.startDate) {
      filtered = filtered.filter((p) => new Date(p.createdAt) >= new Date(filter.startDate!));
    }
    if (filter?.endDate) {
      filtered = filtered.filter((p) => new Date(p.createdAt) <= new Date(filter.endDate!));
    }

    const total = filtered.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 20;
    const paginated = filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    return { data: paginated, total };
  }

  // Supabase 모드
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .eq('academy_id', academyId);

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }
  if (filter?.planType) {
    query = query.eq('plan_type', filter.planType);
  }
  if (filter?.startDate) {
    query = query.gte('created_at', filter.startDate);
  }
  if (filter?.endDate) {
    query = query.lte('created_at', filter.endDate);
  }

  const offset = filter?.offset || 0;
  const limit = filter?.limit || 20;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data || []).map(mapDbToPayment),
    total: count || 0,
  };
}

/**
 * 단일 결제 조회
 */
export async function getPayment(paymentId: string): Promise<{ data: Payment | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    const payment = mockPayments.find((p) => p.id === paymentId);
    return { data: payment || null };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: mapDbToPayment(data) };
}

/**
 * 결제 상태 업데이트
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  metadata?: Record<string, unknown>
): Promise<PaymentResult> {
  if (!isSupabaseConfigured()) {
    const paymentIndex = mockPayments.findIndex((p) => p.id === paymentId);
    if (paymentIndex === -1) {
      return { success: false, error: '결제를 찾을 수 없습니다.' };
    }

    mockPayments[paymentIndex] = {
      ...mockPayments[paymentIndex],
      status,
      metadata: { ...mockPayments[paymentIndex].metadata, ...metadata },
      updatedAt: new Date().toISOString(),
    };

    return { success: true, payment: mockPayments[paymentIndex] };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await (supabase.from('payments') as any)
    .update({
      status,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, payment: mapDbToPayment(data) };
}

/**
 * 현재 구독 조회
 */
export async function getCurrentSubscription(
  academyId: string
): Promise<{ data: Subscription | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    const subscription = mockSubscriptions.find(
      (s) => s.academyId === academyId && s.status === 'active'
    );
    return { data: subscription || null };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('academy_id', academyId)
    .eq('status', 'active')
    .single();

  if (error) {
    return { data: null, error: error.code === 'PGRST116' ? undefined : error.message };
  }

  return { data: mapDbToSubscription(data) };
}

/**
 * 웹훅 처리
 */
export async function handleWebhook(payload: WebhookPayload): Promise<PaymentResult> {
  const { eventType, paymentId, status, transactionId } = payload;

  // 서명 검증 (실제로는 PG사 서명 검증 로직 필요)
  // if (!verifyWebhookSignature(payload)) {
  //   return { success: false, error: '유효하지 않은 웹훅 서명입니다.' };
  // }

  switch (eventType) {
    case 'payment.completed':
      return updatePaymentStatus(paymentId, 'completed', { transactionId });

    case 'payment.failed':
      return updatePaymentStatus(paymentId, 'failed', { transactionId });

    case 'payment.cancelled':
      return updatePaymentStatus(paymentId, 'cancelled', { transactionId });

    case 'payment.refunded':
      return updatePaymentStatus(paymentId, 'refunded', { transactionId });

    case 'subscription.renewed':
      // 구독 갱신 처리
      const { data: payment } = await getPayment(paymentId);
      if (payment) {
        await updateSubscription(
          payment.academyId,
          payment.planType,
          payment.startDate,
          payment.endDate
        );
      }
      return { success: true };

    case 'subscription.cancelled':
      return cancelSubscription(paymentId);

    default:
      return { success: false, error: '알 수 없는 이벤트 타입입니다.' };
  }
}

/**
 * 플랜 정보 조회
 */
export function getPlan(planType: PlanType): Plan | null {
  return PLANS[planType] || null;
}

/**
 * 모든 플랜 정보 조회
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

// 헬퍼 함수들

function mapDbToPayment(dbPayment: any): Payment {
  return {
    id: dbPayment.id,
    academyId: dbPayment.academy_id,
    planType: dbPayment.plan_type,
    amount: dbPayment.amount,
    currency: dbPayment.currency,
    status: dbPayment.status,
    method: dbPayment.method,
    billingPeriod: dbPayment.billing_period,
    startDate: dbPayment.start_date,
    endDate: dbPayment.end_date,
    paidAt: dbPayment.paid_at,
    transactionId: dbPayment.transaction_id,
    receiptUrl: dbPayment.receipt_url,
    metadata: dbPayment.metadata,
    createdAt: dbPayment.created_at,
    updatedAt: dbPayment.updated_at,
  };
}

function mapDbToSubscription(dbSubscription: any): Subscription {
  return {
    id: dbSubscription.id,
    academyId: dbSubscription.academy_id,
    planType: dbSubscription.plan_type,
    status: dbSubscription.status,
    currentPeriodStart: dbSubscription.current_period_start,
    currentPeriodEnd: dbSubscription.current_period_end,
    cancelAtPeriodEnd: dbSubscription.cancel_at_period_end,
    createdAt: dbSubscription.created_at,
    updatedAt: dbSubscription.updated_at,
  };
}

function updateMockSubscription(
  academyId: string,
  planType: PlanType,
  startDate: string,
  endDate: string
): void {
  const existingIndex = mockSubscriptions.findIndex(
    (s) => s.academyId === academyId
  );

  const subscription: Subscription = {
    id: existingIndex >= 0 ? mockSubscriptions[existingIndex].id : `sub-${Date.now()}`,
    academyId,
    planType,
    status: 'active',
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
    cancelAtPeriodEnd: false,
    createdAt: existingIndex >= 0 ? mockSubscriptions[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    mockSubscriptions[existingIndex] = subscription;
  } else {
    mockSubscriptions.push(subscription);
  }
}

async function updateSubscription(
  academyId: string,
  planType: PlanType,
  startDate: string,
  endDate: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    updateMockSubscription(academyId, planType, startDate, endDate);
    return;
  }

  const supabase = createServerSupabaseClient();

  // 기존 구독 확인
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('academy_id', academyId)
    .single();

  if (existing) {
    // 기존 구독 업데이트
    await (supabase.from('subscriptions') as any).update({
      plan_type: planType,
      status: 'active',
      current_period_start: startDate,
      current_period_end: endDate,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    }).eq('id', (existing as any).id);
  } else {
    // 새 구독 생성
    await (supabase.from('subscriptions') as any).insert({
      academy_id: academyId,
      plan_type: planType,
      status: 'active',
      current_period_start: startDate,
      current_period_end: endDate,
      cancel_at_period_end: false,
    });
  }
}

async function cancelSubscription(paymentId: string): Promise<PaymentResult> {
  const { data: payment } = await getPayment(paymentId);
  if (!payment) {
    return { success: false, error: '결제를 찾을 수 없습니다.' };
  }

  if (!isSupabaseConfigured()) {
    const subIndex = mockSubscriptions.findIndex(
      (s) => s.academyId === payment.academyId
    );
    if (subIndex >= 0) {
      mockSubscriptions[subIndex] = {
        ...mockSubscriptions[subIndex],
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString(),
      };
    }
    return { success: true };
  }

  const supabase = createServerSupabaseClient();
  await (supabase.from('subscriptions') as any)
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('academy_id', payment.academyId);

  return { success: true };
}
