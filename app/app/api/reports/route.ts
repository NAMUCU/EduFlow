/**
 * 리포트 API - 목록 조회 및 저장
 *
 * GET /api/reports - 생성된 리포트 목록 조회
 * POST /api/reports - 리포트 저장 (수정)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Report,
  ReportListItem,
  ReportListResponse,
  ReportSaveRequest,
  ReportSaveResponse,
  ReportListFilter,
  ReportStatus,
  ReportPeriodType,
} from '@/types/report';
import reportsData from '@/data/reports.json';
import studentsData from '@/data/students.json';

// Mock 데이터 저장소 (실제로는 DB 사용)
const reports: Report[] = [...reportsData.reports] as Report[];

/**
 * 학생 정보 조회
 */
function getStudentById(studentId: string) {
  return studentsData.students.find((s) => s.id === studentId);
}

/**
 * GET /api/reports
 * 생성된 리포트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const academyId = searchParams.get('academyId') || '';
    const studentId = searchParams.get('studentId') || '';
    const periodType = searchParams.get('periodType') as ReportPeriodType | '';
    const status = searchParams.get('status') as ReportStatus | '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 필터링
    let filteredReports = reports.filter((report) => {
      // 학원 필터
      if (academyId && report.academyId !== academyId) {
        return false;
      }

      // 학생 필터
      if (studentId && report.studentId !== studentId) {
        return false;
      }

      // 기간 유형 필터
      if (periodType && report.period.type !== periodType) {
        return false;
      }

      // 상태 필터
      if (status && report.status !== status) {
        return false;
      }

      // 날짜 범위 필터
      if (startDate && report.period.startDate < startDate) {
        return false;
      }
      if (endDate && report.period.endDate > endDate) {
        return false;
      }

      return true;
    });

    // 최신순 정렬
    filteredReports.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 전체 개수
    const total = filteredReports.length;

    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

    // ReportListItem 형태로 변환
    const reportList: ReportListItem[] = paginatedReports.map((report) => ({
      id: report.id,
      studentId: report.studentId,
      studentName: report.student.name,
      studentGrade: report.student.grade,
      studentSchool: report.student.school,
      period: report.period,
      status: report.status,
      overallScore: report.gradeAnalysis.overallScore,
      previousScore: report.gradeAnalysis.previousOverallScore,
      scoreTrend: report.gradeAnalysis.overallTrend,
      sentAt: report.sentAt,
      createdAt: report.createdAt,
    }));

    const response: ReportListResponse = {
      success: true,
      data: {
        reports: reportList,
        total,
        page,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('리포트 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '리포트 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * 리포트 저장 (신규 생성 또는 수정)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReportSaveRequest = await request.json();
    const { id, studentId, period, gradeAnalysis, attendanceAnalysis, aiAnalysis, teacherComment, status } = body;

    // 필수 필드 검증
    if (!studentId || !period) {
      return NextResponse.json(
        {
          success: false,
          error: '학생 ID와 기간 정보는 필수입니다.',
        } as ReportSaveResponse,
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
        } as ReportSaveResponse,
        { status: 404 }
      );
    }

    // 기존 리포트 수정인 경우
    if (id) {
      const existingIndex = reports.findIndex((r) => r.id === id);
      if (existingIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: '해당 리포트를 찾을 수 없습니다.',
          } as ReportSaveResponse,
          { status: 404 }
        );
      }

      // 리포트 업데이트
      const existingReport = reports[existingIndex];
      const updatedReport: Report = {
        ...existingReport,
        period: period || existingReport.period,
        gradeAnalysis: gradeAnalysis || existingReport.gradeAnalysis,
        attendanceAnalysis: attendanceAnalysis || existingReport.attendanceAnalysis,
        aiAnalysis: aiAnalysis || existingReport.aiAnalysis,
        teacherComment: teacherComment !== undefined ? teacherComment : existingReport.teacherComment,
        status: status || existingReport.status,
        updatedAt: new Date().toISOString(),
      };

      reports[existingIndex] = updatedReport;

      const response: ReportSaveResponse = {
        success: true,
        data: updatedReport,
        message: '리포트가 수정되었습니다.',
      };

      return NextResponse.json(response);
    }

    // 신규 리포트 생성
    const maxId = reports.reduce((max, r) => {
      const num = parseInt(r.id.replace('RPT', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `RPT${String(maxId + 1).padStart(3, '0')}`;

    const newReport: Report = {
      id: newId,
      academyId: 'ACD001',
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
      status: status || 'draft',
      gradeAnalysis: gradeAnalysis || {
        overallScore: 0,
        previousOverallScore: 0,
        overallTrend: 'stable',
        overallChangeAmount: 0,
        subjectGrades: [],
        unitAnalysis: [],
        weakUnits: [],
        strongUnits: [],
        gradeDistribution: [],
        dailyScoreTrend: [],
      },
      attendanceAnalysis: attendanceAnalysis || {
        totalClassDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        earlyLeaveDays: 0,
        sickLeaveDays: 0,
        attendanceRate: 0,
        previousAttendanceRate: 0,
        attendanceRateTrend: 'stable',
        dailyAttendance: [],
      },
      aiAnalysis: aiAnalysis || {
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
      },
      teacherComment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'TCH001',
    };

    reports.push(newReport);

    const response: ReportSaveResponse = {
      success: true,
      data: newReport,
      message: '리포트가 저장되었습니다.',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('리포트 저장 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '리포트 저장에 실패했습니다.',
      } as ReportSaveResponse,
      { status: 500 }
    );
  }
}
