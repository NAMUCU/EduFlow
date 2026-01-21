/**
 * 결제 웹훅 API - 외부 PG사로부터 결제 완료 알림 수신
 *
 * POST /api/payments/webhook - 결제 완료 웹훅 처리
 *
 * 지원하는 이벤트:
 * - payment.completed: 결제 완료
 * - payment.failed: 결제 실패
 * - payment.cancelled: 결제 취소
 * - payment.refunded: 결제 환불
 * - subscription.renewed: 구독 갱신
 * - subscription.cancelled: 구독 취소
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/services/payments';
import type { WebhookPayload, WebhookEventType, PaymentStatus } from '@/types/payment';

// 웹훅 시크릿 키 (환경변수에서 가져옴)
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'webhook-secret-key';

/**
 * 웹훅 서명 검증
 * 실제 PG사 연동 시 해당 PG사의 서명 검증 로직으로 교체 필요
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature) {
    console.warn('웹훅 서명이 없습니다.');
    return false;
  }

  // Mock 모드에서는 항상 true 반환
  if (process.env.MOCK_PAYMENT === 'true') {
    return true;
  }

  // 실제 구현 시:
  // 1. HMAC-SHA256 등을 사용하여 payload와 secret으로 서명 생성
  // 2. 생성된 서명과 받은 서명 비교
  // const crypto = require('crypto');
  // const expectedSignature = crypto
  //   .createHmac('sha256', WEBHOOK_SECRET)
  //   .update(payload)
  //   .digest('hex');
  // return crypto.timingSafeEqual(
  //   Buffer.from(signature),
  //   Buffer.from(expectedSignature)
  // );

  // Mock: 단순 비교
  return signature === WEBHOOK_SECRET;
}

/**
 * 이벤트 타입 유효성 검증
 */
function isValidEventType(eventType: string): eventType is WebhookEventType {
  const validEvents: WebhookEventType[] = [
    'payment.completed',
    'payment.failed',
    'payment.cancelled',
    'payment.refunded',
    'subscription.renewed',
    'subscription.cancelled',
  ];
  return validEvents.includes(eventType as WebhookEventType);
}

/**
 * POST /api/payments/webhook
 * 결제 완료 웹훅 처리
 */
export async function POST(request: NextRequest) {
  try {
    // Raw body 추출 (서명 검증용)
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');

    // 서명 검증
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('웹훅 서명 검증 실패');
      return NextResponse.json(
        { success: false, error: '유효하지 않은 웹훅 서명입니다.' },
        { status: 401 }
      );
    }

    // JSON 파싱
    let body: WebhookPayload;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('웹훅 페이로드 파싱 실패:', parseError);
      return NextResponse.json(
        { success: false, error: '유효하지 않은 JSON 형식입니다.' },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    const { eventType, paymentId, status, timestamp } = body;

    if (!eventType || !paymentId || !status || !timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다. (eventType, paymentId, status, timestamp)',
        },
        { status: 400 }
      );
    }

    // 이벤트 타입 유효성 검증
    if (!isValidEventType(eventType)) {
      console.warn(`알 수 없는 이벤트 타입: ${eventType}`);
      return NextResponse.json(
        { success: false, error: `알 수 없는 이벤트 타입입니다: ${eventType}` },
        { status: 400 }
      );
    }

    // 타임스탬프 검증 (5분 이내의 요청만 허용)
    const webhookTime = new Date(timestamp).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - webhookTime) > fiveMinutes) {
      console.error('웹훅 타임스탬프 만료');
      return NextResponse.json(
        { success: false, error: '웹훅 타임스탬프가 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 웹훅 처리
    console.log(`웹훅 이벤트 처리: ${eventType} - 결제 ID: ${paymentId}`);
    const result = await handleWebhook(body);

    if (!result.success) {
      console.error(`웹훅 처리 실패: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 이벤트별 추가 처리
    switch (eventType) {
      case 'payment.completed':
        console.log(`결제 완료: ${paymentId}`);
        // 추가 처리: 이메일 발송, 알림 등
        break;

      case 'payment.failed':
        console.log(`결제 실패: ${paymentId}`);
        // 추가 처리: 실패 알림, 재시도 안내 등
        break;

      case 'payment.cancelled':
        console.log(`결제 취소: ${paymentId}`);
        // 추가 처리: 취소 확인 알림 등
        break;

      case 'payment.refunded':
        console.log(`결제 환불: ${paymentId}`);
        // 추가 처리: 환불 완료 알림 등
        break;

      case 'subscription.renewed':
        console.log(`구독 갱신: ${paymentId}`);
        // 추가 처리: 갱신 알림, 영수증 발송 등
        break;

      case 'subscription.cancelled':
        console.log(`구독 취소: ${paymentId}`);
        // 추가 처리: 취소 확인, 서비스 종료 안내 등
        break;
    }

    // 성공 응답 (PG사에서 200 응답을 기대함)
    return NextResponse.json({
      success: true,
      message: `웹훅 이벤트 처리 완료: ${eventType}`,
      data: {
        paymentId,
        eventType,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('웹훅 처리 중 오류 발생:', error);

    // 오류가 발생해도 200을 반환해야 PG사에서 재시도하지 않음
    // 내부적으로는 로그를 남기고 모니터링
    return NextResponse.json(
      {
        success: false,
        error: '웹훅 처리 중 오류가 발생했습니다.',
        retryable: true,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/webhook
 * 웹훅 엔드포인트 상태 확인 (헬스체크용)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    supportedEvents: [
      'payment.completed',
      'payment.failed',
      'payment.cancelled',
      'payment.refunded',
      'subscription.renewed',
      'subscription.cancelled',
    ],
  });
}
