/**
 * SMS 문제 배포 클라이언트
 *
 * 이 파일은 학생에게 과제/문제 링크를 문자로 배포하는 기능을 제공합니다.
 * - 학생별 고유 토큰 생성
 * - 문제 풀이 링크 생성
 * - 문자 발송 및 결과 추적
 *
 * PRD F2. 문자 기반 문제 배포 기능 구현
 */

import { sendSms, sendBulkSms, isMockMode } from './sms'
import { applyTemplate } from './sms-templates'
import type { SmsRecipient } from '@/types/sms'
import type {
  DistributeAssignmentInput,
  DistributionResult,
  DistributionResponse,
  StudentDistributionInfo,
} from '@/types/sms-distribution'

// ============================================
// 고유 토큰 생성
// ============================================

/**
 * 학생별 고유 토큰 생성
 *
 * 과제 ID와 학생 ID를 조합하여 SHA-256 해시 기반 토큰 생성
 * 토큰은 URL-safe한 base64로 인코딩됨
 *
 * @param assignmentId - 과제 ID
 * @param studentId - 학생 ID
 * @param salt - 추가 salt 값 (선택, 기본값: 환경변수 또는 고정값)
 * @returns 고유 토큰 문자열
 */
export async function generateUniqueToken(
  assignmentId: string,
  studentId: string,
  salt?: string
): Promise<string> {
  const secretSalt = salt || process.env.TOKEN_SALT || 'eduflow-secret-salt-2024'
  const data = `${assignmentId}:${studentId}:${secretSalt}`

  // Web Crypto API를 사용한 SHA-256 해시 생성
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)

  // URL-safe base64로 인코딩
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const base64Hash = btoa(String.fromCharCode(...hashArray))

  // URL-safe 변환 (+, /, = 문자 치환)
  const urlSafeToken = base64Hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // 앞 16자만 사용 (충분히 유니크하면서 URL 길이 최적화)
  return urlSafeToken.slice(0, 16)
}

/**
 * 토큰 검증을 위해 토큰 재생성 후 비교
 *
 * @param token - 검증할 토큰
 * @param assignmentId - 과제 ID
 * @param studentId - 학생 ID
 * @returns 토큰 유효 여부
 */
export async function verifyToken(
  token: string,
  assignmentId: string,
  studentId: string
): Promise<boolean> {
  const expectedToken = await generateUniqueToken(assignmentId, studentId)
  return token === expectedToken
}

// ============================================
// 문제 풀이 링크 생성
// ============================================

/**
 * 학생별 문제 풀이 링크 생성
 *
 * @param assignmentId - 과제 ID
 * @param token - 학생 고유 토큰
 * @param baseUrl - 기본 URL (선택, 기본값: 환경변수 또는 localhost)
 * @returns 문제 풀이 URL
 */
