import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  AssignmentDetailResponse,
  AssignmentUpdateInput,
  AssignmentStatistics,
} from '@/types/assignment';
import { AssignmentStatus } from '@/types/database';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'assignments.json');
const PROBLEMS_FILE_PATH = path.join(process.cwd(), 'data', 'example-problems.json');

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
 * 문제 데이터 파일 읽기
 */
async function readProblemsData() {
  try {
    const data = await fs.readFile(PROBLEMS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('문제 데이터 파일 읽기 오류:', error);
    return {};
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
 * 문제 데이터에서 특정 문제 ID로 문제 찾기
 */
function findProblemById(problemsData: Record<string, Record<string, Record<string, Array<{
  id: string;
  question: string;
  answer: string;
  solution: string;
  difficulty: string;
  type: string;
}>>>>, problemId: string) {
  // 모든 과목, 학년, 단원을 순회하며 문제 찾기
  for (const subject of Object.values(problemsData)) {
    for (const grade of Object.values(subject)) {
      for (const unit of Object.values(grade)) {
        const problem = unit.find((p: { id: string }) => p.id === problemId);
        if (problem) return problem;
      }
    }
  }
  return null;
}

/**
 * 과제 통계 계산
 */
function calculateStatistics(studentAssignments: Array<{
  status: AssignmentStatus;
  score: number | null;
}>): AssignmentStatistics {
  const totalStudents = studentAssignments.length;

  const statusCounts = studentAssignments.reduce(
    (acc, sa) => {
      acc[sa.status] = (acc[sa.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const gradedAssignments = studentAssignments.filter(
    (sa) => sa.status === 'graded' && sa.score !== null
  );

  const scores = gradedAssignments.map((sa) => sa.score as number);

  return {
    total_students: totalStudents,
    not_started_count: statusCounts['not_started'] || 0,
    in_progress_count: statusCounts['in_progress'] || 0,
    submitted_count: statusCounts['submitted'] || 0,
    graded_count: statusCounts['graded'] || 0,
    average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    highest_score: scores.length > 0 ? Math.max(...scores) : null,
    lowest_score: scores.length > 0 ? Math.min(...scores) : null,
    completion_rate: totalStudents > 0
      ? Math.round(((statusCounts['submitted'] || 0) + (statusCounts['graded'] || 0)) / totalStudents * 100)
      : 0,
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assignments/[id]
 * 과제 상세 정보를 조회합니다.
 *
 * Response:
 * - 성공: { success: true, data: AssignmentDetail }
 * - 실패: { success: false, error: string }
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 데이터 로드
    const [assignmentsData, problemsData] = await Promise.all([
      readAssignmentsData(),
      readProblemsData(),
    ]);

    // 과제 찾기
    const assignment = assignmentsData.assignments.find(
      (a: { id: string }) => a.id === id
    );

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: '과제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 문제 상세 정보 로드
    const problemsDetail = assignment.problems.map((problemId: string, index: number) => {
      const problem = findProblemById(problemsData, problemId);
      return {
        id: problemId,
        order: index + 1,
        points: 100 / assignment.problems.length, // 균등 배점
        question: problem?.question || '문제를 찾을 수 없습니다.',
        answer: problem?.answer || '',
        solution: problem?.solution || '',
        difficulty: problem?.difficulty || 'medium',
        type: problem?.type || 'short_answer',
        options: null,
        subject: '',
        grade: '',
        unit: '',
        image_url: null,
        tags: null,
        academy_id: null,
        created_by: null,
        is_public: true,
        ai_generated: false,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
      };
    });

    // 학생별 과제 현황 로드
    const studentAssignments = assignmentsData.student_assignments
      .filter((sa: { assignment_id: string }) => sa.assignment_id === id)
      .map((sa: {
        id: string;
        student_id: string;
        student_name: string;
        student_grade: string;
        status: AssignmentStatus;
        score: number | null;
        answers: Array<{ problem_id: string; answer: string; is_correct: boolean | null; score?: number }> | null;
        feedback: string | null;
        started_at: string | null;
        submitted_at: string | null;
        graded_at: string | null;
        created_at: string;
        updated_at: string;
      }) => {
        const student = assignmentsData.students.find(
          (s: { id: string }) => s.id === sa.student_id
        );

        // 진행률 계산
        const answeredCount = sa.answers?.length || 0;
        const totalCount = assignment.problems.length;
        const progressPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

        // 정답 수 계산
        const correctCount = sa.answers?.filter((a: { is_correct: boolean | null }) => a.is_correct === true).length || 0;

        return {
          id: sa.id,
          assignment_id: id,
          student_id: sa.student_id,
          student: {
            id: sa.student_id,
            grade: student?.grade || sa.student_grade,
            school_name: student?.school_name || '',
            class_name: student?.class_name || '',
            user: {
              id: student?.user_id || sa.student_id,
              name: student?.name || sa.student_name,
              email: student?.email || '',
            },
          },
          status: sa.status,
          score: sa.score,
          answers: sa.answers,
          feedback: sa.feedback,
          started_at: sa.started_at,
          submitted_at: sa.submitted_at,
          graded_at: sa.graded_at,
          created_at: sa.created_at,
          updated_at: sa.updated_at,
          progress_percentage: progressPercentage,
          correct_count: correctCount,
          total_count: totalCount,
        };
      });

    // 통계 계산
    const statistics = calculateStatistics(studentAssignments);

    const response: AssignmentDetailResponse = {
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        academy_id: assignment.academy_id,
        teacher_id: assignment.teacher_id,
        teacher: {
          id: assignment.teacher_id,
          name: assignment.teacher_name,
          email: 'teacher@example.com', // TODO: 실제 이메일 조회
        },
        problems: assignment.problems,
        problems_detail: problemsDetail,
        due_date: assignment.due_date,
        time_limit: assignment.time_limit,
        is_active: assignment.is_active,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        student_assignments: studentAssignments,
        statistics,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('과제 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assignments/[id]
 * 과제를 수정합니다.
 *
 * Request Body: AssignmentUpdateInput
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: AssignmentUpdateInput = await request.json();

    // 데이터 로드
    const data = await readAssignmentsData();

    // 과제 찾기
    const assignmentIndex = data.assignments.findIndex(
      (a: { id: string }) => a.id === id
    );

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: '과제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 과제 업데이트
    const now = new Date().toISOString();
    const updatedAssignment = {
      ...data.assignments[assignmentIndex],
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.problems !== undefined && { problems: body.problems }),
      ...(body.due_date !== undefined && { due_date: body.due_date }),
      ...(body.time_limit !== undefined && { time_limit: body.time_limit }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      updated_at: now,
    };

    data.assignments[assignmentIndex] = updatedAssignment;

    // 파일에 저장
    await writeAssignmentsData(data);

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: '과제가 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('과제 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assignments/[id]
 * 과제를 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 데이터 로드
    const data = await readAssignmentsData();

    // 과제 찾기
    const assignmentIndex = data.assignments.findIndex(
      (a: { id: string }) => a.id === id
    );

    if (assignmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: '과제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 과제 삭제
    data.assignments.splice(assignmentIndex, 1);

    // 관련 학생 과제도 삭제
    data.student_assignments = data.student_assignments.filter(
      (sa: { assignment_id: string }) => sa.assignment_id !== id
    );

    // 파일에 저장
    await writeAssignmentsData(data);

    return NextResponse.json({
      success: true,
      message: '과제가 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('과제 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
