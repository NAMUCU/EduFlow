/**
 * QR 코드 출석 체크인 서비스
 *
 * QR 코드를 통한 출석 관리 기능을 제공합니다.
 * - QR 코드 데이터 생성 (강사용)
 * - QR 코드 검증 및 체크인 처리 (학생용)
 * - QR 유효시간 관리 (수업 시작 전후 30분)
 */

import { v4 as uuidv4 } from 'uuid'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type { AttendanceStatus } from '@/types/database'

// ============================================
// 타입 정의
// ============================================

/** QR 코드 데이터 구조 */
export interface QRCodeData {
  /** 고유 토큰 (위변조 방지) */
  token: string
  /** 수업 ID */
  classId: string
  /** 학원 ID */
  academyId: string
  /** 날짜 (YYYY-MM-DD) */
  date: string
  /** 수업 시작 시간 (HH:mm) */
  classStartTime: string
  /** QR 생성 시간 (ISO 8601) */
  createdAt: string
  /** QR 만료 시간 (ISO 8601) */
  expiresAt: string
}

/** QR 체크인 결과 */
export interface QRCheckInResult {
  success: boolean
  message: string
  status?: AttendanceStatus
  checkInTime?: string
  studentName?: string
  className?: string
}

/** QR 생성 결과 */
export interface QRGenerateResult {
  success: boolean
  qrData?: string
  expiresAt?: string
  error?: string
}

/** QR 유효성 검사 결과 */
export interface QRValidationResult {
  valid: boolean
  expired?: boolean
  message: string
  data?: QRCodeData
}

// ============================================
// 상수 정의
// ============================================

/** QR 유효 시간 (분) - 수업 시작 전후 */
const QR_VALIDITY_MINUTES_BEFORE = 30
const QR_VALIDITY_MINUTES_AFTER = 30

/** 지각 기준 (분) */
const LATE_THRESHOLD_MINUTES = 10

/** QR 토큰 저장소 (메모리 기반 - 프로덕션에서는 Redis 권장) */
const activeQRTokens = new Map<string, QRCodeData>()

// ============================================
// QR 코드 생성 함수
// ============================================

/**
 * QR 코드 데이터 생성
 *
 * @param classId - 수업 ID
 * @param date - 날짜 (YYYY-MM-DD)
 * @param classStartTime - 수업 시작 시간 (HH:mm)
 * @param academyId - 학원 ID
 * @returns QR 코드 데이터 문자열 (JSON)
 */
export function generateQRCode(
  classId: string,
  date: string,
  classStartTime: string = '14:00',
  academyId: string = 'academy-001'
): QRGenerateResult {
  try {
    // 고유 토큰 생성
    const token = uuidv4()

    // 유효 시간 계산
    const now = new Date()
    const [hours, minutes] = classStartTime.split(':').map(Number)

    // 수업 시작 시간 설정
    const classStart = new Date(date)
    classStart.setHours(hours, minutes, 0, 0)

    // QR 유효 시간: 수업 시작 30분 전 ~ 수업 시작 30분 후
    const validFrom = new Date(classStart.getTime() - QR_VALIDITY_MINUTES_BEFORE * 60 * 1000)
    const validUntil = new Date(classStart.getTime() + QR_VALIDITY_MINUTES_AFTER * 60 * 1000)

    const qrData: QRCodeData = {
      token,
      classId,
      academyId,
      date,
      classStartTime,
      createdAt: now.toISOString(),
      expiresAt: validUntil.toISOString(),
    }

    // 토큰 저장 (실시간 검증용)
    activeQRTokens.set(token, qrData)

    // 만료 시 자동 삭제
    const ttl = validUntil.getTime() - now.getTime()
    if (ttl > 0) {
      setTimeout(() => {
        activeQRTokens.delete(token)
      }, ttl)
    }

    // JSON 문자열로 반환
    const qrString = JSON.stringify(qrData)

    return {
      success: true,
      qrData: qrString,
      expiresAt: validUntil.toISOString(),
    }
  } catch (error) {
    console.error('QR 코드 생성 오류:', error)
    return {
      success: false,
      error: 'QR 코드 생성에 실패했습니다.',
    }
  }
}

/**
 * QR 코드 갱신 (기존 토큰 무효화 후 새로 생성)
 */
export function refreshQRCode(
  classId: string,
  date: string,
  classStartTime: string = '14:00',
  academyId: string = 'academy-001'
): QRGenerateResult {
  // 해당 수업의 기존 토큰 모두 삭제
  for (const [token, data] of activeQRTokens.entries()) {
    if (data.classId === classId && data.date === date) {
      activeQRTokens.delete(token)
    }
  }

  // 새 QR 코드 생성
  return generateQRCode(classId, date, classStartTime, academyId)
}

// ============================================
// QR 코드 검증 함수
// ============================================

/**
 * QR 코드 데이터 파싱 및 검증
 */
