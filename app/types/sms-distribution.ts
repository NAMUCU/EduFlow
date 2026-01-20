/**
 * SMS 문제 배포 관련 타입 정의
 *
 * PRD F2. 문자 기반 문제 배포 기능에 필요한 타입을 정의합니다.
 */

// ============================================
// 배포 입력 타입
// ============================================

/**
 * 과제 배포 입력 데이터
 */
export interface DistributeAssignmentInput {
  /** 배포할 과제 ID */
  assignmentId: string

  /** 배포 대상 학생 ID 목록 */
  studentIds: string[]

  /**
   * 발송 메시지 템플릿
   *
   * 사용 가능한 변수:
   * - {studentName}: 학생 이름
   * - {assignmentTitle}: 과제 제목
   * - {dueDate}: 마감일
   * - {solveLink}: 문제 풀이 링크
   *
   * @example "[EduFlow] {studentName}님, 과제 링크: {solveLink}"
   */
  messageTemplate?: string

  /**
   * 예약 발송 시간 (ISO 8601 형식)
   *
   * 설정하지 않으면 즉시 발송됩니다.
   *
   * @example "2024-01-25T09:00:00+09:00"
   */
  scheduledAt?: string
}

// ============================================
// 배포 결과 타입
// ============================================

/** 배포 상태 */
export type DistributionStatus = 'sent' | 'failed' | 'scheduled'

/**
 * 개별 학생 배포 결과
 */
export interface DistributionResult {
  /** 학생 ID */
  studentId: string

  /** 학생 이름 */
  studentName: string

  /** 학생 전화번호 */
  phone: string

  /** 학생별 고유 문제 풀이 링크 */
  uniqueLink: string

  /** 발송 상태 */
  status: DistributionStatus

  /** 발송 시각 (ISO 8601 형식) - 성공 또는 예약 시 */
  sentAt?: string

  /** 에러 메시지 (실패 시) */
  error?: string
}

/**
 * 전체 배포 응답
 */
export interface DistributionResponse {
  /** 성공 여부 (최소 1명 이상 성공시 true) */
  success: boolean

  /** 과제 ID */
  assignmentId: string

  /** 전체 대상 학생 수 */
  totalCount: number

  /** 발송 성공 수 */
  successCount: number

  /** 발송 실패 수 */
  failedCount: number

  /** 예약 발송 수 */
  scheduledCount: number

  /** 개별 결과 목록 */
  results: DistributionResult[]

  /** Mock 모드 여부 (테스트 발송) */
  isMockMode: boolean

  /** 배포 처리 시각 */
  distributedAt: string
}

// ============================================
// 학생 정보 타입
// ============================================

/**
 * 배포에 필요한 학생 정보
 */
export interface StudentDistributionInfo {
  /** 학생 ID */
  id: string

  /** 학생 이름 */
  name: string

  /** 학생 전화번호 (필수) */
  phone: string

  /** 학부모 전화번호 (선택적 - 학부모에게도 발송 시 사용) */
  parentPhone?: string
}

// ============================================
// API 요청/응답 타입
// ============================================

/**
 * POST /api/assignments/distribute 요청 바디
 */
export interface DistributeAssignmentRequest {
  /** 과제 ID */
  assignmentId: string

  /**
   * 배포 대상 학생 ID 목록
   *
   * 빈 배열이면 과제에 배정된 전체 학생에게 발송
   */
  studentIds?: string[]

  /** 메시지 템플릿 (선택) */
  messageTemplate?: string

  /** 예약 발송 시간 (선택) */
  scheduledAt?: string

  /** 학부모에게도 발송 여부 (선택, 기본값: false) */
  sendToParent?: boolean
}

/**
 * POST /api/assignments/distribute 응답
 */
export interface DistributeAssignmentApiResponse {
  /** 성공 여부 */
  success: boolean

  /** 배포 결과 */
  data?: DistributionResponse

  /** 에러 메시지 (실패 시) */
  error?: string
}

// ============================================
// 배포 로그 타입 (DB 저장용)
// ============================================

/**
 * 배포 로그 데이터
 */
export interface DistributionLog {
  /** 로그 ID */
  id: string

  /** 과제 ID */
  assignmentId: string

  /** 학생 ID */
  studentId: string

  /** 학생 이름 */
  studentName: string

  /** 발송 전화번호 */
  phone: string

  /** 고유 링크 */
  uniqueLink: string

  /** 발송 상태 */
  status: DistributionStatus

  /** 발송 시각 */
  sentAt: string | null

  /** 에러 메시지 */
  error: string | null

  /** 발송자 ID */
  senderId: string

  /** 생성 시각 */
  createdAt: string
}

/**
 * 배포 로그 삽입용 타입
 */
export type DistributionLogInsert = Omit<DistributionLog, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: string
}

// ============================================
// 토큰 검증 타입
// ============================================

/**
 * 토큰 검증 결과
 */
export interface TokenVerificationResult {
  /** 유효 여부 */
  isValid: boolean

  /** 과제 ID */
  assignmentId?: string

  /** 학생 ID */
  studentId?: string

  /** 에러 메시지 (무효시) */
  error?: string
}

// ============================================
// 한국어 라벨 상수
// ============================================

/** 배포 상태 한국어 라벨 */
export const DISTRIBUTION_STATUS_LABELS: Record<DistributionStatus, string> = {
  sent: '발송 완료',
  failed: '발송 실패',
  scheduled: '예약됨',
}

/** 배포 상태 색상 클래스 */
export const DISTRIBUTION_STATUS_COLORS: Record<DistributionStatus, string> = {
  sent: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  scheduled: 'text-blue-600 bg-blue-100',
}
