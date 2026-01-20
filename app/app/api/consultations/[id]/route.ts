/**
 * 상담 API - 상세 조회, 수정, 삭제
 *
 * GET /api/consultations/[id] - 상담 상세 조회
 * PUT /api/consultations/[id] - 상담 정보 수정
 * DELETE /api/consultations/[id] - 상담 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import consultationsData from '@/data/consultations.json';
import {
  ConsultationDetail,
  ConsultationDetailResponse,
  ConsultationMutationResponse,
  ConsultationDeleteResponse,
  UpdateConsultationInput,
  ConsultationListItem,
} from '@/types/consultation';
import { ConsultationType, ConsultationStatus } from '@/types/database';

// 타입 정의
interface ConsultationRecord {
  id: string;
  studentId: string;
  parentId: string;
  teacherId: string;
  date: string;
  time: string;
  duration: number;
  type: ConsultationType;
  topic: string;
  notes: string;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
}

interface StudentInfo {
  name: string;
  grade: string;
  school: string;
  className?: string;
}

interface ParentInfo {
  name: string;
  phone: string;
  email?: string;
}

interface TeacherInfo {
  name: string;
  subjects?: string[];
}

// JSON 데이터를 메모리에 저장 (실제 환경에서는 DB 사용)
let consultations: ConsultationRecord[] = [...consultationsData.consultations] as ConsultationRecord[];
const students: Record<string, StudentInfo> = consultationsData.students;
const parents: Record<string, ParentInfo> = consultationsData.parents;
const teachers: Record<string, TeacherInfo> = consultationsData.teachers;

/**
 * 상담 레코드를 상세 정보로 변환
 */
function toDetail(consultation: ConsultationRecord): ConsultationDetail {
  const student = students[consultation.studentId];
  const parent = parents[consultation.parentId];
  const teacher = teachers[consultation.teacherId];

  return {
    id: consultation.id,
    date: consultation.date,
    time: consultation.time,
    duration: consultation.duration,
    type: consultation.type,
    topic: consultation.topic,
    notes: consultation.notes || '',
    status: consultation.status,
    student: {
      id: consultation.studentId,
      name: student?.name || '알 수 없음',
      grade: student?.grade || '',
      school: student?.school || '',
      className: student?.className,
    },
    parent: {
      id: consultation.parentId,
      name: parent?.name || '알 수 없음',
      phone: parent?.phone || '',
      email: parent?.email,
    },
    teacher: teacher ? {
      id: consultation.teacherId,
      name: teacher.name,
      subjects: teacher.subjects,
    } : undefined,
    createdAt: consultation.createdAt,
    updatedAt: consultation.updatedAt,
  };
}

/**
 * 상담 레코드를 목록 아이템으로 변환
 */
function toListItem(consultation: ConsultationRecord): ConsultationListItem {
  const student = students[consultation.studentId];
  const parent = parents[consultation.parentId];
  const teacher = teachers[consultation.teacherId];

  return {
    id: consultation.id,
    date: consultation.date,
    time: consultation.time,
    duration: consultation.duration,
    type: consultation.type,
    topic: consultation.topic,
    status: consultation.status,
    studentName: student?.name || '알 수 없음',
    studentGrade: student?.grade,
    parentName: parent?.name || '알 수 없음',
    parentPhone: parent?.phone || '',
    teacherName: teacher?.name,
  };
}

/**
 * GET /api/consultations/[id]
 * 상담 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const consultation = consultations.find((c) => c.id === id);

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const response: ConsultationDetailResponse = {
      success: true,
      data: toDetail(consultation),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('상담 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/consultations/[id]
 * 상담 정보 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateConsultationInput = await request.json();

    const consultationIndex = consultations.findIndex((c) => c.id === id);

    if (consultationIndex === -1) {
      return NextResponse.json(
        { success: false, error: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const consultation = consultations[consultationIndex];

    // 이미 완료되거나 취소된 상담의 상태 변경 제한
    if (consultation.status === 'cancelled' && body.status !== undefined) {
      return NextResponse.json(
        { success: false, error: '취소된 상담은 수정할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 날짜/시간 변경 시 유효성 검증
    if (body.date || body.time) {
      const newDate = body.date || consultation.date;
      const newTime = body.time || consultation.time;
      const consultationDateTime = new Date(`${newDate}T${newTime}`);

      if (isNaN(consultationDateTime.getTime())) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 날짜 또는 시간입니다.' },
          { status: 400 }
        );
      }

      // 중복 예약 확인 (자기 자신 제외)
      if (body.date || body.time) {
        const existingConsultation = consultations.find(
          (c) =>
            c.id !== id &&
            c.date === newDate &&
            c.time === newTime &&
            c.status === 'scheduled'
        );
        if (existingConsultation) {
          return NextResponse.json(
            { success: false, error: '해당 시간에 이미 예약된 상담이 있습니다.' },
            { status: 400 }
          );
        }
      }
    }

    // 상담 정보 업데이트
    const updatedConsultation: ConsultationRecord = {
      ...consultation,
      date: body.date ?? consultation.date,
      time: body.time ?? consultation.time,
      duration: body.duration ?? consultation.duration,
      type: body.type ?? consultation.type,
      topic: body.topic ?? consultation.topic,
      notes: body.notes ?? consultation.notes,
      status: body.status ?? consultation.status,
      updatedAt: new Date().toISOString(),
    };

    consultations[consultationIndex] = updatedConsultation;

    const response: ConsultationMutationResponse = {
      success: true,
      data: toListItem(updatedConsultation),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('상담 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/consultations/[id]
 * 상담 삭제 (실제로는 취소 처리)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const consultationIndex = consultations.findIndex((c) => c.id === id);

    if (consultationIndex === -1) {
      return NextResponse.json(
        { success: false, error: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const consultation = consultations[consultationIndex];

    // 이미 완료된 상담은 삭제 불가
    if (consultation.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '완료된 상담은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 상담 취소 처리 (실제 삭제 대신)
    consultations[consultationIndex] = {
      ...consultation,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    const response: ConsultationDeleteResponse = {
      success: true,
      message: '상담이 취소되었습니다.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('상담 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
