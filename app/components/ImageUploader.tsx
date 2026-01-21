'use client';

/**
 * 이미지 업로드 컴포넌트
 *
 * Vercel React Best Practices 적용:
 * - rerender-memo: React.memo로 불필요한 리렌더링 방지
 * - rerender-functional-setstate: 함수형 setState로 안정적인 콜백 참조
 */

import React, { useState, useCallback, useRef, memo } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

// UI 텍스트 상수
const UI_TEXT = {
  title: '이미지 업로드',
  dragAndDrop: '이미지를 드래그하여 놓거나',
  clickToSelect: '클릭하여 파일 선택',
  supportedFormats: '지원 형식: JPEG, PNG, GIF, WebP, BMP (최대 10MB)',
  uploading: '업로드 중...',
  removeImage: '이미지 제거',
  selectMultiple: '여러 이미지를 선택할 수 있습니다',
  errorFileType: '지원하지 않는 파일 형식입니다.',
  errorFileSize: '파일 크기가 10MB를 초과합니다.',
};

// 허용되는 파일 타입
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 업로드된 이미지 타입
export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface ImageUploaderProps {
  onImagesSelected: (images: UploadedImage[]) => void;
  onImageRemove?: (imageId: string) => void;
  multiple?: boolean;
  maxImages?: number;
  existingImages?: UploadedImage[];
}

// ImageUploader 컴포넌트 (memo 적용)
function ImageUploaderComponent({
  onImagesSelected,
  onImageRemove,
  multiple = true,
  maxImages = 10,
  existingImages = [],
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 고유 ID 생성
  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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

  // 파일 처리 (rerender-functional-setstate 적용)
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      setImages((currentImages) => {
        // 최대 이미지 수 확인
        const remainingSlots = maxImages - currentImages.length;
        if (remainingSlots <= 0) {
          setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
          return currentImages;
        }

        const filesToProcess = fileArray.slice(0, remainingSlots);
        const newImages: UploadedImage[] = [];

        for (const file of filesToProcess) {
          const validationError = validateFile(file);
          if (validationError) {
            setError(validationError);
            continue;
          }

          const preview = URL.createObjectURL(file);
          newImages.push({
            id: generateId(),
            file,
            preview,
            progress: 0,
            status: 'pending',
          });
        }

        if (newImages.length > 0) {
          const updatedImages = multiple ? [...currentImages, ...newImages] : newImages;
          // 외부 콜백은 setTimeout으로 스케줄링하여 setState 내부에서 직접 호출 방지
          setTimeout(() => onImagesSelected(updatedImages), 0);
          return updatedImages;
        }
        return currentImages;
      });
    },
    [maxImages, multiple, onImagesSelected]
  );

  // 드래그 앤 드롭 핸들러
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

      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // input 초기화 (같은 파일 다시 선택 가능하게)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  // 이미지 제거 (rerender-functional-setstate 적용)
  const handleRemoveImage = useCallback(
    (imageId: string) => {
      setImages((currentImages) => {
        const imageToRemove = currentImages.find((img) => img.id === imageId);
        if (imageToRemove) {
          URL.revokeObjectURL(imageToRemove.preview);
        }

        const updatedImages = currentImages.filter((img) => img.id !== imageId);
        // 외부 콜백은 setTimeout으로 스케줄링
        setTimeout(() => {
          onImagesSelected(updatedImages);
          onImageRemove?.(imageId);
        }, 0);
        return updatedImages;
      });
    },
    [onImagesSelected, onImageRemove]
  );

  // 클릭으로 파일 선택
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 드래그 앤 드롭 영역 */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? 'border-primary-500 bg-primary-50 scale-[1.02]'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}
          `}
          >
            <Upload
              className={`w-8 h-8 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
            />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700">{UI_TEXT.dragAndDrop}</p>
            <p className="text-primary-500 font-medium">{UI_TEXT.clickToSelect}</p>
          </div>

          <p className="text-sm text-gray-500">{UI_TEXT.supportedFormats}</p>
          {multiple && (
            <p className="text-xs text-gray-400">{UI_TEXT.selectMultiple}</p>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 이미지 미리보기 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
            >
              {/* 이미지 미리보기 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.preview}
                alt="업로드된 이미지"
                className="w-full h-full object-cover"
              />

              {/* 업로드 진행률 */}
              {image.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-3/4">
                    <div className="bg-white/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-300"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                    <p className="text-white text-xs text-center mt-2">
                      {image.progress}%
                    </p>
                  </div>
                </div>
              )}

              {/* 에러 표시 */}
              {image.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                  <div className="text-white text-center p-2">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">{image.error || '오류 발생'}</p>
                  </div>
                </div>
              )}

              {/* 완료 표시 */}
              {image.status === 'completed' && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* 삭제 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(image.id);
                }}
                className="absolute top-2 left-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title={UI_TEXT.removeImage}
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* 파일명 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs truncate">{image.file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
const ImageUploader = memo(ImageUploaderComponent);
ImageUploader.displayName = 'ImageUploader';

export default ImageUploader;
