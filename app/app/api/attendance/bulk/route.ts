import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Attendance,
  BulkAttendanceInput,
  BulkAttendanceResponse,
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
 * POST /api/attendance/bulk
 * 반 전체 출결을 일괄 등록합니다.
 *
 * Request Body: BulkAttendanceInput
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkAttendanceInput = await request.json();

    // 필수 필드 검증
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

    if (!body.attendances || body.attendances.length === 0) {
      return NextResponse.json(
        { success: false, error: '출결 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readAttendanceData();

    // 반 정보 조회
    const classInfo = data.classes.find((c: { id: string }) => c.id === body.class_id);
    if (!classInfo) {
      return NextResponse.json(
        { success: false, error: '해당 반을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    let smsSentCount = 0;

    // 각 학생의 출결 처리
    for (const attendanceInput of body.attendances) {
      // 학생 정보 조회
      const student = data.students.find((s: { id: string }) => s.id === attendanceInput.student_id);
      if (!student) {
        console.warn(`학생 ID ${attendanceInput.student_id}를 찾을 수 없습니다.`);
        continue;
      }

      // 기존 출결 기록 확인
      const existingIndex = data.attendances.findIndex(
        (a: Attendance) =>
          a.student_id === attendanceInput.student_id &&
          a.date === body.date &&
          a.class_id === body.class_id
      );

      let newAttendance: Attendance;

      if (existingIndex >= 0) {
        // 기존 기록 업데이트
        newAttendance = {
          ...data.attendances[existingIndex],
          status: attendanceInput.status,
          check_in_time: attendanceInput.check_in_time || data.attendances[existingIndex].check_in_time,
          memo: attendanceInput.memo || data.attendances[existingIndex].memo,
          updated_at: now,
        };
        data.attendances[existingIndex] = newAttendance;
        updatedCount++;
      } else {
        // 새 출결 기록 생성
        const newId = `att-${Date.now()}-${attendanceInput.student_id.slice(-3)}`;
        newAttendance = {
          id: newId,
          student_id: attendanceInput.student_id,
          student_name: student.name,
          class_id: body.class_id,
          class_name: classInfo.name,
          academy_id: student.academy_id || 'academy-001',
          date: body.date,
          status: attendanceInput.status,
          check_in_time: attendanceInput.check_in_time || null,
          check_out_time: null,
          memo: attendanceInput.memo || null,
          sms_sent: false,
          sms_sent_at: null,
          created_by: 'teacher-001', // TODO: 실제 로그인 사용자 ID
          created_at: now,
          updated_at: now,
        };
        data.attendances.push(newAttendance);
        createdCount++;
      }

      // SMS 발송 처리 (결석/지각 학생에게)
      if (body.send_sms_for_absent) {
        const needsSms = attendanceInput.status === 'absent' || attendanceInput.status === 'late';
        if (needsSms && !newAttendance.sms_sent) {
          // 기존 기록인 경우 인덱스로 찾아서 업데이트
          if (existingIndex >= 0) {
            data.attendances[existingIndex].sms_sent = true;
            data.attendances[existingIndex].sms_sent_at = now;
          } else {
            // 새로 추가된 기록의 경우
            const addedIndex = data.attendances.findIndex((a: Attendance) => a.id === newAttendance.id);
            if (addedIndex >= 0) {
              data.attendances[addedIndex].sms_sent = true;
              data.attendances[addedIndex].sms_sent_at = now;
            }
          }
          smsSentCount++;
          // TODO: 실제 SMS 발송 연동
          console.log(`SMS 발송: ${student.name} 학생 ${attendanceInput.status === 'absent' ? '결석' : '지각'} 알림`);
        }
      }
    }

    // 파일에 저장
    await writeAttendanceData(data);

    const response: BulkAttendanceResponse = {
      success: true,
      data: {
        created_count: createdCount,
        updated_count: updatedCount,
        sms_sent_count: smsSentCount,
      },
      message: `출결 등록 완료: 신규 ${createdCount}건, 수정 ${updatedCount}건${smsSentCount > 0 ? `, SMS ${smsSentCount}건 발송` : ''}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('일괄 출결 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: '일괄 출결을 등록하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
