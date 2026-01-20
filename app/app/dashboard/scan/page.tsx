'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ScanLine,
  Loader2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import ImageUploader, { UploadedImage } from '@/components/ImageUploader';
import OcrResult from '@/components/OcrResult';
import { OcrResult as OcrResultType, ExtractedProblem } from '@/lib/ocr';
import {
  OcrProvider,
  OcrModel,
  OCR_PROVIDERS,
  MODELS_BY_PROVIDER,
  DEFAULT_OCR_MODEL,
  PRICE_COLORS,
  PROVIDER_LABELS,
} from '@/types/ocr';

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '문제 스캔',
  pageDescription: '이미지에서 문제를 자동으로 추출하고 편집할 수 있습니다.',
  step1Title: '1. 이미지 업로드',
  step1Description: '문제가 포함된 이미지를 업로드하세요.',
  step2Title: '2. OCR 텍스트 추출',
  step2Description: '이미지에서 텍스트를 추출합니다.',
  step3Title: '3. 문제 편집 및 저장',
  step3Description: '추출된 문제를 확인하고 편집하세요.',
  startOcr: 'OCR 시작',
  processing: '텍스트 추출 중...',
  saveProblems: '문제 저장',
  savingProblems: '저장 중...',
  reset: '초기화',
  selectImages: '이미지를 선택해주세요.',
  mockModeWarning:
    'Mock 모드로 실행 중입니다. 실제 OCR을 사용하려면 환경변수를 설정하세요.',
  ocrComplete: 'OCR 처리가 완료되었습니다.',
  ocrError: 'OCR 처리 중 오류가 발생했습니다.',
  saveComplete: '문제가 저장되었습니다.',
  saveError: '저장 중 오류가 발생했습니다.',
  processingImage: '이미지 처리 중...',
  selectProvider: 'OCR 엔진 선택',
  selectModel: '모델 선택',
  modelSettings: 'OCR 모델 설정',
  priceLabel: '비용',
};

// 워크플로우 단계
type WorkflowStep = 'upload' | 'ocr' | 'edit' | 'saved';

// 알림 타입
interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
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

