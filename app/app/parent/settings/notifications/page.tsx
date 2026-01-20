'use client';

import { Suspense, memo, useCallback } from 'react';
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  Moon,
  FileText,
  Loader2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import {
  ParentNotificationChannels,
  ParentNotificationTypes,
  PARENT_NOTIFICATION_CHANNEL_LABELS,
  PARENT_NOTIFICATION_TYPE_LABELS,
  PREFERRED_DAY_LABELS,
} from '@/types/settings';

/**
 * 학부모 알림 설정 페이지 (PRD F5)
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 설정 데이터 캐싱
 * - rerender-memo: 토글 컴포넌트 메모이제이션
 * - rerender-functional-setstate: 설정 변경 시 함수형 setState
 */

// UI 텍스트 상수
const UI_TEXT = {
  title: '알림 설정',
  subtitle: '자녀의 학습 현황 알림을 원하는 방식으로 받아보세요',
  loading: '설정을 불러오는 중...',
  saving: '저장 중...',
  saveSuccess: '설정이 저장되었습니다',
  saveError: '저장 중 오류가 발생했습니다',
  resetButton: '기본값으로 초기화',
  resetConfirm: '모든 알림 설정을 기본값으로 초기화하시겠습니까?',

  // 섹션 제목
  channelSection: '알림 수신 채널',
  channelDescription: '알림을 받을 방법을 선택하세요',
  typeSection: '알림 유형',
  typeDescription: '받고 싶은 알림 종류를 선택하세요',
  quietHoursSection: '방해금지 시간',
  quietHoursDescription: '이 시간에는 알림을 받지 않습니다',
  reportSection: '학습 보고서',
  reportDescription: '정기 학습 보고서 수신 설정',

  // 방해금지 시간
  quietHoursEnabled: '방해금지 시간 활성화',
  quietHoursStart: '시작 시간',
  quietHoursEnd: '종료 시간',

  // 보고서
  weeklyReport: '주간 보고서',
  weeklyReportDesc: '매주 자녀의 학습 현황을 요약해 보내드립니다',
  monthlyReport: '월간 보고서',
  monthlyReportDesc: '매월 자녀의 학습 성과를 분석해 보내드립니다',
  preferredDay: '보고서 수신 요일',
  preferredDayDesc: '보고서를 받고 싶은 요일을 선택하세요',
};

// 채널 아이콘 매핑
const CHANNEL_ICONS: Record<keyof ParentNotificationChannels, React.ReactNode> = {
  sms: <MessageSquare className="w-5 h-5" />,
  kakao: <MessageSquare className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  push: <Smartphone className="w-5 h-5" />,
};

// 알림 유형 아이콘 매핑
const TYPE_ICONS: Record<keyof ParentNotificationTypes, React.ReactNode> = {
  assignment: <FileText className="w-5 h-5" />,
  grade: <CheckCircle2 className="w-5 h-5" />,
  attendance: <Clock className="w-5 h-5" />,
  consultation: <MessageSquare className="w-5 h-5" />,
  notice: <Bell className="w-5 h-5" />,
};

// ============================================
// 메모이제이션된 토글 컴포넌트
// ============================================

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * 토글 스위치 컴포넌트
 *
 * Vercel Best Practice: rerender-memo
 * - React.memo로 불필요한 리렌더링 방지
 * - enabled/onToggle이 변경되지 않으면 리렌더링하지 않음
 */
const ToggleSwitch = memo(function ToggleSwitch({
  enabled,
  onToggle,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full
          bg-white shadow ring-0 transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
});

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * 설정 항목 컴포넌트
 *
 * Vercel Best Practice: rerender-memo
 * - 개별 설정 항목을 메모이제이션하여 다른 항목 변경 시 리렌더링 방지
 */
const SettingItem = memo(function SettingItem({
  icon,
  label,
  description,
  enabled,
  onToggle,
  disabled = false,
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg text-indigo-600">
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onToggle={onToggle} disabled={disabled} />
    </div>
  );
});

// ============================================
// 섹션 컴포넌트
// ============================================

interface SectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, description, icon, children }: SectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="text-indigo-600">{icon}</div>
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

// ============================================
// 알림 설정 콘텐츠 컴포넌트
// ============================================

