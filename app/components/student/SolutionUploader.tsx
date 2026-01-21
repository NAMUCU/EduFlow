'use client';

/**
 * 학생 풀이 이미지 업로더 컴포넌트
 *
 * 기능:
 * - 카메라 촬영 또는 갤러리 선택
 * - 이미지 크롭/회전
 * - 업로드 프로그레스
 * - 미리보기
 */

import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  X,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Check,
  Loader2,
  AlertCircle,
  Maximize2,
  Crop,
} from 'lucide-react';

// UI 텍스트 상수
const UI_TEXT = {
  title: '풀이 이미지 업로드',
  takePhoto: '사진 촬영',
  selectFromGallery: '갤러리에서 선택',
  dragAndDrop: '이미지를 드래그하거나',
  clickToSelect: '클릭하여 업로드',
  supportedFormats: '지원 형식: JPEG, PNG (최대 10MB)',
  rotateLeft: '왼쪽으로 회전',
  rotateRight: '오른쪽으로 회전',
  zoomIn: '확대',
  zoomOut: '축소',
  crop: '크롭',
  resetCrop: '크롭 초기화',
  confirm: '확인',
  cancel: '취소',
  uploading: '업로드 중...',
  processing: 'OCR 처리 중...',
  retake: '다시 촬영',
  preview: '미리보기',
  fullscreen: '전체화면으로 보기',
  errorCamera: '카메라에 접근할 수 없습니다.',
  errorFileType: '지원하지 않는 파일 형식입니다.',
  errorFileSize: '파일 크기가 10MB를 초과합니다.',
};

// 허용되는 파일 타입
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 업로드 상태 타입
type UploadStatus = 'idle' | 'capturing' | 'preview' | 'cropping' | 'uploading' | 'processing' | 'completed' | 'error';

interface SolutionUploaderProps {
  onImageSelected: (file: File, preview: string) => void;
  onUpload?: (base64: string) => Promise<{ success: boolean; url?: string; ocrText?: string; error?: string }>;
  onCancel?: () => void;
  initialImage?: string;
  showOcrResult?: boolean;
  compact?: boolean;
}

