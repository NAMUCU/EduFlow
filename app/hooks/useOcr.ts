/**
 * OCR 관련 커스텀 Hook
 * 스캔 페이지의 OCR 로직을 분리하여 관리합니다.
 *
 * Vercel React Best Practices 적용:
 * - rerender-functional-setstate: 함수형 setState로 안정적인 콜백 참조
 * - bundle-conditional: 조건부 모듈 로딩
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage } from '@/components/ImageUploader';
import type { ExtractedProblem } from '@/lib/ocr';
import {
  OcrProvider,
  OcrModel,
  MODELS_BY_PROVIDER,
  DEFAULT_OCR_MODEL,
} from '@/types/ocr';

// OCR 결과 타입
export interface OcrResultData {
  text: string;
  confidence: number;
  problems: ExtractedProblem[];
  provider?: OcrProvider;
  model?: string;
  processingTime?: number;
}

// API 상태 타입
interface ApiStatus {
  mockMode: boolean;
  availableProviders: OcrProvider[];
  providers: Array<{
    provider: OcrProvider;
    name: string;
    available: boolean;
    models: OcrModel[];
    message: string;
  }>;
}

// 알림 타입
interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// useOcr 반환 타입
export interface UseOcrReturn {
  // 상태
  ocrResults: Map<string, OcrResultData>;
  isProcessing: boolean;
  isSaving: boolean;
  notification: Notification | null;
  isMockMode: boolean;

  // OCR 모델 선택
  selectedProvider: OcrProvider;
  selectedModel: string;
  apiStatus: ApiStatus | null;

  // 액션
  processImages: (images: UploadedImage[], onProgress: (imageId: string, status: 'uploading' | 'completed' | 'error', progress: number, error?: string) => void) => Promise<void>;
  reExtractProblems: (imageId: string, text: string) => Promise<void>;
  saveProblems: () => Promise<boolean>;
  handleTextChange: (imageId: string, newText: string) => void;
  handleProblemsChange: (imageId: string, newProblems: ExtractedProblem[]) => void;
  handleProviderChange: (provider: OcrProvider) => void;
  handleModelChange: (model: string) => void;
  showNotification: (type: Notification['type'], message: string) => void;
  clearNotification: () => void;
  resetResults: () => void;
  removeResult: (imageId: string) => void;
  isProviderAvailable: (provider: OcrProvider) => boolean;
  getSelectedModelInfo: () => OcrModel | undefined;
  totalProblems: number;
}

// Hook 옵션
interface UseOcrOptions {
  notificationTimeout?: number;
}

/**
 * OCR 관련 로직을 관리하는 커스텀 Hook
 */
