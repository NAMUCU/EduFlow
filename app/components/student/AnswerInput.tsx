'use client';

/**
 * 학생 답안 입력 컴포넌트
 *
 * 문제 유형별 답안 입력 UI:
 * - 객관식: 번호 선택 버튼
 * - 단답형: 텍스트 입력
 * - 서술형: 텍스트 + 이미지 업로드
 */

import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Check,
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// SolutionUploader lazy load
const SolutionUploader = dynamic(() => import('./SolutionUploader'), {
  loading: () => (
    <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
  ssr: false,
});

// UI 텍스트 상수
const UI_TEXT = {
  multipleChoice: '객관식',
  shortAnswer: '단답형',
  essay: '서술형',
  selectAnswer: '답을 선택해주세요',
  enterAnswer: '답을 입력해주세요',
  enterSolution: '풀이 과정과 답을 자세히 작성해주세요...',
  uploadHandwriting: '손글씨 업로드',
  removeImage: '이미지 삭제',
  viewImage: '이미지 보기',
  hideImage: '이미지 숨기기',
  ocrResult: 'OCR 인식 결과',
  useOcrResult: '인식 결과 사용',
  editOcrResult: '직접 수정',
  clearAnswer: '답안 지우기',
  characterCount: '글자 수',
  minCharacters: '최소 글자 수',
  maxCharacters: '최대 글자 수',
};

// 문제 유형
type ProblemType = 'multiple_choice' | 'short_answer' | 'essay';

// 객관식 보기 타입
interface Choice {
  id: number;
  text: string;
  isImage?: boolean;
  imageUrl?: string;
}

// 답안 타입
export interface AnswerData {
  answer: string;
  imageUrl?: string;
  ocrText?: string;
  answeredAt?: string;
}

// Props 타입
interface AnswerInputProps {
  type: ProblemType;
  choices?: Choice[];
  currentAnswer?: AnswerData;
  onAnswer: (answer: string, imageUrl?: string) => void;
  onImageUpload?: (base64: string) => Promise<{ success: boolean; url?: string; ocrText?: string; error?: string }>;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  showValidation?: boolean;
  isGraded?: boolean;
  isCorrect?: boolean | null;
  correctAnswer?: string;
}

// 객관식 답안 입력 컴포넌트
const MultipleChoiceInput = memo(function MultipleChoiceInput({
  choices = [],
  currentAnswer,
  onAnswer,
  disabled,
  isGraded,
  isCorrect,
  correctAnswer,
}: {
  choices: Choice[];
  currentAnswer?: AnswerData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  isGraded?: boolean;
  isCorrect?: boolean | null;
  correctAnswer?: string;
}) {
  const selectedId = currentAnswer?.answer;

  return (
    <div className="space-y-3">
      {choices.map((choice) => {
        const isSelected = selectedId === choice.id.toString();
        const isCorrectChoice = correctAnswer === choice.id.toString();
        const showAsCorrect = isGraded && isCorrectChoice;
        const showAsIncorrect = isGraded && isSelected && !isCorrect;

        return (
          <button
            key={choice.id}
            onClick={() => !disabled && onAnswer(choice.id.toString())}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              showAsCorrect
                ? 'border-green-500 bg-green-50'
                : showAsIncorrect
                ? 'border-red-500 bg-red-50'
                : isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              {/* 선택 번호 */}
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  showAsCorrect
                    ? 'bg-green-500 text-white'
                    : showAsIncorrect
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showAsCorrect ? (
                  <Check className="w-5 h-5" />
                ) : showAsIncorrect ? (
                  <X className="w-5 h-5" />
                ) : (
                  choice.id
                )}
              </span>

              {/* 보기 내용 */}
              <div className="flex-1">
                {choice.isImage && choice.imageUrl ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={choice.imageUrl}
                      alt={`보기 ${choice.id}`}
                      className="max-h-16 rounded-lg"
                    />
                    {choice.text ? <span className="text-gray-700">{choice.text}</span> : null}
                  </div>
                ) : (
                  <span className="font-medium text-gray-800">{choice.text}</span>
                )}
              </div>

              {/* 정답/오답 표시 */}
              {isGraded && (
                <div className="flex-shrink-0">
                  {showAsCorrect && (
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                      정답
                    </span>
                  )}
                  {showAsIncorrect && (
                    <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded">
                      오답
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
});

// 단답형 답안 입력 컴포넌트
const ShortAnswerInput = memo(function ShortAnswerInput({
  currentAnswer,
  onAnswer,
  placeholder,
  maxLength,
  disabled,
  isGraded,
  isCorrect,
  correctAnswer,
}: {
  currentAnswer?: AnswerData;
  onAnswer: (answer: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  isGraded?: boolean;
  isCorrect?: boolean | null;
  correctAnswer?: string;
}) {
  const value = currentAnswer?.answer || '';
  const inputRef = useRef<HTMLInputElement>(null);

  // 정답/오답 스타일
  const getBorderStyle = () => {
    if (isGraded) {
      if (isCorrect) return 'border-green-500 bg-green-50 focus:ring-green-100';
      return 'border-red-500 bg-red-50 focus:ring-red-100';
    }
    return 'border-gray-200 focus:border-blue-500 focus:ring-blue-100';
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={placeholder || UI_TEXT.enterAnswer}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full p-4 border-2 rounded-xl focus:ring-2 outline-none transition-all text-lg ${getBorderStyle()} ${
            disabled ? 'cursor-not-allowed opacity-75' : ''
          }`}
        />

        {/* 글자 수 표시 */}
        {maxLength && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {value.length}/{maxLength}
          </span>
        )}

        {/* 정답/오답 아이콘 */}
        {isGraded && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isCorrect ? (
              <Check className="w-6 h-6 text-green-500" />
            ) : (
              <X className="w-6 h-6 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* 정답 표시 (오답인 경우) */}
      {isGraded && !isCorrect && correctAnswer && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700">
            정답: <span className="font-medium">{correctAnswer}</span>
          </span>
        </div>
      )}

      {/* 답안 지우기 버튼 */}
      {value && !disabled && !isGraded && (
        <button
          onClick={() => onAnswer('')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {UI_TEXT.clearAnswer}
        </button>
      )}
    </div>
  );
});

// 서술형 답안 입력 컴포넌트
const EssayInput = memo(function EssayInput({
  currentAnswer,
  onAnswer,
  onImageUpload,
  placeholder,
  minLength,
  maxLength,
  disabled,
  showValidation,
  isGraded,
  isCorrect,
}: {
  currentAnswer?: AnswerData;
  onAnswer: (answer: string, imageUrl?: string) => void;
  onImageUpload?: (base64: string) => Promise<{ success: boolean; url?: string; ocrText?: string; error?: string }>;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  showValidation?: boolean;
  isGraded?: boolean;
  isCorrect?: boolean | null;
}) {
  const value = currentAnswer?.answer || '';
  const imageUrl = currentAnswer?.imageUrl;
  const [showUploader, setShowUploader] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 영역 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`;
    }
  }, [value]);

  // 글자 수 검증
  const isValid = () => {
    if (minLength && value.length < minLength) return false;
    if (maxLength && value.length > maxLength) return false;
    return true;
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (base64: string) => {
    if (!onImageUpload) return { success: false, error: '업로드 기능이 없습니다.' };

    setIsUploading(true);
    try {
      const result = await onImageUpload(base64);

      if (result.success && result.url) {
        onAnswer(value, result.url);

        if (result.ocrText) {
          setOcrText(result.ocrText);
        }
      }

      return result;
    } finally {
      setIsUploading(false);
    }
  };

  // OCR 결과 사용
  const useOcrResult = () => {
    if (ocrText) {
      onAnswer(value ? `${value}\n\n${ocrText}` : ocrText, imageUrl);
      setOcrText(null);
    }
  };

  // 이미지 삭제
  const removeImage = () => {
    onAnswer(value, undefined);
    setOcrText(null);
  };

  // 정답/오답 스타일
  const getBorderStyle = () => {
    if (isGraded) {
      if (isCorrect) return 'border-green-500 bg-green-50';
      if (isCorrect === false) return 'border-red-500 bg-red-50';
      return 'border-yellow-500 bg-yellow-50'; // 채점 대기
    }
    if (showValidation && !isValid()) {
      return 'border-red-300';
    }
    return 'border-gray-200 focus-within:border-blue-500';
  };

  return (
    <div className="space-y-4">
      {/* 텍스트 입력 영역 */}
      <div
        className={`relative rounded-xl border-2 transition-all ${getBorderStyle()} ${
          disabled ? 'opacity-75' : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onAnswer(e.target.value, imageUrl)}
          placeholder={placeholder || UI_TEXT.enterSolution}
          maxLength={maxLength}
          disabled={disabled}
          rows={6}
          className="w-full p-4 bg-transparent outline-none resize-none text-lg"
        />

        {/* 하단 정보 바 */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          {/* 글자 수 */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              {UI_TEXT.characterCount}: {value.length}
              {maxLength && `/${maxLength}`}
            </span>
            {minLength && value.length < minLength && (
              <span className="text-orange-600">
                {UI_TEXT.minCharacters}: {minLength}자 ({minLength - value.length}자 부족)
              </span>
            )}
          </div>

          {/* 이미지 업로드 버튼 */}
          {!disabled && !isGraded && onImageUpload && (
            <button
              onClick={() => setShowUploader(!showUploader)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showUploader
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              {UI_TEXT.uploadHandwriting}
            </button>
          )}
        </div>
      </div>

      {/* 이미지 업로더 */}
      {showUploader && !disabled && !isGraded && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
          <SolutionUploader
            onImageSelected={() => {}}
            onUpload={handleImageUpload}
            onCancel={() => setShowUploader(false)}
            compact={false}
          />
        </div>
      )}

      {/* 업로드된 이미지 미리보기 */}
      {imageUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowImage(!showImage)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <ImageIcon className="w-4 h-4" />
              {showImage ? UI_TEXT.hideImage : UI_TEXT.viewImage}
              {showImage ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {!disabled && !isGraded && (
              <button
                onClick={removeImage}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                {UI_TEXT.removeImage}
              </button>
            )}
          </div>

          {showImage && (
            <div className="relative bg-gray-100 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="제출한 풀이 이미지"
                className="w-full max-h-[400px] object-contain"
              />

              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OCR 결과 */}
      {ocrText && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start justify-between gap-4 mb-2">
            <span className="text-sm font-medium text-blue-800">{UI_TEXT.ocrResult}:</span>
            <div className="flex gap-2">
              <button
                onClick={useOcrResult}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Check className="w-3 h-3" />
                {UI_TEXT.useOcrResult}
              </button>
              <button
                onClick={() => setOcrText(null)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-blue-700 text-sm whitespace-pre-wrap">{ocrText}</p>
        </div>
      )}

      {/* 채점 결과 표시 */}
      {isGraded && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl ${
            isCorrect
              ? 'bg-green-50 border border-green-200'
              : isCorrect === false
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          {isCorrect ? (
            <>
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">정답</span>
            </>
          ) : isCorrect === false ? (
            <>
              <X className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">오답</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700 font-medium">채점 대기 중</span>
            </>
          )}
        </div>
      )}

      {/* 답안 지우기 버튼 */}
      {value && !disabled && !isGraded && (
        <button
          onClick={() => onAnswer('', imageUrl)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {UI_TEXT.clearAnswer}
        </button>
      )}
    </div>
  );
});

// 메인 AnswerInput 컴포넌트
function AnswerInputComponent({
  type,
  choices = [],
  currentAnswer,
  onAnswer,
  onImageUpload,
  minLength,
  maxLength,
  placeholder,
  disabled = false,
  showValidation = false,
  isGraded = false,
  isCorrect = null,
  correctAnswer,
}: AnswerInputProps) {
  const handleAnswer = useCallback(
    (answer: string, imageUrl?: string) => {
      onAnswer(answer, imageUrl);
    },
    [onAnswer]
  );

  switch (type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceInput
          choices={choices}
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
          disabled={disabled}
          isGraded={isGraded}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer}
        />
      );

    case 'short_answer':
      return (
        <ShortAnswerInput
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          isGraded={isGraded}
          isCorrect={isCorrect}
          correctAnswer={correctAnswer}
        />
      );

    case 'essay':
      return (
        <EssayInput
          currentAnswer={currentAnswer}
          onAnswer={handleAnswer}
          onImageUpload={onImageUpload}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          showValidation={showValidation}
          isGraded={isGraded}
          isCorrect={isCorrect}
        />
      );

    default:
      return (
        <div className="p-4 bg-gray-100 rounded-xl text-gray-500 text-center">
          지원하지 않는 문제 유형입니다.
        </div>
      );
  }
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
const AnswerInput = memo(AnswerInputComponent);
AnswerInput.displayName = 'AnswerInput';

export default AnswerInput;
export { MultipleChoiceInput, ShortAnswerInput, EssayInput };
