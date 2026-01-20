'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  GraduationCap,
  Users,
  BookOpen,
  Shield,
  Building2,
  School,
  Phone,
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

// 역할 타입 정의
type UserRole = 'student' | 'parent' | 'teacher' | 'admin'

// 역할 정보
const ROLES = [
  {
    id: 'student' as UserRole,
    label: '학생',
    icon: GraduationCap,
    description: '학습 콘텐츠를 이용하고 문제를 풀어요',
    color: 'blue'
  },
  {
    id: 'parent' as UserRole,
    label: '학부모',
    icon: Users,
    description: '자녀의 학습 현황을 확인해요',
    color: 'green'
  },
  {
    id: 'teacher' as UserRole,
    label: '선생님',
    icon: BookOpen,
    description: '수업을 관리하고 문제를 출제해요',
    color: 'purple'
  },
  {
    id: 'admin' as UserRole,
    label: '관리자',
    icon: Shield,
    description: '학원 전체를 운영해요',
    color: 'orange'
  },
]

// 학년 옵션
const GRADES = [
  { value: 'elementary_1', label: '초등학교 1학년' },
  { value: 'elementary_2', label: '초등학교 2학년' },
  { value: 'elementary_3', label: '초등학교 3학년' },
  { value: 'elementary_4', label: '초등학교 4학년' },
  { value: 'elementary_5', label: '초등학교 5학년' },
  { value: 'elementary_6', label: '초등학교 6학년' },
  { value: 'middle_1', label: '중학교 1학년' },
  { value: 'middle_2', label: '중학교 2학년' },
  { value: 'middle_3', label: '중학교 3학년' },
  { value: 'high_1', label: '고등학교 1학년' },
  { value: 'high_2', label: '고등학교 2학년' },
  { value: 'high_3', label: '고등학교 3학년' },
]

