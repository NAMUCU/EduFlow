'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import type { PasswordChangeRequest } from '@/types/settings'

interface PasswordFormProps {
  onSuccess?: () => void
}

export default function PasswordForm({ onSuccess }: PasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 비밀번호 유효성 검사 상태
  const passwordValidation = {
    minLength: formData.newPassword.length >= 8,
    hasLetter: /[a-zA-Z]/.test(formData.newPassword),
    hasNumber: /[0-9]/.test(formData.newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
    matches: formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0,
  }

  const isPasswordValid = passwordValidation.minLength && passwordValidation.hasLetter && passwordValidation.hasNumber

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // 클라이언트 측 유효성 검사
    if (!formData.currentPassword) {
      setError('현재 비밀번호를 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!isPasswordValid) {
      setError('새 비밀번호가 요구 조건을 충족하지 않습니다.')
      setIsLoading(false)
      return
    }

    if (!passwordValidation.matches) {
      setError('새 비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    try {
      const requestData: PasswordChangeRequest = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }

      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '비밀번호 변경에 실패했습니다.')
        return
      }

      setSuccess(true)
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      onSuccess?.()

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <li className={`flex items-center gap-2 ${valid ? 'text-green-600' : 'text-gray-500'}`}>
      {valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span>{text}</span>
    </li>
  )

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-6">비밀번호 변경</h3>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="label">현재 비밀번호 *</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                className="input pr-10"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="현재 비밀번호를 입력하세요"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="label">새 비밀번호 *</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                className="input pr-10"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="새 비밀번호를 입력하세요"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {/* 비밀번호 요구사항 */}
            {formData.newPassword && (
              <ul className="mt-2 space-y-1 text-sm">
                <ValidationItem valid={passwordValidation.minLength} text="최소 8자 이상" />
                <ValidationItem valid={passwordValidation.hasLetter} text="영문 포함" />
                <ValidationItem valid={passwordValidation.hasNumber} text="숫자 포함" />
                <ValidationItem valid={passwordValidation.hasSpecial} text="특수문자 포함 (권장)" />
              </ul>
            )}
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <label className="label">새 비밀번호 확인 *</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                className="input pr-10"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="새 비밀번호를 다시 입력하세요"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword && (
              <p className={`mt-1 text-sm ${passwordValidation.matches ? 'text-green-600' : 'text-red-600'}`}>
                {passwordValidation.matches ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
              </p>
            )}
          </div>
        </div>

        {/* 에러/성공 메시지 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            비밀번호가 성공적으로 변경되었습니다.
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !isPasswordValid || !passwordValidation.matches}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                변경 중...
              </>
            ) : (
              '비밀번호 변경'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
