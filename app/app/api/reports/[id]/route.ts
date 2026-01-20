/**
 * 리포트 상세 API
 *
 * GET /api/reports/[id] - 리포트 상세 조회
 * PATCH /api/reports/[id] - 리포트 부분 수정 (선생님 코멘트 등)
 * DELETE /api/reports/[id] - 리포트 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Report,
  ReportDetailResponse,
  ReportSaveResponse,
  ReportSendRequest,
  ReportSendResponse,
} from '@/types/report';
import reportsData from '@/data/reports.json';

// Mock 데이터 저장소
const reports: Report[] = [...reportsData.reports] as Report[];

/**
 * GET /api/reports/[id]
 * 리포트 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = reports.find((r) => r.id === id);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 리포트를 찾을 수 없습니다.',
        } as ReportDetailResponse,
        { status: 404 }
      );
    }

    const response: ReportDetailResponse = {
      success: true,
      data: report,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('리포트 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '리포트를 불러오는데 실패했습니다.',
      } as ReportDetailResponse,
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/[id]
 * 리포트 부분 수정 (선생님 코멘트, 상태 등)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const reportIndex = reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 리포트를 찾을 수 없습니다.',
        } as ReportSaveResponse,
        { status: 404 }
      );
    }

    const existingReport = reports[reportIndex];

    // 허용된 필드만 업데이트
    const allowedFields = ['teacherComment', 'status', 'aiAnalysis'];
    const updates: Partial<Report> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updates as Record<string, unknown>)[field] = body[field];
      }
    }

    // 리포트 업데이트
    const updatedReport: Report = {
      ...existingReport,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    reports[reportIndex] = updatedReport;

    const response: ReportSaveResponse = {
      success: true,
      data: updatedReport,
      message: '리포트가 수정되었습니다.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('리포트 수정 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '리포트 수정에 실패했습니다.',
      } as ReportSaveResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * 리포트 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reportIndex = reports.findIndex((r) => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 리포트를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 리포트 삭제
    reports.splice(reportIndex, 1);

    return NextResponse.json({
      success: true,
      message: '리포트가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('리포트 삭제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '리포트 삭제에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