// 과목 옵션
const SUBJECTS = [
  { value: 'korean', label: '국어' },
  { value: 'math', label: '수학' },
  { value: 'english', label: '영어' },
  { value: 'science', label: '과학' },
  { value: 'social', label: '사회' },
  { value: 'etc', label: '기타' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: 역할 선택
    role: '' as UserRole | '',

    // Step 2: 기본 정보 + 역할별 추가 정보
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',

    // 학생 전용
    grade: '',
    school: '',
    academyCode: '',

    // 학부모 전용
    studentCode: '',

    // 선생님 전용
    subjects: [] as string[],
    teacherAcademyCode: '',

    // 약관 동의
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  })

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role })
  }

  const handleSubjectToggle = (subject: string) => {
    const subjects = formData.subjects.includes(subject)
      ? formData.subjects.filter(s => s !== subject)
      : [...formData.subjects, subject]
    setFormData({ ...formData, subjects })
  }

  const handleNext = () => {
    if (step === 1 && !formData.role) {
      alert('역할을 선택해주세요.')
      return
    }
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step !== 2) {
      handleNext()
      return
    }

    // 유효성 검사
    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      alert('필수 약관에 동의해주세요.')
      return
    }

    setIsLoading(true)

    // TODO: Supabase 회원가입 연동
    await new Promise(resolve => setTimeout(resolve, 1500))
    setStep(3) // 완료 단계로 이동
    setIsLoading(false)
  }

  // Step 1: 역할 선택
  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-gray-600 text-center mb-6">
        어떤 역할로 EduFlow를 이용하실 건가요?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const Icon = role.icon
          const isSelected = formData.role === role.id
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-8 h-8 mb-2 ${
                isSelected ? 'text-primary-500' : 'text-gray-400'
              }`} />
              <p className={`font-semibold ${
                isSelected ? 'text-primary-700' : 'text-gray-900'
              }`}>
                {role.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {role.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Step 2: 정보 입력
  const renderStep2 = () => (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <div>
        <label className="label">이름</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="홍길동"
            className="input pl-12"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">이메일</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="example@email.com"
            className="input pl-12"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">전화번호</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            placeholder="010-1234-5678"
            className="input pl-12"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      {/* 역할별 추가 정보 */}
      {formData.role === 'student' && (
        <>
          <div>
            <label className="label">학년</label>
            <select
              className="input"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              required
            >
              <option value="">학년을 선택하세요</option>
              {GRADES.map((grade) => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">학교명</label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="OO초등학교"
                className="input pl-12"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">학원 코드 (선택)</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="학원에서 받은 코드를 입력하세요"
                className="input pl-12"
                value={formData.academyCode}
                onChange={(e) => setFormData({ ...formData, academyCode: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              학원에 등록되어 있다면 코드를 입력하세요
            </p>
          </div>
        </>
      )}

      {formData.role === 'parent' && (
        <div>
          <label className="label">자녀 연결 코드</label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="자녀의 학생 코드를 입력하세요"
              className="input pl-12"
              value={formData.studentCode}
              onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            자녀 계정의 마이페이지에서 학생 코드를 확인할 수 있습니다
          </p>
        </div>
      )}

      {formData.role === 'teacher' && (
        <>
          <div>
            <label className="label">담당 과목</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((subject) => {
                const isSelected = formData.subjects.includes(subject.value)
                return (
                  <button
                    key={subject.value}
                    type="button"
                    onClick={() => handleSubjectToggle(subject.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {subject.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">학원 코드</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="소속 학원 코드를 입력하세요"
                className="input pl-12"
                value={formData.teacherAcademyCode}
                onChange={(e) => setFormData({ ...formData, teacherAcademyCode: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}

      {/* 비밀번호 */}
      <div>
        <label className="label">비밀번호</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="8자 이상 입력하세요"
            className="input pl-12 pr-12"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="label">비밀번호 확인</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            className="input pl-12"
            value={formData.passwordConfirm}
            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
            required
          />
        </div>
        {formData.password && formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
          <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
        )}
      </div>

      {/* 약관 동의 */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            checked={formData.agreeTerms}
            onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
          />
          <span className="text-sm text-gray-600">
            <span className="text-primary-600 font-medium cursor-pointer hover:underline">이용약관</span>에 동의합니다 <span className="text-red-500">(필수)</span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            checked={formData.agreePrivacy}
            onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
          />
          <span className="text-sm text-gray-600">
            <span className="text-primary-600 font-medium cursor-pointer hover:underline">개인정보처리방침</span>에 동의합니다 <span className="text-red-500">(필수)</span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            checked={formData.agreeMarketing}
            onChange={(e) => setFormData({ ...formData, agreeMarketing: e.target.checked })}
          />
          <span className="text-sm text-gray-600">
            마케팅 정보 수신에 동의합니다 (선택)
          </span>
        </label>
      </div>
    </div>
  )

  // Step 3: 완료
  const renderStep3 = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        회원가입 완료!
      </h3>
      <p className="text-gray-600 mb-8">
        EduFlow에 오신 것을 환영합니다.<br />
        이제 로그인하여 서비스를 이용하실 수 있습니다.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-2 btn-primary py-3 px-8 text-lg"
      >
        로그인하러 가기
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  )

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return '역할 선택'
      case 2:
        return '정보 입력'
      case 3:
        return '가입 완료'
      default:
        return ''
    }
  }

  return (
    <>
      {/* 회원가입 폼 */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* 진행 표시 */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {getStepTitle()}
        </h2>

        <form onSubmit={handleSubmit}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* 버튼 */}
          {step < 3 && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  이전
                </button>
              )}
              <button
                type="submit"
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={isLoading || (step === 1 && !formData.role)}
              >
                {isLoading ? (
                  '처리 중...'
                ) : step === 2 ? (
                  '가입하기'
                ) : (
                  <>
                    다음
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 로그인 링크 */}
      {step < 3 && (
        <p className="text-center mt-6 text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            로그인
          </Link>
        </p>
      )}
    </>
  )
}
