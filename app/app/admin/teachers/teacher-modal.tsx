'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  X,
  Loader2,
  User,
  Mail,
  Phone,
  BookOpen,
  Users,
  Shield,
  FileText,
  Check,
} from 'lucide-react'
import { createTeacher, updateTeacher } from '@/hooks/useTeachers'
import { useClasses } from '@/hooks/useClasses'
import {
  TeacherListItem,
  TeacherRole,
  CreateTeacherInput,
  UpdateTeacherInput,
  TEACHER_ROLE_LABELS,
} from '@/types/teacher'

// UI 텍스트 상수
const UI_TEXT = {
  addTitle: '강사 추가',
  editTitle: '강사 정보 수정',
  nameLabel: '이름',
  namePlaceholder: '강사 이름을 입력하세요',
  emailLabel: '이메일',
  emailPlaceholder: 'example@academy.com',
  phoneLabel: '연락처',
  phonePlaceholder: '010-0000-0000',
  subjectsLabel: '담당 과목',
  subjectsPlaceholder: '담당 과목을 선택하세요',
  classesLabel: '담당 반',
  classesPlaceholder: '담당 반을 선택하세요',
  roleLabel: '권한',
  rolePlaceholder: '권한을 선택하세요',
  memoLabel: '메모',
  memoPlaceholder: '참고사항을 입력하세요 (선택)',
  cancel: '취소',
  add: '추가',
  save: '저장',
  adding: '추가 중...',
  saving: '저장 중...',
  success: '저장되었습니다.',
  error: '오류가 발생했습니다.',
  required: '필수 항목입니다.',
  invalidEmail: '올바른 이메일 형식이 아닙니다.',
  invalidPhone: '올바른 전화번호 형식이 아닙니다.',
}

// 과목 목록
const SUBJECT_OPTIONS = ['수학', '영어', '국어', '과학', '사회']

// 역할 옵션
const ROLE_OPTIONS: { value: TeacherRole; label: string }[] = [
  { value: 'teacher', label: TEACHER_ROLE_LABELS.teacher },
  { value: 'admin', label: TEACHER_ROLE_LABELS.admin },
]

interface TeacherModalProps {
  teacher: TeacherListItem | null
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  email: string
  phone: string
  subjects: string[]
  classIds: string[]
  role: TeacherRole
  memo: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  subjects?: string
  role?: string
}

export default function TeacherModal({ teacher, onClose, onSuccess }: TeacherModalProps) {
  const isEditing = !!teacher

  // 반 목록 조회
  const { classes, isLoading: isLoadingClasses } = useClasses()

  // 폼 상태
  const [formData, setFormData] = useState<FormData>({
    name: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    subjects: teacher?.subjects || [],
    classIds: teacher?.classes.map(c => c.id) || [],
    role: teacher?.role || 'teacher',
    memo: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // 입력값 변경 핸들러
  const handleChange = useCallback((
    field: keyof FormData,
    value: string | string[] | TeacherRole
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러 클리어
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  // 과목 토글 핸들러
  const handleSubjectToggle = useCallback((subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }))
    if (errors.subjects) {
      setErrors(prev => ({ ...prev, subjects: undefined }))
    }
  }, [errors.subjects])

  // 반 토글 핸들러
  const handleClassToggle = useCallback((classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId],
    }))
  }, [])

  // 유효성 검사
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = UI_TEXT.required
    }

    if (!formData.email.trim()) {
      newErrors.email = UI_TEXT.required
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = UI_TEXT.invalidEmail
    }

    if (!formData.phone.trim()) {
      newErrors.phone = UI_TEXT.required
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = UI_TEXT.invalidPhone
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = UI_TEXT.required
    }

    if (!formData.role) {
      newErrors.role = UI_TEXT.required
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 제출 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      if (isEditing && teacher) {
        // 수정
        const updateData: UpdateTeacherInput = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subjects: formData.subjects,
          class_ids: formData.classIds,
          role: formData.role,
          memo: formData.memo || undefined,
        }

        const result = await updateTeacher(teacher.id, updateData)
        if (result.success) {
          onSuccess()
        } else {
          alert(result.error || UI_TEXT.error)
        }
      } else {
        // 생성
        const createData: CreateTeacherInput = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subjects: formData.subjects,
          class_ids: formData.classIds,
          role: formData.role,
          memo: formData.memo || undefined,
        }

        const result = await createTeacher(createData)
        if (result.success) {
          onSuccess()
        } else {
          alert(result.error || UI_TEXT.error)
        }
      }
    } catch {
      alert(UI_TEXT.error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isEditing, teacher, validate, onSuccess])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? UI_TEXT.editTitle : UI_TEXT.addTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                {UI_TEXT.nameLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={UI_TEXT.namePlaceholder}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                {UI_TEXT.emailLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={UI_TEXT.emailPlaceholder}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* 연락처 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                {UI_TEXT.phoneLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={UI_TEXT.phonePlaceholder}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* 담당 과목 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4" />
                {UI_TEXT.subjectsLabel} <span className="text-red-500">*</span>
              </label>
              <div className={`flex flex-wrap gap-2 p-3 border rounded-lg ${
                errors.subjects ? 'border-red-500' : 'border-gray-200'
              }`}>
                {SUBJECT_OPTIONS.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleSubjectToggle(subject)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      formData.subjects.includes(subject)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {formData.subjects.includes(subject) && (
                      <Check className="w-3 h-3" />
                    )}
                    {subject}
                  </button>
                ))}
              </div>
              {errors.subjects && (
                <p className="mt-1 text-sm text-red-500">{errors.subjects}</p>
              )}
            </div>

            {/* 담당 반 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4" />
                {UI_TEXT.classesLabel}
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {isLoadingClasses ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : classes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleClassToggle(cls.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                          formData.classIds.includes(cls.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {formData.classIds.includes(cls.id) && (
                          <Check className="w-3 h-3" />
                        )}
                        {cls.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    등록된 반이 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 권한 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4" />
                {UI_TEXT.roleLabel} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('role', option.value)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.role === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">{errors.role}</p>
              )}
            </div>

            {/* 메모 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                {UI_TEXT.memoLabel}
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) => handleChange('memo', e.target.value)}
                placeholder={UI_TEXT.memoPlaceholder}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            {UI_TEXT.cancel}
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting
              ? (isEditing ? UI_TEXT.saving : UI_TEXT.adding)
              : (isEditing ? UI_TEXT.save : UI_TEXT.add)
            }
          </button>
        </div>
      </div>
    </div>
  )
}
