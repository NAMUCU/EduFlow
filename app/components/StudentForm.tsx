'use client';

import { useState } from 'react';
import { X, User, Phone, School, BookOpen, Users } from 'lucide-react';
import {
  CreateStudentInput,
  UpdateStudentInput,
  StudentBasicInfo,
  GRADE_OPTIONS,
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
} from '@/types/student';

// ============================================
// 상수 정의
// ============================================

const RELATIONSHIP_OPTIONS = [
  { value: '부', label: '아버지' },
  { value: '모', label: '어머니' },
  { value: '조부', label: '할아버지' },
  { value: '조모', label: '할머니' },
  { value: '기타', label: '기타' },
] as const;

// ============================================
// 타입 정의
// ============================================

interface StudentFormProps {
  /** 폼 모드 (등록/수정) */
  mode: 'create' | 'edit';
  /** 수정 모드일 때 기존 학생 정보 */
  initialData?: StudentBasicInfo;
  /** 폼 제출 핸들러 */
  onSubmit: (data: CreateStudentInput | UpdateStudentInput) => Promise<void>;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  grade?: string;
  school?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  subjects?: string;
}

// ============================================
// 컴포넌트
// ============================================

export default function StudentForm({
  mode,
  initialData,
  onSubmit,
  onClose,
  isLoading = false,
}: StudentFormProps) {
  // 폼 상태
  const [formData, setFormData] = useState<CreateStudentInput>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    grade: initialData?.grade || '',
    school: initialData?.school || '',
    className: initialData?.className || '',
    subjects: initialData?.subjects || [],
    memo: initialData?.memo || '',
    parent: {
      name: initialData?.parent.name || '',
      phone: initialData?.parent.phone || '',
      email: initialData?.parent.email || '',
      relationship: initialData?.parent.relationship || '모',
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // 입력 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('parent.')) {
      const parentField = name.replace('parent.', '');
      setFormData((prev) => ({
        ...prev,
        parent: {
          ...prev.parent,
          [parentField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // 에러 초기화
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // 과목 선택 핸들러
  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });

    if (errors.subjects) {
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '학생 이름을 입력해주세요.';
    }

    if (!formData.grade) {
      newErrors.grade = '학년을 선택해주세요.';
    }

    if (!formData.school.trim()) {
      newErrors.school = '학교를 입력해주세요.';
    }

    if (formData.phone && !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.';
    }

    if (!formData.parent.name.trim()) {
      newErrors.parentName = '학부모 이름을 입력해주세요.';
    }

    if (!formData.parent.phone.trim()) {
      newErrors.parentPhone = '학부모 연락처를 입력해주세요.';
    } else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(formData.parent.phone.replace(/-/g, ''))) {
      newErrors.parentPhone = '올바른 전화번호 형식이 아닙니다.';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = '최소 1개 이상의 과목을 선택해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? '새 학생 등록' : '학생 정보 수정'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* 학생 기본 정보 섹션 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary-500" />
              <h4 className="text-lg font-semibold text-gray-900">학생 정보</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 학생 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학생 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="홍길동"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* 학년 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학년 <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.grade ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">학년 선택</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-500">{errors.grade}</p>
                )}
              </div>

              {/* 학교 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학교 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    placeholder="OO중학교"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.school ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.school && (
                  <p className="mt-1 text-sm text-red-500">{errors.school}</p>
                )}
              </div>

              {/* 반 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반
                </label>
                <select
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">반 선택 (선택사항)</option>
                  {CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* 학생 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학생 연락처
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="010-1234-5678"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* 학생 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학생 이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="student@email.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* 수강 과목 섹션 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h4 className="text-lg font-semibold text-gray-900">
                수강 과목 <span className="text-red-500">*</span>
              </h4>
            </div>

            <div className="flex gap-2 flex-wrap">
              {SUBJECT_OPTIONS.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleSubjectToggle(subject)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.subjects.includes(subject)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            {errors.subjects && (
              <p className="mt-2 text-sm text-red-500">{errors.subjects}</p>
            )}
          </div>

          {/* 학부모 정보 섹션 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-500" />
              <h4 className="text-lg font-semibold text-gray-900">학부모 정보</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 학부모 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학부모 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="parent.name"
                  value={formData.parent.name}
                  onChange={handleInputChange}
                  placeholder="홍부모"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.parentName ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.parentName && (
                  <p className="mt-1 text-sm text-red-500">{errors.parentName}</p>
                )}
              </div>

              {/* 관계 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관계
                </label>
                <select
                  name="parent.relationship"
                  value={formData.parent.relationship}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 학부모 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학부모 연락처 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="parent.phone"
                    value={formData.parent.phone}
                    onChange={handleInputChange}
                    placeholder="010-8765-4321"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.parentPhone ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.parentPhone && (
                  <p className="mt-1 text-sm text-red-500">{errors.parentPhone}</p>
                )}
              </div>

              {/* 학부모 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학부모 이메일
                </label>
                <input
                  type="email"
                  name="parent.email"
                  value={formData.parent.email}
                  onChange={handleInputChange}
                  placeholder="parent@email.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* 메모 섹션 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <textarea
              name="memo"
              value={formData.memo}
              onChange={handleInputChange}
              placeholder="학생에 대한 특이사항이나 메모를 입력하세요..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </form>

        {/* 하단 버튼 */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                처리 중...
              </>
            ) : mode === 'create' ? (
              '등록하기'
            ) : (
              '저장하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
