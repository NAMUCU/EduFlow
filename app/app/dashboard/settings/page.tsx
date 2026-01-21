'use client'

import { useState, useRef, startTransition, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import {
  User,
  Bell,
  Lock,
  Building2,
  Palette,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Key,
  Cpu,
} from 'lucide-react'
import type { ProfileSettings, NotificationSettings, AcademySettings, ApiKeySettings, ModelSettings } from '@/types/settings'

// 설정 컴포넌트 동적 임포트 (bundle-dynamic-imports)
// 무거운 폼 컴포넌트를 초기 번들에서 제외하여 TTI 개선
const ProfileForm = dynamic(
  () => import('@/components/settings/ProfileForm'),
  { ssr: false, loading: () => <SettingsPanelSkeleton /> }
)

const PasswordForm = dynamic(
  () => import('@/components/settings/PasswordForm'),
  { ssr: false, loading: () => <SettingsPanelSkeleton /> }
)

const NotificationForm = dynamic(
  () => import('@/components/settings/NotificationForm'),
  { ssr: false, loading: () => <SettingsPanelSkeleton /> }
)

const AcademyForm = dynamic(
  () => import('@/components/settings/AcademyForm'),
  { ssr: false, loading: () => <SettingsPanelSkeleton /> }
)

const ApiKeysForm = dynamic(
  () => import('@/components/settings/ApiKeysForm'),
  { ssr: false, loading: () => <SettingsPanelSkeleton /> }
)

const ModelSettingsForm = dynamic(
  () => import('@/components/settings/ModelSettingsForm'),
  { ssr: false, loading: () => <SettingsPanelSkeleton /> }
)

// 로딩 스켈레톤 컴포넌트
function SettingsPanelSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

// 사용자 역할 타입 (실제로는 세션에서 가져옴)
type UserRole = 'owner' | 'teacher' | 'student' | 'parent'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  // 사용자 역할 (Mock: 원장으로 설정)
  const [userRole] = useState<UserRole>('owner')

  // 설정 데이터를 ref로 저장 (rerender-defer-reads)
  // 콜백에서만 사용하므로 상태 구독 제거하여 불필요한 리렌더링 방지
  const profileDataRef = useRef<ProfileSettings | null>(null)
  const notificationDataRef = useRef<NotificationSettings | null>(null)
  const academyDataRef = useRef<AcademySettings | null>(null)
  const apiKeysDataRef = useRef<ApiKeySettings | null>(null)
  const modelSettingsDataRef = useRef<ModelSettings | null>(null)

  // 화면 설정 (로컬 상태)
  const [theme, setTheme] = useState('light')

  // AI 설정 (로컬 상태)
  const [aiSettings, setAiSettings] = useState({
    aiModel: 'gemini',
    autoReview: true,
    reviewModels: ['gemini', 'gpt'] as string[],
  })

  // 탭 목록 (역할에 따라 동적 생성)
  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'password', label: '비밀번호', icon: Lock },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    ...(userRole === 'owner' ? [{ id: 'academy', label: '학원 설정', icon: Building2 }] : []),
    { id: 'appearance', label: '화면 설정', icon: Palette },
    { id: 'apiKeys', label: 'API 키 관리', icon: Key },
    { id: 'modelSettings', label: '모델 설정', icon: Cpu },
    { id: 'ai', label: 'AI 설정', icon: Smartphone },
    { id: 'billing', label: '결제/구독', icon: CreditCard },
    { id: 'help', label: '도움말', icon: HelpCircle },
  ]

  // 탭 전환 핸들러 (rerender-transitions)
  // startTransition으로 탭 전환을 non-urgent 업데이트로 표시하여 UI 반응성 유지
  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      setActiveTab(tabId)
    })
  }

  const handleLogout = () => {
    // TODO: 실제 로그아웃 로직 구현
    if (confirm('로그아웃 하시겠습니까?')) {
      window.location.href = '/login'
    }
  }

  // 설정 데이터 저장 핸들러 (ref에 저장하여 리렌더링 방지)
  const handleProfileSave = (data: ProfileSettings) => {
    profileDataRef.current = data
  }

  const handleNotificationSave = (data: NotificationSettings) => {
    notificationDataRef.current = data
  }

  const handleAcademySave = (data: AcademySettings) => {
    academyDataRef.current = data
  }

  const handleApiKeysSave = (data: ApiKeySettings) => {
    apiKeysDataRef.current = data
  }

  const handleModelSettingsSave = (data: ModelSettings) => {
    modelSettingsDataRef.current = data
  }

  return (
    <div>
      <Header
        title="설정"
        subtitle="계정 및 서비스 설정을 관리합니다"
      />

      <div className="p-8">
        <div className="grid grid-cols-4 gap-6">
          {/* 사이드 탭 */}
          <div className="col-span-1">
            <div className="card p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          </div>

          {/* 설정 내용 (bundle-conditional) */}
          {/* 활성화된 탭의 컴포넌트만 렌더링하여 불필요한 모듈 로딩 방지 */}
          <div className="col-span-3">
            <Suspense fallback={<SettingsPanelSkeleton />}>
              {/* 프로필 */}
              {activeTab === 'profile' && (
                <ProfileForm
                  initialData={profileDataRef.current}
                  onSave={handleProfileSave}
                />
              )}

              {/* 비밀번호 */}
              {activeTab === 'password' && <PasswordForm />}

              {/* 알림 설정 */}
              {activeTab === 'notifications' && (
                <NotificationForm
                  initialData={notificationDataRef.current}
                  onSave={handleNotificationSave}
                />
              )}

              {/* 학원 설정 (원장 전용) */}
              {activeTab === 'academy' && userRole === 'owner' && (
                <AcademyForm
                  initialData={academyDataRef.current}
                  onSave={handleAcademySave}
                />
              )}

              {/* API 키 관리 */}
              {activeTab === 'apiKeys' && (
                <ApiKeysForm
                  initialData={apiKeysDataRef.current}
                  onSave={handleApiKeysSave}
                />
              )}

              {/* 모델 설정 */}
              {activeTab === 'modelSettings' && (
                <ModelSettingsForm
                  initialData={modelSettingsDataRef.current}
                  onSave={handleModelSettingsSave}
                />
              )}
            </Suspense>

            {/* 화면 설정 */}
            {activeTab === 'appearance' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">화면 설정</h3>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">테마</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: '라이트', icon: Sun },
                      { value: 'dark', label: '다크', icon: Moon },
                      { value: 'system', label: '시스템', icon: Smartphone },
                    ].map((themeOption) => (
                      <button
                        key={themeOption.value}
                        onClick={() => setTheme(themeOption.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          theme === themeOption.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <themeOption.icon
                          className={`w-6 h-6 mx-auto mb-2 ${
                            theme === themeOption.value ? 'text-primary-600' : 'text-gray-400'
                          }`}
                        />
                        <p className="font-medium text-gray-900">{themeOption.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI 설정 */}
            {activeTab === 'ai' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">AI 설정</h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">문제 생성 AI</h4>
                    <select
                      className="input"
                      value={aiSettings.aiModel}
                      onChange={(e) =>
                        setAiSettings({ ...aiSettings, aiModel: e.target.value })
                      }
                    >
                      <option value="gemini">Gemini 3.0 Pro (추천)</option>
                      <option value="gpt">GPT-4</option>
                      <option value="claude">Claude 3</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      문제 생성에 사용할 AI 모델을 선택합니다
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">자동 검수</h4>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-3">
                      <div>
                        <p className="font-medium text-gray-900">생성된 문제 자동 검수</p>
                        <p className="text-sm text-gray-500">다른 AI로 생성된 문제를 검토합니다</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={aiSettings.autoReview}
                          onChange={(e) =>
                            setAiSettings({ ...aiSettings, autoReview: e.target.checked })
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    {aiSettings.autoReview && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          검수에 사용할 AI (멀티 선택)
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {['gemini', 'gpt', 'claude'].map((model) => (
                            <label
                              key={model}
                              className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-white"
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-primary-500"
                                checked={aiSettings.reviewModels.includes(model)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAiSettings({
                                      ...aiSettings,
                                      reviewModels: [...aiSettings.reviewModels, model],
                                    })
                                  } else {
                                    setAiSettings({
                                      ...aiSettings,
                                      reviewModels: aiSettings.reviewModels.filter(
                                        (m) => m !== model
                                      ),
                                    })
                                  }
                                }}
                              />
                              {model === 'gemini'
                                ? 'Gemini'
                                : model === 'gpt'
                                ? 'GPT-4'
                                : 'Claude'}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 결제/구독 */}
            {activeTab === 'billing' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">결제 및 구독</h3>

                <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl text-white mb-6">
                  <p className="text-sm opacity-80 mb-1">현재 플랜</p>
                  <p className="text-2xl font-bold mb-4">Pro 플랜</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm opacity-80">다음 결제일: 2025-02-01</p>
                    <p className="text-xl font-bold">월 29,000원</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">결제 수단</p>
                      <p className="text-sm text-gray-500">신한카드 **** 1234</p>
                    </div>
                    <button className="btn-secondary">변경</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">결제 내역</p>
                      <p className="text-sm text-gray-500">과거 결제 내역을 확인합니다</p>
                    </div>
                    <button className="btn-ghost flex items-center gap-1">
                      보기 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">플랜 변경</p>
                      <p className="text-sm text-gray-500">더 많은 기능이 필요하신가요?</p>
                    </div>
                    <button className="btn-primary">업그레이드</button>
                  </div>
                </div>
              </div>
            )}

            {/* 도움말 */}
            {activeTab === 'help' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">도움말</h3>

                <div className="space-y-3">
                  {[
                    { label: '사용 가이드', desc: 'EduFlow 사용법을 알아보세요' },
                    { label: '자주 묻는 질문', desc: '다른 사용자들이 자주 묻는 질문들' },
                    { label: '문의하기', desc: '궁금한 점을 문의해주세요' },
                    { label: '버그 신고', desc: '오류를 발견하셨나요?' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                  <p>EduFlow v0.1.0</p>
                  <p className="mt-1">2025 EduFlow. All rights reserved.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
