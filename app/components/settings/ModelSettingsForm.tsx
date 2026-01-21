'use client'

import { useState } from 'react'
import { Loader2, Cpu, Eye } from 'lucide-react'
import type {
  ModelSettings,
  ModelSettingsUpdateRequest,
  ChatModel,
  VisionModel,
} from '@/types/settings'
import {
  CHAT_MODEL_LABELS,
  VISION_MODEL_LABELS,
  DEFAULT_MODEL_SETTINGS,
} from '@/types/settings'

interface ModelSettingsFormProps {
  initialData?: ModelSettings | null
  onSave?: (data: ModelSettings) => void
}

export default function ModelSettingsForm({ initialData, onSave }: ModelSettingsFormProps) {
  const [formData, setFormData] = useState<ModelSettings>({
    chatModel: initialData?.chatModel || DEFAULT_MODEL_SETTINGS.chatModel,
    visionModel: initialData?.visionModel || DEFAULT_MODEL_SETTINGS.visionModel,
    embeddingModel: initialData?.embeddingModel || DEFAULT_MODEL_SETTINGS.embeddingModel,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChatModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ChatModel
    setFormData((prev) => ({ ...prev, chatModel: value }))
    setError(null)
    setSuccess(false)
  }

  const handleVisionModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as VisionModel
    setFormData((prev) => ({ ...prev, visionModel: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: ModelSettingsUpdateRequest = {
        chatModel: formData.chatModel,
        visionModel: formData.visionModel,
      }

      const response = await fetch('/api/settings/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '모델 설정 저장에 실패했습니다.')
        return
      }

      setSuccess(true)
      onSave?.(result.data)

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('모델 설정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const chatModelOptions = Object.entries(CHAT_MODEL_LABELS) as [ChatModel, typeof CHAT_MODEL_LABELS[ChatModel]][]
  const visionModelOptions = Object.entries(VISION_MODEL_LABELS) as [VisionModel, typeof VISION_MODEL_LABELS[VisionModel]][]

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-6">AI 모델 설정</h3>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* 채팅 모델 선택 */}
          <div>
            <label className="label flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gray-500" />
              채팅 모델
            </label>
            <select
              className="input"
              value={formData.chatModel}
              onChange={handleChatModelChange}
            >
              {chatModelOptions.map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {CHAT_MODEL_LABELS[formData.chatModel].description}
            </p>
          </div>

          {/* 비전 모델 선택 */}
          <div>
            <label className="label flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              비전 모델
            </label>
            <select
              className="input"
              value={formData.visionModel}
              onChange={handleVisionModelChange}
            >
              {visionModelOptions.map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {VISION_MODEL_LABELS[formData.visionModel].description}
            </p>
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
            모델 설정이 성공적으로 저장되었습니다.
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