export function validateQRCode(qrDataString: string): QRValidationResult {
  try {
    const qrData: QRCodeData = JSON.parse(qrDataString)

    // 필수 필드 확인
    if (!qrData.token || !qrData.classId || !qrData.date || !qrData.expiresAt) {
      return {
        valid: false,
        message: '유효하지 않은 QR 코드입니다.',
      }
    }

    // 토큰 존재 여부 확인
    const storedData = activeQRTokens.get(qrData.token)
    if (!storedData) {
      return {
        valid: false,
        message: '만료되었거나 유효하지 않은 QR 코드입니다.',
      }
    }

    // 만료 시간 확인
    const now = new Date()
    const expiresAt = new Date(qrData.expiresAt)

    if (now > expiresAt) {
      activeQRTokens.delete(qrData.token)
      return {
        valid: false,
        expired: true,
        message: 'QR 코드가 만료되었습니다. 새 QR 코드를 요청하세요.',
      }
    }

    // 유효 시작 시간 확인 (수업 시작 30분 전부터)
    const [hours, minutes] = qrData.classStartTime.split(':').map(Number)
    const classStart = new Date(qrData.date)
    classStart.setHours(hours, minutes, 0, 0)
    const validFrom = new Date(classStart.getTime() - QR_VALIDITY_MINUTES_BEFORE * 60 * 1000)

    if (now < validFrom) {
      return {
        valid: false,
        message: `출석 체크는 수업 시작 ${QR_VALIDITY_MINUTES_BEFORE}분 전부터 가능합니다.`,
      }
    }

    return {
      valid: true,
      message: '유효한 QR 코드입니다.',
      data: qrData,
    }
  } catch {
    return {
      valid: false,
      message: 'QR 코드 형식이 올바르지 않습니다.',
    }
  }
}

// ============================================
// 체크인 처리 함수
// ============================================

/**
 * QR 체크인 처리
 *
 * @param qrDataString - 스캔한 QR 코드 데이터 (JSON)
 * @param studentId - 학생 ID
 * @returns 체크인 결과
 */
export async function verifyCheckIn(
  qrDataString: string,
  studentId: string
): Promise<QRCheckInResult> {
  // 1. QR 코드 검증
  const validation = validateQRCode(qrDataString)

  if (!validation.valid || !validation.data) {
    return {
      success: false,
      message: validation.message,
    }
  }

  const qrData = validation.data

  // 2. 체크인 시간 및 상태 결정
  const now = new Date()
  const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const [classHours, classMinutes] = qrData.classStartTime.split(':').map(Number)
  const classStart = new Date(qrData.date)
  classStart.setHours(classHours, classMinutes, 0, 0)

  // 지각 여부 판단 (수업 시작 10분 후부터 지각)
  const lateThreshold = new Date(classStart.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000)
  const status: AttendanceStatus = now > lateThreshold ? 'late' : 'present'

  // 3. 출석 기록 저장
  try {
    let studentName = '학생'
    let className = '수업'

    if (!isSupabaseConfigured()) {
      // Mock 모드
      console.log(`[Mock] QR 체크인: 학생=${studentId}, 수업=${qrData.classId}, 상태=${status}`)
      studentName = '테스트 학생'
      className = '테스트 수업'
    } else {
      const supabase = createServerSupabaseClient()

      // 학생 정보 조회
      const { data: studentData } = await (supabase as any)
        .from('students')
        .select('id, user:profiles(name)')
        .eq('id', studentId)
        .single()

      if (studentData?.user) {
        studentName = (studentData.user as any).name || '학생'
      }

      // 수업 정보 조회
      const { data: classData } = await (supabase as any)
        .from('classes')
        .select('name')
        .eq('id', qrData.classId)
        .single()

      if (classData) {
        className = classData.name
      }

      // 중복 체크인 확인
      const { data: existingAttendance } = await (supabase as any)
        .from('attendance')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('date', qrData.date)
        .single() as { data: { id: string, status: string } | null }

      if (existingAttendance) {
        return {
          success: false,
          message: '이미 출석 체크가 완료되었습니다.',
          status: existingAttendance.status as AttendanceStatus,
          checkInTime,
          studentName,
          className,
        }
      }

      // 출석 기록 생성
      const { error } = await (supabase as any)
        .from('attendance')
        .insert({
          student_id: studentId,
          date: qrData.date,
          status,
          check_in_time: checkInTime,
          note: 'QR 코드 출석',
        })

      if (error) {
        console.error('출석 기록 저장 오류:', error)
        return {
          success: false,
          message: '출석 기록 저장에 실패했습니다.',
        }
      }
    }

    const statusMessage = status === 'present' ? '출석' : '지각'

    return {
      success: true,
      message: `${statusMessage} 체크인이 완료되었습니다.`,
      status,
      checkInTime,
      studentName,
      className,
    }
  } catch (error) {
    console.error('체크인 처리 오류:', error)
    return {
      success: false,
      message: '체크인 처리 중 오류가 발생했습니다.',
    }
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 현재 활성화된 QR 토큰 수 조회 (디버깅/모니터링용)
 */
export function getActiveQRTokenCount(): number {
  return activeQRTokens.size
}

/**
 * 특정 수업의 활성 QR 토큰 존재 여부 확인
 */
export function hasActiveQRToken(classId: string, date: string): boolean {
  for (const data of activeQRTokens.values()) {
    if (data.classId === classId && data.date === date) {
      return true
    }
  }
  return false
}

/**
 * 특정 수업의 활성 QR 데이터 조회
 */
export function getActiveQRData(classId: string, date: string): QRCodeData | null {
  for (const data of activeQRTokens.values()) {
    if (data.classId === classId && data.date === date) {
      return data
    }
  }
  return null
}

/**
 * QR 유효 시간 정보 반환
 */
export function getQRValidityInfo(): { beforeMinutes: number; afterMinutes: number; lateThresholdMinutes: number } {
  return {
    beforeMinutes: QR_VALIDITY_MINUTES_BEFORE,
    afterMinutes: QR_VALIDITY_MINUTES_AFTER,
    lateThresholdMinutes: LATE_THRESHOLD_MINUTES,
  }
}
