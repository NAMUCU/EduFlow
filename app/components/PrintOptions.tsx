'use client';

// 출력 옵션 설정 컴포넌트
// 문제지 출력 시 사용할 다양한 옵션을 설정할 수 있는 컴포넌트

import { useState, useRef } from 'react';
import {
  FileText,
  CheckCircle,
  BookOpen,
  Shuffle,
  ListOrdered,
  Upload,
  X,
  Calendar,
  Building2,
  User,
} from 'lucide-react';
import { PrintOptions, PDF_UI_TEXT, DEFAULT_PRINT_OPTIONS } from '@/types/pdf';

interface PrintOptionsProps {
  options: PrintOptions;
  onChange: (options: PrintOptions) => void;
}

export default function PrintOptionsComponent({
  options,
  onChange,
}: PrintOptionsProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    options.academyLogo || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 옵션 업데이트 헬퍼
  const updateOption = <K extends keyof PrintOptions>(
    key: K,
    value: PrintOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  // 로고 파일 처리
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB 제한
        alert('이미지 크기는 1MB 이하로 업로드해주세요.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
        updateOption('academyLogo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // 로고 제거
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    updateOption('academyLogo', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 섹션 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 제목 */}
          <div>
            <label className="label">{PDF_UI_TEXT.TITLE}</label>
            <input
              type="text"
              value={options.title}
              onChange={(e) => updateOption('title', e.target.value)}
              placeholder="문제지 제목을 입력하세요"
              className="input"
            />
          </div>

          {/* 날짜 */}
          <div>
            <label className="label flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {PDF_UI_TEXT.DATE}
            </label>
            <input
              type="date"
              value={options.date}
              onChange={(e) => updateOption('date', e.target.value)}
              className="input"
            />
          </div>

          {/* 학원명 */}
          <div>
            <label className="label flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {PDF_UI_TEXT.ACADEMY_NAME}
            </label>
            <input
              type="text"
              value={options.academyName}
              onChange={(e) => updateOption('academyName', e.target.value)}
              placeholder="학원명을 입력하세요"
              className="input"
            />
          </div>

          {/* 학생 이름 */}
          <div>
            <label className="label flex items-center gap-2">
              <User className="w-4 h-4" />
              {PDF_UI_TEXT.STUDENT_NAME}
            </label>
            <input
              type="text"
              value={options.studentName || ''}
              onChange={(e) => updateOption('studentName', e.target.value)}
              placeholder="학생 이름 (선택)"
              className="input"
            />
          </div>
        </div>

        {/* 학원 로고 */}
        <div className="mt-4">
          <label className="label">{PDF_UI_TEXT.ACADEMY_LOGO}</label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="학원 로고"
                  className="w-16 h-16 object-contain border border-gray-200 rounded-lg"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-400" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-500">
              PNG, JPG (최대 1MB)
            </p>
          </div>
        </div>
      </div>

      {/* 출력 내용 섹션 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {PDF_UI_TEXT.CONTENT_TYPE}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 문제만 */}
          <button
            onClick={() => updateOption('contentType', 'problem_only')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              options.contentType === 'problem_only'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                options.contentType === 'problem_only'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p
                className={`font-medium ${
                  options.contentType === 'problem_only'
                    ? 'text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                {PDF_UI_TEXT.PROBLEM_ONLY}
              </p>
              <p className="text-xs text-gray-500">학생 풀이용</p>
            </div>
          </button>

          {/* 문제 + 정답 */}
          <button
            onClick={() => updateOption('contentType', 'with_answer')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              options.contentType === 'with_answer'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                options.contentType === 'with_answer'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p
                className={`font-medium ${
                  options.contentType === 'with_answer'
                    ? 'text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                {PDF_UI_TEXT.WITH_ANSWER}
              </p>
              <p className="text-xs text-gray-500">정답 확인용</p>
            </div>
          </button>

          {/* 문제 + 정답 + 풀이 */}
          <button
            onClick={() => updateOption('contentType', 'with_solution')}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              options.contentType === 'with_solution'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                options.contentType === 'with_solution'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p
                className={`font-medium ${
                  options.contentType === 'with_solution'
                    ? 'text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                {PDF_UI_TEXT.WITH_SOLUTION}
              </p>
              <p className="text-xs text-gray-500">해설 포함</p>
            </div>
          </button>
        </div>
      </div>

      {/* 템플릿 선택 섹션 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {PDF_UI_TEXT.TEMPLATE}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 기본 문제지 */}
          <button
            onClick={() => updateOption('template', 'default')}
            className={`p-4 rounded-xl border-2 transition-all ${
              options.template === 'default'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-full h-24 bg-white border border-gray-300 rounded-lg mb-3 p-2 flex flex-col">
              <div className="h-2 bg-gray-200 rounded mb-2 w-3/4 mx-auto" />
              <div className="flex-1 space-y-1.5">
                <div className="h-1.5 bg-gray-100 rounded w-full" />
                <div className="h-1.5 bg-gray-100 rounded w-5/6" />
                <div className="h-1.5 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
            <p
              className={`font-medium text-center ${
                options.template === 'default'
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              {PDF_UI_TEXT.TEMPLATE_DEFAULT}
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">A4, 1단</p>
          </button>

          {/* 시험지 */}
          <button
            onClick={() => updateOption('template', 'exam')}
            className={`p-4 rounded-xl border-2 transition-all ${
              options.template === 'exam'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-full h-24 bg-white border border-gray-300 rounded-lg mb-3 p-2 flex flex-col">
              <div className="h-2 bg-gray-200 rounded mb-2 w-3/4 mx-auto" />
              <div className="flex-1 flex gap-2">
                <div className="flex-1 space-y-1">
                  <div className="h-1 bg-gray-100 rounded w-full" />
                  <div className="h-1 bg-gray-100 rounded w-5/6" />
                  <div className="h-1 bg-gray-100 rounded w-4/5" />
                </div>
                <div className="w-px bg-gray-200" />
                <div className="flex-1 space-y-1">
                  <div className="h-1 bg-gray-100 rounded w-full" />
                  <div className="h-1 bg-gray-100 rounded w-5/6" />
                  <div className="h-1 bg-gray-100 rounded w-4/5" />
                </div>
              </div>
            </div>
            <p
              className={`font-medium text-center ${
                options.template === 'exam'
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              {PDF_UI_TEXT.TEMPLATE_EXAM}
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">A4, 2단</p>
          </button>

          {/* 오답 노트 */}
          <button
            onClick={() => updateOption('template', 'wrong_note')}
            className={`p-4 rounded-xl border-2 transition-all ${
              options.template === 'wrong_note'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-full h-24 bg-white border border-gray-300 rounded-lg mb-3 p-2 flex flex-col">
              <div className="h-2 bg-gray-200 rounded mb-2 w-3/4 mx-auto" />
              <div className="flex-1 space-y-2">
                <div className="h-1.5 bg-gray-100 rounded w-full" />
                <div className="h-6 border border-dashed border-gray-200 rounded" />
              </div>
            </div>
            <p
              className={`font-medium text-center ${
                options.template === 'wrong_note'
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              {PDF_UI_TEXT.TEMPLATE_WRONG_NOTE}
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">메모 공간 포함</p>
          </button>
        </div>
      </div>

      {/* 문제 순서 섹션 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {PDF_UI_TEXT.PROBLEM_ORDER}
        </h3>
        <div className="flex gap-3">
          {/* 순서대로 */}
          <button
            onClick={() => updateOption('problemOrder', 'sequential')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              options.problemOrder === 'sequential'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ListOrdered
              className={`w-5 h-5 ${
                options.problemOrder === 'sequential'
                  ? 'text-primary-500'
                  : 'text-gray-400'
              }`}
            />
            <span
              className={`font-medium ${
                options.problemOrder === 'sequential'
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              {PDF_UI_TEXT.SEQUENTIAL}
            </span>
          </button>

          {/* 랜덤 */}
          <button
            onClick={() => updateOption('problemOrder', 'random')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              options.problemOrder === 'random'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Shuffle
              className={`w-5 h-5 ${
                options.problemOrder === 'random'
                  ? 'text-primary-500'
                  : 'text-gray-400'
              }`}
            />
            <span
              className={`font-medium ${
                options.problemOrder === 'random'
                  ? 'text-primary-700'
                  : 'text-gray-700'
              }`}
            >
              {PDF_UI_TEXT.RANDOM}
            </span>
          </button>
        </div>
      </div>

      {/* 표시 옵션 섹션 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {PDF_UI_TEXT.DISPLAY_OPTIONS}
        </h3>
        <div className="space-y-3">
          {/* 문제 번호 표시 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.showProblemNumber}
              onChange={(e) =>
                updateOption('showProblemNumber', e.target.checked)
              }
              className="w-5 h-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-gray-700">
              {PDF_UI_TEXT.SHOW_PROBLEM_NUMBER}
            </span>
          </label>

          {/* 난이도 표시 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.showDifficulty}
              onChange={(e) => updateOption('showDifficulty', e.target.checked)}
              className="w-5 h-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-gray-700">{PDF_UI_TEXT.SHOW_DIFFICULTY}</span>
          </label>

          {/* 문제 유형 표시 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.showProblemType}
              onChange={(e) =>
                updateOption('showProblemType', e.target.checked)
              }
              className="w-5 h-5 text-primary-500 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-gray-700">
              {PDF_UI_TEXT.SHOW_PROBLEM_TYPE}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
