/**
 * 학생 API - 목록 조회 및 등록
 *
 * GET /api/students - 학생 목록 조회 (필터: 반, 학년, 검색)
 * POST /api/students - 학생 등록
 */

import { NextRequest, NextResponse } from 'next/server';
import studentsData from '@/data/students.json';
import {
  StudentListItem,
  StudentListResponse,
  StudentMutationResponse,
  CreateStudentInput,
  StudentStatus,
} from '@/types/student';

// JSON 데이터를 메모리에 저장 (실제 환경에서는 DB 사용)
let students = [...studentsData.students];

/**
 * GET /api/students
 * 학생 목록 조회 (필터링 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade') || '';
    const className = searchParams.get('className') || '';
    const status = searchParams.get('status') as StudentStatus | '';
    const subject = searchParams.get('subject') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 필터링
    let filteredStudents = students.filter((student) => {
      // 검색어 필터
      if (search) {
        const searchLower = search.toLowerCase();
        const matchName = student.name.toLowerCase().includes(searchLower);
        const matchSchool = student.school.toLowerCase().includes(searchLower);
        const matchGrade = student.grade.toLowerCase().includes(searchLower);
        if (!matchName && !matchSchool && !matchGrade) {
          return false;
        }
      }

      // 학년 필터
      if (grade && student.grade !== grade) {
        return false;
      }

      // 반 필터
      if (className && student.className !== className) {
        return false;
      }

      // 상태 필터
      if (status && student.status !== status) {
        return false;
      }

      // 과목 필터
      if (subject && !student.subjects.includes(subject)) {
        return false;
      }

      return true;
    });

    // 전체 개수
    const total = filteredStudents.length;

    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

    // StudentListItem 형태로 변환
    const studentList: StudentListItem[] = paginatedStudents.map((student) => ({
      id: student.id,
      name: student.name,
      grade: student.grade,
      school: student.school,
      className: student.className,
      phone: student.phone,
      parentName: student.parent.name,
      parentPhone: student.parent.phone,
      subjects: student.subjects,
      recentScore: student.averageScore || undefined,
      status: student.status as StudentStatus,
      enrolledAt: student.enrolledAt,
    }));

    const response: StudentListResponse = {
      success: true,
      data: {
        students: studentList,
        total,
        page,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학생 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * 학생 등록
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateStudentInput = await request.json();

    // 필수 필드 검증
    if (!body.name || !body.grade || !body.school) {
      return NextResponse.json(
        { success: false, error: '이름, 학년, 학교는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (!body.parent || !body.parent.name || !body.parent.phone) {
      return NextResponse.json(
        { success: false, error: '학부모 이름과 연락처는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 새 학생 ID 생성
    const maxId = students.reduce((max, s) => {
      const num = parseInt(s.id.replace('STU', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `STU${String(maxId + 1).padStart(3, '0')}`;

    // 새 학생 객체 생성
    const newStudent = {
      id: newId,
      name: body.name,
      email: body.email || '',
      phone: body.phone || '',
      grade: body.grade,
      school: body.school,
      className: body.className || '',
      subjects: body.subjects || [],
      status: '신규' as StudentStatus,
      averageScore: null as number | null,
      enrolledAt: new Date().toISOString().split('T')[0],
      memo: body.memo || '',
      parent: {
        name: body.parent.name,
        phone: body.parent.phone,
        email: body.parent.email || '',
        relationship: body.parent.relationship || '기타',
      },
    };

    // 메모리에 추가
    students.push(newStudent);

    const response: StudentMutationResponse = {
      success: true,
      data: {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        grade: newStudent.grade,
        school: newStudent.school,
        className: newStudent.className,
        subjects: newStudent.subjects,
        status: newStudent.status,
        averageScore: newStudent.averageScore || undefined,
        enrolledAt: newStudent.enrolledAt,
        memo: newStudent.memo,
        parent: {
          name: newStudent.parent.name,
          phone: newStudent.parent.phone,
          email: newStudent.parent.email,
          relationship: newStudent.parent.relationship as '부' | '모' | '조부' | '조모' | '기타',
        },
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('학생 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}
