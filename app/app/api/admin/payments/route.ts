import { NextRequest, NextResponse } from 'next/server';

// 결제 상태 타입
type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';

// 결제 방법 타입
type PaymentMethod = 'card' | 'bank_transfer' | 'virtual_account' | 'kakao_pay' | 'naver_pay';

// 결제 내역 타입
interface Payment {
  id: string;
  academyId: string;
  academyName: string;
  planName: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  paidAt: string | null;
  createdAt: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceNumber: string;
  receiptUrl: string | null;
}

// 결제 통계 타입
interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  monthlyTransactions: number;
  averageTransactionAmount: number;
  revenueByPlan: {
    planName: string;
    revenue: number;
    count: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    count: number;
  }[];
  statusBreakdown: {
    status: PaymentStatus;
    count: number;
    amount: number;
  }[];
  methodBreakdown: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
}

// Mock 결제 데이터 생성
function generateMockPayments(): Payment[] {
  const academies = [
    { id: 'academy-001', name: '강남수학학원' },
    { id: 'academy-002', name: '서초영어학원' },
    { id: 'academy-003', name: '송파과학학원' },
    { id: 'academy-004', name: '분당국어학원' },
    { id: 'academy-005', name: '일산종합학원' },
    { id: 'academy-006', name: '평촌수학전문학원' },
    { id: 'academy-007', name: '목동영재학원' },
    { id: 'academy-008', name: '노원탑클래스학원' },
    { id: 'academy-009', name: '수원스마트학원' },
    { id: 'academy-010', name: '인천글로벌학원' },
  ];

  const plans = [
    { name: 'Basic', amount: 49000 },
    { name: 'Standard', amount: 99000 },
    { name: 'Premium', amount: 199000 },
    { name: 'Enterprise', amount: 399000 },
  ];

  const statuses: PaymentStatus[] = ['completed', 'pending', 'failed', 'refunded', 'cancelled'];
  const methods: PaymentMethod[] = ['card', 'bank_transfer', 'virtual_account', 'kakao_pay', 'naver_pay'];

  const payments: Payment[] = [];

  // 최근 12개월 결제 데이터 생성
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - monthOffset);

    // 각 월별 10-20개 결제
    const paymentCount = Math.floor(Math.random() * 11) + 10;

    for (let i = 0; i < paymentCount; i++) {
      const academy = academies[Math.floor(Math.random() * academies.length)];
      const plan = plans[Math.floor(Math.random() * plans.length)];
      const status = statuses[Math.floor(Math.random() * 100) < 85 ? 0 : Math.floor(Math.random() * statuses.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];

      const day = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);

      const billingStart = new Date(createdAt);
      const billingEnd = new Date(createdAt);
      billingEnd.setMonth(billingEnd.getMonth() + 1);

      const paymentId = `pay-${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;

      payments.push({
        id: paymentId,
        academyId: academy.id,
        academyName: academy.name,
        planName: plan.name,
        amount: plan.amount,
        status,
        method,
        paidAt: status === 'completed' ? createdAt.toISOString() : null,
        createdAt: createdAt.toISOString(),
        billingPeriodStart: billingStart.toISOString(),
        billingPeriodEnd: billingEnd.toISOString(),
        invoiceNumber: `INV-${paymentId.replace('pay-', '')}`,
        receiptUrl: status === 'completed' ? `https://receipt.example.com/${paymentId}` : null,
      });
    }
  }

  // 날짜순 정렬 (최신순)
  return payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Mock 통계 데이터 생성
function generateMockStats(payments: Payment[]): PaymentStats {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 완료된 결제만 필터
  const completedPayments = payments.filter(p => p.status === 'completed');

  // 이번 달 결제
  const monthlyPayments = completedPayments.filter(p => {
    const date = new Date(p.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // 총 수익
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // 플랜별 수익
  const planMap = new Map<string, { revenue: number; count: number }>();
  completedPayments.forEach(p => {
    const current = planMap.get(p.planName) || { revenue: 0, count: 0 };
    planMap.set(p.planName, {
      revenue: current.revenue + p.amount,
      count: current.count + 1,
    });
  });
  const revenueByPlan = Array.from(planMap.entries()).map(([planName, data]) => ({
    planName,
    ...data,
  }));

  // 월별 수익
  const monthMap = new Map<string, { revenue: number; count: number }>();
  completedPayments.forEach(p => {
    const date = new Date(p.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthMap.get(monthKey) || { revenue: 0, count: 0 };
    monthMap.set(monthKey, {
      revenue: current.revenue + p.amount,
      count: current.count + 1,
    });
  });
  const revenueByMonth = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 상태별 현황
  const statusMap = new Map<PaymentStatus, { count: number; amount: number }>();
  payments.forEach(p => {
    const current = statusMap.get(p.status) || { count: 0, amount: 0 };
    statusMap.set(p.status, {
      count: current.count + 1,
      amount: current.amount + p.amount,
    });
  });
  const statusBreakdown = Array.from(statusMap.entries()).map(([status, data]) => ({
    status,
    ...data,
  }));

  // 결제 방법별 현황
  const methodMap = new Map<PaymentMethod, { count: number; amount: number }>();
  completedPayments.forEach(p => {
    const current = methodMap.get(p.method) || { count: 0, amount: 0 };
    methodMap.set(p.method, {
      count: current.count + 1,
      amount: current.amount + p.amount,
    });
  });
  const methodBreakdown = Array.from(methodMap.entries()).map(([method, data]) => ({
    method,
    ...data,
  }));

  return {
    totalRevenue,
    monthlyRevenue,
    totalTransactions: payments.length,
    monthlyTransactions: monthlyPayments.length,
    averageTransactionAmount: completedPayments.length > 0
      ? Math.round(totalRevenue / completedPayments.length)
      : 0,
    revenueByPlan,
    revenueByMonth,
    statusBreakdown,
    methodBreakdown,
  };
}

// 결제 내역 조회 및 통계
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 통계 요청 확인
    const isStatsRequest = searchParams.get('stats') === 'true';

    // 필터 파라미터
    const status = searchParams.get('status') as PaymentStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const academyId = searchParams.get('academyId');
    const planName = searchParams.get('planName');
    const method = searchParams.get('method') as PaymentMethod | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Mock 데이터 생성
    let payments = generateMockPayments();

    // 필터 적용
    if (status) {
      payments = payments.filter(p => p.status === status);
    }

    if (startDate) {
      const start = new Date(startDate);
      payments = payments.filter(p => new Date(p.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      payments = payments.filter(p => new Date(p.createdAt) <= end);
    }

    if (academyId) {
      payments = payments.filter(p => p.academyId === academyId);
    }

    if (planName) {
      payments = payments.filter(p => p.planName === planName);
    }

    if (method) {
      payments = payments.filter(p => p.method === method);
    }

    // 통계 요청인 경우
    if (isStatsRequest) {
      const stats = generateMockStats(payments);
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // 페이지네이션
    const totalCount = payments.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedPayments = payments.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('결제 내역 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '결제 내역을 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
