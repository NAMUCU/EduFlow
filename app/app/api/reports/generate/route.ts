/**
 * 리포트 생성 API
 *
 * POST /api/reports/generate - 학생별 학습 리포트 자동 생성
 *
 * 이 API는 학생의 성적, 출결 데이터를 분석하고
 * AI를 활용하여 맞춤형 학습 리포트를 생성합니다.
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
  UnitGradeInfo,
  SubjectGradeInfo,
  generatePeriodLabel,
  calculateScoreTrend,
  isWeakUnit,
} from '@/types/report';
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
 * Mock 성적 분석 데이터 생성
 */
function generateGradeAnalysis(
  studentId: string,
  subjects: string[]
): GradeAnalysisSection {
  // 실제로는 DB에서 성적 데이터를 조회하여 분석
  // 여기서는 Mock 데이터 생성

  const baseScore = 70 + Math.floor(Math.random() * 25);
  const previousScore = baseScore - 5 + Math.floor(Math.random() * 10);

  const subjectGrades: SubjectGradeInfo[] = subjects.map((subject) => {
    const currentScore = baseScore + Math.floor(Math.random() * 10);
    const prevScore = previousScore + Math.floor(Math.random() * 10);
    return {
      subject,
      currentScore,
      previousScore: prevScore,
      averageScore: Math.round((currentScore + prevScore) / 2),
      highestScore: currentScore + 5,
      lowestScore: currentScore - 15,
      testCount: 3 + Math.floor(Math.random() * 4),
      trend: calculateScoreTrend(currentScore, prevScore),
      changeAmount: currentScore - prevScore,
    };
  });

  // 단원별 분석 (Mock)
  const unitNames: Record<string, string[]> = {
    수학: ['인수분해', '이차방정식', '판별식', '근과 계수의 관계', '일차함수'],
    영어: ['문법', '독해', '어휘', '듣기', '작문'],
    과학: ['물리', '화학', '생물', '지구과학'],
  };

  const unitAnalysis: UnitGradeInfo[] = [];
  subjects.forEach((subject) => {
    const units = unitNames[subject] || ['단원1', '단원2', '단원3'];
    units.forEach((unitName) => {
      const correctRate = 40 + Math.floor(Math.random() * 55);
      const totalCount = 20;
      const correctCount = Math.round((correctRate / 100) * totalCount);
      unitAnalysis.push({
        subject,
        unitName,
        correctCount,
        totalCount,
        correctRate,
        isWeak: isWeakUnit(correctRate),
      });
    });
  });

  const weakUnits = unitAnalysis.filter((u) => u.isWeak);
  const strongUnits = unitAnalysis
    .filter((u) => u.correctRate >= 80)
    .slice(0, 3);

  return {
    overallScore: baseScore,
    previousOverallScore: previousScore,
    overallTrend: calculateScoreTrend(baseScore, previousScore),
    overallChangeAmount: baseScore - previousScore,
    subjectGrades,
    unitAnalysis,
    weakUnits,
    strongUnits,
    gradeDistribution: [
      { range: '90-100', count: Math.floor(Math.random() * 3), percentage: 10 + Math.floor(Math.random() * 20) },
      { range: '80-89', count: 2 + Math.floor(Math.random() * 3), percentage: 20 + Math.floor(Math.random() * 20) },
      { range: '70-79', count: 2 + Math.floor(Math.random() * 2), percentage: 20 + Math.floor(Math.random() * 15) },
      { range: '60-69', count: Math.floor(Math.random() * 2), percentage: 5 + Math.floor(Math.random() * 15) },
      { range: '0-59', count: 0, percentage: 0 },
    ],
    dailyScoreTrend: [
      { date: '2025-01-13', score: previousScore, subject: subjects[0] },
      { date: '2025-01-15', score: Math.round((previousScore + baseScore) / 2), subject: subjects[0] },
      { date: '2025-01-17', score: baseScore, subject: subjects[0] },
    ],
  };
}

/**
 * Mock 출결 분석 데이터 생성
 */
