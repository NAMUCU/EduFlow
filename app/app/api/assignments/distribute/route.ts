/**
 * POST /api/assignments/distribute
 *
 * 과제를 학생들에게 문자로 배포하는 API
 *
 * PRD F2. 문자 기반 문제 배포 기능 구현
 *
 * 기능:
 * - 과제에 배정된 학생들에게 고유 링크가 포함된 문자 발송
 * - 학생별 고유 토큰 생성 (과제ID + 학생ID 조합 해시)
 * - 발송 결과 로깅
 * - 예약 발송 지원
 *
 * 입력:
 * - assignmentId: 과제 ID (필수)
 * - studentIds: 학생 ID 목록 (선택, 빈 배열이면 과제에 배정된 전체 학생)
 * - messageTemplate: 메시지 템플릿 (선택)
 * - scheduledAt: 예약 발송 시간 (선택)
 * - sendToParent: 학부모에게도 발송 여부 (선택)
 *
 * 출력:
 * - 발송 결과 (성공/실패 학생 목록)
 */

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import {
  distributeAssignment,
  distributeAssignmentBulk,
  createDistributionLogs,
} from '@/lib/sms-sender'
import type {
  DistributeAssignmentRequest,
  DistributeAssignmentApiResponse,
  StudentDistributionInfo,
} from '@/types/sms-distribution'

// 데이터 파일 경로 (개발/테스트용)
const ASSIGNMENTS_DATA_PATH = path.join(process.cwd(), 'data', 'assignments.json')
const STUDENTS_DATA_PATH = path.join(process.cwd(), 'data', 'students.json')
const DISTRIBUTION_LOGS_PATH = path.join(process.cwd(), 'data', 'distribution-logs.json')

// ============================================
// 데이터 파일 읽기/쓰기 헬퍼
// ============================================

interface AssignmentData {
  id: string
  title: string
  description: string | null
  due_date: string | null
  problems: string[]
  is_active: boolean
}

interface StudentAssignmentData {
  assignment_id: string
  student_id: string
  student_name: string
}

interface StudentData {
  id: string
  name: string
  phone?: string
  parent_phone?: string
}

interface AssignmentsFileData {
  assignments: AssignmentData[]
  student_assignments: StudentAssignmentData[]
  students: StudentData[]
}

/**
 * 과제 데이터 파일 읽기
 */
