import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Class,
  ClassStudentMutationResponse,
  AddStudentsToClass,
  RemoveStudentsFromClass,
} from '@/types/class';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'classes.json');

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/classes/[id]/students
 * 반에 학생을 추가합니다.
 *
 * Request Body: AddStudentsToClass
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: AddStudentsToClass = await request.json();

    // 필수 필드 검증
    if (!body.student_ids || body.student_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '추가할 학생을 선택해주세요.' },
        { status: 400 }
      );
    }

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

    // 학생 유효성 검사
    const validStudentIds: string[] = [];
    const invalidStudentIds: string[] = [];

    for (const studentId of body.student_ids) {
      const student = data.students.find((s: { id: string }) => s.id === studentId);
      if (student) {
        // 이미 반에 있는 학생인지 확인
        if (!currentClass.student_ids.includes(studentId)) {
          validStudentIds.push(studentId);
        }
      } else {
        invalidStudentIds.push(studentId);
      }
    }

    if (invalidStudentIds.length > 0) {
      return NextResponse.json(
        { success: false, error: `존재하지 않는 학생이 포함되어 있습니다: ${invalidStudentIds.join(', ')}` },
        { status: 400 }
      );
    }

    // 최대 수용 인원 확인
    if (currentClass.max_students !== null) {
      const newTotalCount = currentClass.student_ids.length + validStudentIds.length;
      if (newTotalCount > currentClass.max_students) {
        return NextResponse.json(
          {
            success: false,
            error: `최대 수용 인원(${currentClass.max_students}명)을 초과합니다. 현재 ${currentClass.student_ids.length}명, 추가 가능 인원: ${currentClass.max_students - currentClass.student_ids.length}명`,
          },
          { status: 400 }
        );
      }
    }

    if (validStudentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '추가할 새 학생이 없습니다. (이미 반에 등록된 학생들입니다)' },
        { status: 400 }
      );
    }

    // 학생 추가
    currentClass.student_ids.push(...validStudentIds);
    currentClass.updated_at = new Date().toISOString();

    // 데이터 업데이트
    data.classes[classIndex] = currentClass;

    // 파일에 저장
    await writeClassesData(data);

    const response: ClassStudentMutationResponse = {
      success: true,
      data: {
        class_id: id,
        student_ids: validStudentIds,
      },
      message: `${validStudentIds.length}명의 학생이 '${currentClass.name}' 반에 추가되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학생 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생을 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]/students
 * 반에서 학생을 제거합니다.
 *
 * Request Body: RemoveStudentsFromClass
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: RemoveStudentsFromClass = await request.json();

    // 필수 필드 검증
    if (!body.student_ids || body.student_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '제거할 학생을 선택해주세요.' },
        { status: 400 }
      );
    }

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

    // 제거할 학생 확인
    const studentsToRemove = body.student_ids.filter((studentId) =>
      currentClass.student_ids.includes(studentId)
    );

    if (studentsToRemove.length === 0) {
      return NextResponse.json(
        { success: false, error: '제거할 학생이 반에 등록되어 있지 않습니다.' },
        { status: 400 }
      );
    }

    // 학생 제거
    currentClass.student_ids = currentClass.student_ids.filter(
      (studentId: string) => !studentsToRemove.includes(studentId)
    );
    currentClass.updated_at = new Date().toISOString();

    // 데이터 업데이트
    data.classes[classIndex] = currentClass;

    // 파일에 저장
    await writeClassesData(data);

    const response: ClassStudentMutationResponse = {
      success: true,
      data: {
        class_id: id,
        student_ids: studentsToRemove,
      },
      message: `${studentsToRemove.length}명의 학생이 '${currentClass.name}' 반에서 제거되었습니다.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학생 제거 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생을 제거하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
