'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      alert('이메일을 입력해주세요.')
      return
    }

    setIsLoading(true)

    // TODO: Supabase 비밀번호 재설정 이메일 발송 연동
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSent(true)
    setIsLoading(false)
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {!isSent ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              비밀번호 찾기
            </h2>
            <p className="text-gray-600 mb-6">
              가입하신 이메일 주소를 입력하시면<br />
              비밀번호 재설정 링크를 보내드립니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="example@email.com"
                    className="input pl-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  '발송 중...'
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    재설정 링크 발송
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              이메일 발송 완료
            </h3>
            <p className="text-gray-600 mb-6">
              <span className="font-medium text-primary-600">{email}</span>
              <br />
              위 주소로 비밀번호 재설정 링크를 보냈습니다.
              <br />
              이메일을 확인해주세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSent(false)
                  setEmail('')
                }}
                className="w-full btn-secondary py-3"
              >
                다른 이메일로 다시 시도
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 로그인으로 돌아가기 */}
      <div className="text-center mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          로그인으로 돌아가기
        </Link>
      </div>
    </>
  )
}
