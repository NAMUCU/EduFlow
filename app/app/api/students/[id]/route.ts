/**
 * 학생 상세 API - 조회, 수정, 삭제
 *
 * GET /api/students/[id] - 학생 상세 조회
 * PUT /api/students/[id] - 학생 정보 수정
 * DELETE /api/students/[id] - 학생 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import studentsData from '@/data/students.json';
import {
  StudentDetail,
  StudentDetailResponse,
  StudentMutationResponse,
  StudentDeleteResponse,
  UpdateStudentInput,
  StudentStatus,
  GradeSummary,
  AssignmentStats,
  AttendanceStats,
} from '@/types/student';

// JSON 데이터를 메모리에 저장 (실제 환경에서는 DB 사용)
let students = [...studentsData.students];
const gradesData = studentsData.grades as Record<string, Array<{
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  examType: string;
}>>;
const attendanceData = studentsData.attendance as Record<string, Array<{
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  note?: string;
}>>;
const consultationsData = studentsData.consultations as Record<string, Array<{
  id: string;
  date: string;
  type: string;
  duration: number;
  topic: string;
  notes: string;
  status: string;
}>>;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]
 * 학생 상세 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const student = students.find((s) => s.id === id);

    if (!student) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 성적 데이터 조회
    const studentGrades = gradesData[id] || [];
    const gradeSummary = calculateGradeSummary(studentGrades);

    // 출결 데이터 조회
    const studentAttendance = attendanceData[id] || [];
    const attendanceStats = calculateAttendanceStats(studentAttendance);

    // 상담 데이터 조회
    const studentConsultations = consultationsData[id] || [];

    // 과제 통계 (목업 데이터)
    const assignmentStats: AssignmentStats = {
      total: 12,
      completed: 10,
      inProgress: 1,
      notStarted: 1,
      averageScore: student.averageScore || 0,
      completionRate: 83,
    };

    const studentDetail: StudentDetail = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      grade: student.grade,
      school: student.school,
      className: student.className,
      subjects: student.subjects,
      status: student.status as StudentStatus,
      averageScore: student.averageScore || undefined,
      enrolledAt: student.enrolledAt,
      memo: student.memo,
      parent: {
        name: student.parent.name,
        phone: student.parent.phone,
        email: student.parent.email,
        relationship: student.parent.relationship as '부' | '모' | '조부' | '조모' | '기타',
      },
      // 통계 요약 (UI용)
      stats: {
        averageScore: student.averageScore || 0,
        trend: 'stable' as const,
        completedAssignments: assignmentStats.completed,
        totalAssignments: assignmentStats.total,
        attendanceRate: attendanceStats.attendanceRate,
        studyHours: 12, // Mock
      },
      grades: gradeSummary,
      recentGrades: studentGrades.slice(0, 5).map((g) => ({
        id: `${id}-${g.date}-${g.subject}`,
        student_id: id,
        subject: g.subject,
        unit: null,
        score: g.score,
        max_score: g.maxScore,
        exam_type: g.examType,
        date: g.date,
        memo: null,
        created_at: g.date,
        updated_at: g.date,
      })),
      assignmentStats,
      recentAssignments: [],
      attendanceStats,
      recentAttendance: studentAttendance.slice(0, 10).map((a, idx) => ({
        id: `${id}-${a.date}-${idx}`,
        student_id: id,
        date: a.date,
        status: a.status as 'present' | 'absent' | 'late' | 'early_leave',
        check_in_time: a.checkInTime || null,
        check_out_time: a.checkOutTime || null,
        note: a.note || null,
        created_at: a.date,
        updated_at: a.date,
      })),
      consultations: studentConsultations.map((c) => ({
        id: c.id,
        parent_id: student.parent.name,
        teacher_id: 'TEACHER001',
        student_id: id,
        type: c.type as 'in_person' | 'phone' | 'video',
        date: c.date,
        duration: c.duration,
        topic: c.topic,
        notes: c.notes,
        status: c.status as 'scheduled' | 'completed' | 'cancelled',
        created_at: c.date,
        updated_at: c.date,
      })),
    };

    const response: StudentDetailResponse = {
      success: true,
      data: studentDetail,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학생 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students/[id]
 * 학생 정보 수정
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateStudentInput = await request.json();

    const studentIndex = students.findIndex((s) => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 학생 정보 업데이트
    const existingStudent = students[studentIndex];
    const updatedStudent = {
      ...existingStudent,
      ...(body.name && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.grade && { grade: body.grade }),
      ...(body.school && { school: body.school }),
      ...(body.className !== undefined && { className: body.className }),
      ...(body.subjects && { subjects: body.subjects }),
      ...(body.memo !== undefined && { memo: body.memo }),
      ...(body.status && { status: body.status }),
      ...(body.parent && {
        parent: {
          ...existingStudent.parent,
          ...(body.parent.name && { name: body.parent.name }),
          ...(body.parent.phone && { phone: body.parent.phone }),
          ...(body.parent.email !== undefined && { email: body.parent.email }),
          ...(body.parent.relationship && { relationship: body.parent.relationship }),
        },
      }),
    };

    students[studentIndex] = updatedStudent;

    const response: StudentMutationResponse = {
      success: true,
      data: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        grade: updatedStudent.grade,
        school: updatedStudent.school,
        className: updatedStudent.className,
        subjects: updatedStudent.subjects,
        status: updatedStudent.status as StudentStatus,
        averageScore: updatedStudent.averageScore || undefined,
        enrolledAt: updatedStudent.enrolledAt,
        memo: updatedStudent.memo,
        parent: {
          name: updatedStudent.parent.name,
          phone: updatedStudent.parent.phone,
          email: updatedStudent.parent.email,
          relationship: updatedStudent.parent.relationship as '부' | '모' | '조부' | '조모' | '기타',
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학생 정보 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생 정보 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[id]
 * 학생 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const studentIndex = students.findIndex((s) => s.id === id);

    if (studentIndex === -1) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 학생 삭제
    students.splice(studentIndex, 1);

    const response: StudentDeleteResponse = {
      success: true,
      message: '학생이 성공적으로 삭제되었습니다.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학생 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '학생 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 성적 요약 계산
 */
