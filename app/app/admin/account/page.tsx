'use client'

import { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Save,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  AlertCircle,
  Key,
  Bell,
  History,
} from 'lucide-react'

// Mock 데이터
const MOCK_ADMIN_INFO = {
  name: '시스템 관리자',
  email: 'admin@eduflow.kr',
  phone: '010-1234-5678',
  role: 'super_admin',
  createdAt: '2024-01-15',
  lastLogin: '2025-01-21 14:30:00',
}

const MOCK_LOGIN_HISTORY = [
  { id: '1', date: '2025-01-21 14:30:00', ip: '192.168.1.100', device: 'Chrome / macOS', status: 'success' },
  { id: '2', date: '2025-01-21 09:15:00', ip: '192.168.1.100', device: 'Chrome / macOS', status: 'success' },
  { id: '3', date: '2025-01-20 18:45:00', ip: '192.168.1.100', device: 'Chrome / macOS', status: 'success' },
  { id: '4', date: '2025-01-20 10:00:00', ip: '211.234.56.78', device: 'Safari / iOS', status: 'success' },
  { id: '5', date: '2025-01-19 20:30:00', ip: '123.456.78.90', device: 'Chrome / Windows', status: 'failed' },
]

// 관리자 비밀번호 확인용
const ADMIN_PASSWORD = 'admin1234'