export function useOcr(options: UseOcrOptions = {}): UseOcrReturn {
  const { notificationTimeout = 5000 } = options;

  // 상태 관리
  const [ocrResults, setOcrResults] = useState<Map<string, OcrResultData>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // OCR 모델 선택 상태
  const [selectedProvider, setSelectedProvider] = useState<OcrProvider>(DEFAULT_OCR_MODEL.provider);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_OCR_MODEL.model);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  // 타이머 ref (메모리 누수 방지)
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 알림 표시 (rerender-functional-setstate 적용)
  const showNotification = useCallback(
    (type: Notification['type'], message: string) => {
      // 이전 타이머 정리
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }

      setNotification({ type, message });

      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
        notificationTimerRef.current = null;
      }, notificationTimeout);
    },
    [notificationTimeout]
  );

  // 알림 초기화
  const clearNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setNotification(null);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  // API 상태 확인
  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ocr');
      const data = await response.json();

      setIsMockMode(data.mockMode);
      setApiStatus(data);

      // 사용 가능한 provider가 있으면 해당 provider 선택
      if (data.availableProviders && data.availableProviders.length > 0) {
        const firstAvailable = data.availableProviders[0] as OcrProvider;
        setSelectedProvider(firstAvailable);
        const models = MODELS_BY_PROVIDER[firstAvailable];
        if (models && models.length > 0) {
          setSelectedModel(models[0].model);
        }
      }
    } catch (error) {
      console.error('API 상태 확인 오류:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 API 상태 확인
  useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  // Provider 변경
  const handleProviderChange = useCallback((provider: OcrProvider) => {
    setSelectedProvider(provider);
    const models = MODELS_BY_PROVIDER[provider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].model);
    }
  }, []);

  // Model 변경
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  // Provider 사용 가능 여부 확인
  const isProviderAvailable = useCallback(
    (provider: OcrProvider): boolean => {
      if (!apiStatus) return false;
      return apiStatus.availableProviders?.includes(provider) || false;
    },
    [apiStatus]
  );

  // 선택된 모델 정보 가져오기
  const getSelectedModelInfo = useCallback((): OcrModel | undefined => {
    const models = MODELS_BY_PROVIDER[selectedProvider] || [];
    return models.find((m) => m.model === selectedModel) || models[0];
  }, [selectedProvider, selectedModel]);

  // 텍스트 변경 핸들러 (rerender-functional-setstate 적용)
  const handleTextChange = useCallback((imageId: string, newText: string) => {
    setOcrResults((prev) => {
      const newResults = new Map(prev);
      const result = newResults.get(imageId);
      if (result) {
        newResults.set(imageId, { ...result, text: newText });
      }
      return newResults;
    });
  }, []);

  // 문제 변경 핸들러 (rerender-functional-setstate 적용)
  const handleProblemsChange = useCallback(
    (imageId: string, newProblems: ExtractedProblem[]) => {
      setOcrResults((prev) => {
        const newResults = new Map(prev);
        const result = newResults.get(imageId);
        if (result) {
          newResults.set(imageId, { ...result, problems: newProblems });
        }
        return newResults;
      });
    },
    []
  );

  // 결과 제거
  const removeResult = useCallback((imageId: string) => {
    setOcrResults((prev) => {
      const newResults = new Map(prev);
      newResults.delete(imageId);
      return newResults;
    });
  }, []);

  // 결과 초기화
  const resetResults = useCallback(() => {
    setOcrResults(new Map());
  }, []);

  // 이미지 OCR 처리
  const processImages = useCallback(
    async (
      images: UploadedImage[],
      onProgress: (
        imageId: string,
        status: 'uploading' | 'completed' | 'error',
        progress: number,
        error?: string
      ) => void
    ) => {
      if (images.length === 0) {
        showNotification('warning', '이미지를 선택해주세요.');
        return;
      }

      setIsProcessing(true);

      // 새 결과 맵 (기존 결과 유지)
      const newResults = new Map(ocrResults);

      for (const image of images) {
        onProgress(image.id, 'uploading', 0);

        try {
          // FormData 생성
          const formData = new FormData();
          formData.append('image', image.file);
          formData.append('provider', selectedProvider);
          formData.append('model', selectedModel);

          // 진행률 시뮬레이션
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress = Math.min(progress + 10, 90);
            onProgress(image.id, 'uploading', progress);
          }, 200);

          // API 호출
          const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData,
          });

          clearInterval(progressInterval);

          const data = await response.json();

          if (data.success) {
            newResults.set(image.id, data.data);
            onProgress(image.id, 'completed', 100);
          } else {
            throw new Error(data.error || 'OCR 처리 실패');
          }
        } catch (error) {
          console.error('OCR 오류:', error);
          onProgress(
            image.id,
            'error',
            0,
            error instanceof Error ? error.message : 'OCR 처리 실패'
          );
        }
      }

      // 결과 업데이트 (rerender-functional-setstate)
      setOcrResults(newResults);
      setIsProcessing(false);

      if (newResults.size > 0) {
        const modelInfo = getSelectedModelInfo();
        showNotification(
          'success',
          `OCR 처리가 완료되었습니다. (${modelInfo?.name || selectedModel} 사용)`
        );
      } else {
        showNotification('error', 'OCR 처리 중 오류가 발생했습니다.');
      }
    },
    [ocrResults, selectedProvider, selectedModel, showNotification, getSelectedModelInfo]
  );

  // 텍스트에서 문제 다시 추출
  const reExtractProblems = useCallback(
    async (imageId: string, text: string) => {
      setIsProcessing(true);

      try {
        const response = await fetch('/api/ocr', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (data.success) {
          setOcrResults((prev) => {
            const newResults = new Map(prev);
            const result = newResults.get(imageId);
            if (result) {
              newResults.set(imageId, { ...result, problems: data.problems });
            }
            return newResults;
          });
        }
      } catch (error) {
        console.error('문제 추출 오류:', error);
        showNotification('error', '문제 추출 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    },
    [showNotification]
  );

  // 문제 저장
  const saveProblems = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);

    try {
      // 모든 문제 수집
      const allProblems: ExtractedProblem[] = [];
      ocrResults.forEach((result) => {
        allProblems.push(...result.problems);
      });

      // TODO: 실제 저장 로직 구현 (Supabase 등)
      // 현재는 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('저장된 문제:', allProblems);

      showNotification('success', `${allProblems.length}개의 문제가 저장되었습니다.`);
      return true;
    } catch (error) {
      console.error('저장 오류:', error);
      showNotification('error', '저장 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [ocrResults, showNotification]);

  // 전체 문제 수 계산
  const totalProblems = Array.from(ocrResults.values()).reduce(
    (sum, result) => sum + result.problems.length,
    0
  );

  return {
    // 상태
    ocrResults,
    isProcessing,
    isSaving,
    notification,
    isMockMode,

    // OCR 모델 선택
    selectedProvider,
    selectedModel,
    apiStatus,

    // 액션
    processImages,
    reExtractProblems,
    saveProblems,
    handleTextChange,
    handleProblemsChange,
    handleProviderChange,
    handleModelChange,
    showNotification,
    clearNotification,
    resetResults,
    removeResult,
    isProviderAvailable,
    getSelectedModelInfo,
    totalProblems,
  };
}

export default useOcr;
