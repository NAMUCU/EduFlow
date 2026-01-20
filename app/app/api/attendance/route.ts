import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Attendance,
  AttendanceListResponse,
  AttendanceFilterOptions,
  AttendanceCreateInput,
  AttendanceStatus,
} from '@/types/attendance';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'attendance.json');

/**
 * 출결 데이터 파일 읽기
 */
async function readAttendanceData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('데이터 파일 읽기 오류:', error);
    return { attendances: [], students: [], classes: [] };
  }
}

/**
 * 출결 데이터 파일 쓰기
 */
async function writeAttendanceData(data: unknown) {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * GET /api/attendance
 * 출결 기록을 조회합니다.
 *
 * Query Parameters:
 * - date: 특정 날짜 (YYYY-MM-DD)
 * - date_from: 조회 시작 날짜 (YYYY-MM-DD)
 * - date_to: 조회 종료 날짜 (YYYY-MM-DD)
 * - class_id: 반 ID
 * - student_id: 학생 ID
 * - status: 출결 상태
 * - academy_id: 학원 ID
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 옵션 추출
    const filters: AttendanceFilterOptions = {
      date: searchParams.get('date') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      class_id: searchParams.get('class_id') || undefined,
      student_id: searchParams.get('student_id') || undefined,
      status: (searchParams.get('status') as AttendanceStatus) || undefined,
      academy_id: searchParams.get('academy_id') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '50', 10);

    // 데이터 로드
    const data = await readAttendanceData();
    let attendances: Attendance[] = data.attendances || [];

    // 필터 적용
    if (filters.date) {
      attendances = attendances.filter((a) => a.date === filters.date);
    }

    if (filters.date_from) {
      attendances = attendances.filter((a) => a.date >= filters.date_from!);
    }

    if (filters.date_to) {
      attendances = attendances.filter((a) => a.date <= filters.date_to!);
    }

    if (filters.class_id) {
      attendances = attendances.filter((a) => a.class_id === filters.class_id);
    }

    if (filters.student_id) {
      attendances = attendances.filter((a) => a.student_id === filters.student_id);
    }

    if (filters.status) {
      attendances = attendances.filter((a) => a.status === filters.status);
    }

    if (filters.academy_id) {
      attendances = attendances.filter((a) => a.academy_id === filters.academy_id);
    }

    // 날짜 내림차순 정렬 (최신순)
    attendances.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.student_name.localeCompare(b.student_name);
    });

    // 페이지네이션
    const total = attendances.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = attendances.slice(startIndex, endIndex);

    const response: AttendanceListResponse = {
      success: true,
      data: {
        attendances: paginatedList,
        total,
        page,
        page_size: pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('출결 기록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '출결 기록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance
 * 새 출결 기록을 등록합니다.
 *
 * Request Body: AttendanceCreateInput
 */
export async function POST(request: NextRequest) {
  try {
    const body: AttendanceCreateInput = await request.json();

    // 필수 필드 검증
    if (!body.student_id) {
      return NextResponse.json(
        { success: false, error: '학생 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.class_id) {
      return NextResponse.json(
        { success: false, error: '반 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { success: false, error: '날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: '출결 상태는 필수입니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readAttendanceData();

    // 학생 정보 조회
    const student = data.students.find((s: { id: string }) => s.id === body.student_id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: '해당 학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 반 정보 조회
    const classInfo = data.classes.find((c: { id: string }) => c.id === body.class_id);
    if (!classInfo) {
      return NextResponse.json(
        { success: false, error: '해당 반을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 중복 확인 (같은 학생, 같은 날짜, 같은 반)
    const existingIndex = data.attendances.findIndex(
      (a: Attendance) =>
        a.student_id === body.student_id &&
        a.date === body.date &&
        a.class_id === body.class_id
    );

    const now = new Date().toISOString();
    let newAttendance: Attendance;

    if (existingIndex >= 0) {
      // 기존 기록 업데이트
      newAttendance = {
        ...data.attendances[existingIndex],
        status: body.status,
        check_in_time: body.check_in_time || data.attendances[existingIndex].check_in_time,
        check_out_time: body.check_out_time || data.attendances[existingIndex].check_out_time,
        memo: body.memo || data.attendances[existingIndex].memo,
        updated_at: now,
      };
      data.attendances[existingIndex] = newAttendance;
    } else {
      // 새 출결 기록 생성
      const newId = `att-${Date.now()}`;
      newAttendance = {
        id: newId,
        student_id: body.student_id,
        student_name: student.name,
        class_id: body.class_id,
        class_name: classInfo.name,
        academy_id: student.academy_id || 'academy-001',
        date: body.date,
        status: body.status,
        check_in_time: body.check_in_time || null,
        check_out_time: body.check_out_time || null,
        memo: body.memo || null,
        sms_sent: false,
        sms_sent_at: null,
        created_by: 'teacher-001', // TODO: 실제 로그인 사용자 ID
        created_at: now,
        updated_at: now,
      };
      data.attendances.push(newAttendance);
    }

    // SMS 발송 처리 (Mock)
    if (body.send_sms && (body.status === 'absent' || body.status === 'late')) {
      newAttendance.sms_sent = true;
      newAttendance.sms_sent_at = now;
      // TODO: 실제 SMS 발송 연동
      console.log(`SMS 발송: ${student.name} 학생 ${body.status === 'absent' ? '결석' : '지각'} 알림`);
    }

    // 파일에 저장
    await writeAttendanceData(data);

    return NextResponse.json({
      success: true,
      data: newAttendance,
      message: existingIndex >= 0
        ? '출결 기록이 수정되었습니다.'
        : '출결 기록이 등록되었습니다.',
    });
  } catch (error) {
    console.error('출결 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: '출결 기록을 등록하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
