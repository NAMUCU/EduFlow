import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  ExamDetailResponse,
  ExamUpdateInput,
  ExamStatistics,
  StudentExamStatus,
  ExamStatus,
  ExamProblem,
  StudentExamAnswer,
  getExamStatus,
} from '@/types/exam';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'exams.json');
const PROBLEMS_FILE_PATH = path.join(process.cwd(), 'data', 'example-problems.json');

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
 * 시험 통계 계산
 */
function calculateStatistics(
  studentExams: Array<{
    status: StudentExamStatus;
    score: number | null;
    percentage: number | null;
  }>,
  passingScore: number | null
): ExamStatistics {
  const totalStudents = studentExams.length;

  const statusCounts = studentExams.reduce(
    (acc, se) => {
      acc[se.status] = (acc[se.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const gradedExams = studentExams.filter(
    (se) => se.status === 'graded' && se.score !== null
  );

  const scores = gradedExams.map((se) => se.score as number);
  const percentages = gradedExams.map((se) => se.percentage as number);

  // 합격/불합격 계산
  let passCount = 0;
  let failCount = 0;
  if (passingScore !== null) {
    gradedExams.forEach((se) => {
      if (se.score !== null && se.score >= passingScore) {
        passCount++;
      } else {
        failCount++;
      }
    });
  }

  return {
    total_students: totalStudents,
    not_started_count: statusCounts['not_started'] || 0,
    in_progress_count: statusCounts['in_progress'] || 0,
    submitted_count: statusCounts['submitted'] || 0,
    graded_count: statusCounts['graded'] || 0,
    average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    average_percentage: percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : null,
    highest_score: scores.length > 0 ? Math.max(...scores) : null,
    lowest_score: scores.length > 0 ? Math.min(...scores) : null,
    pass_count: passCount,
    fail_count: failCount,
    pass_rate: passingScore !== null && gradedExams.length > 0
      ? Math.round((passCount / gradedExams.length) * 100)
      : null,
    completion_rate: totalStudents > 0
      ? Math.round(((statusCounts['submitted'] || 0) + (statusCounts['graded'] || 0)) / totalStudents * 100)
      : 0,
  };
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/exams/[id]
 * 시험 상세 정보를 조회합니다.
 *
 * Response:
 * - 성공: { success: true, data: ExamDetail }
 * - 실패: { success: false, error: string }
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 데이터 로드
    const [examsData, problemsData] = await Promise.all([
      readExamsData(),
      readProblemsData(),
    ]);

    // 시험 찾기
    const exam = examsData.exams.find(
      (e: { id: string }) => e.id === id
    );

    if (!exam) {
      return NextResponse.json(
        { success: false, error: '시험을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 상태 업데이트
    const currentStatus = getExamStatus({
      start_date: exam.start_date,
      end_date: exam.end_date,
      status: exam.status,
    });

    // 문제 상세 정보 로드
    const problemsDetail = exam.problems.map((examProblem: ExamProblem) => {
      const problem = findProblemById(problemsData, examProblem.problem_id);
      return {
        id: examProblem.problem_id,
        order: examProblem.order,
        points: examProblem.points,
        question: problem?.question || '문제를 찾을 수 없습니다.',
        answer: problem?.answer || '',
        solution: problem?.solution || '',
        difficulty: problem?.difficulty || 'medium',
        type: problem?.type || 'short_answer',
        options: null,
        subject: exam.subject,
        grade: exam.grade,
        unit: '',
        image_url: null,
        tags: null,
        academy_id: exam.academy_id,
        created_by: exam.teacher_id,
        is_public: true,
        ai_generated: false,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
      };
    });

    // 학생별 시험 현황 로드
    const studentExams = examsData.student_exams
      .filter((se: { exam_id: string }) => se.exam_id === id)
      .map((se: {
        id: string;
        student_id: string;
        student_name: string;
        student_grade: string;
        status: StudentExamStatus;
        score: number | null;
        percentage: number | null;
        rank: number | null;
        answers: StudentExamAnswer[] | null;
        feedback: string | null;
        started_at: string | null;
        submitted_at: string | null;
        graded_at: string | null;
        created_at: string;
        updated_at: string;
      }) => {
        const student = examsData.students.find(
          (s: { id: string }) => s.id === se.student_id
        );

        // 진행률 계산
        const answeredCount = se.answers?.length || 0;
        const totalCount = exam.problems.length;
        const progressPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

        // 정답 수 계산
        const correctCount = se.answers?.filter((a: { is_correct: boolean | null }) => a.is_correct === true).length || 0;

        return {
          id: se.id,
          exam_id: id,
          student_id: se.student_id,
          student: {
            id: se.student_id,
            grade: student?.grade || se.student_grade,
            school_name: student?.school_name || '',
            class_name: student?.class_name || '',
            user: {
              id: student?.user_id || se.student_id,
              name: student?.name || se.student_name,
              email: student?.email || '',
            },
          },
          status: se.status,
          score: se.score,
          percentage: se.percentage,
          rank: se.rank,
          answers: se.answers,
          feedback: se.feedback,
          started_at: se.started_at,
          submitted_at: se.submitted_at,
          graded_at: se.graded_at,
          created_at: se.created_at,
          updated_at: se.updated_at,
          progress_percentage: progressPercentage,
          correct_count: correctCount,
          total_count: totalCount,
        };
      });

    // 통계 계산
    const statistics = calculateStatistics(studentExams, exam.passing_score);

    const response: ExamDetailResponse = {
      success: true,
      data: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        academy_id: exam.academy_id,
        teacher_id: exam.teacher_id,
        teacher: {
          id: exam.teacher_id,
          name: exam.teacher_name,
          email: 'teacher@example.com', // TODO: 실제 이메일 조회
        },
        exam_type: exam.exam_type,
        subject: exam.subject,
        grade: exam.grade,
        problems: exam.problems,
        problems_detail: problemsDetail,
        total_points: exam.total_points,
        passing_score: exam.passing_score,
        start_date: exam.start_date,
        end_date: exam.end_date,
        time_limit: exam.time_limit,
        status: currentStatus,
        shuffle_problems: exam.shuffle_problems,
        shuffle_options: exam.shuffle_options,
        show_score_immediately: exam.show_score_immediately,
        show_answers_after_exam: exam.show_answers_after_exam,
        created_at: exam.created_at,
        updated_at: exam.updated_at,
        student_exams: studentExams,
        statistics,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('시험 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '시험 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/exams/[id]
 * 시험을 수정합니다.
 *
 * Request Body: ExamUpdateInput
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: ExamUpdateInput = await request.json();

    // 데이터 로드
    const data = await readExamsData();

    // 시험 찾기
    const examIndex = data.exams.findIndex(
      (e: { id: string }) => e.id === id
    );

    if (examIndex === -1) {
      return NextResponse.json(
        { success: false, error: '시험을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingExam = data.exams[examIndex];

    // 진행 중이거나 완료된 시험은 일부 필드만 수정 가능
    const currentStatus = getExamStatus({
      start_date: existingExam.start_date,
      end_date: existingExam.end_date,
      status: existingExam.status,
    });

    if (currentStatus === 'in_progress') {
      // 진행 중인 시험은 제한적 수정만 허용
      if (body.problems || body.start_date) {
        return NextResponse.json(
          { success: false, error: '진행 중인 시험의 문제나 시작 시간은 수정할 수 없습니다.' },
          { status: 400 }
        );
      }
    }

    if (currentStatus === 'completed') {
      // 완료된 시험은 제목, 설명만 수정 가능
      if (body.problems || body.start_date || body.end_date || body.time_limit) {
        return NextResponse.json(
          { success: false, error: '완료된 시험은 제목과 설명만 수정할 수 있습니다.' },
          { status: 400 }
        );
      }
    }

    // 시험 업데이트
    const now = new Date().toISOString();

    // 총점 재계산 (문제 변경 시)
    let totalPoints = existingExam.total_points;
    if (body.problems) {
      totalPoints = body.total_points || body.problems.reduce((sum, p) => sum + p.points, 0);
    }

    const updatedExam = {
      ...existingExam,
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.exam_type !== undefined && { exam_type: body.exam_type }),
      ...(body.subject !== undefined && { subject: body.subject }),
      ...(body.grade !== undefined && { grade: body.grade }),
      ...(body.problems !== undefined && { problems: body.problems, total_points: totalPoints }),
      ...(body.passing_score !== undefined && { passing_score: body.passing_score }),
      ...(body.start_date !== undefined && { start_date: body.start_date }),
      ...(body.end_date !== undefined && { end_date: body.end_date }),
      ...(body.time_limit !== undefined && { time_limit: body.time_limit }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.shuffle_problems !== undefined && { shuffle_problems: body.shuffle_problems }),
      ...(body.shuffle_options !== undefined && { shuffle_options: body.shuffle_options }),
      ...(body.show_score_immediately !== undefined && { show_score_immediately: body.show_score_immediately }),
      ...(body.show_answers_after_exam !== undefined && { show_answers_after_exam: body.show_answers_after_exam }),
      updated_at: now,
    };

    data.exams[examIndex] = updatedExam;

    // 파일에 저장
    await writeExamsData(data);

    return NextResponse.json({
      success: true,
      data: updatedExam,
      message: '시험이 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('시험 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '시험을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/exams/[id]
 * 시험을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 데이터 로드
    const data = await readExamsData();

    // 시험 찾기
    const examIndex = data.exams.findIndex(
      (e: { id: string }) => e.id === id
    );

    if (examIndex === -1) {
      return NextResponse.json(
        { success: false, error: '시험을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const exam = data.exams[examIndex];

    // 진행 중인 시험은 삭제 불가
    const currentStatus = getExamStatus({
      start_date: exam.start_date,
      end_date: exam.end_date,
      status: exam.status,
    });

    if (currentStatus === 'in_progress') {
      return NextResponse.json(
        { success: false, error: '진행 중인 시험은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 시험 삭제
    data.exams.splice(examIndex, 1);

    // 관련 학생 시험 기록도 삭제
    data.student_exams = data.student_exams.filter(
      (se: { exam_id: string }) => se.exam_id !== id
    );

    // 파일에 저장
    await writeExamsData(data);

    return NextResponse.json({
      success: true,
      message: '시험이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('시험 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '시험을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
