'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 나중에 Supabase 인증 연동
    // 지금은 바로 대시보드로 이동
    router.push('/dashboard')
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
          <p className="text-gray-500 mt-2">학원 관리의 새로운 기준</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="비밀번호를 입력하세요"
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

            {/* 옵션 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-gray-600">로그인 상태 유지</span>
              </label>
              <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                비밀번호 찾기
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button type="submit" className="w-full btn-primary py-3 text-lg">
              로그인
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
            <button className="w-full btn-secondary flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
            <button className="w-full btn-secondary flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FEE500">
                <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.747 1.842 5.166 4.598 6.52-.146.53-.94 3.41-.97 3.63 0 0-.02.166.087.23.107.063.234.007.234.007.31-.043 3.59-2.357 4.158-2.76.615.087 1.25.13 1.893.13 5.523 0 10-3.463 10-7.757C22 6.463 17.523 3 12 3z"/>
              </svg>
              카카오로 계속하기
            </button>
          </div>
        </div>

        {/* 회원가입 링크 */}
        <p className="text-center mt-6 text-gray-600">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
