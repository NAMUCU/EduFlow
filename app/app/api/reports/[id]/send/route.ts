/**
 * 리포트 발송 API
 *
 * POST /api/reports/[id]/send - 학부모에게 리포트 발송
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Report,
  ReportSendRequest,
  ReportSendResponse,
} from '@/types/report';
import reportsData from '@/data/reports.json';

// Mock 데이터 저장소
const reports: Report[] = [...reportsData.reports] as Report[];

/**
 * POST /api/reports/[id]/send
 * 학부모에게 리포트 발송
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: ReportSendRequest = await request.json();
    const { sendType, recipient, message } = body;

    // 리포트 조회
    const reportIndex = reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 리포트를 찾을 수 없습니다.',
        } as ReportSendResponse,
        { status: 404 }
      );
    }

    const report = reports[reportIndex];

    // 이미 발송된 리포트인지 확인
    if (report.status === 'sent') {
      return NextResponse.json(
        {
          success: false,
          error: '이미 발송된 리포트입니다.',
        } as ReportSendResponse,
        { status: 400 }
      );
    }

    // 발송 대상 결정
    const sendTo = recipient || report.parent?.phone;

    if (!sendTo) {
      return NextResponse.json(
        {
          success: false,
          error: '발송 대상이 지정되지 않았습니다.',
        } as ReportSendResponse,
        { status: 400 }
      );
    }

    // 실제로는 여기서 SMS/이메일/카카오톡 발송 로직 구현
    // Mock: 발송 성공 처리
    const sentAt = new Date().toISOString();

    // 리포트 상태 업데이트
    const updatedReport: Report = {
      ...report,
      status: 'sent',
      sentAt,
      sentTo: [
        ...(report.sentTo || []),
        { type: sendType, recipient: sendTo },
      ],
      updatedAt: sentAt,
    };

    reports[reportIndex] = updatedReport;

    // 성공 응답
    const response: ReportSendResponse = {
      success: true,
      data: {
        sentAt,
        sentTo: sendTo,
        messageId: `MSG_${Date.now()}`, // Mock 메시지 ID
      },
      message: `리포트가 ${sendType}로 ${sendTo}에게 발송되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('리포트 발송 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '리포트 발송에 실패했습니다.',
      } as ReportSendResponse,
      { status: 500 }
    );
  }
}
