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
    feedback?: string;
    image_url?: string;
  }> | null;
  feedback: string | null;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}

interface SavedProblem {
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
  image_url: string | null;
}

/**
 * 데이터 파일 읽기/쓰기
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

async function writeAssignmentsData(data: unknown) {
  try {
    await fs.writeFile(ASSIGNMENTS_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('과제 데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
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
 * GET /api/assignments/student/[id]
 * 학생 과제 상세 정보를 조회합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const assignmentsData = await readAssignmentsData();
    const problemsData = await readProblemsData();

    const { assignments, student_assignments } = assignmentsData;
    const { problems: allProblems } = problemsData;

    // 학생 과제 찾기
    const studentAssignment: StudentAssignment | undefined = student_assignments.find(
      (sa: StudentAssignment) => sa.id === id
    );

    if (!studentAssignment) {
      return NextResponse.json(
        { success: false, error: '해당 과제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 과제 정보 찾기
    const assignment: Assignment | undefined = assignments.find(
      (a: Assignment) => a.id === studentAssignment.assignment_id
    );

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: '과제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 문제 정보 변환
    const problems = assignment.problems
      .map((problemId: string, index: number) => {
        const problem: SavedProblem | undefined = allProblems.find(
          (p: SavedProblem) => p.id === problemId
        );

        if (!problem) return null;

        // 문제 유형 변환
        let type: 'multiple_choice' | 'short_answer' | 'essay' = 'short_answer';
        if (problem.type === 'multiple_choice') type = 'multiple_choice';
        else if (problem.type === 'essay') type = 'essay';

        // 객관식 옵션 변환
        let options = undefined;
        if (problem.options && problem.options.length > 0) {
          options = problem.options.map((opt, idx) => ({
            id: idx + 1,
            text: opt.text,
          }));
        }

        return {
          id: problem.id,
          number: index + 1,
          question: problem.question,
          type,
          options,
          points: 30, // 문제당 30점
          hint: problem.solution ? problem.solution.substring(0, 100) + '...' : undefined,
          image_url: problem.image_url,
        };
      })
      .filter(Boolean);

    // 학생 답안 변환
    const answers = studentAssignment.answers?.map((ans) => ({
      problem_id: ans.problem_id,
      answer: ans.answer,
      is_correct: ans.is_correct,
      score: ans.score || null,
      feedback: ans.feedback,
      answered_at: new Date().toISOString(),
      image_url: ans.image_url,
    })) || [];

    // 과목 추출
    const firstProblem = allProblems.find((p: SavedProblem) =>
      assignment.problems.includes(p.id)
    );
    const subject = firstProblem?.subject || '기타';
    const chapter = firstProblem?.unit || null;

    return NextResponse.json({
      success: true,
      data: {
        id: studentAssignment.id,
        assignment_id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject,
        chapter,
        due_date: assignment.due_date,
        time_limit: assignment.time_limit,
        problems,
        answers,
        status: studentAssignment.status,
        score: studentAssignment.score,
        max_score: assignment.problems.length * 30,
        started_at: studentAssignment.started_at,
        submitted_at: studentAssignment.submitted_at,
        graded_at: studentAssignment.graded_at,
        feedback: studentAssignment.feedback,
      },
    });
  } catch (error) {
    console.error('학생 과제 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제 상세 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assignments/student/[id]
 * 학생 과제 상태를 업데이트합니다. (시작하기)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 데이터 로드
    const data = await readAssignmentsData();
    const { student_assignments } = data;

    // 학생 과제 찾기
    const saIndex = student_assignments.findIndex(
      (sa: StudentAssignment) => sa.id === id
    );

    if (saIndex === -1) {
      return NextResponse.json(
        { success: false, error: '해당 과제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const studentAssignment = student_assignments[saIndex];

    // 상태 업데이트
    if (body.action === 'start') {
      if (studentAssignment.status !== 'not_started') {
        return NextResponse.json(
          { success: false, error: '이미 시작된 과제입니다.' },
          { status: 400 }
        );
      }

      studentAssignment.status = 'in_progress';
      studentAssignment.started_at = new Date().toISOString();
      studentAssignment.updated_at = new Date().toISOString();
    }

    // 데이터 저장
    data.student_assignments[saIndex] = studentAssignment;
    await writeAssignmentsData(data);

    return NextResponse.json({
      success: true,
      data: studentAssignment,
      message: '과제를 시작했습니다.',
    });
  } catch (error) {
    console.error('학생 과제 상태 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제 상태를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
