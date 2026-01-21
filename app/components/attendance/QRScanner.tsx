'use client'

/**
 * QR 스캐너 컴포넌트 (학생용)
 *
 * 학생이 카메라로 QR 코드를 스캔하여 출석 체크인을 할 수 있는 컴포넌트입니다.
 *
 * 주요 기능:
 * - 카메라 접근 및 QR 코드 스캔
 * - 체크인 결과 표시 (출석/지각)
 * - 에러 처리 및 재시도
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react'

// ============================================
// 타입 정의
// ============================================

interface QRScannerProps {
  /** 학생 ID */
  studentId: string
  /** 체크인 성공 콜백 */
  onCheckInSuccess?: (data: CheckInData) => void
  /** 체크인 실패 콜백 */
  onCheckInError?: (error: string) => void
  /** 스캐너 닫기 콜백 */
  onClose?: () => void
}

interface CheckInData {
  status: 'present' | 'late'
  checkInTime: string
  studentName: string
  className: string
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error'

// ============================================
// 상수 정의
// ============================================

const SCAN_MESSAGES = {
  idle: 'QR 코드를 스캔해주세요',
  scanning: 'QR 코드를 카메라에 비춰주세요',
  processing: '체크인 처리 중...',
  success: '출석 체크인 완료!',
  error: '체크인 실패',
}

// ============================================
// 컴포넌트
// ============================================

export default function QRScanner({
  studentId,
  onCheckInSuccess,
  onCheckInError,
  onClose,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  const [scanState, setScanState] = useState<ScanState>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [checkInResult, setCheckInResult] = useState<CheckInData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // ZXing 라이브러리 동적 로드
  const [BrowserQRCodeReader, setBrowserQRCodeReader] = useState<any>(null)

  useEffect(() => {
    // 클라이언트에서만 ZXing 로드
    import('@zxing/library').then((module) => {
      setBrowserQRCodeReader(() => module.BrowserQRCodeReader)
    })
  }, [])

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setScanState('scanning')

      const constraints = {
        video: {
          facingMode: 'environment', // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsScanning(true)
      }
    } catch (error: any) {
      console.error('카메라 접근 오류:', error)

      let errorMsg = '카메라에 접근할 수 없습니다.'
      if (error.name === 'NotAllowedError') {
        errorMsg = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
      } else if (error.name === 'NotFoundError') {
        errorMsg = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.'
      } else if (error.name === 'NotReadableError') {
        errorMsg = '카메라를 사용할 수 없습니다. 다른 앱에서 카메라를 사용 중일 수 있습니다.'
      }

      setCameraError(errorMsg)
      setScanState('error')
    }
  }, [])

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setIsScanning(false)
  }, [])

  // 체크인 처리
  const processCheckIn = useCallback(async (qrData: string) => {
    try {
      const response = await fetch('/api/attendance/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_data: qrData,
          student_id: studentId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const checkInData: CheckInData = {
          status: result.data.status,
          checkInTime: result.data.checkInTime,
          studentName: result.data.studentName,
          className: result.data.className,
        }

        setCheckInResult(checkInData)
        setScanState('success')
        onCheckInSuccess?.(checkInData)
      } else {
        setErrorMessage(result.error || '체크인에 실패했습니다.')
        setScanState('error')
        onCheckInError?.(result.error)
      }
    } catch (error) {
      console.error('체크인 API 오류:', error)
      setErrorMessage('서버 연결에 실패했습니다.')
      setScanState('error')
      onCheckInError?.('서버 연결 실패')
    }
  }, [studentId, onCheckInSuccess, onCheckInError])

  // QR 코드 스캔 처리
  const scanQRCode = useCallback(async () => {
    if (!BrowserQRCodeReader || !videoRef.current || !isScanning) return

    try {
      const reader = new BrowserQRCodeReader()
      const result = await reader.decodeFromVideoElement(videoRef.current)

      if (result) {
        // QR 코드 인식 성공
        stopCamera()
        setScanState('processing')

        // 체크인 API 호출
        await processCheckIn(result.getText())
      }
    } catch (error: unknown) {
      // NotFoundException은 QR 코드를 찾지 못한 경우 (정상)
      if (error instanceof Error && error.name !== 'NotFoundException') {
        console.error('QR 스캔 오류:', error)
      }
    }
  }, [BrowserQRCodeReader, isScanning, stopCamera, processCheckIn])

  // 재시도
  const handleRetry = useCallback(() => {
    setCheckInResult(null)
    setErrorMessage(null)
    setCameraError(null)
    setScanState('idle')
    startCamera()
  }, [startCamera])

  // 스캔 루프
  useEffect(() => {
    if (!isScanning || scanState !== 'scanning') return

    const scanLoop = () => {
      scanQRCode()
      animationRef.current = requestAnimationFrame(scanLoop)
    }

    // 0.5초마다 스캔
    const intervalId = setInterval(scanLoop, 500)

    return () => {
      clearInterval(intervalId)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isScanning, scanState, scanQRCode])

  // 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  // 숨겨진 캔버스 (스캔용)
  const hiddenCanvas = (
    <canvas ref={canvasRef} className="hidden" width={640} height={480} />
  )

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">QR 출석 체크인</h2>
        <p className="text-sm text-gray-500 mt-1">{SCAN_MESSAGES[scanState]}</p>
      </div>

      {/* 스캐너 영역 */}
      <div className="relative w-full aspect-square max-w-[300px] bg-gray-900 rounded-lg overflow-hidden">
        {/* 카메라 뷰 */}
        {(scanState === 'scanning' || scanState === 'idle') && !cameraError && (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {/* 스캔 프레임 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                {/* 코너 강조 */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                {/* 스캔 라인 애니메이션 */}
                <div className="absolute left-0 right-0 h-0.5 bg-blue-500 animate-scan-line" />
              </div>
            </div>
          </>
        )}

        {/* 처리 중 */}
        {scanState === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="mt-4 text-white text-sm">체크인 처리 중...</p>
          </div>
        )}

        {/* 성공 */}
        {scanState === 'success' && checkInResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500">
            <CheckCircle className="w-16 h-16 text-white" />
            <p className="mt-4 text-white font-bold text-lg">
              {checkInResult.status === 'present' ? '출석' : '지각'} 완료!
            </p>
            <p className="text-white/80 text-sm mt-2">
              {checkInResult.checkInTime}
            </p>
          </div>
        )}

        {/* 에러 */}
        {scanState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500">
            <XCircle className="w-16 h-16 text-white" />
            <p className="mt-4 text-white font-bold text-lg">체크인 실패</p>
            <p className="text-white/80 text-sm mt-2 text-center px-4">
              {errorMessage || cameraError}
            </p>
          </div>
        )}

        {/* 카메라 오류 */}
        {cameraError && scanState !== 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <CameraOff className="w-12 h-12 text-gray-400" />
            <p className="mt-4 text-gray-300 text-sm text-center px-4">
              {cameraError}
            </p>
          </div>
        )}
      </div>

      {hiddenCanvas}

      {/* 결과 정보 */}
      {scanState === 'success' && checkInResult && (
        <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">
                {checkInResult.studentName}님, 출석 체크인이 완료되었습니다.
              </p>
              <p className="text-sm text-green-600 mt-1">
                {checkInResult.className} | {checkInResult.checkInTime}
              </p>
              {checkInResult.status === 'late' && (
                <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  지각으로 처리되었습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 w-full">
        {(scanState === 'success' || scanState === 'error') && (
          <button
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            다시 스캔
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        )}
      </div>

      {/* 도움말 */}
      {scanState === 'scanning' && (
        <div className="text-center text-sm text-gray-500">
          <p>선생님이 보여주는 QR 코드를 카메라에 비춰주세요.</p>
          <p className="mt-1">QR 코드가 프레임 안에 들어오도록 해주세요.</p>
        </div>
      )}

      {/* 스캔 라인 애니메이션 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}} />
    </div>
  )
}