function SolutionUploaderComponent({
  onImageSelected,
  onUpload,
  onCancel,
  initialImage,
  showOcrResult = true,
  compact = false,
}: SolutionUploaderProps) {
  // 상태 관리
  const [status, setStatus] = useState<UploadStatus>(initialImage ? 'preview' : 'idle');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initialImage || '');
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  // 카메라 가용성 체크
  useEffect(() => {
    const checkCamera = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          // getUserMedia가 존재하는지 확인
          const hasGetUserMedia = !!navigator.mediaDevices.getUserMedia;
          setIsCameraAvailable(hasGetUserMedia);
        } catch {
          setIsCameraAvailable(false);
        }
      }
    };
    checkCamera();
  }, []);

  // 컴포넌트 언마운트 시 카메라 스트림 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 파일 검증
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return UI_TEXT.errorFileType;
    }
    if (file.size > MAX_FILE_SIZE) {
      return UI_TEXT.errorFileSize;
    }
    return null;
  };

  // 파일 처리
  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setStatus('preview');
      setRotation(0);
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }, []);

  // 갤러리에서 선택
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFile]
  );

  // 카메라 촬영 (모바일)
  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    },
    [processFile]
  );

  // 웹캠 시작 (데스크톱)
  const startWebcam = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(UI_TEXT.errorCamera);
      return;
    }

    try {
      setStatus('capturing');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError(UI_TEXT.errorCamera);
      setStatus('idle');
    }
  }, []);

  // 웹캠에서 사진 촬영
  const captureFromWebcam = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          processFile(file);
        }

        // 카메라 스트림 중지
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      },
      'image/jpeg',
      0.9
    );
  }, [processFile]);

  // 웹캠 중지
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStatus('idle');
  }, []);

  // 드래그 앤 드롭
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  // 이미지 회전
  const rotateImage = useCallback(
    async (direction: 'left' | 'right') => {
      if (!preview) return;

      const newRotation = direction === 'right' ? rotation + 90 : rotation - 90;
      setRotation(newRotation % 360);

      // 실제 이미지 회전 처리
      const img = new Image();
      img.src = preview;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const radian = ((newRotation % 360) * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radian));
      const cos = Math.abs(Math.cos(radian));

      canvas.width = img.height * sin + img.width * cos;
      canvas.height = img.height * cos + img.width * sin;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radian);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedPreview = canvas.toDataURL('image/jpeg', 0.9);
      setPreview(rotatedPreview);
    },
    [preview, rotation]
  );

  // 줌 조절
  const adjustZoom = useCallback((delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  // 크롭 시작
  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cropStartRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  // 크롭 드래그
  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cropStartRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;

      const x = Math.min(cropStartRef.current.x, currentX);
      const y = Math.min(cropStartRef.current.y, currentY);
      const width = Math.abs(currentX - cropStartRef.current.x);
      const height = Math.abs(currentY - cropStartRef.current.y);

      setCropArea({ x, y, width, height });
    },
    []
  );

  // 크롭 종료
  const handleCropMouseUp = useCallback(() => {
    cropStartRef.current = null;
  }, []);

  // 크롭 적용
  const applyCrop = useCallback(async () => {
    if (!preview || cropArea.width < 5 || cropArea.height < 5) {
      setShowCropModal(false);
      return;
    }

    const img = new Image();
    img.src = preview;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = (cropArea.x / 100) * img.width;
    const sy = (cropArea.y / 100) * img.height;
    const sWidth = (cropArea.width / 100) * img.width;
    const sHeight = (cropArea.height / 100) * img.height;

    canvas.width = sWidth;
    canvas.height = sHeight;
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

    const croppedPreview = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(croppedPreview);
    setShowCropModal(false);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  }, [preview, cropArea]);

  // 확인 및 업로드
  const handleConfirm = useCallback(async () => {
    if (!preview || !imageFile) return;

    onImageSelected(imageFile, preview);

    if (onUpload) {
      setStatus('uploading');
      setProgress(0);

      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const base64 = preview.split(',')[1];
        setStatus('processing');
        const result = await onUpload(base64);

        clearInterval(progressInterval);

        if (result.success) {
          setProgress(100);
          if (result.ocrText) {
            setOcrResult(result.ocrText);
          }
          setStatus('completed');
        } else {
          setError(result.error || '업로드에 실패했습니다.');
          setStatus('error');
        }
      } catch (err) {
        clearInterval(progressInterval);
        setError('업로드 중 오류가 발생했습니다.');
        setStatus('error');
      }
    } else {
      setStatus('completed');
    }
  }, [preview, imageFile, onImageSelected, onUpload]);

  // 취소/다시 시작
  const handleReset = useCallback(() => {
    setStatus('idle');
    setImageFile(null);
    setPreview('');
    setRotation(0);
    setZoom(1);
    setError(null);
    setProgress(0);
    setOcrResult(null);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
    onCancel?.();
  }, [onCancel]);

  // Compact 모드 (작은 버튼만 표시)
  if (compact && status === 'idle') {
    return (
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />

        {isCameraAvailable && (
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>{UI_TEXT.takePhoto}</span>
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
          <span>{UI_TEXT.selectFromGallery}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 초기 상태 - 업로드 영역 */}
      {status === 'idle' && (
        <div className="space-y-4">
          {/* 카메라/갤러리 버튼 */}
          <div className="flex gap-3">
            {isCameraAvailable && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex flex-col items-center gap-2 p-6 bg-blue-50 text-blue-700 rounded-xl border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
              >
                <Camera className="w-10 h-10" />
                <span className="font-medium">{UI_TEXT.takePhoto}</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 p-6 bg-gray-50 text-gray-700 rounded-xl border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              <ImageIcon className="w-10 h-10" />
              <span className="font-medium">{UI_TEXT.selectFromGallery}</span>
            </button>
          </div>

          {/* 드래그 앤 드롭 영역 */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isDragging ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Upload className={`w-7 h-7 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-gray-700 font-medium">{UI_TEXT.dragAndDrop}</p>
                <p className="text-blue-600 font-medium">{UI_TEXT.clickToSelect}</p>
              </div>
              <p className="text-sm text-gray-500">{UI_TEXT.supportedFormats}</p>
            </div>
          </div>
        </div>
      )}

      {/* 카메라 캡처 상태 (웹캠) */}
      {status === 'capturing' && (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={stopWebcam}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
              {UI_TEXT.cancel}
            </button>
            <button
              onClick={captureFromWebcam}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              {UI_TEXT.takePhoto}
            </button>
          </div>
        </div>
      )}

      {/* 미리보기 상태 */}
      {status === 'preview' && preview && (
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-xl overflow-hidden">
            {/* 이미지 미리보기 */}
            <div
              className="relative flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="풀이 이미지 미리보기"
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>

            {/* 이미지 편집 도구 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
              <button
                onClick={() => rotateImage('left')}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title={UI_TEXT.rotateLeft}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => rotateImage('right')}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title={UI_TEXT.rotateRight}
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-1" />
              <button
                onClick={() => adjustZoom(-0.25)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title={UI_TEXT.zoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-sm min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => adjustZoom(0.25)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title={UI_TEXT.zoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-1" />
              <button
                onClick={() => setShowCropModal(true)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title={UI_TEXT.crop}
              >
                <Crop className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
              {UI_TEXT.retake}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Check className="w-5 h-5" />
              {UI_TEXT.confirm}
            </button>
          </div>
        </div>
      )}

      {/* 업로드/처리 중 상태 */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="업로드 중인 이미지"
              className="w-full max-h-[400px] object-contain opacity-50"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
              <p className="text-white font-medium">
                {status === 'uploading' ? UI_TEXT.uploading : UI_TEXT.processing}
              </p>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 완료 상태 */}
      {status === 'completed' && (
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="업로드된 이미지"
              className="w-full max-h-[400px] object-contain"
            />
            <div className="absolute top-3 right-3 bg-green-500 text-white p-2 rounded-full">
              <Check className="w-5 h-5" />
            </div>
          </div>

          {/* OCR 결과 */}
          {showOcrResult && ocrResult && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-medium text-blue-800 mb-2">OCR 인식 결과:</p>
              <p className="text-blue-700 whitespace-pre-wrap">{ocrResult}</p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Camera className="w-5 h-5" />
            {UI_TEXT.retake}
          </button>
        </div>
      )}

      {/* 에러 상태 */}
      {status === 'error' && (
        <div className="space-y-4">
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            {UI_TEXT.retake}
          </button>
        </div>
      )}

      {/* 크롭 모달 */}
      {showCropModal && preview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">{UI_TEXT.crop}</h3>
            </div>

            <div
              className="relative aspect-video bg-gray-900 cursor-crosshair"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="크롭할 이미지"
                className="w-full h-full object-contain"
              />

              {/* 크롭 영역 표시 */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20"
                style={{
                  left: `${cropArea.x}%`,
                  top: `${cropArea.y}%`,
                  width: `${cropArea.width}%`,
                  height: `${cropArea.height}%`,
                }}
              />

              {/* 어두운 영역 (크롭 영역 외부) */}
              <div
                className="absolute inset-0 bg-black/50 pointer-events-none"
                style={{
                  clipPath: `polygon(
                    0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                    ${cropArea.x}% ${cropArea.y}%,
                    ${cropArea.x}% ${cropArea.y + cropArea.height}%,
                    ${cropArea.x + cropArea.width}% ${cropArea.y + cropArea.height}%,
                    ${cropArea.x + cropArea.width}% ${cropArea.y}%,
                    ${cropArea.x}% ${cropArea.y}%
                  )`,
                }}
              />
            </div>

            <div className="p-4 flex gap-3">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropArea({ x: 0, y: 0, width: 100, height: 100 });
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {UI_TEXT.cancel}
              </button>
              <button
                onClick={() => setCropArea({ x: 0, y: 0, width: 100, height: 100 })}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                {UI_TEXT.resetCrop}
              </button>
              <button
                onClick={applyCrop}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                {UI_TEXT.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
const SolutionUploader = memo(SolutionUploaderComponent);
SolutionUploader.displayName = 'SolutionUploader';

export default SolutionUploader;
