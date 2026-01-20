'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Loader2, Clock } from 'lucide-react'
import type {
  AcademySettings,
  AcademyUpdateRequest,
  OperatingHours,
} from '@/types/settings'
import { DAY_OF_WEEK_LABELS } from '@/types/settings'

interface AcademyFormProps {
  initialData?: AcademySettings | null
  onSave?: (data: AcademySettings) => void
}

export default function AcademyForm({ initialData, onSave }: AcademyFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    logoImage: initialData?.logoImage || null as string | null,
    businessNumber: initialData?.businessNumber || '',
    operatingHours: initialData?.operatingHours || getDefaultOperatingHours(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(!initialData)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 기본 운영 시간 생성
  function getDefaultOperatingHours(): OperatingHours[] {
    return [
      { dayOfWeek: 0, openTime: null, closeTime: null, isOpen: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isOpen: true },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isOpen: true },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isOpen: true },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isOpen: true },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isOpen: true },
      { dayOfWeek: 6, openTime: '10:00', closeTime: '18:00', isOpen: true },
    ]
  }

  // 초기 데이터 로드
  useEffect(() => {
    if (initialData) return

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/academy')
        const result = await response.json()

        if (result.success) {
          setFormData({
            name: result.data.name || '',
            address: result.data.address || '',
            phone: result.data.phone || '',
            logoImage: result.data.logoImage || null,
            businessNumber: result.data.businessNumber || '',
            operatingHours: result.data.operatingHours || getDefaultOperatingHours(),
          })
        }
      } catch {
        setError('학원 설정을 불러오는데 실패했습니다.')
      } finally {
        setIsFetching(false)
      }
    }

    fetchSettings()
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('파일 크기는 2MB 이하여야 합니다.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setError('JPG, PNG, WebP, SVG 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // TODO: 실제로는 Supabase Storage에 업로드
      const previewUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, logoImage: previewUrl }))
    } catch {
      setError('로고 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleOperatingHourChange = (
    dayOfWeek: number,
    field: 'isOpen' | 'openTime' | 'closeTime',
    value: boolean | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: prev.operatingHours.map((hours) =>
        hours.dayOfWeek === dayOfWeek
          ? {
              ...hours,
              [field]: value,
              // 휴무로 변경 시 시간 초기화
              ...(field === 'isOpen' && !value
                ? { openTime: null, closeTime: null }
                : {}),
            }
          : hours
      ),
    }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: AcademyUpdateRequest = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        logoImage: formData.logoImage,
        businessNumber: formData.businessNumber || null,
        operatingHours: formData.operatingHours,
      }

      const response = await fetch('/api/settings/academy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '학원 설정 저장에 실패했습니다.')
        return
      }

      setSuccess(true)
      onSave?.(result.data)

      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('학원 설정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="card flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-6">학원 설정</h3>

      <form onSubmit={handleSubmit}>
        {/* 로고 이미지 */}
        <div className="flex items-center gap-6 mb-8">
          <div
            onClick={handleLogoClick}
            className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer group hover:border-primary-500 transition-colors"
          >
            {formData.logoImage ? (
              <img
                src={formData.logoImage}
                alt="학원 로고"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Camera className="w-8 h-8" />
              </div>
            )}
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
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleLogoChange}
            className="hidden"
          />
          <div>
            <button
              type="button"
              onClick={handleLogoClick}
              className="btn-secondary mb-2"
              disabled={isUploading}
            >
              {isUploading ? '업로드 중...' : '로고 변경'}
            </button>
            <p className="text-sm text-gray-500">JPG, PNG, WebP, SVG (최대 2MB)</p>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="label">학원명 *</label>
            <input
              type="text"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="학원 이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="label">주소</label>
            <input
              type="text"
              name="address"
              className="input"
              value={formData.address}
              onChange={handleChange}
              placeholder="학원 주소를 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">대표 전화번호</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="02-0000-0000"
              />
            </div>
            <div>
              <label className="label">사업자 등록번호</label>
              <input
                type="text"
                name="businessNumber"
                className="input"
                value={formData.businessNumber}
                onChange={handleChange}
                placeholder="000-00-00000"
              />
            </div>
          </div>
        </div>

        {/* 운영 시간 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">운영 시간</h4>
          </div>

          <div className="space-y-2">
            {formData.operatingHours.map((hours) => (
              <div
                key={hours.dayOfWeek}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  hours.isOpen ? 'bg-gray-50' : 'bg-gray-100'
                }`}
              >
                <div className="w-16">
                  <span
                    className={`font-medium ${
                      hours.dayOfWeek === 0
                        ? 'text-red-600'
                        : hours.dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {DAY_OF_WEEK_LABELS[hours.dayOfWeek]}
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours.isOpen}
                    onChange={(e) =>
                      handleOperatingHourChange(hours.dayOfWeek, 'isOpen', e.target.checked)
                    }
                    className="w-4 h-4 rounded text-primary-500"
                  />
                  <span className="text-sm text-gray-600">영업</span>
                </label>

                {hours.isOpen && (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={hours.openTime || ''}
                      onChange={(e) =>
                        handleOperatingHourChange(hours.dayOfWeek, 'openTime', e.target.value)
                      }
                      className="input py-1 px-2 text-sm w-28"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="time"
                      value={hours.closeTime || ''}
                      onChange={(e) =>
                        handleOperatingHourChange(hours.dayOfWeek, 'closeTime', e.target.value)
                      }
                      className="input py-1 px-2 text-sm w-28"
                    />
                  </div>
                )}

                {!hours.isOpen && (
                  <span className="text-sm text-gray-400 ml-4">휴무</span>
                )}
              </div>
            ))}
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
            학원 설정이 성공적으로 저장되었습니다.
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
