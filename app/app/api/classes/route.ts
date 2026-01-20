import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Class,
  ClassListItem,
  ClassListResponse,
  ClassMutationResponse,
  ClassFilterOptions,
  CreateClass,
  ClassSchedule,
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

/**
 * GET /api/classes
 * 반 목록을 조회합니다.
 *
 * Query Parameters:
 * - status: 반 상태 필터 (active, inactive, archived)
 * - subject: 과목 필터
 * - grade: 학년 필터
 * - teacher_id: 선생님 ID 필터
 * - search: 검색어 (이름, 설명)
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 옵션 추출
    const filters: ClassFilterOptions = {
      status: searchParams.get('status') as ClassFilterOptions['status'] || undefined,
      subject: searchParams.get('subject') || undefined,
      grade: searchParams.get('grade') || undefined,
      teacher_id: searchParams.get('teacher_id') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);

    // 데이터 로드
    const data = await readClassesData();
    const { classes } = data;

    // 반 목록 아이템으로 변환
    let classList: ClassListItem[] = classes.map((cls: Class) => ({
      id: cls.id,
      name: cls.name,
      subject: cls.subject,
      grade: cls.grade,
      teacher_name: cls.teacher_name,
      schedule: cls.schedule,
      student_count: cls.student_ids.length,
      max_students: cls.max_students,
      status: cls.status,
      color: cls.color,
    }));

    // 필터 적용
    if (filters.status) {
      classList = classList.filter((c) => c.status === filters.status);
    }

    if (filters.subject) {
      classList = classList.filter((c) => c.subject === filters.subject);
    }

    if (filters.grade) {
      classList = classList.filter((c) => c.grade === filters.grade);
    }

    if (filters.teacher_id) {
      const filteredClasses = classes.filter((c: Class) => c.teacher_id === filters.teacher_id);
      const filteredIds = filteredClasses.map((c: Class) => c.id);
      classList = classList.filter((c) => filteredIds.includes(c.id));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchingClasses = classes.filter((c: Class) =>
        c.name.toLowerCase().includes(searchLower) ||
        (c.description && c.description.toLowerCase().includes(searchLower))
      );
      const matchingIds = matchingClasses.map((c: Class) => c.id);
      classList = classList.filter((c) => matchingIds.includes(c.id));
    }

    // 정렬: 이름순
    classList.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    // 페이지네이션
    const total = classList.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = classList.slice(startIndex, endIndex);

    const response: ClassListResponse = {
      success: true,
      data: {
        classes: paginatedList,
        total,
        page,
        page_size: pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('반 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '반 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes
 * 새 반을 생성합니다.
 *
 * Request Body: CreateClass
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateClass = await request.json();

    // 필수 필드 검증
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: '반 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.subject || !body.subject.trim()) {
      return NextResponse.json(
        { success: false, error: '과목은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.grade || !body.grade.trim()) {
      return NextResponse.json(
        { success: false, error: '대상 학년은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.teacher_id || !body.teacher_id.trim()) {
      return NextResponse.json(
        { success: false, error: '담당 선생님은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.schedule || body.schedule.length === 0) {
      return NextResponse.json(
        { success: false, error: '수업 일정은 최소 1개 이상 필요합니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readClassesData();

    // 선생님 정보 조회
    const teacher = data.teachers.find((t: { id: string; name: string }) => t.id === body.teacher_id);
    if (!teacher) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 선생님입니다.' },
        { status: 400 }
      );
    }

    // 새 반 ID 생성
    const newClassId = `class-${Date.now()}`;
    const now = new Date().toISOString();

    // 새 반 객체 생성
    const newClass: Class = {
      id: newClassId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      academy_id: body.academy_id || 'academy-001', // 기본값
      teacher_id: body.teacher_id,
      teacher_name: teacher.name,
      subject: body.subject.trim(),
      grade: body.grade.trim(),
      schedule: body.schedule as ClassSchedule[],
      student_ids: body.student_ids || [],
      max_students: body.max_students ?? null,
      status: 'active',
      color: body.color || null,
      room: body.room || null,
      memo: body.memo || null,
      created_at: now,
      updated_at: now,
    };

    // 데이터에 추가
    data.classes.push(newClass);

    // 파일에 저장
    await writeClassesData(data);

    const response: ClassMutationResponse = {
      success: true,
      data: newClass,
      message: `'${newClass.name}' 반이 성공적으로 생성되었습니다.`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('반 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '반을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