export default function AdminAccountPage() {
  const [activeTab, setActiveTab] = useState('info')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 수정 모드 및 비밀번호 관련 상태
  const [isEditMode, setIsEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState<'unlock' | 'save' | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 기본 정보
  const [adminInfo, setAdminInfo] = useState(MOCK_ADMIN_INFO)

  // 비밀번호 변경
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // 알림 설정
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    browser: true,
    loginAlert: true,
    systemAlert: true,
    reportAlert: false,
  })

  const tabs = [
    { id: 'info', label: '기본 정보', icon: User },
    { id: 'password', label: '비밀번호 변경', icon: Lock },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    { id: 'history', label: '로그인 기록', icon: History },
  ]

  // 비밀번호 확인 핸들러
  const handlePasswordSubmit = () => {
    if (passwordInput !== ADMIN_PASSWORD) {
      setPasswordError('비밀번호가 올바르지 않습니다.')
      return
    }

    if (showPasswordModal === 'unlock') {
      setIsEditMode(true)
      setShowPasswordModal(null)
      setPasswordInput('')
      setPasswordError('')
    } else if (showPasswordModal === 'save') {
      performSave()
      setShowPasswordModal(null)
      setPasswordInput('')
      setPasswordError('')
    }
  }

  // 실제 저장 수행
  const performSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setIsEditMode(false)
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 1000)
  }

  // 저장 버튼 클릭
  const handleSave = () => {
    setShowPasswordModal('save')
    setPasswordInput('')
    setPasswordError('')
  }

  // 수정 모드 진입
  const handleUnlock = () => {
    setShowPasswordModal('unlock')
    setPasswordInput('')
    setPasswordError('')
  }

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setAdminInfo(MOCK_ADMIN_INFO)
  }

  // 비밀번호 변경 처리
  const handlePasswordChange = () => {
    const errors: string[] = []

    if (!passwords.current) {
      errors.push('현재 비밀번호를 입력하세요.')
    }
    if (passwords.current !== ADMIN_PASSWORD) {
      errors.push('현재 비밀번호가 올바르지 않습니다.')
    }
    if (!passwords.new) {
      errors.push('새 비밀번호를 입력하세요.')
    }
    if (passwords.new.length < 8) {
      errors.push('새 비밀번호는 8자 이상이어야 합니다.')
    }
    if (passwords.new !== passwords.confirm) {
      errors.push('새 비밀번호 확인이 일치하지 않습니다.')
    }

    setPasswordErrors(errors)

    if (errors.length === 0) {
      setIsSaving(true)
      setTimeout(() => {
        setIsSaving(false)
        setSaveSuccess(true)
        setPasswords({ current: '', new: '', confirm: '' })
        setTimeout(() => setSaveSuccess(false), 2000)
        alert('비밀번호가 변경되었습니다.')
      }, 1000)
    }
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            계정 설정
            {!isEditMode && activeTab === 'info' && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                읽기 모드
              </span>
            )}
            {isEditMode && activeTab === 'info' && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                <Key className="w-3 h-3" />
                수정 모드
              </span>
            )}
          </h1>
          <p className="text-gray-500">관리자 계정 정보를 관리합니다</p>
        </div>
        {activeTab === 'info' && (
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={handleUnlock}
                className="btn-primary flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                수정하기
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="btn-secondary flex items-center gap-2"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      저장 완료
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      저장
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
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

        {/* 내용 */}
        <div className="flex-1 space-y-6">
          {/* 기본 정보 */}
          {activeTab === 'info' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" />
                관리자 정보
              </h3>

              {!isEditMode && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800">
                    현재 읽기 모드입니다. 정보를 수정하려면 <strong>수정하기</strong> 버튼을 클릭하세요.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label">이름</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10"
                      value={adminInfo.name}
                      onChange={(e) => setAdminInfo({ ...adminInfo, name: e.target.value })}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">이메일</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      className="input pl-10"
                      value={adminInfo.email}
                      onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">전화번호</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      className="input pl-10"
                      value={adminInfo.phone}
                      onChange={(e) => setAdminInfo({ ...adminInfo, phone: e.target.value })}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">권한</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10 bg-gray-50"
                      value="슈퍼 관리자"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label className="label">가입일</label>
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={adminInfo.createdAt}
                    disabled
                  />
                </div>
                <div>
                  <label className="label">최근 로그인</label>
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={adminInfo.lastLogin}
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* 비밀번호 변경 */}
          {activeTab === 'password' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-600" />
                비밀번호 변경
              </h3>

              <div className="max-w-md space-y-6">
                {passwordErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                      <AlertCircle className="w-4 h-4" />
                      오류
                    </div>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {passwordErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="label">현재 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className="input pr-10"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="현재 비밀번호 입력"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">새 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      className="input pr-10"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="새 비밀번호 입력 (8자 이상)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">새 비밀번호 확인</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      className="input pr-10"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="새 비밀번호 다시 입력"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      비밀번호 변경
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 알림 설정 */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                알림 설정
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">알림 채널</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">이메일 알림</p>
                          <p className="text-sm text-gray-500">이메일로 알림 수신</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-500"
                        checked={notifications.email}
                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">SMS 알림</p>
                          <p className="text-sm text-gray-500">문자로 알림 수신</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-500"
                        checked={notifications.sms}
                        onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">브라우저 알림</p>
                          <p className="text-sm text-gray-500">브라우저 푸시 알림</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-500"
                        checked={notifications.browser}
                        onChange={(e) => setNotifications({ ...notifications, browser: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">알림 유형</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">로그인 알림</p>
                        <p className="text-sm text-gray-500">새로운 로그인 시 알림</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-500"
                        checked={notifications.loginAlert}
                        onChange={(e) => setNotifications({ ...notifications, loginAlert: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">시스템 알림</p>
                        <p className="text-sm text-gray-500">시스템 오류/장애 알림</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-500"
                        checked={notifications.systemAlert}
                        onChange={(e) => setNotifications({ ...notifications, systemAlert: e.target.checked })}
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">보고서 알림</p>
                        <p className="text-sm text-gray-500">주간/월간 보고서 알림</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded text-primary-500"
                        checked={notifications.reportAlert}
                        onChange={(e) => setNotifications({ ...notifications, reportAlert: e.target.checked })}
                      />
                    </label>
                  </div>
                </div>

                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  알림 설정 저장
                </button>
              </div>
            </div>
          )}

          {/* 로그인 기록 */}
          {activeTab === 'history' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-primary-600" />
                로그인 기록
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">시간</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">IP 주소</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">기기/브라우저</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_LOGIN_HISTORY.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900">{log.date}</td>
                        <td className="py-4 px-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{log.ip}</code>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{log.device}</td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {log.status === 'success' ? (
                              <>
                                <Check className="w-3 h-3" />
                                성공
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                실패
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                최근 30일간의 로그인 기록이 표시됩니다.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 비밀번호 확인 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {showPasswordModal === 'unlock' ? '관리자 인증' : '저장 확인'}
                </h3>
                <p className="text-sm text-gray-500">
                  {showPasswordModal === 'unlock'
                    ? '수정 모드로 전환하려면 비밀번호를 입력하세요.'
                    : '변경사항을 저장하려면 비밀번호를 입력하세요.'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="label">관리자 비밀번호</label>
              <input
                type="password"
                className="input"
                placeholder="비밀번호 입력"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value)
                  setPasswordError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit()
                  }
                }}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowPasswordModal(null)
                  setPasswordInput('')
                  setPasswordError('')
                }}
                className="btn-secondary"
              >
                취소
              </button>
              <button onClick={handlePasswordSubmit} className="btn-primary">
                {showPasswordModal === 'unlock' ? '수정 모드 진입' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
