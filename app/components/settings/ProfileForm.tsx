'use client'

import { useState, useRef } from 'react'
import { User, Camera, Loader2 } from 'lucide-react'
import type { ProfileSettings, ProfileUpdateRequest } from '@/types/settings'

interface ProfileFormProps {
  initialData?: ProfileSettings | null
  onSave?: (data: ProfileSettings) => void
}

export default function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    profileImage: initialData?.profileImage || null as string | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 검증 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('파일 크기는 2MB 이하여야 합니다.')
      return
    }

    // 파일 형식 검증
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPG, PNG, WebP 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // TODO: 실제로는 Supabase Storage에 업로드
      // Mock: 로컬 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, profileImage: previewUrl }))
    } catch {
      setError('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: ProfileUpdateRequest = {
        name: formData.name,
        phone: formData.phone || null,
        profileImage: formData.profileImage,
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '프로필 저장에 실패했습니다.')
        return
      }

      setSuccess(true)
      onSave?.(result.data)

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitial = () => {
    return formData.name ? formData.name.charAt(0).toUpperCase() : '?'
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-6">프로필 설정</h3>

      <form onSubmit={handleSubmit}>
        {/* 프로필 이미지 */}
        <div className="flex items-center gap-6 mb-8">
          <div
            onClick={handleImageClick}
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
          >
            {formData.profileImage ? (
              <img
                src={formData.profileImage}
                alt="프로필"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
                {getInitial()}
              </div>
            )}
            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
          <div>
            <button
              type="button"
              onClick={handleImageClick}
              className="btn-secondary mb-2"
              disabled={isUploading}
            >
              {isUploading ? '업로드 중...' : '사진 변경'}
            </button>
            <p className="text-sm text-gray-500">JPG, PNG 파일 (최대 2MB)</p>
          </div>
        </div>

        {/* 입력 필드들 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">이름 *</label>
              <input
                type="text"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                required
              />
            </div>
            <div>
              <label className="label">이메일</label>
              <input
                type="email"
                name="email"
                className="input bg-gray-50"
                value={formData.email}
                disabled
                title="이메일은 변경할 수 없습니다"
              />
              <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
            </div>
          </div>
          <div>
            <label className="label">전화번호</label>
            <input
              type="tel"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
            />
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
            프로필이 성공적으로 저장되었습니다.
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장하기'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