function calculateGradeSummary(grades: Array<{ subject: string; score: number; maxScore: number; date: string }>): GradeSummary[] {
  const subjectMap = new Map<string, number[]>();

  grades.forEach((grade) => {
    const scores = subjectMap.get(grade.subject) || [];
    scores.push((grade.score / grade.maxScore) * 100);
    subjectMap.set(grade.subject, scores);
  });

  const summaries: GradeSummary[] = [];

  subjectMap.forEach((scores, subject) => {
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const recentScore = scores[0];

    // 추이 계산
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (scores.length >= 2) {
      const diff = scores[0] - scores[scores.length - 1];
      if (diff > 5) trend = 'up';
      else if (diff < -5) trend = 'down';
    }

    summaries.push({
      subject,
      averageScore,
      recentScore,
      trend,
      totalTests: scores.length,
    });
  });

  return summaries;
}

/**
 * 출결 통계 계산
 */
function calculateAttendanceStats(attendance: Array<{ status: string }>): AttendanceStats {
  const totalDays = attendance.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let earlyLeave = 0;

  attendance.forEach((a) => {
    switch (a.status) {
      case 'present':
        present++;
        break;
      case 'absent':
        absent++;
        break;
      case 'late':
        late++;
        present++; // 지각도 출석으로 카운트
        break;
      case 'early_leave':
        earlyLeave++;
        present++; // 조퇴도 출석으로 카운트
        break;
    }
  });

  const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 100;

  return {
    totalDays,
    present,
    absent,
    late,
    earlyLeave,
    attendanceRate,
  };
}
