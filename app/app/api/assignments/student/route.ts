import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 데이터 파일 경로
const ASSIGNMENTS_DATA_PATH = path.join(process.cwd(), 'data', 'assignments.json');
const PROBLEMS_DATA_PATH = path.join(process.cwd(), 'data', 'saved-problems.json');

// 타입 정의
interface Assignment {
  id: string;
  title: string;
  description: string | null;
  teacher_name: string;
  problems: string[];
  due_date: string | null;
  time_limit: number | null;
  is_active: boolean;
}

interface StudentAssignment {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_grade: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  answers: Array<{
    problem_id: string;
    answer: string;
    is_correct: boolean | null;
    score?: number;
    image_url?: string;
  }> | null;
  feedback: string | null;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}

interface Problem {
  id: string;
  subject: string;
  grade: string;
  unit: string;
  question: string;
  answer: string;
  solution: string;
  difficulty: string;
  type: string;
  options: Array<{
    id: string;
    text: string;
    is_correct: boolean;
  }> | null;
}

interface StudentAssignmentItem {
  id: string;
  assignment_id: string;
  title: string;
  description: string | null;
  subject: string;
  chapter: string | null;
  due_date: string | null;
  problem_count: number;
  completed_count: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  max_score: number;
  difficulty: string;
  teacher_name: string;
  started_at: string | null;
  submitted_at: string | null;
}

/**
 * 데이터 파일 읽기
 */
async function readAssignmentsData() {
  try {
    const data = await fs.readFile(ASSIGNMENTS_DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('과제 데이터 파일 읽기 오류:', error);
    return { assignments: [], student_assignments: [] };
  }
}

async function readProblemsData() {
  try {
    const data = await fs.readFile(PROBLEMS_DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('문제 데이터 파일 읽기 오류:', error);
    return { problems: [] };
  }
}

/**
 * 난이도 계산 (문제들의 평균 난이도)
 */
function calculateDifficulty(problems: Problem[]): string {
  const difficultyMap: { [key: string]: number } = { easy: 1, medium: 2, hard: 3 };
  const reverseDifficultyMap: { [key: number]: string } = { 1: '하', 2: '중', 3: '상' };

  if (problems.length === 0) return '중';

  const avgDifficulty =
    problems.reduce((sum, p) => sum + (difficultyMap[p.difficulty] || 2), 0) / problems.length;

  const roundedDifficulty = Math.round(avgDifficulty);
  return reverseDifficultyMap[roundedDifficulty] || '중';
}

/**
 * 과목 추출 (첫 번째 문제의 과목)
 */
function extractSubject(problems: Problem[]): string {
  if (problems.length === 0) return '기타';
  return problems[0].subject || '기타';
}

/**
 * 단원 추출 (첫 번째 문제의 단원)
 */
function extractUnit(problems: Problem[]): string | null {
  if (problems.length === 0) return null;
  return problems[0].unit || null;
}

/**
 * GET /api/assignments/student
 * 학생의 과제 목록을 조회합니다.
 *
 * Query Parameters:
 * - student_id: 학생 ID (필수)
 * - status: 과제 상태 필터 (not_started, in_progress, submitted, graded)
 * - subject: 과목 필터
 * - search: 제목 검색
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 학생 ID 필수 체크
    const studentId = searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '학생 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 필터 옵션 추출
    const statusFilter = searchParams.get('status');
    const subjectFilter = searchParams.get('subject');
    const searchFilter = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);

    // 데이터 로드 (병렬 읽기)
    const [assignmentsData, problemsData] = await Promise.all([
      readAssignmentsData(),
      readProblemsData(),
    ]);

    const { assignments, student_assignments } = assignmentsData;
    const { problems: allProblems } = problemsData;

    // 학생의 과제만 필터링
    const studentAssignments: StudentAssignment[] = student_assignments.filter(
      (sa: StudentAssignment) => sa.student_id === studentId
    );

    // 과제 목록 아이템으로 변환
    let assignmentList: StudentAssignmentItem[] = studentAssignments.map((sa: StudentAssignment) => {
      // 해당 과제 정보 찾기
      const assignment: Assignment | undefined = assignments.find(
        (a: Assignment) => a.id === sa.assignment_id
      );

      if (!assignment) {
        return null;
      }

      // 과제에 포함된 문제들
      const assignmentProblems = assignment.problems
        .map((pid: string) => allProblems.find((p: Problem) => p.id === pid))
        .filter(Boolean) as Problem[];

      // 완료된 문제 수 계산
      const completedCount = sa.answers?.length || 0;

      return {
        id: sa.id,
        assignment_id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: extractSubject(assignmentProblems),
        chapter: extractUnit(assignmentProblems),
        due_date: assignment.due_date,
        problem_count: assignment.problems.length,
        completed_count: completedCount,
        status: sa.status,
        score: sa.score,
        max_score: assignment.problems.length * 30, // 문제당 30점으로 가정
        difficulty: calculateDifficulty(assignmentProblems),
        teacher_name: assignment.teacher_name,
        started_at: sa.started_at,
        submitted_at: sa.submitted_at,
      } as StudentAssignmentItem;
    }).filter(Boolean) as StudentAssignmentItem[];

    // 상태 필터 적용
    if (statusFilter && statusFilter !== 'all') {
      assignmentList = assignmentList.filter((a) => a.status === statusFilter);
    }

    // 과목 필터 적용
    if (subjectFilter) {
      assignmentList = assignmentList.filter((a) => a.subject === subjectFilter);
    }

    // 검색 필터 적용
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      assignmentList = assignmentList.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          (a.description && a.description.toLowerCase().includes(searchLower))
      );
    }

    // 정렬: 마감일 기준 오름차순 (마감일 없는 것은 뒤로)
    assignmentList.sort((a, b) => {
      // 진행 중인 과제 우선
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;

      // 시작 전 과제 두 번째
      if (a.status === 'not_started' && b.status !== 'not_started') return -1;
      if (a.status !== 'not_started' && b.status === 'not_started') return 1;

      // 마감일 기준 정렬
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

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedList,
        total,
        page,
        page_size: pageSize,
      },
    });
  } catch (error) {
    console.error('학생 과제 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
