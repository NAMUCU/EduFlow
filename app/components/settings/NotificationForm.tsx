'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type {
  NotificationSettings,
  NotificationChannels,
  NotificationTypes,
  NotificationUpdateRequest,
} from '@/types/settings'
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '@/types/settings'

interface NotificationFormProps {
  initialData?: NotificationSettings | null
  onSave?: (data: NotificationSettings) => void
}

export default function NotificationForm({ initialData, onSave }: NotificationFormProps) {
  const [channels, setChannels] = useState<NotificationChannels>({
    email: initialData?.channels?.email ?? true,
    sms: initialData?.channels?.sms ?? true,
    push: initialData?.channels?.push ?? false,
  })

  const [types, setTypes] = useState<NotificationTypes>({
    reportReminder: initialData?.types?.reportReminder ?? true,
    assignmentReminder: initialData?.types?.assignmentReminder ?? true,
    gradeUpdate: initialData?.types?.gradeUpdate ?? true,
    consultationReminder: initialData?.types?.consultationReminder ?? true,
    systemNotice: initialData?.types?.systemNotice ?? true,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    if (initialData) return

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/notifications')
        const result = await response.json()

        if (result.success) {
          setChannels(result.data.channels)
          setTypes(result.data.types)
        }
      } catch {
        setError('알림 설정을 불러오는데 실패했습니다.')
      } finally {
        setIsFetching(false)
      }
    }

    fetchSettings()
  }, [initialData])

  const handleChannelChange = (key: keyof NotificationChannels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }))
    setError(null)
    setSuccess(false)
  }

  const handleTypeChange = (key: keyof NotificationTypes) => {
    setTypes((prev) => ({ ...prev, [key]: !prev[key] }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: NotificationUpdateRequest = {
        channels,
        types,
      }

      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '알림 설정 저장에 실패했습니다.')
        return
      }

      setSuccess(true)
      onSave?.(result.data)

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('알림 설정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const Toggle = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean
    onChange: () => void
    disabled?: boolean
  }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
    </label>
  )

  if (isFetching) {
    return (
      <div className="card flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-6">알림 설정</h3>

      <div className="space-y-6">
        {/* 알림 수신 방법 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">알림 수신 방법</h4>
          <div className="space-y-3">
            {(Object.keys(NOTIFICATION_CHANNEL_LABELS) as Array<keyof NotificationChannels>).map((key) => {
              const { label, description } = NOTIFICATION_CHANNEL_LABELS[key]
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                  <Toggle
                    checked={channels[key]}
                    onChange={() => handleChannelChange(key)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 알림 종류 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">알림 종류</h4>
          <div className="space-y-3">
            {(Object.keys(NOTIFICATION_TYPE_LABELS) as Array<keyof NotificationTypes>).map((key) => {
              const { label, description } = NOTIFICATION_TYPE_LABELS[key]
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                  <Toggle
                    checked={types[key]}
                    onChange={() => handleTypeChange(key)}
                  />
                </div>
              )
            })}
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
          알림 설정이 성공적으로 저장되었습니다.
        </div>
      )}

      {/* 저장 버튼 */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleSubmit}
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
    </div>
  )
}