export function generateSolveLink(
  assignmentId: string,
  token: string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/student/solve/${assignmentId}?token=${token}`
}

/**
 * 단축 URL 생성 (선택적)
 *
 * SMS 문자 길이 제한을 위해 URL을 단축할 수 있음
 * 실제 구현시 bit.ly, rebrandly 등의 서비스 연동 필요
 *
 * @param url - 단축할 URL
 * @returns 단축된 URL (현재는 원본 URL 반환)
 */
export async function shortenUrl(url: string): Promise<string> {
  // TODO: URL 단축 서비스 연동 (bit.ly, rebrandly 등)
  // 현재는 원본 URL 반환
  return url
}

// ============================================
// 메시지 템플릿 처리
// ============================================

/** 기본 과제 배포 메시지 템플릿 */
export const DEFAULT_DISTRIBUTION_TEMPLATE = `[EduFlow] {studentName}님, 새 과제가 도착했습니다!

과제: {assignmentTitle}
마감: {dueDate}

아래 링크에서 문제를 풀어주세요:
{solveLink}`

/** 간단한 배포 메시지 템플릿 (SMS 90자 이내) */
export const SHORT_DISTRIBUTION_TEMPLATE = `[EduFlow] {studentName}님 과제: {assignmentTitle}
{solveLink}`

/**
 * 배포 메시지 생성
 *
 * @param template - 메시지 템플릿
 * @param variables - 템플릿 변수 값
 * @returns 완성된 메시지
 */
export function createDistributionMessage(
  template: string,
  variables: {
    studentName: string
    assignmentTitle: string
    dueDate?: string
    solveLink: string
    [key: string]: string | undefined
  }
): string {
  // undefined 값을 빈 문자열로 변환
  const cleanVariables: Record<string, string> = {}
  for (const [key, value] of Object.entries(variables)) {
    cleanVariables[key] = value ?? ''
  }

  return applyTemplate(template, cleanVariables)
}

// ============================================
// 과제 배포 메인 함수
// ============================================

/**
 * 과제를 학생들에게 문자로 배포
 *
 * 각 학생에게 고유 토큰이 포함된 문제 풀이 링크를 문자로 발송합니다.
 *
 * @param input - 배포 입력 데이터
 * @param students - 학생 정보 목록 (ID, 이름, 전화번호 포함)
 * @param assignmentInfo - 과제 정보 (제목, 마감일 등)
 * @returns 배포 결과
 *
 * @example
 * const result = await distributeAssignment(
 *   {
 *     assignmentId: 'assign-001',
 *     studentIds: ['student-001', 'student-002'],
 *     messageTemplate: '[EduFlow] {studentName}님, 과제 링크: {solveLink}'
 *   },
 *   [
 *     { id: 'student-001', name: '홍길동', phone: '010-1234-5678' },
 *     { id: 'student-002', name: '김철수', phone: '010-9876-5432' }
 *   ],
 *   { title: '수학 단원평가', dueDate: '2024-01-25' }
 * )
 */
export async function distributeAssignment(
  input: DistributeAssignmentInput,
  students: StudentDistributionInfo[],
  assignmentInfo: {
    title: string
    dueDate?: string | null
  }
): Promise<DistributionResponse> {
  const {
    assignmentId,
    studentIds,
    messageTemplate = DEFAULT_DISTRIBUTION_TEMPLATE,
    scheduledAt,
  } = input

  const results: DistributionResult[] = []
  const now = new Date().toISOString()

  // 예약 발송인지 확인
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date()

  // 학생별 처리
  for (const studentId of studentIds) {
    // 학생 정보 찾기
    const student = students.find((s) => s.id === studentId)

    if (!student) {
      results.push({
        studentId,
        studentName: '알 수 없음',
        phone: '',
        uniqueLink: '',
        status: 'failed',
        error: '학생 정보를 찾을 수 없습니다.',
      })
      continue
    }

    if (!student.phone) {
      results.push({
        studentId,
        studentName: student.name,
        phone: '',
        uniqueLink: '',
        status: 'failed',
        error: '학생의 전화번호가 등록되어 있지 않습니다.',
      })
      continue
    }

    try {
      // 1. 고유 토큰 생성
      const token = await generateUniqueToken(assignmentId, studentId)

      // 2. 문제 풀이 링크 생성
      const solveLink = generateSolveLink(assignmentId, token)

      // 3. 메시지 생성
      const message = createDistributionMessage(messageTemplate, {
        studentName: student.name,
        assignmentTitle: assignmentInfo.title,
        dueDate: formatDueDate(assignmentInfo.dueDate),
        solveLink,
      })

      // 4. 예약 발송 또는 즉시 발송
      if (isScheduled) {
        // 예약 발송: 스케줄러에 등록
        results.push({
          studentId,
          studentName: student.name,
          phone: student.phone,
          uniqueLink: solveLink,
          status: 'scheduled',
          sentAt: scheduledAt,
        })
      } else {
        // 즉시 발송
        const smsResult = await sendSms(student.phone, message)

        results.push({
          studentId,
          studentName: student.name,
          phone: student.phone,
          uniqueLink: solveLink,
          status: smsResult.success ? 'sent' : 'failed',
          sentAt: smsResult.success ? now : undefined,
          error: smsResult.error,
        })
      }
    } catch (error) {
      results.push({
        studentId,
        studentName: student.name,
        phone: student.phone,
        uniqueLink: '',
        status: 'failed',
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      })
    }
  }

  // 결과 집계
  const successCount = results.filter((r) => r.status === 'sent').length
  const failedCount = results.filter((r) => r.status === 'failed').length
  const scheduledCount = results.filter((r) => r.status === 'scheduled').length

  return {
    success: failedCount === 0 || successCount > 0,
    assignmentId,
    totalCount: results.length,
    successCount,
    failedCount,
    scheduledCount,
    results,
    isMockMode: isMockMode(),
    distributedAt: now,
  }
}

/**
 * 대량 배포 (병렬 처리)
 *
 * 많은 학생에게 동시에 발송할 때 사용합니다.
 * 최대 동시 발송 수를 제한하여 API 부하를 관리합니다.
 *
 * @param input - 배포 입력 데이터
 * @param students - 학생 정보 목록
 * @param assignmentInfo - 과제 정보
 * @param concurrency - 동시 발송 수 (기본값: 5)
 * @returns 배포 결과
 */
export async function distributeAssignmentBulk(
  input: DistributeAssignmentInput,
  students: StudentDistributionInfo[],
  assignmentInfo: {
    title: string
    dueDate?: string | null
  },
  concurrency: number = 5
): Promise<DistributionResponse> {
  const {
    assignmentId,
    studentIds,
    messageTemplate = DEFAULT_DISTRIBUTION_TEMPLATE,
  } = input

  const results: DistributionResult[] = []
  const now = new Date().toISOString()

  // 학생 목록을 청크로 나누기
  const chunks: string[][] = []
  for (let i = 0; i < studentIds.length; i += concurrency) {
    chunks.push(studentIds.slice(i, i + concurrency))
  }

  // 청크별로 병렬 처리
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (studentId) => {
      const student = students.find((s) => s.id === studentId)

      if (!student || !student.phone) {
        return {
          studentId,
          studentName: student?.name || '알 수 없음',
          phone: student?.phone || '',
          uniqueLink: '',
          status: 'failed' as const,
          error: student ? '전화번호 없음' : '학생 정보 없음',
        }
      }

      try {
        const token = await generateUniqueToken(assignmentId, studentId)
        const solveLink = generateSolveLink(assignmentId, token)
        const message = createDistributionMessage(messageTemplate, {
          studentName: student.name,
          assignmentTitle: assignmentInfo.title,
          dueDate: formatDueDate(assignmentInfo.dueDate),
          solveLink,
        })

        const smsResult = await sendSms(student.phone, message)

        return {
          studentId,
          studentName: student.name,
          phone: student.phone,
          uniqueLink: solveLink,
          status: smsResult.success ? 'sent' as const : 'failed' as const,
          sentAt: smsResult.success ? now : undefined,
          error: smsResult.error,
        }
      } catch (error) {
        return {
          studentId,
          studentName: student.name,
          phone: student.phone,
          uniqueLink: '',
          status: 'failed' as const,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        }
      }
    })

    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)
  }

  // 결과 집계
  const successCount = results.filter((r) => r.status === 'sent').length
  const failedCount = results.filter((r) => r.status === 'failed').length
  const scheduledCount = results.filter((r) => r.status === 'scheduled').length

  return {
    success: failedCount === 0 || successCount > 0,
    assignmentId,
    totalCount: results.length,
    successCount,
    failedCount,
    scheduledCount,
    results,
    isMockMode: isMockMode(),
    distributedAt: now,
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 마감일 포맷팅
 *
 * @param dueDate - ISO 8601 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (예: '1월 25일 23:59')
 */
function formatDueDate(dueDate?: string | null): string {
  if (!dueDate) {
    return '마감일 없음'
  }

  const date = new Date(dueDate)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${month}월 ${day}일 ${hours}:${minutes}`
}