async function readAssignmentsData(): Promise<AssignmentsFileData> {
  try {
    const data = await fs.readFile(ASSIGNMENTS_DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('과제 데이터 파일 읽기 오류:', error)
    return { assignments: [], student_assignments: [], students: [] }
  }
}

/**
 * 학생 데이터 파일 읽기 (별도 파일이 있는 경우)
 */
async function readStudentsData(): Promise<StudentData[]> {
  try {
    const data = await fs.readFile(STUDENTS_DATA_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    return parsed.students || parsed || []
  } catch {
    // 학생 데이터가 없으면 과제 데이터에서 가져옴
    const assignmentsData = await readAssignmentsData()
    return assignmentsData.students || []
  }
}

/**
 * 배포 로그 저장
 */
async function saveDistributionLogs(logs: unknown[]): Promise<void> {
  try {
    let existingLogs: unknown[] = []

    try {
      const data = await fs.readFile(DISTRIBUTION_LOGS_PATH, 'utf-8')
      existingLogs = JSON.parse(data)
    } catch {
      // 파일이 없으면 새로 생성
      existingLogs = []
    }

    const allLogs = [...existingLogs, ...logs]
    await fs.writeFile(
      DISTRIBUTION_LOGS_PATH,
      JSON.stringify(allLogs, null, 2),
      'utf-8'
    )
  } catch (error) {
    console.error('배포 로그 저장 오류:', error)
    // 로그 저장 실패는 발송 실패로 처리하지 않음
  }
}

// ============================================
// POST 핸들러
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱
    const body: DistributeAssignmentRequest = await request.json()
    const {
      assignmentId,
      studentIds,
      messageTemplate,
      scheduledAt,
      sendToParent = false,
    } = body

    // 2. 필수 파라미터 검증
    if (!assignmentId) {
      return NextResponse.json<DistributeAssignmentApiResponse>(
        {
          success: false,
          error: '과제 ID는 필수입니다.',
        },
        { status: 400 }
      )
    }

    // 3. 과제 데이터 조회
    const assignmentsData = await readAssignmentsData()
    const assignment = assignmentsData.assignments.find(
      (a) => a.id === assignmentId
    )

    if (!assignment) {
      return NextResponse.json<DistributeAssignmentApiResponse>(
        {
          success: false,
          error: '존재하지 않는 과제입니다.',
        },
        { status: 404 }
      )
    }

    // 4. 대상 학생 목록 결정
    let targetStudentIds: string[]

    if (studentIds && studentIds.length > 0) {
      // 지정된 학생 ID 사용
      targetStudentIds = studentIds
    } else {
      // 과제에 배정된 전체 학생
      targetStudentIds = assignmentsData.student_assignments
        .filter((sa) => sa.assignment_id === assignmentId)
        .map((sa) => sa.student_id)
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json<DistributeAssignmentApiResponse>(
        {
          success: false,
          error: '배포 대상 학생이 없습니다.',
        },
        { status: 400 }
      )
    }

    // 5. 학생 정보 조회
    const studentsData = await readStudentsData()

    // 학생 정보를 StudentDistributionInfo 형태로 변환
    const students: StudentDistributionInfo[] = targetStudentIds.map((studentId) => {
      // 먼저 별도 학생 데이터에서 찾기
      let student = studentsData.find((s) => s.id === studentId)

      // 없으면 과제 데이터의 학생 목록에서 찾기
      if (!student && assignmentsData.students) {
        student = assignmentsData.students.find((s) => s.id === studentId)
      }

      // 그래도 없으면 student_assignments에서 이름만 가져오기
      if (!student) {
        const sa = assignmentsData.student_assignments.find(
          (sa) => sa.student_id === studentId
        )
        return {
          id: studentId,
          name: sa?.student_name || '알 수 없음',
          phone: '', // 전화번호 없음
        }
      }

      return {
        id: student.id,
        name: student.name,
        phone: student.phone || '',
        parentPhone: student.parent_phone,
      }
    })

    // 6. 과제 배포 실행
    const distributeInput = {
      assignmentId,
      studentIds: targetStudentIds,
      messageTemplate,
      scheduledAt,
    }

    const assignmentInfo = {
      title: assignment.title,
      dueDate: assignment.due_date,
    }

    // 학생 수에 따라 일반/대량 배포 선택
    const result =
      targetStudentIds.length > 10
        ? await distributeAssignmentBulk(distributeInput, students, assignmentInfo, 5)
        : await distributeAssignment(distributeInput, students, assignmentInfo)

    // 7. 학부모에게도 발송 (옵션)
    if (sendToParent) {
      // TODO: 학부모 발송 로직 구현
      // 학부모 전화번호가 있는 학생들에게 추가 발송
      console.log('학부모 발송 기능은 추후 구현 예정입니다.')
    }

    // 8. 발송 로그 저장
    const senderId = 'teacher-001' // TODO: 실제 로그인된 사용자 ID 사용
    const logs = createDistributionLogs(assignmentId, result.results, senderId)
    await saveDistributionLogs(logs)

    // 9. 응답 반환
    const response: DistributeAssignmentApiResponse = {
      success: result.success,
      data: result,
    }

    // 일부 실패가 있어도 200 반환 (결과에 실패 정보 포함)
    return NextResponse.json(response)
  } catch (error) {
    console.error('과제 배포 API 오류:', error)

    return NextResponse.json<DistributeAssignmentApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '과제 배포 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET 핸들러 - 배포 이력 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    // 배포 로그 읽기
    let logs: unknown[] = []

    try {
      const data = await fs.readFile(DISTRIBUTION_LOGS_PATH, 'utf-8')
      logs = JSON.parse(data)
    } catch {
      logs = []
    }

    // 특정 과제의 배포 이력만 필터링
    if (assignmentId) {
      logs = logs.filter((log: unknown) => {
        const typedLog = log as { assignment_id?: string }
        return typedLog.assignment_id === assignmentId
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total: logs.length,
      },
    })
  } catch (error) {
    console.error('배포 이력 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '배포 이력을 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
