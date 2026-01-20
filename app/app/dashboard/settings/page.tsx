'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { User, Bell, Lock, Palette, CreditCard, HelpCircle, LogOut, ChevronRight, Moon, Sun, Smartphone } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    // 프로필
    name: '박정훈',
    email: 'junghoon@academy.com',
    phone: '010-1234-5678',
    // 알림
    emailNotification: true,
    smsNotification: true,
    pushNotification: false,
    reportReminder: true,
    assignmentReminder: true,
    // 테마
    theme: 'light',
    // AI 설정
    aiModel: 'gemini',
    autoReview: true,
    reviewModels: ['gemini', 'gpt'],
  })

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    { id: 'security', label: '보안', icon: Lock },
    { id: 'appearance', label: '화면 설정', icon: Palette },
    { id: 'ai', label: 'AI 설정', icon: Smartphone },
    { id: 'billing', label: '결제/구독', icon: CreditCard },
    { id: 'help', label: '도움말', icon: HelpCircle },
  ]

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
                  onClick={() => setActiveTab(tab.id)}
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
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">로그아웃</span>
              </button>
            </div>
          </div>

          {/* 설정 내용 */}
          <div className="col-span-3">
            {/* 프로필 */}
            {activeTab === 'profile' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">프로필 설정</h3>

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-3xl font-bold text-primary-600">
                    박
                  </div>
                  <div>
                    <button className="btn-secondary mb-2">사진 변경</button>
                    <p className="text-sm text-gray-500">JPG, PNG 파일 (최대 2MB)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">이름</label>
                      <input
                        type="text"
                        className="input"
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">이메일</label>
                      <input
                        type="email"
                        className="input"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">전화번호</label>
                    <input
                      type="tel"
                      className="input"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button className="btn-primary">저장하기</button>
                </div>
              </div>
            )}

            {/* 알림 설정 */}
            {activeTab === 'notifications' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">알림 설정</h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">알림 수신 방법</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'emailNotification', label: '이메일 알림', desc: '중요 알림을 이메일로 받습니다' },
                        { key: 'smsNotification', label: '문자 알림', desc: '긴급 알림을 문자로 받습니다' },
                        { key: 'pushNotification', label: '푸시 알림', desc: '앱 푸시 알림을 받습니다' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={settings[item.key as keyof typeof settings] as boolean}
                              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">알림 종류</h4>
                    <div className="space-y-3">
                      {[
                        { key: 'reportReminder', label: '보고서 발송 알림', desc: '주간 보고서 발송 시점을 알려드립니다' },
                        { key: 'assignmentReminder', label: '과제 마감 알림', desc: '과제 마감 전 미제출 학생을 알려드립니다' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={settings[item.key as keyof typeof settings] as boolean}
                              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 보안 */}
            {activeTab === 'security' && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6">보안 설정</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">비밀번호 변경</p>
                      <p className="text-sm text-gray-500">마지막 변경: 30일 전</p>
                    </div>
                    <button className="btn-secondary">변경하기</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">2단계 인증</p>
                      <p className="text-sm text-gray-500">추가 보안을 위해 2단계 인증을 설정하세요</p>
                    </div>
                    <button className="btn-secondary">설정하기</button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">로그인 기록</p>
                      <p className="text-sm text-gray-500">최근 로그인 내역을 확인합니다</p>
                    </div>
                    <button className="btn-ghost flex items-center gap-1">
                      보기 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setSettings({ ...settings, theme: theme.value })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          settings.theme === theme.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <theme.icon className={`w-6 h-6 mx-auto mb-2 ${
                          settings.theme === theme.value ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <p className="font-medium text-gray-900">{theme.label}</p>
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
                      value={settings.aiModel}
                      onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                    >
                      <option value="gemini">Gemini 3.0 Pro (추천)</option>
                      <option value="gpt">GPT-4</option>
                      <option value="claude">Claude 3</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-2">문제 생성에 사용할 AI 모델을 선택합니다</p>
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
                          checked={settings.autoReview}
                          onChange={(e) => setSettings({ ...settings, autoReview: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>

                    {settings.autoReview && (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-700 mb-3">검수에 사용할 AI (멀티 선택)</p>
                        <div className="flex gap-2 flex-wrap">
                          {['gemini', 'gpt', 'claude'].map((model) => (
                            <label key={model} className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-white">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-primary-500"
                                checked={settings.reviewModels.includes(model)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSettings({ ...settings, reviewModels: [...settings.reviewModels, model] })
                                  } else {
                                    setSettings({ ...settings, reviewModels: settings.reviewModels.filter(m => m !== model) })
                                  }
                                }}
                              />
                              {model === 'gemini' ? 'Gemini' : model === 'gpt' ? 'GPT-4' : 'Claude'}
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
                    <div key={i} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 cursor-pointer transition-colors">
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
                  <p className="mt-1">© 2025 EduFlow. All rights reserved.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
