import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Attendance,
  AttendanceUpdateInput,
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
 * GET /api/attendance/[id]
 * 특정 출결 기록을 조회합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const data = await readAttendanceData();

    // 출결 기록 찾기
    const attendance = data.attendances.find((a: Attendance) => a.id === id);

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: '해당 출결 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('출결 기록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '출결 기록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/attendance/[id]
 * 특정 출결 기록을 수정합니다.
 *
 * Request Body: AttendanceUpdateInput
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: AttendanceUpdateInput = await request.json();

    // 데이터 로드
    const data = await readAttendanceData();

    // 출결 기록 찾기
    const attendanceIndex = data.attendances.findIndex((a: Attendance) => a.id === id);

    if (attendanceIndex === -1) {
      return NextResponse.json(
        { success: false, error: '해당 출결 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingAttendance: Attendance = data.attendances[attendanceIndex];
    const now = new Date().toISOString();

    // 출결 기록 업데이트
    const updatedAttendance: Attendance = {
      ...existingAttendance,
      status: body.status !== undefined ? body.status : existingAttendance.status,
      check_in_time: body.check_in_time !== undefined ? body.check_in_time : existingAttendance.check_in_time,
      check_out_time: body.check_out_time !== undefined ? body.check_out_time : existingAttendance.check_out_time,
      memo: body.memo !== undefined ? body.memo : existingAttendance.memo,
      updated_at: now,
    };

    // SMS 발송 처리 (Mock)
    if (body.send_sms && updatedAttendance.status) {
      const needsSms = updatedAttendance.status === 'absent' || updatedAttendance.status === 'late';
      if (needsSms && !updatedAttendance.sms_sent) {
        updatedAttendance.sms_sent = true;
        updatedAttendance.sms_sent_at = now;
        // TODO: 실제 SMS 발송 연동
        console.log(`SMS 발송: ${updatedAttendance.student_name} 학생 출결 상태 변경 알림`);
      }
    }

    data.attendances[attendanceIndex] = updatedAttendance;

    // 파일에 저장
    await writeAttendanceData(data);

    return NextResponse.json({
      success: true,
      data: updatedAttendance,
      message: '출결 기록이 수정되었습니다.',
    });
  } catch (error) {
    console.error('출결 기록 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '출결 기록을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendance/[id]
 * 특정 출결 기록을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const data = await readAttendanceData();

    // 출결 기록 찾기
    const attendanceIndex = data.attendances.findIndex((a: Attendance) => a.id === id);

    if (attendanceIndex === -1) {
      return NextResponse.json(
        { success: false, error: '해당 출결 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제할 기록 정보
    const deletedAttendance: Attendance = data.attendances[attendanceIndex];

    // 배열에서 삭제
    data.attendances.splice(attendanceIndex, 1);

    // 파일에 저장
    await writeAttendanceData(data);

    return NextResponse.json({
      success: true,
      message: `${deletedAttendance.student_name} 학생의 ${deletedAttendance.date} 출결 기록이 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('출결 기록 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '출결 기록을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
