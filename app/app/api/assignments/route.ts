import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  AssignmentListItem,
  AssignmentListResponse,
  AssignmentFilterOptions,
  AssignmentCreateInput,
  AssignmentTab,
  getAssignmentTabStatus,
} from '@/types/assignment';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'assignments.json');

/**
 * 과제 데이터 파일 읽기
 */
async function readAssignmentsData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('데이터 파일 읽기 오류:', error);
    return { assignments: [], student_assignments: [], students: [], classes: [] };
  }
}

/**
 * 과제 데이터 파일 쓰기
 */
async function writeAssignmentsData(data: unknown) {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * GET /api/assignments
 * 과제 목록을 조회합니다.
 *
 * Query Parameters:
 * - status: 과제 상태 필터 (in_progress, scheduled, completed)
 * - due_date_from: 마감일 시작 범위 (ISO 8601)
 * - due_date_to: 마감일 끝 범위 (ISO 8601)
 * - student_id: 특정 학생의 과제만 조회
 * - teacher_id: 특정 선생님의 과제만 조회
 * - academy_id: 특정 학원의 과제만 조회
 * - search: 제목/설명 검색
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 옵션 추출
    const filters: AssignmentFilterOptions = {
      status: (searchParams.get('status') as AssignmentTab) || undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      student_id: searchParams.get('student_id') || undefined,
      teacher_id: searchParams.get('teacher_id') || undefined,
      academy_id: searchParams.get('academy_id') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);

    // 데이터 로드
    const data = await readAssignmentsData();
    const { assignments, student_assignments } = data;

    // 과제 목록 아이템으로 변환
    let assignmentList: AssignmentListItem[] = assignments.map((assignment: {
      id: string;
      title: string;
      description: string | null;
      due_date: string | null;
      is_active: boolean;
      problems: string[];
      created_at: string;
      teacher_name: string;
    }) => {
      // 해당 과제의 학생별 과제 현황
      const relatedStudentAssignments = student_assignments.filter(
        (sa: { assignment_id: string }) => sa.assignment_id === assignment.id
      );

      const studentCount = relatedStudentAssignments.length;
      const completedCount = relatedStudentAssignments.filter(
        (sa: { status: string }) => sa.status === 'graded' || sa.status === 'submitted'
      ).length;

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        is_active: assignment.is_active,
        problem_count: assignment.problems.length,
        student_count: studentCount,
        completed_count: completedCount,
        created_at: assignment.created_at,
        teacher_name: assignment.teacher_name,
        status: getAssignmentTabStatus({
          due_date: assignment.due_date,
          is_active: assignment.is_active,
        }),
      };
    });

    // 필터 적용
    if (filters.status) {
      assignmentList = assignmentList.filter((a) => a.status === filters.status);
    }

    if (filters.due_date_from) {
      const fromDate = new Date(filters.due_date_from);
      assignmentList = assignmentList.filter((a) => {
        if (!a.due_date) return false;
        return new Date(a.due_date) >= fromDate;
      });
    }

    if (filters.due_date_to) {
      const toDate = new Date(filters.due_date_to);
      assignmentList = assignmentList.filter((a) => {
        if (!a.due_date) return false;
        return new Date(a.due_date) <= toDate;
      });
    }

    if (filters.student_id) {
      const studentAssignmentIds = student_assignments
        .filter((sa: { student_id: string }) => sa.student_id === filters.student_id)
        .map((sa: { assignment_id: string }) => sa.assignment_id);
      assignmentList = assignmentList.filter((a) => studentAssignmentIds.includes(a.id));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      assignmentList = assignmentList.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          (a.description && a.description.toLowerCase().includes(searchLower))
      );
    }

    // 정렬: 마감일 기준 오름차순 (마감일 없는 것은 뒤로)
    assignmentList.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    // 페이지네이션
    const total = assignmentList.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = assignmentList.slice(startIndex, endIndex);

    const response: AssignmentListResponse = {
      success: true,
      data: {
        assignments: paginatedList,
        total,
        page,
        page_size: pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('과제 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assignments
 * 새 과제를 생성합니다.
 *
 * Request Body: AssignmentCreateInput
 */
export async function POST(request: NextRequest) {
  try {
    const body: AssignmentCreateInput = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: '과제 제목은 필수입니다.' },
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
        { success: false, error: '최소 1명 이상의 학생을 선택해야 합니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readAssignmentsData();

    // 새 과제 ID 생성
    const newAssignmentId = `assign-${Date.now()}`;
    const now = new Date().toISOString();

    // 새 과제 객체 생성
    const newAssignment = {
      id: newAssignmentId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      academy_id: body.academy_id || 'academy-001', // 기본값
      teacher_id: body.teacher_id || 'teacher-001', // 기본값
      teacher_name: '박정훈', // TODO: 실제 선생님 이름 조회
      problems: body.problems,
      due_date: body.due_date || null,
      time_limit: body.time_limit || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    // 학생별 과제 할당 생성
    const newStudentAssignments = body.student_ids.map((studentId, index) => {
      // 학생 정보 조회
      const student = data.students.find((s: { id: string }) => s.id === studentId);

      return {
        id: `sa-${Date.now()}-${index}`,
        assignment_id: newAssignmentId,
        student_id: studentId,
        student_name: student?.name || '알 수 없음',
        student_grade: student?.grade || '',
        status: 'not_started',
        score: null,
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
    data.assignments.push(newAssignment);
    data.student_assignments.push(...newStudentAssignments);

    // 파일에 저장
    await writeAssignmentsData(data);

    return NextResponse.json({
      success: true,
      data: newAssignment,
      message: `과제가 성공적으로 생성되었습니다. ${body.student_ids.length}명의 학생에게 배정되었습니다.`,
    });
  } catch (error) {
    console.error('과제 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
