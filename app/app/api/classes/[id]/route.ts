import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Class,
  ClassDetail,
  ClassDetailResponse,
  ClassMutationResponse,
  ClassDeleteResponse,
  ClassStudent,
  ClassAssignmentSummary,
  UpdateClass,
} from '@/types/class';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'classes.json');
const ASSIGNMENTS_FILE_PATH = path.join(process.cwd(), 'data', 'assignments.json');

/**
 * 반 데이터 파일 읽기
 */
async function readClassesData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('데이터 파일 읽기 오류:', error);
    return { classes: [], teachers: [], students: [] };
  }
}

/**
 * 반 데이터 파일 쓰기
 */
async function writeClassesData(data: unknown) {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * 과제 데이터 파일 읽기
 */
async function readAssignmentsData() {
  try {
    const data = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('과제 데이터 파일 읽기 오류:', error);
    return { assignments: [], student_assignments: [] };
  }
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/classes/[id]
 * 특정 반의 상세 정보를 조회합니다. (학생 목록, 과제 현황 포함)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 데이터 로드
    const data = await readClassesData();
    const assignmentsData = await readAssignmentsData();

    // 반 찾기
    const classItem = data.classes.find((c: Class) => c.id === id);
    if (!classItem) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 반입니다.' },
        { status: 404 }
      );
    }

    // 학생 정보 조회
    const students: ClassStudent[] = classItem.student_ids.map((studentId: string) => {
      const student = data.students.find((s: { id: string }) => s.id === studentId);
      if (student) {
        return {
          id: student.id,
          name: student.name,
          email: student.email || null,
          grade: student.grade || null,
          school_name: student.school_name || null,
          phone: student.phone || null,
          joined_at: null, // TODO: 가입일 정보가 있다면 추가
        };
      }
      return null;
    }).filter(Boolean) as ClassStudent[];

    // 과제 현황 계산
    const { assignments, student_assignments } = assignmentsData;

    // 해당 반 학생들의 과제만 필터링
    const relevantAssignments = student_assignments.filter((sa: { student_id: string }) =>
      classItem.student_ids.includes(sa.student_id)
    );

    const uniqueAssignmentIds = [...new Set(relevantAssignments.map((sa: { assignment_id: string }) => sa.assignment_id))];

    const activeAssignments = assignments.filter(
      (a: { id: string; is_active: boolean }) => uniqueAssignmentIds.includes(a.id) && a.is_active
    );

    const completedAssignments = relevantAssignments.filter(
      (sa: { status: string }) => sa.status === 'graded' || sa.status === 'submitted'
    );

    const totalAssignments = relevantAssignments.length;
    const avgCompletionRate = totalAssignments > 0
      ? Math.round((completedAssignments.length / totalAssignments) * 100)
      : 0;

    const assignmentSummary: ClassAssignmentSummary = {
      total: uniqueAssignmentIds.length,
      active: activeAssignments.length,
      completed: uniqueAssignmentIds.length - activeAssignments.length,
      average_completion_rate: avgCompletionRate,
    };

    // 상세 정보 구성
    const classDetail: ClassDetail = {
      ...classItem,
      students,
      assignment_summary: assignmentSummary,
    };

    const response: ClassDetailResponse = {
      success: true,
      data: classDetail,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('반 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '반 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/classes/[id]
 * 특정 반의 정보를 수정합니다.
 *
 * Request Body: UpdateClass
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: UpdateClass = await request.json();

    // 데이터 로드
    const data = await readClassesData();

    // 반 찾기
    const classIndex = data.classes.findIndex((c: Class) => c.id === id);
    if (classIndex === -1) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 반입니다.' },
        { status: 404 }
      );
    }

    const currentClass = data.classes[classIndex];

    // 선생님 변경 시 유효성 검사
    if (body.teacher_id && body.teacher_id !== currentClass.teacher_id) {
      const teacher = data.teachers.find((t: { id: string }) => t.id === body.teacher_id);
      if (!teacher) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 선생님입니다.' },
          { status: 400 }
        );
      }
      // 선생님 이름도 함께 업데이트
      currentClass.teacher_name = teacher.name;
    }

    // 업데이트할 필드만 수정
    const updatedClass: Class = {
      ...currentClass,
      name: body.name?.trim() ?? currentClass.name,
      description: body.description !== undefined ? body.description : currentClass.description,
      teacher_id: body.teacher_id ?? currentClass.teacher_id,
      subject: body.subject?.trim() ?? currentClass.subject,
      grade: body.grade?.trim() ?? currentClass.grade,
      schedule: body.schedule ?? currentClass.schedule,
      max_students: body.max_students !== undefined ? body.max_students : currentClass.max_students,
      status: body.status ?? currentClass.status,
      color: body.color !== undefined ? body.color : currentClass.color,
      room: body.room !== undefined ? body.room : currentClass.room,
      memo: body.memo !== undefined ? body.memo : currentClass.memo,
      updated_at: new Date().toISOString(),
    };

    // 데이터 업데이트
    data.classes[classIndex] = updatedClass;

    // 파일에 저장
    await writeClassesData(data);

    const response: ClassMutationResponse = {
      success: true,
      data: updatedClass,
      message: `'${updatedClass.name}' 반 정보가 수정되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('반 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '반 정보를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]
 * 특정 반을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // 데이터 로드
    const data = await readClassesData();

    // 반 찾기
    const classIndex = data.classes.findIndex((c: Class) => c.id === id);
    if (classIndex === -1) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 반입니다.' },
        { status: 404 }
      );
    }

    const deletedClass = data.classes[classIndex];

    // 데이터에서 제거
    data.classes.splice(classIndex, 1);

    // 파일에 저장
    await writeClassesData(data);

    const response: ClassDeleteResponse = {
      success: true,
      message: `'${deletedClass.name}' 반이 삭제되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('반 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '반을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
