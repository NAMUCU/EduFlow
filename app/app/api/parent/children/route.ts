/**
 * 학부모 자녀 정보 API
 *
 * GET /api/parent/children - 학부모의 자녀 목록 조회
 *
 * 학부모가 등록한 자녀(학생) 목록을 조회합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import studentsData from '@/data/students.json';

// 자녀 정보 타입
interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  className?: string;
  subjects: string[];
  profileImage?: string;
}

// 응답 타입
interface ChildrenResponse {
  success: boolean;
  data?: {
    children: Child[];
  };
  error?: string;
}

// Mock: 학부모-자녀 매핑
const parentChildrenMap: Record<string, string[]> = {
  'PRT001': ['STU001'], // 김영희 학부모 -> 김민준 학생
  'PRT002': ['STU002'], // 이철수 학부모 -> 이서연 학생
  'PRT003': ['STU003'], // 박미영 학부모 -> 박지호 학생
  'PRT004': ['STU001', 'STU002'], // 테스트 학부모 (복수 자녀)
};

/**
 * GET /api/parent/children
 * 학부모의 자녀 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    // 학부모 ID가 없으면 전체 학생 반환 (개발용)
    let studentIds: string[] = [];

    if (parentId && parentChildrenMap[parentId]) {
      studentIds = parentChildrenMap[parentId];
    } else {
      // 개발 환경에서는 모든 학생 반환
      studentIds = studentsData.students.map((s) => s.id);
    }

    // 학생 정보 조회
    const children: Child[] = studentsData.students
      .filter((student) => studentIds.includes(student.id))
      .map((student) => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        school: student.school,
        className: student.className,
        subjects: student.subjects,
        profileImage: (student as Record<string, unknown>).profileImage as string | undefined,
      }));

    const response: ChildrenResponse = {
      success: true,
      data: {
        children,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('자녀 목록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '자녀 목록을 불러오는데 실패했습니다.',
      } as ChildrenResponse,
      { status: 500 }
    );
  }
}
