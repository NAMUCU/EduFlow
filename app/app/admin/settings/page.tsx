'use client'

import { useState } from 'react'
import {
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  Key,
  Save,
  RefreshCw
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: '일반 설정', icon: Settings },
    { id: 'security', label: '보안', icon: Shield },
    { id: 'notifications', label: '알림', icon: Bell },
    { id: 'api', label: 'API 설정', icon: Key },
    { id: 'backup', label: '백업', icon: Database },
  ]

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">관리자 설정</h1>
        <p className="text-gray-500">시스템 설정을 관리합니다</p>
      </div>

      <div className="flex gap-6">
        {/* 사이드 탭 */}
        <div className="w-56 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 설정 내용 */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6">일반 설정</h3>
              <div className="space-y-6">
                <div>
                  <label className="label">서비스 이름</label>
                  <input type="text" className="input" defaultValue="EduFlow" />
                </div>
                <div>
                  <label className="label">관리자 이메일</label>
                  <input type="email" className="input" defaultValue="admin@eduflow.kr" />
                </div>
                <div>
                  <label className="label">서비스 URL</label>
                  <input type="text" className="input" defaultValue="https://eduflow.kr" />
                </div>
                <div>
                  <label className="label">유지보수 모드</label>
                  <div className="flex items-center gap-3">
                    <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full shadow absolute left-0.5 top-0.5" />
                    </button>
                    <span className="text-sm text-gray-500">비활성화됨</span>
                  </div>
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6">보안 설정</h3>
              <div className="space-y-6">
                <div>
                  <label className="label">비밀번호 변경</label>
                  <input type="password" className="input mb-2" placeholder="현재 비밀번호" />
                  <input type="password" className="input mb-2" placeholder="새 비밀번호" />
                  <input type="password" className="input" placeholder="새 비밀번호 확인" />
                </div>
                <div>
                  <label className="label">2단계 인증</label>
                  <div className="flex items-center gap-3">
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full shadow absolute right-0.5 top-0.5" />
                    </button>
                    <span className="text-sm text-green-600">활성화됨</span>
                  </div>
                </div>
                <div>
                  <label className="label">세션 타임아웃 (분)</label>
                  <input type="number" className="input w-32" defaultValue="30" />
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6">알림 설정</h3>
              <div className="space-y-4">
                {[
                  { label: '새 학원 가입', desc: '새 학원이 가입하면 알림' },
                  { label: '결제 알림', desc: '결제 완료/실패 시 알림' },
                  { label: '문의 알림', desc: '새 고객 문의 시 알림' },
                  { label: '시스템 알림', desc: '서버 오류, 이상 징후 알림' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full shadow absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                ))}
                <button className="btn-primary flex items-center gap-2 mt-6">
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6">API 설정</h3>
              <div className="space-y-6">
                <div>
                  <label className="label">Gemini API Key</label>
                  <div className="flex gap-2">
                    <input type="password" className="input flex-1" defaultValue="AIza••••••••••••" />
                    <button className="btn-secondary">변경</button>
                  </div>
                </div>
                <div>
                  <label className="label">OpenAI API Key (선택)</label>
                  <div className="flex gap-2">
                    <input type="password" className="input flex-1" placeholder="sk-..." />
                    <button className="btn-secondary">저장</button>
                  </div>
                </div>
                <div>
                  <label className="label">API 사용량 제한 (학원당 월)</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Basic</p>
                      <input type="number" className="input" defaultValue="1000" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Pro</p>
                      <input type="number" className="input" defaultValue="5000" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Enterprise</p>
                      <input type="number" className="input" defaultValue="0" placeholder="무제한" />
                    </div>
                  </div>
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  저장
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6">백업 설정</h3>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">자동 백업</p>
                      <p className="text-sm text-gray-500">매일 새벽 3시 자동 백업</p>
                    </div>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full shadow absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">최근 백업: 2025-01-19 03:00</p>
                </div>

                <div>
                  <label className="label">백업 보관 기간</label>
                  <select className="input w-48">
                    <option>7일</option>
                    <option>14일</option>
                    <option>30일</option>
                    <option>90일</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button className="btn-secondary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    지금 백업
                  </button>
                  <button className="btn-secondary flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    백업 복원
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
