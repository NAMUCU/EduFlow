'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  BookOpen,
  Shield,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getRoleDefaultPath } from '@/lib/auth-utils'
import { UserRole } from '@/types/auth'

// 역할 정보 (테스트용 계정 안내 포함)
const ROLES = [
  { id: 'student' as UserRole, label: '학생', icon: GraduationCap, description: '학습 관리', testEmail: 'student@eduflow.com' },
  { id: 'parent' as UserRole, label: '학부모', icon: Users, description: '자녀 학습 현황', testEmail: 'parent@eduflow.com' },
  { id: 'teacher' as UserRole, label: '선생님', icon: BookOpen, description: '수업/문제 관리', testEmail: 'teacher@eduflow.com' },
  { id: 'admin' as UserRole, label: '관리자', icon: Shield, description: '학원 운영 관리', testEmail: 'admin@eduflow.com' },
]

// 로그인 폼 컴포넌트 (useSearchParams 사용으로 인해 분리)
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading: authLoading, error: authError } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // 역할 선택 시 테스트 계정 자동 입력
  const handleRoleSelect = (roleId: UserRole) => {
    setSelectedRole(roleId)
    const role = ROLES.find(r => r.id === roleId)
    if (role) {
      // 테스트 계정 자동 입력 (개발 편의용)
      setFormData(prev => ({
        ...prev,
        email: role.testEmail,
        password: `${roleId}123`, // 테스트 비밀번호: student123, teacher123 등
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      // AuthContext의 login 함수 사용
      await login({
        email: formData.email,
        password: formData.password,
      })

      // 로그인 성공 후 returnUrl이 있으면 해당 페이지로, 없으면 역할별 기본 페이지로 이동
      const returnUrl = searchParams.get('returnUrl')
      // 역할별 기본 경로 가져오기 (로그인 성공 후 user가 설정되므로 selectedRole 사용)
      const defaultPath = getRoleDefaultPath(selectedRole)
      router.push(returnUrl || defaultPath)
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 표시할 에러 메시지
  const displayError = formError || authError
  const isLoading = isSubmitting || authLoading

  return (
    <>
      {/* 로그인 폼 */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">로그인</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 에러 메시지 */}
          {displayError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          {/* 역할 선택 */}
          <div>
            <label className="label">역할 선택</label>
            <div className="grid grid-cols-4 gap-2">
              {ROLES.map((role) => {
                const Icon = role.icon
                const isSelected = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${
                      isSelected ? 'text-primary-500' : 'text-gray-400'
                    }`} />
                    <p className={`text-xs font-medium ${
                      isSelected ? 'text-primary-700' : 'text-gray-600'
                    }`}>
                      {role.label}
                    </p>
                  </button>
                )
              })}
            </div>
            {/* 테스트 계정 안내 */}
            <p className="text-xs text-gray-500 mt-2">
              * 테스트: 역할 선택 시 자동으로 테스트 계정이 입력됩니다.
            </p>
          </div>

          {/* 이메일 */}
          <div>
            <label className="label">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="example@academy.com"
                className="input pl-12"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="label">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                className="input pl-12 pr-12"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

          {/* 옵션 */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              />
              <span className="text-gray-600">로그인 상태 유지</span>
            </label>
            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
              비밀번호 찾기
            </Link>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full btn-primary py-3 text-lg disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-3">
          <button
            type="button"
            className="w-full btn-secondary flex items-center justify-center gap-3 py-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-medium transition-all bg-[#FEE500] hover:bg-[#FDD800] text-[#191919]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#191919" d="M12 3C6.477 3 2 6.463 2 10.714c0 2.747 1.842 5.166 4.598 6.52-.146.53-.94 3.41-.97 3.63 0 0-.02.166.087.23.107.063.234.007.234.007.31-.043 3.59-2.357 4.158-2.76.615.087 1.25.13 1.893.13 5.523 0 10-3.463 10-7.757C22 6.463 17.523 3 12 3z"/>
            </svg>
            카카오로 계속하기
          </button>
        </div>
      </div>

      {/* 회원가입 링크 */}
      <p className="text-center mt-6 text-gray-600">
        아직 계정이 없으신가요?{' '}
        <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          회원가입
        </Link>
      </p>
    </>
  )
}

// 로딩 폴백 컴포넌트
function LoginLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// 메인 페이지 컴포넌트 - Suspense로 감싸서 useSearchParams 에러 방지
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