function generateAttendanceAnalysis(): AttendanceAnalysisSection {
  const totalDays = 5;
  const absentDays = Math.random() > 0.8 ? 1 : 0;
  const lateDays = Math.random() > 0.7 ? 1 : 0;
  const presentDays = totalDays - absentDays - lateDays;

  const attendanceRate = Math.round((presentDays / totalDays) * 100);
  const previousRate = Math.random() > 0.5 ? 100 : 80;

  return {
    totalClassDays: totalDays,
    presentDays,
    absentDays,
    lateDays,
    earlyLeaveDays: 0,
    sickLeaveDays: 0,
    attendanceRate,
    previousAttendanceRate: previousRate,
    attendanceRateTrend: calculateScoreTrend(attendanceRate, previousRate),
    dailyAttendance: [
      { date: '2025-01-13', status: 'present', checkInTime: '16:30', checkOutTime: '19:00' },
      { date: '2025-01-14', status: absentDays > 0 ? 'absent' : 'present', checkInTime: absentDays > 0 ? undefined : '16:30', checkOutTime: absentDays > 0 ? undefined : '19:00' },
      { date: '2025-01-15', status: lateDays > 0 ? 'late' : 'present', checkInTime: lateDays > 0 ? '17:00' : '16:30', checkOutTime: '19:00' },
      { date: '2025-01-17', status: 'present', checkInTime: '16:30', checkOutTime: '19:00' },
      { date: '2025-01-18', status: 'present', checkInTime: '16:30', checkOutTime: '19:00' },
    ],
  };
}

/**
 * AI 분석 생성 (Mock - 실제로는 Gemini API 호출)
 */