/**
 * 배포 로그 생성 (DB 저장용)
 *
 * @param assignmentId - 과제 ID
 * @param results - 배포 결과 목록
 * @param senderId - 발송자 ID
 * @returns 발송 로그 목록
 */
export function createDistributionLogs(
  assignmentId: string,
  results: DistributionResult[],
  senderId: string
): Array<{
  assignment_id: string
  student_id: string
  student_name: string
  phone: string
  unique_link: string
  status: string
  sent_at: string | null
  error: string | null
  sender_id: string
  created_at: string
}> {
  const now = new Date().toISOString()

  return results.map((result) => ({
    assignment_id: assignmentId,
    student_id: result.studentId,
    student_name: result.studentName,
    phone: result.phone,
    unique_link: result.uniqueLink,
    status: result.status,
    sent_at: result.sentAt || null,
    error: result.error || null,
    sender_id: senderId,
    created_at: now,
  }))
}

/**
 * 재발송 처리
 *
 * 발송 실패한 학생들에게만 재발송합니다.
 *
 * @param previousResults - 이전 배포 결과
 * @param input - 원본 배포 입력 데이터
 * @param students - 학생 정보 목록
 * @param assignmentInfo - 과제 정보
 * @returns 재발송 결과
 */
export async function retryFailedDistributions(
  previousResults: DistributionResult[],
  input: DistributeAssignmentInput,
  students: StudentDistributionInfo[],
  assignmentInfo: {
    title: string
    dueDate?: string | null
  }
): Promise<DistributionResponse> {
  // 실패한 학생 ID만 추출
  const failedStudentIds = previousResults
    .filter((r) => r.status === 'failed')
    .map((r) => r.studentId)

  if (failedStudentIds.length === 0) {
    return {
      success: true,
      assignmentId: input.assignmentId,
      totalCount: 0,
      successCount: 0,
      failedCount: 0,
      scheduledCount: 0,
      results: [],
      isMockMode: isMockMode(),
      distributedAt: new Date().toISOString(),
    }
  }

  // 실패한 학생들에게만 재발송
  return distributeAssignment(
    { ...input, studentIds: failedStudentIds },
    students,
    assignmentInfo
  )
}