function NotificationSettingsContent() {
  // 임시 사용자 ID (실제로는 인증 컨텍스트에서 가져와야 함)
  const userId = 'parent-user-123';

  const {
    settings,
    isLoading,
    isSaving,
    saveError,
    toggleChannel,
    toggleType,
    toggleQuietHours,
    updateQuietHours,
    updateReports,
    resetToDefaults,
  } = useNotificationSettings(userId);

  /**
   * 방해금지 시작 시간 변경
   *
   * Vercel Best Practice: rerender-functional-setstate
   * - useCallback으로 핸들러 메모이제이션
   */
  const handleQuietHoursStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateQuietHours({ start: e.target.value });
    },
    [updateQuietHours]
  );

  /**
   * 방해금지 종료 시간 변경
   */
  const handleQuietHoursEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateQuietHours({ end: e.target.value });
    },
    [updateQuietHours]
  );

  /**
   * 주간 보고서 토글
   */
  const handleWeeklyToggle = useCallback(() => {
    updateReports({ weekly: !settings.reports.weekly });
  }, [settings.reports.weekly, updateReports]);

  /**
   * 월간 보고서 토글
   */
  const handleMonthlyToggle = useCallback(() => {
    updateReports({ monthly: !settings.reports.monthly });
  }, [settings.reports.monthly, updateReports]);

  /**
   * 선호 요일 변경
   */
  const handlePreferredDayChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateReports({ preferredDay: parseInt(e.target.value, 10) });
    },
    [updateReports]
  );

  /**
   * 기본값 초기화
   */
  const handleReset = useCallback(() => {
    if (window.confirm(UI_TEXT.resetConfirm)) {
      resetToDefaults();
    }
  }, [resetToDefaults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
        <span className="text-gray-500 text-lg">{UI_TEXT.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 저장 상태 알림 */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{UI_TEXT.saving}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{saveError}</span>
        </div>
      )}

      {/* 알림 수신 채널 섹션 */}
      <Section
        title={UI_TEXT.channelSection}
        description={UI_TEXT.channelDescription}
        icon={<Bell className="w-5 h-5" />}
      >
        {(Object.keys(PARENT_NOTIFICATION_CHANNEL_LABELS) as Array<keyof ParentNotificationChannels>).map(
          (channel) => (
            <SettingItem
              key={channel}
              icon={CHANNEL_ICONS[channel]}
              label={PARENT_NOTIFICATION_CHANNEL_LABELS[channel].label}
              description={PARENT_NOTIFICATION_CHANNEL_LABELS[channel].description}
              enabled={settings.channels[channel]}
              onToggle={() => toggleChannel(channel)}
              disabled={isSaving}
            />
          )
        )}
      </Section>

      {/* 알림 유형 섹션 */}
      <Section
        title={UI_TEXT.typeSection}
        description={UI_TEXT.typeDescription}
        icon={<CheckCircle2 className="w-5 h-5" />}
      >
        {(Object.keys(PARENT_NOTIFICATION_TYPE_LABELS) as Array<keyof ParentNotificationTypes>).map(
          (type) => (
            <SettingItem
              key={type}
              icon={TYPE_ICONS[type]}
              label={PARENT_NOTIFICATION_TYPE_LABELS[type].label}
              description={PARENT_NOTIFICATION_TYPE_LABELS[type].description}
              enabled={settings.types[type]}
              onToggle={() => toggleType(type)}
              disabled={isSaving}
            />
          )
        )}
      </Section>

      {/* 방해금지 시간 섹션 */}
      <Section
        title={UI_TEXT.quietHoursSection}
        description={UI_TEXT.quietHoursDescription}
        icon={<Moon className="w-5 h-5" />}
      >
        <div className="p-4 space-y-4">
          {/* 방해금지 활성화 토글 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{UI_TEXT.quietHoursEnabled}</p>
              <p className="text-sm text-gray-500">활성화하면 설정된 시간에 알림을 받지 않습니다</p>
            </div>
            <ToggleSwitch
              enabled={settings.quietHours.enabled}
              onToggle={toggleQuietHours}
              disabled={isSaving}
            />
          </div>

          {/* 시간 설정 (활성화된 경우에만 표시) */}
          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {UI_TEXT.quietHoursStart}
                </label>
                <input
                  type="time"
                  value={settings.quietHours.start}
                  onChange={handleQuietHoursStartChange}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {UI_TEXT.quietHoursEnd}
                </label>
                <input
                  type="time"
                  value={settings.quietHours.end}
                  onChange={handleQuietHoursEndChange}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 학습 보고서 섹션 */}
      <Section
        title={UI_TEXT.reportSection}
        description={UI_TEXT.reportDescription}
        icon={<FileText className="w-5 h-5" />}
      >
        <div className="p-4 space-y-4">
          {/* 주간 보고서 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">{UI_TEXT.weeklyReport}</p>
              <p className="text-sm text-gray-500">{UI_TEXT.weeklyReportDesc}</p>
            </div>
            <ToggleSwitch
              enabled={settings.reports.weekly}
              onToggle={handleWeeklyToggle}
              disabled={isSaving}
            />
          </div>

          {/* 월간 보고서 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">{UI_TEXT.monthlyReport}</p>
              <p className="text-sm text-gray-500">{UI_TEXT.monthlyReportDesc}</p>
            </div>
            <ToggleSwitch
              enabled={settings.reports.monthly}
              onToggle={handleMonthlyToggle}
              disabled={isSaving}
            />
          </div>

          {/* 선호 요일 선택 */}
          {(settings.reports.weekly || settings.reports.monthly) && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {UI_TEXT.preferredDay}
              </label>
              <p className="text-sm text-gray-500 mb-2">{UI_TEXT.preferredDayDesc}</p>
              <select
                value={settings.reports.preferredDay}
                onChange={handlePreferredDayChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              >
                {Object.entries(PREFERRED_DAY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Section>

      {/* 초기화 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          {UI_TEXT.resetButton}
        </button>
      </div>
    </div>
  );
}

// ============================================
// 로딩 스켈레톤
// ============================================

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-48" />
                  </div>
                </div>
                <div className="w-11 h-6 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 페이지 컴포넌트
// ============================================

export default function ParentNotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Bell className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.title}</h1>
            <p className="text-gray-500">{UI_TEXT.subtitle}</p>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-8 max-w-4xl mx-auto">
        <Suspense fallback={<SettingsSkeleton />}>
          <NotificationSettingsContent />
        </Suspense>
      </main>
    </div>
  );
}
