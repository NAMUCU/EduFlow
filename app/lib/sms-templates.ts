/**
 * SMS 템플릿 관리
 *
 * 이 파일은 SMS 발송에 사용되는 템플릿을 정의합니다.
 * - 출결 알림
 * - 과제 알림
 * - 성적 알림
 * - 공지사항
 *
 * 템플릿 변수는 {변수명} 형식으로 사용합니다.
 */

import {
  SmsTemplate,
  SmsTemplateCategory,
  SmsTemplateVariable,
} from '@/types/sms'

// ============================================
// 템플릿 변수 정의
// ============================================

/** 공통 템플릿 변수 */
export const COMMON_VARIABLES: SmsTemplateVariable[] = [
  {
    key: 'studentName',
    label: '학생 이름',
    description: '학생의 이름',
    example: '홍길동',
  },
  {
    key: 'academyName',
    label: '학원 이름',
    description: '학원명',
    example: 'EduFlow 학원',
  },
]

/** 출결 관련 변수 */
export const ATTENDANCE_VARIABLES: SmsTemplateVariable[] = [
  ...COMMON_VARIABLES,
  {
    key: 'time',
    label: '시간',
    description: '출석/하원 시간',
    example: '14:30',
  },
  {
    key: 'date',
    label: '날짜',
    description: '출석 날짜',
    example: '2024년 1월 15일',
  },
  {
    key: 'status',
    label: '출결 상태',
    description: '출석/결석/지각/조퇴',
    example: '출석',
  },
]

/** 과제 관련 변수 */
export const ASSIGNMENT_VARIABLES: SmsTemplateVariable[] = [
  ...COMMON_VARIABLES,
  {
    key: 'assignmentTitle',
    label: '과제명',
    description: '과제 제목',
    example: '수학 단원평가',
  },
  {
    key: 'subject',
    label: '과목',
    description: '과목명',
    example: '수학',
  },
  {
    key: 'dueDate',
    label: '마감일',
    description: '과제 마감일',
    example: '2024년 1월 20일',
  },
  {
    key: 'problemCount',
    label: '문제 수',
    description: '과제에 포함된 문제 수',
    example: '10',
  },
]

/** 성적 관련 변수 */
export const GRADE_VARIABLES: SmsTemplateVariable[] = [
  ...COMMON_VARIABLES,
  {
    key: 'subject',
    label: '과목',
    description: '과목명',
    example: '수학',
  },
  {
    key: 'score',
    label: '점수',
    description: '획득 점수',
    example: '85',
  },
  {
    key: 'maxScore',
    label: '만점',
    description: '총점',
    example: '100',
  },
  {
    key: 'rank',
    label: '등급/순위',
    description: '성적 등급 또는 순위',
    example: '상위 10%',
  },
  {
    key: 'examType',
    label: '시험 유형',
    description: '시험 종류',
    example: '단원평가',
  },
]

/** 공지사항 변수 */
export const NOTICE_VARIABLES: SmsTemplateVariable[] = [
  ...COMMON_VARIABLES,
  {
    key: 'noticeTitle',
    label: '공지 제목',
    description: '공지사항 제목',
    example: '휴원 안내',
  },
  {
    key: 'noticeContent',
    label: '공지 내용',
    description: '공지사항 본문 (짧게)',
    example: '1월 25일~27일 설 연휴로 휴원합니다.',
  },
]

// ============================================
// 기본 템플릿 정의
// ============================================

/** 출결 알림 템플릿 */
export const ATTENDANCE_TEMPLATES: SmsTemplate[] = [
  {
    id: 'attendance_checkin',
    name: '출석 알림',
    category: 'attendance',
    content: '[EduFlow] {studentName}님이 {time}에 출석했습니다.',
    variables: ATTENDANCE_VARIABLES,
  },
  {
    id: 'attendance_checkout',
    name: '하원 알림',
    category: 'attendance',
    content: '[EduFlow] {studentName}님이 {time}에 하원했습니다.',
    variables: ATTENDANCE_VARIABLES,
  },
  {
    id: 'attendance_absent',
    name: '결석 알림',
    category: 'attendance',
    content: '[EduFlow] {studentName}님이 {date} 수업에 결석했습니다. 사유가 있으시면 학원으로 연락 부탁드립니다.',
    variables: ATTENDANCE_VARIABLES,
  },
  {
    id: 'attendance_late',
    name: '지각 알림',
    category: 'attendance',
    content: '[EduFlow] {studentName}님이 {time}에 지각하여 출석했습니다.',
    variables: ATTENDANCE_VARIABLES,
  },
  {
    id: 'attendance_early_leave',
    name: '조퇴 알림',
    category: 'attendance',
    content: '[EduFlow] {studentName}님이 {time}에 조퇴했습니다.',
    variables: ATTENDANCE_VARIABLES,
  },
]

