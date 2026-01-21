/**
 * QR 코드 출석 API
 *
 * GET: QR 코드 생성 (강사용)
 * POST: QR 체크인 처리 (학생용)
 */

import { NextRequest, NextResponse } from 'next/server'
import * as QRCode from 'qrcode'
import {
  generateQRCode,
  refreshQRCode,
  verifyCheckIn,
  getActiveQRData,
  getQRValidityInfo,
} from '@/lib/services/qr-attendance'

// ============================================
// GET: QR 코드 생성
// ============================================

/**
 * GET /api/attendance/qr
 *
 * QR 코드를 생성합니다 (강사용)
 *
 * Query Parameters:
 * - class_id: 수업 ID (필수)
 * - date: 날짜 YYYY-MM-DD (선택, 기본값: 오늘)
 * - class_start_time: 수업 시작 시간 HH:mm (선택, 기본값: 14:00)
 * - academy_id: 학원 ID (선택, 기본값: academy-001)
 * - format: 반환 형식 - json | image | dataurl (선택, 기본값: json)
 * - refresh: true일 경우 기존 QR 무효화 후 새로 생성 (선택)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 파라미터 추출
    const classId = searchParams.get('class_id')
    const date = searchParams.get('date') || getTodayDate()
    const classStartTime = searchParams.get('class_start_time') || '14:00'
    const academyId = searchParams.get('academy_id') || 'academy-001'
    const format = searchParams.get('format') || 'json'
    const refresh = searchParams.get('refresh') === 'true'

    // 필수 파라미터 검증
    if (!classId) {
      return NextResponse.json(
        { success: false, error: '수업 ID(class_id)는 필수입니다.' },
        { status: 400 }
      )
    }

    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // 시간 형식 검증
    if (!/^\d{2}:\d{2}$/.test(classStartTime)) {
      return NextResponse.json(
        { success: false, error: '시간 형식이 올바르지 않습니다. (HH:mm)' },
        { status: 400 }
      )
    }

    // 기존 QR 확인 또는 새로 생성
    let qrResult
    const existingQR = getActiveQRData(classId, date)

    if (existingQR && !refresh) {
      // 기존 QR 재사용
      qrResult = {
        success: true,
        qrData: JSON.stringify(existingQR),
        expiresAt: existingQR.expiresAt,
      }
    } else if (refresh) {
      // 새로 생성 (기존 무효화)
      qrResult = refreshQRCode(classId, date, classStartTime, academyId)
    } else {
      // 새로 생성
      qrResult = generateQRCode(classId, date, classStartTime, academyId)
    }

    if (!qrResult.success || !qrResult.qrData) {
      return NextResponse.json(
        { success: false, error: qrResult.error || 'QR 코드 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 반환 형식에 따른 처리
    if (format === 'image') {
      // PNG 이미지로 반환
      const qrImageBuffer = await QRCode.toBuffer(qrResult.qrData, {
        type: 'png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })

      return new NextResponse(new Uint8Array(qrImageBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
        },
      })
    }

    if (format === 'dataurl') {
      // Data URL로 반환 (Base64 인코딩된 이미지)
      const qrDataUrl = await QRCode.toDataURL(qrResult.qrData, {
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          dataUrl: qrDataUrl,
          qrData: qrResult.qrData,
          expiresAt: qrResult.expiresAt,
          validity: getQRValidityInfo(),
        },
      })
    }

    // JSON 형식 (기본)
    return NextResponse.json({
      success: true,
      data: {
        qrData: qrResult.qrData,
        expiresAt: qrResult.expiresAt,
        validity: getQRValidityInfo(),
      },
    })
  } catch (error) {
    console.error('QR 코드 생성 API 오류:', error)
    return NextResponse.json(
      { success: false, error: 'QR 코드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: QR 체크인 처리
// ============================================

/**
 * POST /api/attendance/qr
 *
 * QR 코드를 스캔하여 출석 체크인을 처리합니다 (학생용)
 *
 * Request Body:
 * - qr_data: QR 코드 데이터 (JSON 문자열)
 * - student_id: 학생 ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { qr_data, student_id } = body

    // 필수 필드 검증
    if (!qr_data) {
      return NextResponse.json(
        { success: false, error: 'QR 코드 데이터(qr_data)는 필수입니다.' },
        { status: 400 }
      )
    }

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: '학생 ID(student_id)는 필수입니다.' },
        { status: 400 }
      )
    }

    // 체크인 처리
    const result = await verifyCheckIn(qr_data, student_id)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          data: {
            status: result.status,
            checkInTime: result.checkInTime,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        status: result.status,
        checkInTime: result.checkInTime,
        studentName: result.studentName,
        className: result.className,
      },
    })
  } catch (error) {
    console.error('QR 체크인 API 오류:', error)
    return NextResponse.json(
      { success: false, error: 'QR 체크인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 오늘 날짜 반환 (YYYY-MM-DD)
 */
function getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
