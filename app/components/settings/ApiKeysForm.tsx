'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { ApiKeySettings, ApiKeyUpdateRequest } from '@/types/settings'
import { API_KEY_LABELS, DEFAULT_API_KEY_SETTINGS } from '@/types/settings'

interface ApiKeysFormProps {
  initialData?: ApiKeySettings | null
  onSave?: (data: ApiKeySettings) => void
}

/** API 키를 마스킹하여 표시 (앞 4자리...뒤 4자리) */
const maskApiKey = (key: string | null): string => {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`
}

/** 입력 필드의 키 이름 */
type ApiKeyField = keyof ApiKeySettings

export default function ApiKeysForm({ initialData, onSave }: ApiKeysFormProps) {
  // 폼 데이터 상태 (실제 값 저장)
  const [formData, setFormData] = useState<ApiKeySettings>({
    geminiKey: initialData?.geminiKey || null,
    anthropicKey: initialData?.anthropicKey || null,
    openaiKey: initialData?.openaiKey || null,
    googleVisionKey: initialData?.googleVisionKey || null,
    pdfcoKey: initialData?.pdfcoKey || null,
  })

  // 각 필드별 입력 모드 (편집 중인지 여부)
  const [editingFields, setEditingFields] = useState<Record<ApiKeyField, boolean>>({
    geminiKey: false,
    anthropicKey: false,
    openaiKey: false,
    googleVisionKey: false,
    pdfcoKey: false,
  })

  // 각 필드별 값 표시 여부
  const [showValues, setShowValues] = useState<Record<ApiKeyField, boolean>>({
    geminiKey: false,
    anthropicKey: false,
    openaiKey: false,
    googleVisionKey: false,
    pdfcoKey: false,
  })

  // 임시 입력값 (편집 중일 때)
  const [tempValues, setTempValues] = useState<Record<ApiKeyField, string>>({
    geminiKey: '',
    anthropicKey: '',
    openaiKey: '',
    googleVisionKey: '',
    pdfcoKey: '',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 표시할 API 키 필드 목록 (요청된 3개만)
  const displayFields: ApiKeyField[] = ['geminiKey', 'anthropicKey', 'openaiKey']

  /** 필드 편집 시작 */
  const handleEditStart = (field: ApiKeyField) => {
    setEditingFields((prev) => ({ ...prev, [field]: true }))
    setTempValues((prev) => ({ ...prev, [field]: formData[field] || '' }))
    setError(null)
    setSuccess(false)
  }

  /** 필드 편집 취소 */
  const handleEditCancel = (field: ApiKeyField) => {
    setEditingFields((prev) => ({ ...prev, [field]: false }))
    setTempValues((prev) => ({ ...prev, [field]: '' }))
  }

  /** 임시 입력값 변경 */
  const handleTempChange = (field: ApiKeyField, value: string) => {
    setTempValues((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  /** 필드 편집 완료 (로컬 저장) */
  const handleEditConfirm = (field: ApiKeyField) => {
    setFormData((prev) => ({
      ...prev,
      [field]: tempValues[field] || null,
    }))
    setEditingFields((prev) => ({ ...prev, [field]: false }))
  }

  /** 값 표시/숨김 토글 */
  const toggleShowValue = (field: ApiKeyField) => {
    setShowValues((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  /** 저장 제출 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: ApiKeyUpdateRequest = {
        geminiKey: formData.geminiKey,
        anthropicKey: formData.anthropicKey,
        openaiKey: formData.openaiKey,
        googleVisionKey: formData.googleVisionKey,
        pdfcoKey: formData.pdfcoKey,
      }

      const response = await fetch('/api/settings/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'API 키 저장에 실패했습니다.')
        return
      }

      setSuccess(true)
      onSave?.(result.data)

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('API 키 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  /** 키가 설정되어 있는지 확인 */
  const hasKeyValue = (field: ApiKeyField): boolean => {
    return !!formData[field]
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Key className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">API 키 설정</h3>
          <p className="text-sm text-gray-500">AI 서비스 연동을 위한 API 키를 관리합니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {displayFields.map((field) => {
            const config = API_KEY_LABELS[field]
            const isEditing = editingFields[field]
            const showValue = showValues[field]
            const hasValue = hasKeyValue(field)

            return (
              <div key={field} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="font-medium text-gray-900 flex items-center gap-2">
                      {config.label}
                      {config.required && (
                        <span className="text-xs text-red-500">필수</span>
                      )}
                    </label>
                    <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                  {hasValue && !isEditing && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">설정됨</span>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  // 편집 모드
                  <div className="flex gap-2 mt-3">
                    <div className="relative flex-1">
                      <input
                        type={showValue ? 'text' : 'password'}
                        className="input w-full pr-10"
                        value={tempValues[field]}
                        onChange={(e) => handleTempChange(field, e.target.value)}
                        placeholder={`${config.label}를 입력하세요`}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowValue(field)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showValue ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditConfirm(field)}
                      className="btn-primary px-4"
                    >
                      확인
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCancel(field)}
                      className="btn-secondary px-4"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  // 보기 모드
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-600">
                        {hasValue ? (
                          showValue ? formData[field] : maskApiKey(formData[field])
                        ) : (
                          <span className="text-gray-400">설정되지 않음</span>
                        )}
                      </span>
                      {hasValue && (
                        <button
                          type="button"
                          onClick={() => toggleShowValue(field)}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          {showValue ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditStart(field)}
                      className="btn-secondary px-4"
                    >
                      {hasValue ? '변경' : '설정'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 보안 안내 */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">보안 안내</p>
              <ul className="list-disc list-inside space-y-1 text-amber-600">
                <li>API 키는 암호화되어 안전하게 저장됩니다</li>
                <li>API 키는 외부에 노출되지 않도록 주의해주세요</li>
                <li>각 서비스의 콘솔에서 API 키를 발급받을 수 있습니다</li>
              </ul>
            </div>
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
            API 키가 성공적으로 저장되었습니다.
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
