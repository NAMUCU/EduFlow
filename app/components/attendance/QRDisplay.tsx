'use client'

/**
 * QR 코드 표시 컴포넌트 (강사용)
 *
 * 강사가 수업 시간에 QR 코드를 표시하여 학생들이 출석 체크인을 할 수 있게 합니다.
 *
 * 주요 기능:
 * - QR 코드 생성 및 표시
 * - 실시간 체크인 현황 표시
 * - QR 코드 갱신
 * - 만료 시간 카운트다운
 */

import { useState, useEffect, useCallback } from 'react'
import {
  QrCode,
  RefreshCw,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Download,
  Maximize,
  Loader2,
  User,
} from 'lucide-react'

// ============================================
// 타입 정의
// ============================================

interface QRDisplayProps {
  /** 수업 ID */
  classId: string
  /** 수업 이름 */
  className: string
  /** 수업 시작 시간 (HH:mm) */
  classStartTime?: string
  /** 날짜 (YYYY-MM-DD) */
  date?: string
  /** 학원 ID */
  academyId?: string
  /** 전체 학생 목록 */
  students?: StudentInfo[]
  /** 실시간 체크인 업데이트 콜백 */
  onCheckInUpdate?: (studentId: string, status: 'present' | 'late') => void
}

interface StudentInfo {
  id: string
  name: string
}

interface CheckInRecord {
  studentId: string
  studentName: string
  status: 'present' | 'late'
  time: string
}

interface QRData {
  dataUrl: string
  qrData: string
  expiresAt: string
}

// ============================================
// 상수 정의
// ============================================

const STATUS_COLORS = {
  present: 'text-green-600 bg-green-100',
  late: 'text-yellow-600 bg-yellow-100',
  absent: 'text-red-600 bg-red-100',
}

const STATUS_LABELS = {
  present: '출석',
  late: '지각',
  absent: '미출석',
}

// ============================================
// 컴포넌트
// ============================================

export default function QRDisplay({
  classId,
  className,
  classStartTime = '14:00',
  date,
  academyId = 'academy-001',
  students = [],
  onCheckInUpdate,
}: QRDisplayProps) {
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 오늘 날짜 가져오기
  const getTodayDate = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  const currentDate = date || getTodayDate()

  // QR 코드 생성
  const generateQR = useCallback(async (refresh = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        class_id: classId,
        date: currentDate,
        class_start_time: classStartTime,
        academy_id: academyId,
        format: 'dataurl',
      })

      if (refresh) {
        params.append('refresh', 'true')
      }

      const response = await fetch(`/api/attendance/qr?${params}`)
      const result = await response.json()

      if (result.success) {
        setQrData({
          dataUrl: result.data.dataUrl,
          qrData: result.data.qrData,
          expiresAt: result.data.expiresAt,
        })

        // 만료 시간 계산
        const expiresAt = new Date(result.data.expiresAt)
        const now = new Date()
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
        setRemainingTime(remaining)
      } else {
        setError(result.error || 'QR 코드 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('QR 생성 오류:', err)
      setError('서버 연결에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [classId, currentDate, classStartTime, academyId])

  // QR 갱신
  const refreshQR = () => {
    generateQR(true)
  }

  // 만료 시간 카운트다운
  useEffect(() => {
    if (remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          // 만료되면 자동 갱신
          generateQR(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime, generateQR])

  // 초기 QR 생성
  useEffect(() => {
    generateQR()
  }, [generateQR])

  // 실시간 체크인 폴링 (5초마다)
  useEffect(() => {
    const pollCheckIns = async () => {
      try {
        const response = await fetch(
          `/api/attendance?date=${currentDate}&class_id=${classId}`
        )
        const result = await response.json()

        if (result.success && result.data?.attendances) {
          const newCheckIns = result.data.attendances.map((a: any) => ({
            studentId: a.student_id,
            studentName: a.student_name,
            status: a.status,
            time: a.check_in_time || '',
          }))
          setCheckIns(newCheckIns)
        }
      } catch (err) {
        console.error('체크인 현황 조회 오류:', err)
      }
    }

    // 초기 조회
    pollCheckIns()

    // 5초마다 폴링
    const pollInterval = setInterval(pollCheckIns, 5000)

    return () => clearInterval(pollInterval)
  }, [classId, currentDate])

  // 시간 포맷팅 (초 -> MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // QR 다운로드
  const downloadQR = () => {
    if (!qrData?.dataUrl) return

    const link = document.createElement('a')
    link.href = qrData.dataUrl
    link.download = `attendance-qr-${classId}-${currentDate}.png`
    link.click()
  }

  // 전체화면 토글
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // 체크인 현황 통계
  const stats = {
    total: students.length,
    present: checkIns.filter((c) => c.status === 'present').length,
    late: checkIns.filter((c) => c.status === 'late').length,
    absent: students.length - checkIns.length,
  }

  // 전체화면 모드
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8"
        onClick={toggleFullscreen}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{className}</h1>
        <p className="text-xl text-gray-600 mb-8">
          {currentDate} {classStartTime}
        </p>

        {qrData?.dataUrl && (
          <div className="relative">
            <img
              src={qrData.dataUrl}
              alt="출석 QR 코드"
              className="w-[400px] h-[400px] object-contain"
            />
            {remainingTime > 0 && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-mono">{formatTime(remainingTime)}</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-16 text-gray-500">클릭하여 돌아가기</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">{className}</h2>
              <p className="text-blue-100 text-sm">
                {currentDate} | {classStartTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshQR}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="QR 코드 갱신"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={downloadQR}
              disabled={!qrData?.dataUrl}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="QR 코드 다운로드"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="전체화면"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* QR 코드 영역 */}
        <div className="flex flex-col items-center">
          <div className="relative bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            {isLoading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center text-red-500">
                <AlertTriangle className="w-12 h-12 mb-2" />
                <p className="text-center text-sm">{error}</p>
                <button
                  onClick={() => generateQR()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  다시 시도
                </button>
              </div>
            ) : qrData?.dataUrl ? (
              <img
                src={qrData.dataUrl}
                alt="출석 QR 코드"
                className="w-64 h-64 object-contain"
              />
            ) : null}
          </div>

          {/* 만료 시간 */}
          {remainingTime > 0 && (
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">
                {formatTime(remainingTime)} 후 자동 갱신
              </span>
            </div>
          )}

          <p className="mt-2 text-sm text-gray-500">
            학생들에게 이 QR 코드를 스캔하도록 안내하세요
          </p>
        </div>

        {/* 체크인 현황 */}
        <div>
          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-green-600">출석</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-sm text-yellow-600">지각</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-red-600">미출석</div>
            </div>
          </div>

          {/* 체크인 목록 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">실시간 체크인 현황</span>
              <span className="text-sm text-gray-500">
                ({checkIns.length}/{stats.total}명)
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {checkIns.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>아직 체크인한 학생이 없습니다</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {checkIns.map((checkIn) => (
                    <li
                      key={checkIn.studentId}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle
                          className={`w-5 h-5 ${
                            checkIn.status === 'present'
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }`}
                        />
                        <span className="font-medium">{checkIn.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{checkIn.time}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[checkIn.status]
                          }`}
                        >
                          {STATUS_LABELS[checkIn.status]}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 미출석 학생 목록 */}
          {students.length > 0 && stats.absent > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>미출석 학생</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {students
                  .filter(
                    (s) => !checkIns.some((c) => c.studentId === s.id)
                  )
                  .map((student) => (
                    <span
                      key={student.id}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded text-sm"
                    >
                      {student.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