/** 과제 알림 템플릿 */
export const ASSIGNMENT_TEMPLATES: SmsTemplate[] = [
  {
    id: 'assignment_new',
    name: '새 과제 알림',
    category: 'assignment',
    content: '[EduFlow] {studentName}님에게 새 과제가 배정되었습니다.\n과제: {assignmentTitle}\n마감: {dueDate}',
    variables: ASSIGNMENT_VARIABLES,
  },
  {
    id: 'assignment_reminder',
    name: '과제 마감 알림',
    category: 'assignment',
    content: '[EduFlow] {studentName}님, "{assignmentTitle}" 과제 마감이 {dueDate}입니다. 잊지 말고 제출해주세요!',
    variables: ASSIGNMENT_VARIABLES,
  },
  {
    id: 'assignment_submitted',
    name: '과제 제출 완료 알림',
    category: 'assignment',
    content: '[EduFlow] {studentName}님이 "{assignmentTitle}" 과제를 제출했습니다.',
    variables: ASSIGNMENT_VARIABLES,
  },
  {
    id: 'assignment_graded',
    name: '과제 채점 완료 알림',
    category: 'assignment',
    content: '[EduFlow] {studentName}님의 "{assignmentTitle}" 과제 채점이 완료되었습니다. 결과를 확인해주세요.',
    variables: ASSIGNMENT_VARIABLES,
  },
  {
    id: 'assignment_overdue',
    name: '과제 미제출 알림',
    category: 'assignment',
    content: '[EduFlow] {studentName}님, "{assignmentTitle}" 과제가 미제출 상태입니다. 빠른 제출 부탁드립니다.',
    variables: ASSIGNMENT_VARIABLES,
  },
]

/** 성적 알림 템플릿 */
export const GRADE_TEMPLATES: SmsTemplate[] = [
  {
    id: 'grade_registered',
    name: '성적 등록 알림',
    category: 'grade',
    content: '[EduFlow] {studentName}님의 {subject} 성적이 등록되었습니다.',
    variables: GRADE_VARIABLES,
  },
  {
    id: 'grade_detail',
    name: '성적 상세 알림',
    category: 'grade',
    content: '[EduFlow] {studentName}님의 {subject} {examType} 결과: {score}/{maxScore}점',
    variables: GRADE_VARIABLES,
  },
  {
    id: 'grade_improvement',
    name: '성적 향상 알림',
    category: 'grade',
    content: '[EduFlow] 축하합니다! {studentName}님의 {subject} 성적이 향상되었습니다.',
    variables: GRADE_VARIABLES,
  },
  {
    id: 'grade_concern',
    name: '성적 관심 필요 알림',
    category: 'grade',
    content: '[EduFlow] {studentName}님의 {subject} 성적에 관심이 필요합니다. 상담 예약을 권장드립니다.',
    variables: GRADE_VARIABLES,
  },
]

/** 공지사항 템플릿 */
export const NOTICE_TEMPLATES: SmsTemplate[] = [
  {
    id: 'notice_general',
    name: '일반 공지',
    category: 'notice',
    content: '[EduFlow] {noticeTitle}\n{noticeContent}',
    variables: NOTICE_VARIABLES,
  },
  {
    id: 'notice_holiday',
    name: '휴원 공지',
    category: 'notice',
    content: '[EduFlow] 휴원 안내\n{noticeContent}',
    variables: NOTICE_VARIABLES,
  },
  {
    id: 'notice_schedule_change',
    name: '일정 변경 공지',
    category: 'notice',
    content: '[EduFlow] 일정 변경 안내\n{noticeContent}',
    variables: NOTICE_VARIABLES,
  },
]

/** 사용자 정의 템플릿 (빈 템플릿) */
export const CUSTOM_TEMPLATES: SmsTemplate[] = [
  {
    id: 'custom_empty',
    name: '직접 작성',
    category: 'custom',
    content: '',
    variables: COMMON_VARIABLES,
  },
]

// ============================================
// 모든 템플릿 목록
// ============================================

