/**
 * 리포트 생성 API
 *
 * POST /api/reports/generate - 학생별 학습 리포트 자동 생성
 *
 * 이 API는 학생의 성적, 출결 데이터를 분석하고
 * Claude AI를 활용하여 맞춤형 학습 리포트를 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Report,
  ReportGenerateRequest,
  ReportGenerateResponse,
  ReportPeriod,
  GradeAnalysisSection,
  AttendanceAnalysisSection,
  AIAnalysisSection,
  generatePeriodLabel,
} from '@/types/report';
import {
  generateReportFromDB,
  generateWeeklyReport,
  generateMonthlyReport,
  isClaudeConfigured,
  WeeklyData,
  MonthlyData,
} from '@/lib/services/report-generator';
import studentsData from '@/data/students.json';
import reportsData from '@/data/reports.json';

// Mock 데이터 저장소
const reports = [...reportsData.reports];

/**
 * 학생 정보 조회
 */
function getStudentById(studentId: string) {
  return studentsData.students.find((s) => s.id === studentId);
}

/**
 * 리포트 기간 생성
 */
function createReportPeriod(
  periodType: 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): ReportPeriod {
  const start = new Date(startDate);
  const year = start.getFullYear();
  const month = start.getMonth() + 1;

  // 주차 계산
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const dayOfMonth = start.getDate();
  const week = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);

  return {
    type: periodType,
    startDate,
    endDate,
    label: generatePeriodLabel(periodType, startDate, endDate),
    year,
    month,
    week: periodType === 'weekly' ? week : undefined,
  };
}

/**
 * POST /api/reports/generate
 * 학생별 학습 리포트 생성
 *
 * Claude API가 설정된 경우 AI 자연어 요약을 생성하고,
 * 미설정 시 Mock 데이터를 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReportGenerateRequest = await request.json();
    const { studentId, periodType, startDate, endDate, includeAIAnalysis = true } = body;

    // 필수 파라미터 검증
    if (!studentId || !periodType || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: '학생 ID, 기간 유형, 시작일, 종료일은 필수 입력 항목입니다.',
        } as ReportGenerateResponse,
        { status: 400 }
      );
    }

    // 기간 유형 검증
    if (periodType !== 'weekly' && periodType !== 'monthly') {
      return NextResponse.json(
        {
          success: false,
          error: '기간 유형은 weekly 또는 monthly만 가능합니다.',
        } as ReportGenerateResponse,
        { status: 400 }
      );
    }

    // 학생 정보 조회
    const student = getStudentById(studentId);
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 학생을 찾을 수 없습니다.',
        } as ReportGenerateResponse,
        { status: 404 }
      );
    }

    // 리포트 기간 생성
    const period = createReportPeriod(periodType, startDate, endDate);

    // report-generator 서비스를 통해 보고서 생성
    // Claude API가 설정되어 있으면 AI 분석 사용, 아니면 Mock 데이터 사용
    const studentInfo = {
      name: student.name,
      grade: student.grade,
      school: student.school,
      subjects: student.subjects,
    };

    let gradeAnalysis: GradeAnalysisSection;
    let attendanceAnalysis: AttendanceAnalysisSection;
    let aiAnalysis: AIAnalysisSection;

    // DB에서 실제 데이터를 조회하여 보고서 생성 시도
    // (Supabase가 설정되지 않은 경우 Mock 데이터 사용)
    const generatedReport = await generateReportFromDB(
      studentId,
      studentInfo,
      periodType,
      startDate,
      endDate
    );

    gradeAnalysis = generatedReport.gradeAnalysis;
    attendanceAnalysis = generatedReport.attendanceAnalysis;
    aiAnalysis = includeAIAnalysis
      ? generatedReport.aiAnalysis
      : {
          scoreTrendAnalysis: { summary: '', trendDescription: '', keyInsights: [] },
          weakUnitAnalysis: { units: [], overallDescription: '' },
          studyRecommendation: {
            shortTermGoals: [],
            midTermGoals: [],
            recommendedMaterials: [],
            studyStrategies: [],
            motivationMessage: '',
          },
          parentMessage: '',
          studentMessage: '',
          teacherCommentDraft: '',
          generatedAt: new Date().toISOString(),
        } as AIAnalysisSection;

    // 새 리포트 ID 생성
    const maxId = reports.reduce((max, r) => {
      const num = parseInt(r.id.replace('RPT', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `RPT${String(maxId + 1).padStart(3, '0')}`;

    // AI 사용 여부 로깅
    const aiUsed = isClaudeConfigured();
    console.log(`리포트 생성: AI 사용=${aiUsed}, 학생=${student.name}, 기간=${period.label}`);

    // 리포트 객체 생성
    const newReport: Report = {
      id: newId,
      academyId: 'ACD001', // 실제로는 인증된 사용자의 학원 ID
      studentId: student.id,
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        school: student.school,
        className: student.className,
        subjects: student.subjects,
      },
      parent: {
        name: student.parent.name,
        phone: student.parent.phone,
        email: student.parent.email,
      },
      academy: {
        id: 'ACD001',
        name: '에듀플로우 학원',
        teacherName: '박선생',
        teacherPhone: '010-1234-0000',
      },
      period,
      status: 'generated',
      gradeAnalysis,
      attendanceAnalysis,
      aiAnalysis,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'TCH001', // 실제로는 인증된 사용자 ID
    };

    // 메모리에 저장
    reports.push(newReport as typeof reports[0]);

    const response: ReportGenerateResponse = {
      success: true,
      data: newReport,
      message: `${student.name} 학생의 ${period.label} 리포트가 생성되었습니다.${aiUsed ? ' (AI 분석 포함)' : ' (Mock 데이터)'}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('리포트 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '리포트 생성에 실패했습니다.',
      } as ReportGenerateResponse,
      { status: 500 }
    );
  }
}