function generateAIAnalysis(
  studentName: string,
  gradeAnalysis: GradeAnalysisSection
): AIAnalysisSection {
  const { overallScore, previousOverallScore, weakUnits, strongUnits } = gradeAnalysis;
  const scoreDiff = overallScore - previousOverallScore;
  const trendText = scoreDiff > 0 ? `${scoreDiff}점 상승` : scoreDiff < 0 ? `${Math.abs(scoreDiff)}점 하락` : '변동 없음';

  const weakUnitNames = weakUnits.map((u) => u.unitName).join(', ') || '없음';
  const strongUnitNames = strongUnits.map((u) => u.unitName).join(', ') || '없음';

  return {
    scoreTrendAnalysis: {
      summary: `${studentName} 학생의 이번 주 성적은 지난 주 대비 ${trendText}하여 ${scoreDiff >= 0 ? '긍정적인' : '주의가 필요한'} 추세를 보이고 있습니다.`,
      trendDescription: scoreDiff >= 0
        ? `최근 꾸준한 학습으로 성적 향상이 이루어지고 있습니다. 특히 ${strongUnitNames} 단원에서 우수한 성과를 보이고 있습니다.`
        : `최근 어려운 단원을 학습하면서 성적에 다소 영향이 있었습니다. ${weakUnitNames} 단원에 대한 추가 학습이 필요합니다.`,
      keyInsights: [
        strongUnits.length > 0 ? `${strongUnits[0]?.unitName || '기본'} 단원에서 뛰어난 이해력을 보입니다` : '기초 개념 정립이 진행 중입니다',
        weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '심화'} 단원에서 추가 학습이 필요합니다` : '전반적으로 안정적인 학습을 하고 있습니다',
        '꾸준한 출석과 학습 태도가 좋습니다',
      ],
    },
    weakUnitAnalysis: {
      units: weakUnits.slice(0, 3).map((unit, index) => ({
        subject: unit.subject,
        unitName: unit.unitName,
        description: `정답률 ${unit.correctRate}%로, 해당 단원의 핵심 개념 이해가 필요합니다.`,
        suggestedPriority: index + 1,
      })),
      overallDescription: weakUnits.length > 0
        ? `${weakUnitNames} 단원에 대한 집중적인 복습이 필요합니다. 기초 개념부터 차근차근 정리해나가면 충분히 개선될 수 있습니다.`
        : '현재 특별히 취약한 단원이 없습니다. 현재 학습 방향을 유지하세요.',
    },
    studyRecommendation: {
      shortTermGoals: [
        {
          goal: weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '취약 단원'} 개념 복습 및 연습문제 풀이` : '현재 단원 심화 문제 도전',
          reason: weakUnits.length > 0 ? '취약 단원 보완을 위해 우선적으로 학습이 필요합니다' : '현재 수준에서 한 단계 성장하기 위해',
          difficulty: weakUnits.length > 0 ? 'medium' : 'hard',
        },
        {
          goal: '매일 30분 오답 노트 정리',
          reason: '틀린 문제를 반복하지 않기 위한 필수 과정입니다',
          difficulty: 'easy',
        },
      ],
      midTermGoals: [
        {
          goal: '전체 단원 종합 문제 완벽 정복',
          reason: '중간/기말고사 대비를 위해 필수입니다',
        },
        {
          goal: '다음 단원 예습 시작',
          reason: '선행 학습으로 수업 이해도를 높일 수 있습니다',
        },
      ],
      recommendedMaterials: [
        {
          type: 'problem' as const,
          title: weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '기본'} 연습 문제집` : '심화 문제집',
          description: weakUnits.length > 0 ? '기초부터 응용까지 단계별 문제' : '고난도 응용 문제',
          subject: '수학',
          unit: weakUnits[0]?.unitName || strongUnits[0]?.unitName,
        },
        {
          type: 'concept' as const,
          title: '개념 정리 노트',
          description: '핵심 공식 및 개념 요약',
          subject: '수학',
        },
      ],
      studyStrategies: [
        '매일 일정한 시간에 학습하기',
        '오답 노트를 꼼꼼히 작성하기',
        '모르는 부분은 바로 질문하기',
        '복습 후 유사 문제로 확인하기',
      ],
      motivationMessage: scoreDiff >= 0
        ? `${studentName} 학생이 열심히 노력한 결과가 점수로 나타나고 있어요! 이대로 꾸준히 하면 더 좋은 결과를 얻을 수 있을 거예요. 화이팅!`
        : `${studentName} 학생, 이번 주는 조금 어려웠지만 괜찮아요! 어려운 단원을 만났을 뿐이니 같이 차근차근 해결해 나가요. 포기하지 말고 화이팅!`,
    },
    parentMessage: scoreDiff >= 0
      ? `${studentName} 학생이 이번 주에 ${trendText}했습니다! ${strongUnitNames} 단원을 잘 이해하고 있으며, 전반적으로 긍정적인 학습 태도를 보이고 있습니다. ${weakUnits.length > 0 ? `다만 ${weakUnitNames} 부분은 추가 학습이 필요하니 가정에서도 관심 부탁드립니다.` : ''} 앞으로도 좋은 결과가 기대됩니다.`
      : `${studentName} 학생이 이번 주에 다소 어려움을 겪었습니다. ${weakUnitNames} 단원이 어렵게 느껴지는 것 같습니다. 하지만 기초는 갖춰져 있으니 걱정 마세요. 집중적인 복습을 통해 충분히 따라올 수 있습니다. 가정에서의 격려 부탁드립니다.`,
    studentMessage: scoreDiff >= 0
      ? `${studentName}아, 이번 주 정말 열심히 했어! ${strongUnits[0]?.unitName || '학습'} 실력이 많이 늘었어. ${weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '어려운 부분'}만 조금 더 연습하면` : '이대로 꾸준히 하면'} 더 좋은 점수 받을 수 있어. 화이팅!`
      : `${studentName}아, 이번 주는 조금 힘들었지만 괜찮아! ${strongUnits.length > 0 ? `${strongUnits[0]?.unitName || '잘하는 부분'}은 잘하고 있으니` : '기초는 잘 잡혀 있으니'} 어려운 부분도 분명 할 수 있어. 같이 천천히 해보자!`,
    teacherCommentDraft: scoreDiff >= 0
      ? `${studentName} 학생의 이번 주 학습 태도와 성과가 만족스럽습니다. ${strongUnits.length > 0 ? `특히 ${strongUnits[0]?.unitName || '주요 단원'}에서 우수한 성적을 보이고 있습니다.` : ''} ${weakUnits.length > 0 ? `${weakUnits[0]?.unitName || '일부 단원'} 보완에 조금 더 집중하면 더욱 좋겠습니다.` : '현재 학습 방향을 유지하면 좋겠습니다.'}`
      : `${studentName} 학생의 기초 실력은 갖춰져 있으니 조금 더 시간을 들여 개념을 정리하면 충분히 따라올 수 있습니다. ${weakUnitNames} 단원에 대한 집중 복습을 진행할 예정입니다.`,
    generatedAt: new Date().toISOString(),
    modelInfo: {
      model: 'gemini-3.0-pro',
      confidence: 0.85 + Math.random() * 0.1,
    },
  };
}

/**
 * POST /api/reports/generate
 * 학생별 학습 리포트 생성
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

    // 성적 분석 생성
    const gradeAnalysis = generateGradeAnalysis(studentId, student.subjects);

    // 출결 분석 생성
    const attendanceAnalysis = generateAttendanceAnalysis();

    // AI 분석 생성 (옵션)
    const aiAnalysis = includeAIAnalysis
      ? generateAIAnalysis(student.name, gradeAnalysis)
      : ({
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
        } as AIAnalysisSection);

    // 새 리포트 ID 생성
    const maxId = reports.reduce((max, r) => {
      const num = parseInt(r.id.replace('RPT', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `RPT${String(maxId + 1).padStart(3, '0')}`;

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
      message: `${student.name} 학생의 ${period.label} 리포트가 생성되었습니다.`,
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