/** 전체 템플릿 목록 */
export const ALL_TEMPLATES: SmsTemplate[] = [
  ...ATTENDANCE_TEMPLATES,
  ...ASSIGNMENT_TEMPLATES,
  ...GRADE_TEMPLATES,
  ...NOTICE_TEMPLATES,
  ...CUSTOM_TEMPLATES,
]

// ============================================
// 템플릿 관련 유틸리티 함수
// ============================================

/**
 * 카테고리별 템플릿 조회
 */
export function getTemplatesByCategory(category: SmsTemplateCategory): SmsTemplate[] {
  return ALL_TEMPLATES.filter((template) => template.category === category)
}

/**
 * ID로 템플릿 조회
 */
export function getTemplateById(id: string): SmsTemplate | undefined {
  return ALL_TEMPLATES.find((template) => template.id === id)
}

/**
 * 템플릿 변수 치환
 *
 * @param template - 템플릿 내용
 * @param variables - 변수 값 객체 { key: value }
 * @returns 변수가 치환된 메시지
 *
 * @example
 * const message = applyTemplate(
 *   '[EduFlow] {studentName}님이 {time}에 출석했습니다.',
 *   { studentName: '홍길동', time: '14:30' }
 * )
 * // 결과: '[EduFlow] 홍길동님이 14:30에 출석했습니다.'
 */
export function applyTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  // 모든 변수 치환
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(pattern, value)
  }

  return result
}

/**
 * 템플릿에서 사용된 변수 추출
 *
 * @param template - 템플릿 내용
 * @returns 변수 키 배열
 *
 * @example
 * const variables = extractVariablesFromTemplate(
 *   '[EduFlow] {studentName}님이 {time}에 출석했습니다.'
 * )
 * // 결과: ['studentName', 'time']
 */
export function extractVariablesFromTemplate(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g)
  if (!matches) return []

  return matches.map((match) => match.slice(1, -1))
}

/**
 * 템플릿의 누락된 변수 확인
 *
 * @param template - 템플릿 내용
 * @param variables - 제공된 변수 값 객체
 * @returns 누락된 변수 키 배열
 */
export function getMissingVariables(
  template: string,
  variables: Record<string, string>
): string[] {
  const requiredVariables = extractVariablesFromTemplate(template)
  return requiredVariables.filter(
    (key) => !variables[key] || variables[key].trim() === ''
  )
}

/**
 * 템플릿 미리보기 생성
 *
 * @param template - 템플릿 객체
 * @returns 예시 값이 적용된 미리보기 메시지
 */
export function generateTemplatePreview(template: SmsTemplate): string {
  const exampleVariables: Record<string, string> = {}

  for (const variable of template.variables) {
    exampleVariables[variable.key] = variable.example || `[${variable.label}]`
  }

  return applyTemplate(template.content, exampleVariables)
}

/**
 * 메시지 길이 정보 반환
 * - SMS: 90바이트 이하 (한글 기준 약 45자)
 * - LMS: 2000바이트 이하 (한글 기준 약 1000자)
 */
export function getMessageInfo(message: string): {
  /** 문자 수 */
  length: number
  /** 바이트 수 (UTF-8 기준) */
  byteLength: number
  /** 메시지 타입 (SMS/LMS) */
  type: 'SMS' | 'LMS'
  /** 잔여 글자 수 */
  remaining: number
  /** 최대 글자 수 */
  maxLength: number
} {
  const length = message.length
  const byteLength = new TextEncoder().encode(message).length

  // 90바이트(약 45자) 초과시 LMS
  const type = byteLength > 90 ? 'LMS' : 'SMS'
  const maxLength = type === 'SMS' ? 90 : 2000

  return {
    length,
    byteLength,
    type,
    remaining: maxLength - byteLength,
    maxLength,
  }
}

// ============================================
// 카테고리별 템플릿 그룹 (UI 표시용)
// ============================================

/** 카테고리별 템플릿 그룹 */
export const TEMPLATE_GROUPS: {
  category: SmsTemplateCategory
  label: string
  templates: SmsTemplate[]
}[] = [
  {
    category: 'attendance',
    label: '출결 알림',
    templates: ATTENDANCE_TEMPLATES,
  },
  {
    category: 'assignment',
    label: '과제 알림',
    templates: ASSIGNMENT_TEMPLATES,
  },
  {
    category: 'grade',
    label: '성적 알림',
    templates: GRADE_TEMPLATES,
  },
  {
    category: 'notice',
    label: '공지사항',
    templates: NOTICE_TEMPLATES,
  },
  {
    category: 'custom',
    label: '직접 작성',
    templates: CUSTOM_TEMPLATES,
  },
]