export default function ScanPage() {
  // 상태 관리
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [ocrResults, setOcrResults] = useState<Map<string, OcrResultType>>(new Map());
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // OCR 모델 선택 상태
  const [selectedProvider, setSelectedProvider] = useState<OcrProvider>(DEFAULT_OCR_MODEL.provider);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_OCR_MODEL.model);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // 현재 선택된 모델 정보 가져오기
  const getSelectedModelInfo = (): OcrModel | undefined => {
    const models = MODELS_BY_PROVIDER[selectedProvider] || [];
    return models.find((m) => m.model === selectedModel) || models[0];
  };

  // 알림 표시
  const showNotification = useCallback(
    (type: Notification['type'], message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
    },
    []
  );

  // API 상태 확인
  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ocr');
      const data = await response.json();
      setIsMockMode(data.mockMode);
      setApiStatus(data);

      // 사용 가능한 provider가 있으면 해당 provider 선택
      if (data.availableProviders && data.availableProviders.length > 0) {
        const firstAvailable = data.availableProviders[0];
        setSelectedProvider(firstAvailable);
        const models = MODELS_BY_PROVIDER[firstAvailable as OcrProvider];
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

  // Provider 변경 시 해당 provider의 첫 번째 모델 선택
  const handleProviderChange = (provider: OcrProvider) => {
    setSelectedProvider(provider);
    const models = MODELS_BY_PROVIDER[provider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].model);
    }
    setIsProviderDropdownOpen(false);
  };

  // 모델 변경
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setIsModelDropdownOpen(false);
  };

  // Provider 사용 가능 여부 확인
  const isProviderAvailable = (provider: OcrProvider): boolean => {
    if (!apiStatus) return false;
    return apiStatus.availableProviders?.includes(provider) || false;
  };

  // 이미지 선택 핸들러
  const handleImagesSelected = useCallback((selectedImages: UploadedImage[]) => {
    setImages(selectedImages);
    if (selectedImages.length > 0 && !selectedImages.find((img) => img.id === selectedImageId)) {
      setSelectedImageId(selectedImages[0].id);
    }
    setCurrentStep('upload');
  }, [selectedImageId]);

  // 이미지 제거 핸들러
  const handleImageRemove = useCallback(
    (imageId: string) => {
      setOcrResults((prev) => {
        const newResults = new Map(prev);
        newResults.delete(imageId);
        return newResults;
      });

      if (selectedImageId === imageId) {
        const remainingImages = images.filter((img) => img.id !== imageId);
        setSelectedImageId(remainingImages.length > 0 ? remainingImages[0].id : null);
      }
    },
    [images, selectedImageId]
  );

  // OCR 처리
  const handleStartOcr = useCallback(async () => {
    if (images.length === 0) {
      showNotification('warning', UI_TEXT.selectImages);
      return;
    }

    setIsProcessing(true);
    setCurrentStep('ocr');

    const newResults = new Map(ocrResults);

    for (const image of images) {
      // 이미지 상태 업데이트
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, status: 'uploading', progress: 0 } : img
        )
      );

      try {
        // FormData 생성
        const formData = new FormData();
        formData.append('image', image.file);
        formData.append('provider', selectedProvider);
        formData.append('model', selectedModel);

        // 진행률 시뮬레이션
        const progressInterval = setInterval(() => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id
                ? { ...img, progress: Math.min(img.progress + 10, 90) }
                : img
            )
          );
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
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, status: 'completed', progress: 100 } : img
            )
          );
        } else {
          throw new Error(data.error || 'OCR 처리 실패');
        }
      } catch (error) {
        console.error('OCR 오류:', error);
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'OCR 처리 실패',
                }
              : img
          )
        );
      }
    }

    setOcrResults(newResults);
    setIsProcessing(false);

    if (newResults.size > 0) {
      setCurrentStep('edit');
      const modelInfo = getSelectedModelInfo();
      showNotification(
        'success',
        `${UI_TEXT.ocrComplete} (${modelInfo?.name || selectedModel} 사용)`
      );
    } else {
      showNotification('error', UI_TEXT.ocrError);
    }
  }, [images, ocrResults, showNotification, selectedProvider, selectedModel]);

  // 텍스트 변경 핸들러
  const handleTextChange = useCallback(
    (imageId: string, newText: string) => {
      setOcrResults((prev) => {
        const newResults = new Map(prev);
        const result = newResults.get(imageId);
        if (result) {
          newResults.set(imageId, { ...result, text: newText });
        }
        return newResults;
      });
    },
    []
  );

  // 문제 변경 핸들러
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

  // 텍스트에서 문제 다시 추출
  const handleReExtractProblems = useCallback(
    async (imageId: string) => {
      const result = ocrResults.get(imageId);
      if (!result) return;

      setIsProcessing(true);

      try {
        const response = await fetch('/api/ocr', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: result.text }),
        });

        const data = await response.json();

        if (data.success) {
          setOcrResults((prev) => {
            const newResults = new Map(prev);
            newResults.set(imageId, { ...result, problems: data.problems });
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
    [ocrResults, showNotification]
  );

  // 문제 저장
  const handleSaveProblems = useCallback(async () => {
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

      setCurrentStep('saved');
      showNotification('success', `${allProblems.length}개의 문제가 저장되었습니다.`);
    } catch (error) {
      console.error('저장 오류:', error);
      showNotification('error', UI_TEXT.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [ocrResults, showNotification]);

  // 초기화
  const handleReset = useCallback(() => {
    setImages([]);
    setOcrResults(new Map());
    setSelectedImageId(null);
    setCurrentStep('upload');
  }, []);

  // 현재 선택된 이미지의 OCR 결과
  const selectedOcrResult = selectedImageId ? ocrResults.get(selectedImageId) : null;

  // 전체 문제 수 계산
  const totalProblems = Array.from(ocrResults.values()).reduce(
    (sum, result) => sum + result.problems.length,
    0
  );

  // 현재 선택된 모델 정보
  const selectedModelInfo = getSelectedModelInfo();

  return (
    <div className="p-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{UI_TEXT.pageTitle}</h1>
            <p className="text-gray-500">{UI_TEXT.pageDescription}</p>
          </div>
        </div>
      </div>

      {/* Mock 모드 경고 */}
      {isMockMode && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-700 text-sm">{UI_TEXT.mockModeWarning}</p>
        </div>
      )}

      {/* 알림 */}
      {notification && (
        <div
          className={`mb-6 flex items-center gap-3 p-4 rounded-xl ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : notification.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : notification.type === 'warning'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle
              className={`w-5 h-5 flex-shrink-0 ${
                notification.type === 'error'
                  ? 'text-red-600'
                  : notification.type === 'warning'
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`}
            />
          )}
          <p
            className={`text-sm ${
              notification.type === 'success'
                ? 'text-green-700'
                : notification.type === 'error'
                ? 'text-red-700'
                : notification.type === 'warning'
                ? 'text-yellow-700'
                : 'text-blue-700'
            }`}
          >
            {notification.message}
          </p>
        </div>
      )}

      {/* 진행 단계 표시 */}
      <div className="mb-8 flex items-center justify-between">
        {[
          { step: 'upload', title: UI_TEXT.step1Title, description: UI_TEXT.step1Description },
          { step: 'ocr', title: UI_TEXT.step2Title, description: UI_TEXT.step2Description },
          { step: 'edit', title: UI_TEXT.step3Title, description: UI_TEXT.step3Description },
        ].map((item, index) => {
          const isActive = currentStep === item.step;
          const isPast =
            (currentStep === 'ocr' && index === 0) ||
            (currentStep === 'edit' && index <= 1) ||
            (currentStep === 'saved' && index <= 2);

          return (
            <React.Fragment key={item.step}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : isPast
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isPast && !isActive ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className={`font-medium ${isActive ? 'text-primary-600' : 'text-gray-700'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded ${
                    isPast ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 이미지 업로드 */}
        <div className="space-y-6">
          {/* OCR 모델 선택 카드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">{UI_TEXT.modelSettings}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider 선택 */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {UI_TEXT.selectProvider}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsProviderDropdownOpen(!isProviderDropdownOpen);
                    setIsModelDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-800">
                    {OCR_PROVIDERS.find((p) => p.id === selectedProvider)?.name || selectedProvider}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isProviderDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProviderDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {OCR_PROVIDERS.map((provider) => {
                      const available = isProviderAvailable(provider.id) || isMockMode;
                      return (
                        <button
                          key={provider.id}
                          onClick={() => available && handleProviderChange(provider.id)}
                          disabled={!available}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-0 ${
                            selectedProvider === provider.id ? 'bg-primary-50' : ''
                          } ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${selectedProvider === provider.id ? 'text-primary-600' : 'text-gray-800'}`}>
                                {provider.name}
                              </p>
                              <p className="text-xs text-gray-500">{provider.description}</p>
                            </div>
                            {!available && (
                              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                                키 없음
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Model 선택 */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {UI_TEXT.selectModel}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(!isModelDropdownOpen);
                    setIsProviderDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-800">
                    {selectedModelInfo?.name || selectedModel}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {MODELS_BY_PROVIDER[selectedProvider]?.map((model) => (
                      <button
                        key={model.model}
                        onClick={() => handleModelChange(model.model)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-0 ${
                          selectedModel === model.model ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${selectedModel === model.model ? 'text-primary-600' : 'text-gray-800'}`}>
                              {model.name}
                            </p>
                            {model.description && (
                              <p className="text-xs text-gray-500">{model.description}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${PRICE_COLORS[model.price] || 'text-gray-600 bg-gray-50'}`}>
                            {model.price}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 선택된 모델 정보 */}
            {selectedModelInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">선택된 모델:</span>
                  <span className="font-medium text-gray-800">
                    {PROVIDER_LABELS[selectedProvider]} - {selectedModelInfo.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">{UI_TEXT.priceLabel}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${PRICE_COLORS[selectedModelInfo.price] || 'text-gray-600 bg-gray-100'}`}>
                    {selectedModelInfo.price}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {UI_TEXT.step1Title}
            </h2>
            <ImageUploader
              onImagesSelected={handleImagesSelected}
              onImageRemove={handleImageRemove}
              existingImages={images}
              multiple={true}
              maxImages={10}
            />
          </div>

          {/* 이미지 선택 탭 (여러 이미지일 때) */}
          {images.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                이미지 선택 ({images.length}개)
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageId(image.id)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageId === image.id
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.preview}
                      alt={`이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {image.status === 'completed' && ocrResults.has(image.id) && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {image.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartOcr}
              disabled={images.length === 0 || isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{UI_TEXT.processing}</span>
                </>
              ) : (
                <>
                  <ScanLine className="w-5 h-5" />
                  <span>{UI_TEXT.startOcr}</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={isProcessing || isSaving}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 오른쪽: OCR 결과 */}
        <div className="space-y-6">
          {selectedOcrResult ? (
            <>
              <OcrResult
                text={selectedOcrResult.text}
                confidence={selectedOcrResult.confidence}
                problems={selectedOcrResult.problems}
                onTextChange={(text) =>
                  selectedImageId && handleTextChange(selectedImageId, text)
                }
                onProblemsChange={(problems) =>
                  selectedImageId && handleProblemsChange(selectedImageId, problems)
                }
                onConvertToProblems={() =>
                  selectedImageId && handleReExtractProblems(selectedImageId)
                }
                isLoading={isProcessing}
              />

              {/* 사용된 모델 정보 표시 */}
              {selectedOcrResult.provider && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">
                    사용된 모델: <span className="font-medium text-gray-800">
                      {PROVIDER_LABELS[selectedOcrResult.provider as OcrProvider] || selectedOcrResult.provider}
                      {selectedOcrResult.model && ` - ${selectedOcrResult.model}`}
                    </span>
                  </p>
                  {selectedOcrResult.processingTime && (
                    <p className="text-sm text-gray-500 mt-1">
                      처리 시간: {(selectedOcrResult.processingTime / 1000).toFixed(2)}초
                    </p>
                  )}
                </div>
              )}

              {/* 저장 버튼 */}
              {totalProblems > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        총 {totalProblems}개의 문제
                      </p>
                      <p className="text-sm text-gray-500">
                        {ocrResults.size}개의 이미지에서 추출됨
                      </p>
                    </div>
                    <button
                      onClick={handleSaveProblems}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{UI_TEXT.savingProblems}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>{UI_TEXT.saveProblems}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ScanLine className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                OCR 결과가 여기에 표시됩니다
              </h3>
              <p className="text-gray-500">
                이미지를 업로드하고 OCR 시작 버튼을 클릭하세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
