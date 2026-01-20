import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 데이터 파일 경로
const ASSIGNMENTS_DATA_PATH = path.join(process.cwd(), 'data', 'assignments.json');
const PROBLEMS_DATA_PATH = path.join(process.cwd(), 'data', 'saved-problems.json');

// 타입 정의
interface Assignment {
  id: string;
  problems: string[];
}

interface Answer {
  problem_id: string;
  answer: string;
  is_correct: boolean | null | undefined;
  score?: number;
  image_url?: string;
}

interface StudentAssignment {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_grade: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  answers: Answer[] | null;
  feedback: string | null;
  started_at: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  updated_at: string;
}

interface SavedProblem {
  id: string;
  question: string;
  answer: string;
  type: string;
  options: Array<{
    id: string;
    text: string;
    is_correct: boolean;
  }> | null;
}

interface SubmittedAnswer {
  problem_id: string;
  answer: string;
  answered_at?: string;
  image_url?: string;
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
 * 자동 채점 (객관식, 단답형)
 */
function autoGrade(
  submittedAnswer: string,
  correctAnswer: string,
  problemType: string
): { is_correct: boolean | null; score: number } {
  // 정규화: 공백 제거, 소문자 변환
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[,，]/g, ',')
      .trim();

  const normalizedSubmitted = normalize(submittedAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  // 객관식: 정확히 일치
  if (problemType === 'multiple_choice') {
    const isCorrect = normalizedSubmitted === normalizedCorrect;
    return { is_correct: isCorrect, score: isCorrect ? 30 : 0 };
  }

  // 단답형: 정확히 일치 또는 포함 여부
  if (problemType === 'short_answer') {
    // 정확히 일치
    if (normalizedSubmitted === normalizedCorrect) {
      return { is_correct: true, score: 30 };
    }

    // 복수 정답 처리 (콤마로 구분된 경우)
    const correctAnswers = normalizedCorrect.split(',').map((a) => a.trim());
    const submittedAnswers = normalizedSubmitted.split(',').map((a) => a.trim());

    // 모든 정답이 포함되어 있는지 확인
    const allCorrect = correctAnswers.every((ca) =>
      submittedAnswers.some((sa) => sa === ca || sa.includes(ca) || ca.includes(sa))
    );

    if (allCorrect) {
      return { is_correct: true, score: 30 };
    }

    // 부분 점수
    const matchedCount = correctAnswers.filter((ca) =>
      submittedAnswers.some((sa) => sa === ca || sa.includes(ca) || ca.includes(sa))
    ).length;

    if (matchedCount > 0) {
      const partialScore = Math.round((matchedCount / correctAnswers.length) * 30);
      return { is_correct: false, score: partialScore };
    }

    return { is_correct: false, score: 0 };
  }

  // 서술형: 수동 채점 필요 (임시로 부분 점수)
  return { is_correct: null, score: 0 };
}

/**
 * POST /api/assignments/student/[id]/submit
 * 과제를 제출합니다.
 *
 * Request Body:
 * {
 *   answers: [
 *     { problem_id: string, answer: string, image_url?: string }
 *   ]
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { success: false, error: '답안 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readAssignmentsData();
    const problemsData = await readProblemsData();

    const { assignments, student_assignments } = data;
    const { problems: allProblems } = problemsData;

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

    const studentAssignment: StudentAssignment = student_assignments[saIndex];

    // 이미 제출된 과제인지 확인
    if (studentAssignment.status === 'submitted' || studentAssignment.status === 'graded') {
      return NextResponse.json(
        { success: false, error: '이미 제출된 과제입니다.' },
        { status: 400 }
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

    // 답안 채점
    const gradedAnswers: Answer[] = [];
    let totalScore = 0;
    let correctCount = 0;
    let needsManualGrading = false;

    for (const submittedAnswer of body.answers as SubmittedAnswer[]) {
      const problem: SavedProblem | undefined = allProblems.find(
        (p: SavedProblem) => p.id === submittedAnswer.problem_id
      );

      if (!problem) {
        gradedAnswers.push({
          problem_id: submittedAnswer.problem_id,
          answer: submittedAnswer.answer,
          is_correct: null,
          score: 0,
          image_url: submittedAnswer.image_url,
        });
        continue;
      }

      // 자동 채점
      const gradeResult = autoGrade(submittedAnswer.answer, problem.answer, problem.type);

      if (gradeResult.is_correct === null) {
        needsManualGrading = true;
      } else if (gradeResult.is_correct) {
        correctCount++;
      }

      totalScore += gradeResult.score;

      gradedAnswers.push({
        problem_id: submittedAnswer.problem_id,
        answer: submittedAnswer.answer,
        is_correct: gradeResult.is_correct,
        score: gradeResult.score,
        image_url: submittedAnswer.image_url,
      });
    }

    // 학생 과제 업데이트
    const now = new Date().toISOString();
    studentAssignment.answers = gradedAnswers;
    studentAssignment.score = needsManualGrading ? null : totalScore;
    studentAssignment.status = needsManualGrading ? 'submitted' : 'graded';
    studentAssignment.submitted_at = now;
    studentAssignment.updated_at = now;

    if (!needsManualGrading) {
      studentAssignment.graded_at = now;
    }

    // 데이터 저장
    data.student_assignments[saIndex] = studentAssignment;
    await writeAssignmentsData(data);

    // 결과 반환
    const maxScore = assignment.problems.length * 30;

    return NextResponse.json({
      success: true,
      score: totalScore,
      maxScore,
      correctCount,
      totalCount: assignment.problems.length,
      needsManualGrading,
      results: gradedAnswers.map((a) => ({
        problem_id: a.problem_id,
        is_correct: a.is_correct,
        score: a.score,
      })),
      message: needsManualGrading
        ? '과제가 제출되었습니다. 서술형 문제는 선생님의 채점을 기다려주세요.'
        : `과제 제출 완료! 점수: ${totalScore}/${maxScore}점`,
    });
  } catch (error) {
    console.error('과제 제출 오류:', error);
    return NextResponse.json(
      { success: false, error: '과제를 제출하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
