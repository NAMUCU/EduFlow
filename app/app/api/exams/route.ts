import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  ExamListItem,
  ExamListResponse,
  ExamFilterOptions,
  ExamCreateInput,
  ExamTab,
  ExamStatus,
  getExamStatus,
  getExamTabStatus,
} from '@/types/exam';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'exams.json');

/**
 * 시험 데이터 파일 읽기
 */
async function readExamsData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('데이터 파일 읽기 오류:', error);
    return { exams: [], student_exams: [], students: [], classes: [] };
  }
}

/**
 * 시험 데이터 파일 쓰기
 */
async function writeExamsData(data: unknown) {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * GET /api/exams
 * 시험 목록을 조회합니다.
 *
 * Query Parameters:
 * - status: 시험 상태 필터 (scheduled, in_progress, completed)
 * - exam_type: 시험 유형 필터 (regular, mock, placement, practice)
 * - subject: 과목 필터
 * - grade: 학년 필터
 * - start_date_from: 시험 시작일 범위 시작 (ISO 8601)
 * - start_date_to: 시험 시작일 범위 끝 (ISO 8601)
 * - student_id: 특정 학생의 시험만 조회
 * - teacher_id: 특정 선생님의 시험만 조회
 * - academy_id: 특정 학원의 시험만 조회
 * - search: 제목/설명 검색
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 옵션 추출
    const filters: ExamFilterOptions = {
      status: (searchParams.get('status') as ExamTab) || undefined,
      exam_type: searchParams.get('exam_type') as ExamCreateInput['exam_type'] || undefined,
      subject: searchParams.get('subject') || undefined,
      grade: searchParams.get('grade') || undefined,
      start_date_from: searchParams.get('start_date_from') || undefined,
      start_date_to: searchParams.get('start_date_to') || undefined,
      student_id: searchParams.get('student_id') || undefined,
      teacher_id: searchParams.get('teacher_id') || undefined,
      academy_id: searchParams.get('academy_id') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);

    // 데이터 로드
    const data = await readExamsData();
    const { exams, student_exams } = data;

    // 시험 목록 아이템으로 변환
    let examList: ExamListItem[] = exams.map((exam: {
      id: string;
      title: string;
      description: string | null;
      exam_type: string;
      subject: string;
      grade: string;
      problems: { problem_id: string; order: number; points: number }[];
      total_points: number;
      start_date: string;
      end_date: string | null;
      time_limit: number | null;
      status: ExamStatus;
      created_at: string;
      teacher_name: string;
    }) => {
      // 해당 시험의 학생별 시험 현황
      const relatedStudentExams = student_exams.filter(
        (se: { exam_id: string }) => se.exam_id === exam.id
      );

      const studentCount = relatedStudentExams.length;
      const completedCount = relatedStudentExams.filter(
        (se: { status: string }) => se.status === 'graded' || se.status === 'submitted'
      ).length;

      // 평균 점수 계산
      const gradedExams = relatedStudentExams.filter(
        (se: { status: string; score: number | null }) => se.status === 'graded' && se.score !== null
      );
      const averageScore = gradedExams.length > 0
        ? Math.round(gradedExams.reduce((sum: number, se: { score: number }) => sum + se.score, 0) / gradedExams.length)
        : null;

      // 상태 업데이트
      const currentStatus = getExamStatus({
        start_date: exam.start_date,
        end_date: exam.end_date,
        status: exam.status,
      });

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        exam_type: exam.exam_type as ExamListItem['exam_type'],
        subject: exam.subject,
        grade: exam.grade,
        total_points: exam.total_points,
        start_date: exam.start_date,
        end_date: exam.end_date,
        time_limit: exam.time_limit,
        status: currentStatus,
        problem_count: exam.problems.length,
        student_count: studentCount,
        completed_count: completedCount,
        average_score: averageScore,
        created_at: exam.created_at,
        teacher_name: exam.teacher_name,
      };
    });

    // 필터 적용
    if (filters.status) {
      examList = examList.filter((e) => getExamTabStatus({
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
      }) === filters.status);
    }

    if (filters.exam_type) {
      examList = examList.filter((e) => e.exam_type === filters.exam_type);
    }

    if (filters.subject) {
      examList = examList.filter((e) => e.subject === filters.subject);
    }

    if (filters.grade) {
      examList = examList.filter((e) => e.grade === filters.grade);
    }

    if (filters.start_date_from) {
      const fromDate = new Date(filters.start_date_from);
      examList = examList.filter((e) => new Date(e.start_date) >= fromDate);
    }

    if (filters.start_date_to) {
      const toDate = new Date(filters.start_date_to);
      examList = examList.filter((e) => new Date(e.start_date) <= toDate);
    }

    if (filters.student_id) {
      const studentExamIds = student_exams
        .filter((se: { student_id: string }) => se.student_id === filters.student_id)
        .map((se: { exam_id: string }) => se.exam_id);
      examList = examList.filter((e) => studentExamIds.includes(e.id));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      examList = examList.filter(
        (e) =>
          e.title.toLowerCase().includes(searchLower) ||
          (e.description && e.description.toLowerCase().includes(searchLower))
      );
    }

    // 정렬: 시험 시작일 기준 오름차순
    examList.sort((a, b) => {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });

    // 페이지네이션
    const total = examList.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = examList.slice(startIndex, endIndex);

    const response: ExamListResponse = {
      success: true,
      data: {
        exams: paginatedList,
        total,
        page,
        page_size: pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('시험 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '시험 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exams
 * 새 시험을 생성합니다.
 *
 * Request Body: ExamCreateInput
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExamCreateInput = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: '시험 제목은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.problems || body.problems.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1개 이상의 문제를 선택해야 합니다.' },
        { status: 400 }
      );
    }

    if (!body.student_ids || body.student_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1명 이상의 응시자를 선택해야 합니다.' },
        { status: 400 }
      );
    }

    if (!body.start_date) {
      return NextResponse.json(
        { success: false, error: '시험 시작 일시는 필수입니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readExamsData();

    // 새 시험 ID 생성
    const newExamId = `exam-${Date.now()}`;
    const now = new Date().toISOString();

    // 총점 계산
    const totalPoints = body.total_points || body.problems.reduce((sum, p) => sum + p.points, 0);

    // 새 시험 객체 생성
    const newExam = {
      id: newExamId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      academy_id: body.academy_id || 'academy-001',
      teacher_id: body.teacher_id || 'teacher-001',
      teacher_name: '박정훈', // TODO: 실제 선생님 이름 조회
      exam_type: body.exam_type || 'regular',
      subject: body.subject || '',
      grade: body.grade || '',
      problems: body.problems.map((p, index) => ({
        problem_id: p.problem_id,
        order: p.order || index + 1,
        points: p.points,
      })),
      total_points: totalPoints,
      passing_score: body.passing_score || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      time_limit: body.time_limit || null,
      status: 'scheduled' as ExamStatus,
      shuffle_problems: body.shuffle_problems ?? false,
      shuffle_options: body.shuffle_options ?? false,
      show_score_immediately: body.show_score_immediately ?? false,
      show_answers_after_exam: body.show_answers_after_exam ?? true,
      created_at: now,
      updated_at: now,
    };

    // 학생별 시험 할당 생성
    const newStudentExams = body.student_ids.map((studentId, index) => {
      // 학생 정보 조회
      const student = data.students.find((s: { id: string }) => s.id === studentId);

      return {
        id: `se-${Date.now()}-${index}`,
        exam_id: newExamId,
        student_id: studentId,
        student_name: student?.name || '알 수 없음',
        student_grade: student?.grade || '',
        status: 'not_started',
        score: null,
        percentage: null,
        rank: null,
        answers: null,
        feedback: null,
        started_at: null,
        submitted_at: null,
        graded_at: null,
        created_at: now,
        updated_at: now,
      };
    });

    // 데이터에 추가
    data.exams.push(newExam);
    data.student_exams.push(...newStudentExams);

    // 파일에 저장
    await writeExamsData(data);

    return NextResponse.json({
      success: true,
      data: newExam,
      message: `시험이 성공적으로 생성되었습니다. ${body.student_ids.length}명의 학생에게 배정되었습니다.`,
    });
  } catch (error) {
    console.error('시험 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '시험을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
