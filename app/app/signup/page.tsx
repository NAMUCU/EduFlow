'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Mail, Lock, Eye, EyeOff, User, Building2, Phone } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    userType: 'academy', // academy, tutor
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    academyName: '',
    agreeTerms: false,
    agreeMarketing: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
    } else {
      // 나중에 Supabase 회원가입 연동
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">EduFlow</h1>
          <p className="text-gray-500 mt-2">새로운 계정을 만들어보세요</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 진행 표시 */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {step === 1 ? '기본 정보 입력' : '계정 정보 입력'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                {/* 사용자 유형 */}
                <div>
                  <label className="label">회원 유형</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, userType: 'academy' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.userType === 'academy'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Building2 className={`w-6 h-6 mb-2 ${
                        formData.userType === 'academy' ? 'text-primary-500' : 'text-gray-400'
                      }`} />
                      <p className="font-medium text-gray-900">학원 원장</p>
                      <p className="text-xs text-gray-500">학원 운영자</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, userType: 'tutor' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.userType === 'tutor'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className={`w-6 h-6 mb-2 ${
                        formData.userType === 'tutor' ? 'text-primary-500' : 'text-gray-400'
                      }`} />
                      <p className="font-medium text-gray-900">개인 강사</p>
                      <p className="text-xs text-gray-500">과외/프리랜서</p>
                    </button>
                  </div>
                </div>

                {/* 이름 */}
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
                    />
                  </div>
                </div>

                {/* 학원명 (학원 원장인 경우만) */}
                {formData.userType === 'academy' && (
                  <div>
                    <label className="label">학원명</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="OO수학학원"
                        className="input pl-12"
                        value={formData.academyName}
                        onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* 전화번호 */}
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
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
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
                      placeholder="8자 이상 입력하세요"
                      className="input pl-12 pr-12"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {/* 비밀번호 확인 */}
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
                    />
                  </div>
                </div>

                {/* 약관 동의 */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    />
                    <span className="text-sm text-gray-600">
                      <span className="text-primary-600 font-medium">이용약관</span> 및{' '}
                      <span className="text-primary-600 font-medium">개인정보처리방침</span>에 동의합니다 (필수)
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
              </>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary py-3"
                >
                  이전
                </button>
              )}
              <button type="submit" className="flex-1 btn-primary py-3 text-lg">
                {step === 1 ? '다음' : '가입하기'}
              </button>
            </div>
          </form>
        </div>

        {/* 로그인 링크 */}
        <p className="text-center mt-6 text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
