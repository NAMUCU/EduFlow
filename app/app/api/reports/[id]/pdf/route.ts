/**
 * 리포트 PDF 생성 API
 *
 * POST /api/reports/[id]/pdf - 리포트를 PDF로 생성하고 다운로드 URL 반환
 *
 * 실제 환경에서는 PDF.co API 또는 puppeteer를 사용하여 PDF를 생성합니다.
 * 현재는 Mock 구현으로 시뮬레이션합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Report, ReportPDFResponse } from '@/types/report';
import reportsData from '@/data/reports.json';

// Mock 데이터 저장소
const reports: Report[] = [...reportsData.reports] as Report[];

/**
 * POST /api/reports/[id]/pdf
 * PDF 생성 및 다운로드 URL 반환
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 리포트 조회
    const report = reports.find((r) => r.id === id);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 리포트를 찾을 수 없습니다.',
        } as ReportPDFResponse,
        { status: 404 }
      );
    }

    // 요청 바디 파싱 (옵션)
    let options = {
      includeAIAnalysis: true,
      includeTeacherComment: true,
    };

    try {
      const body = await request.json();
      options = { ...options, ...body };
    } catch {
      // 바디가 없어도 OK
    }

    // Mock: PDF 생성 시뮬레이션
    // 실제로는 여기서 PDF.co API 또는 puppeteer를 사용
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // PDF 콘텐츠 생성 (Mock - 텍스트 기반)
    const pdfContent = generatePdfContent(report, options);

    // Base64 인코딩 (실제로는 PDF 바이너리)
    const base64Content = Buffer.from(pdfContent, 'utf-8').toString('base64');

    // Data URL 생성 (실제로는 스토리지 URL)
    const pdfUrl = `data:application/pdf;base64,${base64Content}`;

    // 리포트에 PDF URL 저장
    const reportIndex = reports.findIndex((r) => r.id === id);
    if (reportIndex !== -1) {
      reports[reportIndex] = {
        ...reports[reportIndex],
        pdfUrl,
        pdfGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const response: ReportPDFResponse = {
      success: true,
      data: {
        pdfUrl,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF 생성에 실패했습니다.',
      } as ReportPDFResponse,
      { status: 500 }
    );
  }
}

/**
 * PDF 콘텐츠 생성 (Mock 구현)
 *
 * 실제로는 HTML 템플릿을 렌더링하여 PDF로 변환합니다.
 */
function generatePdfContent(
  report: Report,
  options: { includeAIAnalysis: boolean; includeTeacherComment: boolean }
): string {
  const lines: string[] = [];

  // 헤더
  lines.push('='.repeat(60));
  lines.push('                    학습 보고서');
  lines.push('='.repeat(60));
  lines.push('');

  // 학생 정보
  lines.push('[ 학생 정보 ]');
  lines.push(`  이름: ${report.student.name}`);
  lines.push(`  학년: ${report.student.grade}`);
  lines.push(`  학교: ${report.student.school}`);
  lines.push(`  과목: ${report.student.subjects.join(', ')}`);
  lines.push('');

  // 리포트 기간
  lines.push('[ 리포트 기간 ]');
  lines.push(`  ${report.period.label}`);
  lines.push(`  (${report.period.startDate} ~ ${report.period.endDate})`);
  lines.push('');

  // 성적 요약
  lines.push('-'.repeat(60));
  lines.push('[ 성적 요약 ]');
  lines.push(`  종합 점수: ${report.gradeAnalysis.overallScore}점`);
  lines.push(`  이전 점수: ${report.gradeAnalysis.previousOverallScore}점`);
  lines.push(`  변화: ${report.gradeAnalysis.overallChangeAmount >= 0 ? '+' : ''}${report.gradeAnalysis.overallChangeAmount}점`);
  lines.push('');

  // 과목별 성적
  lines.push('[ 과목별 성적 ]');
  for (const subject of report.gradeAnalysis.subjectGrades) {
    lines.push(`  ${subject.subject}: ${subject.currentScore}점 (${subject.changeAmount >= 0 ? '+' : ''}${subject.changeAmount}점)`);
  }
  lines.push('');

  // 취약 단원
  if (report.gradeAnalysis.weakUnits.length > 0) {
    lines.push('[ 보완이 필요한 단원 ]');
    for (const unit of report.gradeAnalysis.weakUnits) {
      lines.push(`  - ${unit.subject} > ${unit.unitName} (정답률 ${unit.correctRate}%)`);
    }
    lines.push('');
  }

  // 강점 단원
  if (report.gradeAnalysis.strongUnits.length > 0) {
    lines.push('[ 잘하는 단원 ]');
    for (const unit of report.gradeAnalysis.strongUnits) {
      lines.push(`  - ${unit.subject} > ${unit.unitName} (정답률 ${unit.correctRate}%)`);
    }
    lines.push('');
  }

  // 출결 현황
  lines.push('-'.repeat(60));
  lines.push('[ 출결 현황 ]');
  lines.push(`  총 수업일: ${report.attendanceAnalysis.totalClassDays}일`);
  lines.push(`  출석: ${report.attendanceAnalysis.presentDays}일`);
  lines.push(`  결석: ${report.attendanceAnalysis.absentDays}일`);
  lines.push(`  지각: ${report.attendanceAnalysis.lateDays}일`);
  lines.push(`  출석률: ${report.attendanceAnalysis.attendanceRate}%`);
  lines.push('');

  // AI 분석
  if (options.includeAIAnalysis) {
    lines.push('-'.repeat(60));
    lines.push('[ AI 학습 분석 ]');
    lines.push('');
    lines.push('* 성적 추이 분석:');
    lines.push(`  ${report.aiAnalysis.scoreTrendAnalysis.summary}`);
    lines.push('');

    lines.push('* 단기 학습 목표:');
    for (const goal of report.aiAnalysis.studyRecommendation.shortTermGoals) {
      lines.push(`  - ${goal.goal}`);
      lines.push(`    (${goal.reason})`);
    }
    lines.push('');

    lines.push('* 학습 전략:');
    for (const strategy of report.aiAnalysis.studyRecommendation.studyStrategies) {
      lines.push(`  - ${strategy}`);
    }
    lines.push('');

    lines.push('* 학부모님께 드리는 말씀:');
    lines.push(`  ${report.aiAnalysis.parentMessage}`);
    lines.push('');
  }

  // 선생님 코멘트
  if (options.includeTeacherComment) {
    lines.push('-'.repeat(60));
    lines.push('[ 선생님 코멘트 ]');
    lines.push('');
    lines.push(report.teacherComment || report.aiAnalysis.teacherCommentDraft);
    lines.push('');
    lines.push(`- ${report.academy.teacherName} 선생님`);
    lines.push('');
  }

  // 푸터
  lines.push('='.repeat(60));
  lines.push(`생성일시: ${new Date().toLocaleDateString('ko-KR')}`);
  lines.push(`학원: ${report.academy.name}`);
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * GET /api/reports/[id]/pdf
 * 이미 생성된 PDF URL 조회
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
        } as ReportPDFResponse,
        { status: 404 }
      );
    }

    if (!report.pdfUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDF가 아직 생성되지 않았습니다.',
        } as ReportPDFResponse,
        { status: 404 }
      );
    }

    const response: ReportPDFResponse = {
      success: true,
      data: {
        pdfUrl: report.pdfUrl,
        generatedAt: report.pdfGeneratedAt || new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('PDF 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF를 조회하는데 실패했습니다.',
      } as ReportPDFResponse,
      { status: 500 }
    );
  }
}
