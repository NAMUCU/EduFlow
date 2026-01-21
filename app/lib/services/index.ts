/**
 * Supabase 서비스 레이어 통합 export
 *
 * 사용법:
 * import { getStudents, createProblem, signIn } from '@/lib/services'
 */

// 학생 관리
export * from './students'

// 강사 관리
export * from './teachers'

// 문제 관리
export * from './problems'

// 문제 세트 관리
export * from './problem-sets'

// 과제 관리
export * from './assignments'

// 출결 관리
export * from './attendance'

// 반 관리
export * from './classes'

// 상담 관리
export * from './consultations'

// 공지사항 관리
export * from './notices'

// 성적 관리
export * from './grades'

// 인증
export * from './auth'

// 자동 채점
export * from './grading'

// 보고서 생성
export * from './report-generator'

// 알림
export * from './notifications'

// Few-shot 예시 관리
export * from './fewshot'

// 취약점 분석
export * from './weakness-analysis'

// 결제 관리
export * from './payments'

// 대시보드 통계
export * from './dashboard-stats'

// PDF 생성
export * from './pdf-generator'

// 오답노트 관리
export * from './wrong-answers'

// 설정 관리
export * from './settings'

// QR 코드 출석
export * from './qr-attendance'
