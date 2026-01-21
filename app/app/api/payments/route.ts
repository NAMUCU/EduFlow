/**
 * 결제 API - 결제 내역 조회 및 결제 생성
 *
 * GET /api/payments - 결제 내역 조회
 * POST /api/payments - 결제 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPayment,
  getPaymentHistory,
  processPayment,
  getAllPlans,
  getPlan,
  PLANS,
} from '@/lib/services/payments';
import type {
  PlanType,
  PaymentMethod,
  PaymentHistoryResponse,
  PaymentApiResponse,
  Payment,
} from '@/types/payment';

/**
 * GET /api/payments
 * 결제 내역 조회
 *
 * Query Parameters:
 * - academyId: 학원 ID (필수)
 * - status: 결제 상태 필터
 * - planType: 플랜 타입 필터
 * - startDate: 조회 시작일
 * - endDate: 조회 종료일
 * - limit: 페이지 크기 (기본 20)
 * - offset: 시작 오프셋 (기본 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const academyId = searchParams.get('academyId');
    const status = searchParams.get('status') as Payment['status'] | null;
    const planType = searchParams.get('planType') as PlanType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 플랜 목록 조회 요청인 경우
    if (searchParams.get('type') === 'plans') {
      const plans = getAllPlans();
      return NextResponse.json({
        success: true,
        data: { plans },
      });
    }

    // academyId 필수 체크
    if (!academyId) {
      return NextResponse.json(
        { success: false, error: '학원 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 결제 내역 조회
    const result = await getPaymentHistory(academyId, {
      status: status || undefined,
      planType: planType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit,
      offset,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const response: PaymentHistoryResponse = {
      success: true,
      data: {
        payments: result.data,
        total: result.total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('결제 내역 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '결제 내역을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * 결제 생성 또는 결제 처리
 *
 * Body (결제 생성):
 * - action: 'create'
 * - academyId: 학원 ID
 * - planType: 플랜 타입 (free, basic, pro, enterprise)
 * - billingPeriod: 결제 주기 (monthly, yearly)
 *
 * Body (결제 처리):
 * - action: 'process'
 * - paymentId: 결제 ID
 * - method: 결제 방법 (card, bank_transfer, kakao_pay, naver_pay, toss)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      // 결제 생성
      const { academyId, planType, billingPeriod = 'monthly' } = body;

      // 필수 필드 검증
      if (!academyId || !planType) {
        return NextResponse.json(
          { success: false, error: '학원 ID와 플랜 타입은 필수입니다.' },
          { status: 400 }
        );
      }

      // 플랜 유효성 검증
      const plan = getPlan(planType as PlanType);
      if (!plan) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 플랜입니다.' },
          { status: 400 }
        );
      }

      // 결제 금액 계산
      const amount = billingPeriod === 'yearly' && plan.yearlyPrice
        ? plan.yearlyPrice
        : plan.price;

      // 무료 플랜인 경우 결제 생성 없이 바로 활성화
      if (planType === 'free') {
        const result = await createPayment(academyId, planType, 0, billingPeriod);
        if (result.success && result.payment) {
          // 무료 플랜은 즉시 완료 처리
          const processResult = await processPayment(result.payment.id, 'card');
          return NextResponse.json({
            success: true,
            data: {
              payment: processResult.payment,
              message: '무료 플랜이 활성화되었습니다.',
            },
          }, { status: 201 });
        }
        return NextResponse.json(result, { status: result.success ? 201 : 500 });
      }

      // 결제 생성
      const result = await createPayment(academyId, planType, amount, billingPeriod);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      const response: PaymentApiResponse<{ payment: Payment; plan: typeof plan }> = {
        success: true,
        data: {
          payment: result.payment!,
          plan,
        },
        message: '결제가 생성되었습니다. 결제를 진행해주세요.',
      };

      return NextResponse.json(response, { status: 201 });

    } else if (action === 'process') {
      // 결제 처리
      const { paymentId, method } = body;

      // 필수 필드 검증
      if (!paymentId || !method) {
        return NextResponse.json(
          { success: false, error: '결제 ID와 결제 방법은 필수입니다.' },
          { status: 400 }
        );
      }

      // 결제 방법 유효성 검증
      const validMethods: PaymentMethod[] = ['card', 'bank_transfer', 'kakao_pay', 'naver_pay', 'toss'];
      if (!validMethods.includes(method)) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 결제 방법입니다.' },
          { status: 400 }
        );
      }

      // 결제 처리
      const result = await processPayment(paymentId, method);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      const response: PaymentApiResponse<{
        payment: Payment;
        transactionId: string;
        receiptUrl: string;
      }> = {
        success: true,
        data: {
          payment: result.payment!,
          transactionId: result.transactionId!,
          receiptUrl: result.receiptUrl!,
        },
        message: '결제가 완료되었습니다.',
      };

      return NextResponse.json(response);

    } else {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 action입니다. (create 또는 process)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('결제 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '결제 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
