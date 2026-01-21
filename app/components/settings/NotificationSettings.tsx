'use client'

import { useState, useEffect } from 'react'
import { Loader2, Clock, Bell, MessageSquare, Smartphone, Mail, AlertCircle } from 'lucide-react'
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

/**
 * 확장된 알림 채널 타입 (카카오톡 포함)
 */
interface ExtendedNotificationChannels extends NotificationChannels {
  kakao: boolean  // 카카오톡 알림 채널 추가
}

/**
 * 알림 시간 설정
 */
interface NotificationTimeSettings {
  enabled: boolean        // 알림 시간 제한 활성화
  startTime: string       // 알림 시작 시간 (HH:mm)
  endTime: string         // 알림 종료 시간 (HH:mm)
  timezone: string        // 시간대
}

/**
 * 확장된 알림 설정 타입
 */
interface ExtendedNotificationSettings {
  channels: ExtendedNotificationChannels
  types: NotificationTypes
  timeSettings: NotificationTimeSettings
}

interface NotificationSettingsProps {
  initialData?: NotificationSettings | null
  onSave?: (data: NotificationSettings) => void
}

/** 확장된 알림 채널 라벨 */
const EXTENDED_CHANNEL_LABELS = {
  ...NOTIFICATION_CHANNEL_LABELS,
  kakao: {
    label: '카카오톡 알림',
    description: '카카오톡 알림톡으로 알림을 받습니다',
    icon: MessageSquare,
  },
}

/** 기본 시간 설정 */
const DEFAULT_TIME_SETTINGS: NotificationTimeSettings = {
  enabled: false,
  startTime: '09:00',
  endTime: '21:00',
  timezone: 'Asia/Seoul',
}

/**
 * 알림 설정 컴포넌트
 *
 * 기능:
 * - 알림 채널 선택 (SMS, 카카오톡, 이메일, 푸시)
 * - 알림 유형별 On/Off
 * - 알림 시간대 설정
 */
export default function NotificationSettings({ initialData, onSave }: NotificationSettingsProps) {
  const [channels, setChannels] = useState<ExtendedNotificationChannels>({
    email: initialData?.channels?.email ?? true,
    sms: initialData?.channels?.sms ?? true,
    push: initialData?.channels?.push ?? false,
    kakao: true, // 카카오톡 기본 활성화
  })

  const [types, setTypes] = useState<NotificationTypes>({
    reportReminder: initialData?.types?.reportReminder ?? true,
    assignmentReminder: initialData?.types?.assignmentReminder ?? true,
    gradeUpdate: initialData?.types?.gradeUpdate ?? true,
    consultationReminder: initialData?.types?.consultationReminder ?? true,
    systemNotice: initialData?.types?.systemNotice ?? true,
  })

  const [timeSettings, setTimeSettings] = useState<NotificationTimeSettings>(DEFAULT_TIME_SETTINGS)

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
          setChannels({
            ...result.data.channels,
            kakao: result.data.channels?.kakao ?? true,
          })
          setTypes(result.data.types)
          if (result.data.timeSettings) {
            setTimeSettings(result.data.timeSettings)
          }
        }
      } catch {
        setError('알림 설정을 불러오는데 실패했습니다.')
      } finally {
        setIsFetching(false)
      }
    }

    fetchSettings()
  }, [initialData])

  const handleChannelChange = (key: keyof ExtendedNotificationChannels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }))
    setError(null)
    setSuccess(false)
  }

  const handleTypeChange = (key: keyof NotificationTypes) => {
    setTypes((prev) => ({ ...prev, [key]: !prev[key] }))
    setError(null)
    setSuccess(false)
  }

  const handleTimeSettingChange = (field: keyof NotificationTimeSettings, value: string | boolean) => {
    setTimeSettings((prev) => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // 시간 유효성 검사
      if (timeSettings.enabled) {
        const startMinutes = timeToMinutes(timeSettings.startTime)
        const endMinutes = timeToMinutes(timeSettings.endTime)

        if (startMinutes >= endMinutes) {
          setError('알림 시작 시간은 종료 시간보다 이전이어야 합니다.')
          setIsLoading(false)
          return
        }
      }

      const updateData = {
        channels,
        types,
        timeSettings,
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

  const getChannelIcon = (key: string) => {
    switch (key) {
      case 'email':
        return Mail
      case 'sms':
        return Smartphone
      case 'kakao':
        return MessageSquare
      case 'push':
        return Bell
      default:
        return Bell
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
      <h3 className="text-lg font-bold text-gray-900 mb-6">알림 설정</h3>

      <div className="space-y-8">
        {/* 알림 수신 채널 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">알림 수신 채널</h4>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            알림을 받을 채널을 선택하세요. 여러 채널을 동시에 활성화할 수 있습니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(EXTENDED_CHANNEL_LABELS) as Array<keyof ExtendedNotificationChannels>).map((key) => {
              const config = EXTENDED_CHANNEL_LABELS[key as keyof typeof EXTENDED_CHANNEL_LABELS]
              const IconComponent = getChannelIcon(key)

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    channels[key]
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      channels[key] ? 'bg-primary-100' : 'bg-gray-200'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        channels[key] ? 'text-primary-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
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
          <p className="text-sm text-gray-500 mb-4">
            받고 싶은 알림 유형을 선택하세요.
          </p>
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

        {/* 알림 시간 설정 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">알림 시간 설정</h4>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            특정 시간대에만 알림을 받도록 설정할 수 있습니다.
          </p>

          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            {/* 시간 제한 활성화 토글 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">알림 시간 제한</p>
                <p className="text-sm text-gray-500">지정한 시간 외에는 알림을 받지 않습니다</p>
              </div>
              <Toggle
                checked={timeSettings.enabled}
                onChange={() => handleTimeSettingChange('enabled', !timeSettings.enabled)}
              />
            </div>

            {/* 시간 설정 (활성화된 경우만 표시) */}
            {timeSettings.enabled && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">시작 시간</label>
                    <input
                      type="time"
                      className="input"
                      value={timeSettings.startTime}
                      onChange={(e) => handleTimeSettingChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">종료 시간</label>
                    <input
                      type="time"
                      className="input"
                      value={timeSettings.endTime}
                      onChange={(e) => handleTimeSettingChange('endTime', e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    {timeSettings.startTime} ~ {timeSettings.endTime} 사이에만 알림을 받습니다.
                    긴급 알림은 시간 설정과 관계없이 발송됩니다.
                  </p>
                </div>
              </div>
            )}
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

/** 시간 문자열을 분 단위로 변환 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
