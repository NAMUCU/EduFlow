/**
 * 상담 API - 목록 조회 및 예약
 *
 * GET /api/consultations - 상담 목록 조회 (필터: 상태, 유형, 날짜 등)
 * POST /api/consultations - 상담 예약
 */

import { NextRequest, NextResponse } from 'next/server';
import consultationsData from '@/data/consultations.json';
import {
  ConsultationListItem,
  ConsultationListResponse,
  ConsultationMutationResponse,
  CreateConsultationInput,
  ConsultationStatsResponse,
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
 * GET /api/consultations
 * 상담 목록 조회 (필터링 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') as ConsultationType | '';
    const status = searchParams.get('status') as ConsultationStatus | '';
    const studentId = searchParams.get('studentId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const getStats = searchParams.get('stats') === 'true';

    // 통계 요청인 경우
    if (getStats) {
      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const stats = {
        total: consultations.length,
        scheduled: consultations.filter(c => c.status === 'scheduled').length,
        completed: consultations.filter(c => c.status === 'completed').length,
        cancelled: consultations.filter(c => c.status === 'cancelled').length,
        thisMonth: consultations.filter(c => new Date(c.date) >= thisMonthStart).length,
        thisWeek: consultations.filter(c => new Date(c.date) >= thisWeekStart).length,
        byType: {
          in_person: consultations.filter(c => c.type === 'in_person').length,
          phone: consultations.filter(c => c.type === 'phone').length,
          video: consultations.filter(c => c.type === 'video').length,
        },
      };

      const response: ConsultationStatsResponse = {
        success: true,
        data: stats,
      };

      return NextResponse.json(response);
    }

    // 필터링
    let filteredConsultations = consultations.filter((consultation) => {
      // 검색어 필터 (학생 이름, 주제)
      if (search) {
        const searchLower = search.toLowerCase();
        const student = students[consultation.studentId];
        const matchStudentName = student?.name?.toLowerCase().includes(searchLower);
        const matchTopic = consultation.topic.toLowerCase().includes(searchLower);
        const matchNotes = consultation.notes?.toLowerCase().includes(searchLower);
        if (!matchStudentName && !matchTopic && !matchNotes) {
          return false;
        }
      }

      // 유형 필터
      if (type && consultation.type !== type) {
        return false;
      }

      // 상태 필터
      if (status && consultation.status !== status) {
        return false;
      }

      // 학생 ID 필터
      if (studentId && consultation.studentId !== studentId) {
        return false;
      }

      // 날짜 범위 필터
      if (dateFrom && consultation.date < dateFrom) {
        return false;
      }
      if (dateTo && consultation.date > dateTo) {
        return false;
      }

      return true;
    });

    // 날짜 기준 내림차순 정렬 (최신순)
    filteredConsultations.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeB.getTime() - dateTimeA.getTime();
    });

    // 전체 개수
    const total = filteredConsultations.length;

    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const paginatedConsultations = filteredConsultations.slice(startIndex, startIndex + pageSize);

    // ConsultationListItem 형태로 변환
    const consultationList: ConsultationListItem[] = paginatedConsultations.map(toListItem);

    const response: ConsultationListResponse = {
      success: true,
      data: {
        consultations: consultationList,
        total,
        page,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('상담 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/consultations
 * 상담 예약
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateConsultationInput = await request.json();

    // 필수 필드 검증
    if (!body.studentId || !body.date || !body.time || !body.type || !body.topic) {
      return NextResponse.json(
        { success: false, error: '학생, 날짜, 시간, 유형, 주제는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 학생 존재 여부 확인
    const student = students[body.studentId];
    if (!student) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 학생입니다.' },
        { status: 400 }
      );
    }

    // 날짜/시간 유효성 검증
    const consultationDateTime = new Date(`${body.date}T${body.time}`);
    if (isNaN(consultationDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 날짜 또는 시간입니다.' },
        { status: 400 }
      );
    }

    // 중복 예약 확인 (같은 날짜, 시간에 이미 예약이 있는지)
    const existingConsultation = consultations.find(
      (c) => c.date === body.date && c.time === body.time && c.status === 'scheduled'
    );
    if (existingConsultation) {
      return NextResponse.json(
        { success: false, error: '해당 시간에 이미 예약된 상담이 있습니다.' },
        { status: 400 }
      );
    }

    // 새 상담 ID 생성
    const maxId = consultations.reduce((max, c) => {
      const num = parseInt(c.id.replace('CONS', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `CONS${String(maxId + 1).padStart(3, '0')}`;

    // 학부모 ID 설정 (제공되지 않으면 학생 ID 기반으로 추정)
    const parentId = body.parentId || `PAR${body.studentId.replace('STU', '')}`;

    // 새 상담 객체 생성
    const newConsultation: ConsultationRecord = {
      id: newId,
      studentId: body.studentId,
      parentId: parentId,
      teacherId: body.teacherId || 'TCH001',
      date: body.date,
      time: body.time,
      duration: body.duration || 30,
      type: body.type,
      topic: body.topic,
      notes: body.notes || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 메모리에 추가
    consultations.push(newConsultation);

    const response: ConsultationMutationResponse = {
      success: true,
      data: toListItem(newConsultation),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('상담 예약 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 예약에 실패했습니다.' },
      { status: 500 }
    );
  }
}
