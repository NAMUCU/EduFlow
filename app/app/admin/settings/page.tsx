'use client'

import { useState } from 'react'
import {
  Settings,
  Key,
  CreditCard,
  Mail,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  X,
  Upload,
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
  Send,
  FileText,
  Bell,
  Image as ImageIcon,
  Phone,
  Globe,
  Building2,
  Lock,
  Unlock,
} from 'lucide-react'

// Mock 데이터
const MOCK_GENERAL_SETTINGS = {
  serviceName: 'EduFlow',
  serviceUrl: 'https://eduflow.kr',
  logoUrl: '/logo.png',
  contactEmail: 'support@eduflow.kr',
  contactPhone: '02-1234-5678',
  companyName: '(주)에듀플로우',
  businessNumber: '123-45-67890',
  address: '서울특별시 강남구 테헤란로 123, 에듀타워 5층',
  termsUrl: 'https://eduflow.kr/terms',
  privacyUrl: 'https://eduflow.kr/privacy',
}

const MOCK_API_KEYS = [
  {
    id: '1',
    name: 'Gemini API',
    provider: 'google',
    key: 'AIzaSyB1234567890abcdefghijklmnopqrstuvwx',
    status: 'active',
    lastUsed: '2025-01-19 14:30',
    usageCount: 15420,
  },
  {
    id: '2',
    name: 'Claude API',
    provider: 'anthropic',
    key: 'sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz',
    status: 'active',
    lastUsed: '2025-01-19 13:45',
    usageCount: 8230,
  },
  {
    id: '3',
    name: 'OpenAI API',
    provider: 'openai',
    key: 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz',
    status: 'active',
    lastUsed: '2025-01-18 22:10',
    usageCount: 5120,
  },
  {
    id: '4',
    name: '카카오 알림톡',
    provider: 'kakao',
    key: 'KAKAO_KEY_1234567890abcdefghijk',
    status: 'active',
    lastUsed: '2025-01-19 15:00',
    usageCount: 32150,
  },
  {
    id: '5',
    name: 'Google Cloud Vision',
    provider: 'google',
    key: 'AIzaSyC0987654321zyxwvutsrqponmlkjihgfedc',
    status: 'inactive',
    lastUsed: '2025-01-15 09:00',
    usageCount: 1200,
  },
]

const MOCK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    displayName: '무료 체험',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      maxStudents: 10,
      maxTeachers: 1,
      problemGeneration: 50,
      aiReview: false,
      customBranding: false,
      analytics: 'basic',
      support: 'email',
      storage: '1GB',
    },
    isActive: true,
  },
  {
    id: 'basic',
    name: 'Basic',
    displayName: '베이직',
    monthlyPrice: 19000,
    yearlyPrice: 190000,
    features: {
      maxStudents: 50,
      maxTeachers: 3,
      problemGeneration: 500,
      aiReview: true,
      customBranding: false,
      analytics: 'standard',
      support: 'email',
      storage: '10GB',
    },
    isActive: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    displayName: '프로',
    monthlyPrice: 49000,
    yearlyPrice: 490000,
    features: {
      maxStudents: 200,
      maxTeachers: 10,
      problemGeneration: 2000,
      aiReview: true,
      customBranding: true,
      analytics: 'advanced',
      support: 'priority',
      storage: '50GB',
    },
    isActive: true,
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: '엔터프라이즈',
    monthlyPrice: 149000,
    yearlyPrice: 1490000,
    features: {
      maxStudents: -1, // unlimited
      maxTeachers: -1,
      problemGeneration: -1,
      aiReview: true,
      customBranding: true,
      analytics: 'full',
      support: 'dedicated',
      storage: 'unlimited',
    },
    isActive: true,
  },
]

const MOCK_EMAIL_SETTINGS = {
  senderEmail: 'noreply@eduflow.kr',
  senderName: 'EduFlow',
  smtpHost: 'smtp.sendgrid.net',
  smtpPort: 587,
  smtpUsername: 'apikey',
  smtpPassword: 'SG.xxxxxxxxxxxxxxxxxxxxx',
  templates: [
    {
      id: '1',
      name: '가입 환영 메일',
      subject: 'EduFlow에 오신 것을 환영합니다!',
      type: 'welcome',
      lastModified: '2025-01-10',
      isActive: true,
    },
    {
      id: '2',
      name: '비밀번호 재설정',
      subject: '[EduFlow] 비밀번호 재설정 안내',
      type: 'password_reset',
      lastModified: '2025-01-08',
      isActive: true,
    },
    {
      id: '3',
      name: '결제 완료 알림',
      subject: '[EduFlow] 결제가 완료되었습니다',
      type: 'payment_success',
      lastModified: '2025-01-05',
      isActive: true,
    },
    {
      id: '4',
      name: '결제 실패 알림',
      subject: '[EduFlow] 결제 처리에 문제가 발생했습니다',
      type: 'payment_failed',
      lastModified: '2025-01-05',
      isActive: true,
    },
    {
      id: '5',
      name: '학원 가입 승인',
      subject: '[EduFlow] 학원 가입이 승인되었습니다',
      type: 'academy_approved',
      lastModified: '2025-01-03',
      isActive: true,
    },
  ],
  notifications: {
    newAcademy: { email: true, slack: true, push: false },
    payment: { email: true, slack: true, push: true },
    support: { email: true, slack: true, push: false },
    systemError: { email: true, slack: true, push: true },
    weeklyReport: { email: true, slack: false, push: false },
  },
}

// 관리자 비밀번호 (실제 구현시 환경변수/API 검증)
const ADMIN_PASSWORD = 'admin1234'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 수정 모드 및 비밀번호 관련 상태
  const [isEditMode, setIsEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState<'unlock' | 'save' | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 일반 설정
  const [generalSettings, setGeneralSettings] = useState(MOCK_GENERAL_SETTINGS)

  // API 키
  const [apiKeys, setApiKeys] = useState(MOCK_API_KEYS)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState({ name: '', provider: 'google', key: '' })
  const [showAddApiKey, setShowAddApiKey] = useState(false)

  // 요금제
  const [plans, setPlans] = useState(MOCK_PLANS)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)

  // 이메일/알림
  const [emailSettings, setEmailSettings] = useState(MOCK_EMAIL_SETTINGS)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)

  const tabs = [
    { id: 'general', label: '일반 설정', icon: Settings },
    { id: 'api', label: 'API 키 관리', icon: Key },
    { id: 'plans', label: '요금제 설정', icon: CreditCard },
    { id: 'email', label: '이메일/알림', icon: Mail },
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
      // 저장 실행
      performSave()
      setShowPasswordModal(null)
      setPasswordInput('')
      setPasswordError('')
    }
  }

  // 실제 저장 수행
  const performSave = () => {
    setIsSaving(true)
    // Mock save
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setIsEditMode(false) // 저장 후 읽기 모드로 전환
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 1000)
  }

  // 저장 버튼 클릭 (비밀번호 확인 필요)
  const handleSave = () => {
    setShowPasswordModal('save')
    setPasswordInput('')
    setPasswordError('')
  }

  // 수정 모드 진입 (비밀번호 확인 필요)
  const handleUnlock = () => {
    setShowPasswordModal('unlock')
    setPasswordInput('')
    setPasswordError('')
  }

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false)
    // TODO: 변경사항 되돌리기 (필요시 원본 데이터 저장해두고 복원)
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 10) return '••••••••'
    return key.slice(0, 8) + '••••••••••••' + key.slice(-4)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다.')
  }

  const handleAddApiKey = () => {
    if (!newApiKey.name || !newApiKey.key) return
    const newKey = {
      id: String(apiKeys.length + 1),
      ...newApiKey,
      status: 'active',
      lastUsed: '-',
      usageCount: 0,
    }
    setApiKeys([...apiKeys, newKey])
    setNewApiKey({ name: '', provider: 'google', key: '' })
    setShowAddApiKey(false)
  }

  const handleDeleteApiKey = (id: string) => {
    if (confirm('이 API 키를 삭제하시겠습니까?')) {
      setApiKeys(apiKeys.filter((key) => key.id !== id))
    }
  }

  const toggleApiKeyStatus = (id: string) => {
    setApiKeys(
      apiKeys.map((key) =>
        key.id === id
          ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' }
          : key
      )
    )
  }

  const formatPrice = (price: number) => {
    if (price === 0) return '무료'
    return price.toLocaleString() + '원'
  }

  const formatFeatureValue = (value: number | string | boolean) => {
    if (typeof value === 'boolean') return value ? '지원' : '미지원'
    if (value === -1 || value === 'unlimited') return '무제한'
    if (typeof value === 'number') return value.toLocaleString()
    return value
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            시스템 설정
            {!isEditMode && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                읽기 모드
              </span>
            )}
            {isEditMode && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                수정 모드
              </span>
            )}
          </h1>
          <p className="text-gray-500">서비스 전반의 설정을 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button
              onClick={handleUnlock}
              className="btn-primary flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              수정하기
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
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
                    변경사항 저장
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 읽기 모드 안내 */}
      {!isEditMode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <Lock className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800">
            현재 읽기 모드입니다. 설정을 변경하려면 <strong>수정하기</strong> 버튼을 클릭하고 관리자 비밀번호를 입력하세요.
          </p>
        </div>
      )}

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
        <div className="flex-1 space-y-6">
          {/* 일반 설정 */}
          {activeTab === 'general' && (
            <>
              {/* 서비스 기본 정보 */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  서비스 기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">서비스명</label>
                    <input
                      type="text"
                      className="input"
                      value={generalSettings.serviceName}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, serviceName: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">서비스 URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="input pl-10"
                        value={generalSettings.serviceUrl}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, serviceUrl: e.target.value })
                        }
                        disabled={!isEditMode}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label">로고</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <button className="btn-secondary flex items-center gap-2 mb-2" disabled={!isEditMode}>
                          <Upload className="w-4 h-4" />
                          로고 업로드
                        </button>
                        <p className="text-xs text-gray-500">
                          권장 크기: 200x200px, PNG/SVG 형식
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary-600" />
                  연락처 정보
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">대표 이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        className="input pl-10"
                        value={generalSettings.contactEmail}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })
                        }
                        disabled={!isEditMode}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">대표 전화번호</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        className="input pl-10"
                        value={generalSettings.contactPhone}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })
                        }
                        disabled={!isEditMode}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">회사명</label>
                    <input
                      type="text"
                      className="input"
                      value={generalSettings.companyName}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, companyName: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">사업자등록번호</label>
                    <input
                      type="text"
                      className="input"
                      value={generalSettings.businessNumber}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, businessNumber: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">주소</label>
                    <input
                      type="text"
                      className="input"
                      value={generalSettings.address}
                      onChange={(e) =>
                        setGeneralSettings({ ...generalSettings, address: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>

              {/* 법적 문서 */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  법적 문서 URL
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">이용약관 URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={generalSettings.termsUrl}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, termsUrl: e.target.value })
                        }
                        disabled={!isEditMode}
                      />
                      <a
                        href={generalSettings.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="label">개인정보처리방침 URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-1"
                        value={generalSettings.privacyUrl}
                        onChange={(e) =>
                          setGeneralSettings({ ...generalSettings, privacyUrl: e.target.value })
                        }
                        disabled={!isEditMode}
                      />
                      <a
                        href={generalSettings.privacyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* API 키 관리 */}
          {activeTab === 'api' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary-600" />
                  API 키 관리
                </h3>
                <button
                  onClick={() => setShowAddApiKey(true)}
                  className="btn-primary flex items-center gap-2"
                  disabled={!isEditMode}
                >
                  <Plus className="w-4 h-4" />
                  API 키 추가
                </button>
              </div>

              {/* 알림 */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">API 키 보안 주의사항</p>
                  <p className="text-sm text-amber-700 mt-1">
                    API 키는 민감한 정보입니다. 외부에 노출되지 않도록 주의하고, 정기적으로 교체하는
                    것을 권장합니다.
                  </p>
                </div>
              </div>

              {/* 새 API 키 추가 폼 */}
              {showAddApiKey && (
                <div className="p-4 bg-gray-50 rounded-xl mb-6 border-2 border-primary-200">
                  <h4 className="font-medium text-gray-900 mb-4">새 API 키 추가</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="label">이름</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="예: Gemini API"
                        value={newApiKey.name}
                        onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">제공자</label>
                      <select
                        className="input"
                        value={newApiKey.provider}
                        onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                      >
                        <option value="google">Google (Gemini, Vision)</option>
                        <option value="openai">OpenAI (GPT)</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="kakao">카카오 (알림톡)</option>
                        <option value="naver">네이버</option>
                        <option value="other">기타</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">API 키</label>
                      <input
                        type="password"
                        className="input"
                        placeholder="API 키 입력"
                        value={newApiKey.key}
                        onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddApiKey(false)} className="btn-secondary">
                      취소
                    </button>
                    <button onClick={handleAddApiKey} className="btn-primary">
                      추가
                    </button>
                  </div>
                </div>
              )}

              {/* API 키 목록 */}
              <div className="space-y-3">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      apiKey.status === 'active'
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            apiKey.provider === 'google'
                              ? 'bg-blue-100 text-blue-600'
                              : apiKey.provider === 'openai'
                              ? 'bg-green-100 text-green-600'
                              : apiKey.provider === 'anthropic'
                              ? 'bg-orange-100 text-orange-600'
                              : apiKey.provider === 'kakao'
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{apiKey.name}</p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                apiKey.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {apiKey.status === 'active' ? '활성' : '비활성'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <code className="text-sm text-gray-500 font-mono">
                              {showApiKey === apiKey.id ? apiKey.key : maskApiKey(apiKey.key)}
                            </code>
                            <button
                              onClick={() =>
                                setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)
                              }
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {showApiKey === apiKey.id ? (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right text-sm">
                          <p className="text-gray-500">최근 사용: {apiKey.lastUsed}</p>
                          <p className="text-gray-500">
                            사용량: {apiKey.usageCount.toLocaleString()}회
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleApiKeyStatus(apiKey.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              apiKey.status === 'active'
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            disabled={!isEditMode}
                          >
                            {apiKey.status === 'active' ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            disabled={!isEditMode}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 요금제 설정 */}
          {activeTab === 'plans' && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                요금제 설정
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      plan.isPopular
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-white text-xs font-bold rounded-full">
                        인기
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{plan.displayName}</h4>
                        <p className="text-sm text-gray-500">{plan.name}</p>
                      </div>
                      <button
                        onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}
                        className="btn-secondary text-sm"
                        disabled={!isEditMode}
                      >
                        {editingPlan === plan.id ? '완료' : '편집'}
                      </button>
                    </div>

                    {editingPlan === plan.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">월 요금</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={plan.monthlyPrice}
                              onChange={(e) =>
                                setPlans(
                                  plans.map((p) =>
                                    p.id === plan.id
                                      ? { ...p, monthlyPrice: Number(e.target.value) }
                                      : p
                                  )
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">연 요금</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={plan.yearlyPrice}
                              onChange={(e) =>
                                setPlans(
                                  plans.map((p) =>
                                    p.id === plan.id
                                      ? { ...p, yearlyPrice: Number(e.target.value) }
                                      : p
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">최대 학생 수</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={plan.features.maxStudents}
                              onChange={(e) =>
                                setPlans(
                                  plans.map((p) =>
                                    p.id === plan.id
                                      ? {
                                          ...p,
                                          features: {
                                            ...p.features,
                                            maxStudents: Number(e.target.value),
                                          },
                                        }
                                      : p
                                  )
                                )
                              }
                              placeholder="-1 = 무제한"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">최대 선생님 수</label>
                            <input
                              type="number"
                              className="input text-sm"
                              value={plan.features.maxTeachers}
                              onChange={(e) =>
                                setPlans(
                                  plans.map((p) =>
                                    p.id === plan.id
                                      ? {
                                          ...p,
                                          features: {
                                            ...p.features,
                                            maxTeachers: Number(e.target.value),
                                          },
                                        }
                                      : p
                                  )
                                )
                              }
                              placeholder="-1 = 무제한"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">월 문제 생성 수</label>
                          <input
                            type="number"
                            className="input text-sm"
                            value={plan.features.problemGeneration}
                            onChange={(e) =>
                              setPlans(
                                plans.map((p) =>
                                  p.id === plan.id
                                    ? {
                                        ...p,
                                        features: {
                                          ...p.features,
                                          problemGeneration: Number(e.target.value),
                                        },
                                      }
                                    : p
                                )
                              )
                            }
                            placeholder="-1 = 무제한"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-gray-900">
                              {formatPrice(plan.monthlyPrice)}
                            </span>
                            {plan.monthlyPrice > 0 && (
                              <span className="text-sm text-gray-500">/월</span>
                            )}
                          </div>
                          {plan.yearlyPrice > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              연 결제 시 {formatPrice(plan.yearlyPrice)}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">학생 수</span>
                            <span className="font-medium">
                              {formatFeatureValue(plan.features.maxStudents)}명
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">선생님 수</span>
                            <span className="font-medium">
                              {formatFeatureValue(plan.features.maxTeachers)}명
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">월 문제 생성</span>
                            <span className="font-medium">
                              {formatFeatureValue(plan.features.problemGeneration)}개
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">AI 검수</span>
                            <span
                              className={`font-medium ${
                                plan.features.aiReview ? 'text-green-600' : 'text-gray-400'
                              }`}
                            >
                              {formatFeatureValue(plan.features.aiReview)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600">커스텀 브랜딩</span>
                            <span
                              className={`font-medium ${
                                plan.features.customBranding ? 'text-green-600' : 'text-gray-400'
                              }`}
                            >
                              {formatFeatureValue(plan.features.customBranding)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">저장 공간</span>
                            <span className="font-medium">{plan.features.storage}</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">상태:</span>
                        <span
                          className={`text-sm font-medium ${
                            plan.isActive ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {plan.isActive ? '활성화' : '비활성화'}
                        </span>
                      </div>
                      <label className={`relative inline-flex items-center ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={plan.isActive}
                          onChange={(e) =>
                            setPlans(
                              plans.map((p) =>
                                p.id === plan.id ? { ...p, isActive: e.target.checked } : p
                              )
                            )
                          }
                          disabled={!isEditMode}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이메일/알림 설정 */}
          {activeTab === 'email' && (
            <>
              {/* SMTP 설정 */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary-600" />
                  이메일 발송 설정 (SMTP)
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">발송 이메일</label>
                    <input
                      type="email"
                      className="input"
                      value={emailSettings.senderEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, senderEmail: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">발송자 이름</label>
                    <input
                      type="text"
                      className="input"
                      value={emailSettings.senderName}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, senderName: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">SMTP 호스트</label>
                    <input
                      type="text"
                      className="input"
                      value={emailSettings.smtpHost}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">SMTP 포트</label>
                    <input
                      type="number"
                      className="input"
                      value={emailSettings.smtpPort}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpPort: Number(e.target.value) })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">SMTP 사용자명</label>
                    <input
                      type="text"
                      className="input"
                      value={emailSettings.smtpUsername}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })
                      }
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <label className="label">SMTP 비밀번호</label>
                    <div className="relative">
                      <input
                        type={showSmtpPassword ? 'text' : 'password'}
                        className="input pr-10"
                        value={emailSettings.smtpPassword}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                        }
                        disabled={!isEditMode}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSmtpPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="btn-secondary flex items-center gap-2" disabled={!isEditMode}>
                    <Send className="w-4 h-4" />
                    테스트 이메일 발송
                  </button>
                </div>
              </div>

              {/* 이메일 템플릿 */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  이메일 템플릿
                </h3>
                <div className="space-y-3">
                  {emailSettings.templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            template.isActive
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{template.name}</p>
                          <p className="text-sm text-gray-500">{template.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          수정: {template.lastModified}
                        </span>
                        <button className="btn-secondary text-sm" disabled={!isEditMode}>편집</button>
                        <label className={`relative inline-flex items-center ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={template.isActive}
                            onChange={(e) =>
                              setEmailSettings({
                                ...emailSettings,
                                templates: emailSettings.templates.map((t) =>
                                  t.id === template.id ? { ...t, isActive: e.target.checked } : t
                                ),
                              })
                            }
                            disabled={!isEditMode}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 알림 채널 설정 */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-600" />
                  알림 채널 설정
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          알림 유형
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                          이메일
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                          Slack
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">
                          푸시 알림
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(emailSettings.notifications).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          newAcademy: '새 학원 가입',
                          payment: '결제 알림',
                          support: '고객 문의',
                          systemError: '시스템 오류',
                          weeklyReport: '주간 리포트',
                        }
                        return (
                          <tr key={key} className="border-b border-gray-100">
                            <td className="py-4 px-4 text-gray-900">{labels[key]}</td>
                            <td className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded text-primary-500"
                                checked={value.email}
                                onChange={(e) =>
                                  setEmailSettings({
                                    ...emailSettings,
                                    notifications: {
                                      ...emailSettings.notifications,
                                      [key]: { ...value, email: e.target.checked },
                                    },
                                  })
                                }
                                disabled={!isEditMode}
                              />
                            </td>
                            <td className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded text-primary-500"
                                checked={value.slack}
                                onChange={(e) =>
                                  setEmailSettings({
                                    ...emailSettings,
                                    notifications: {
                                      ...emailSettings.notifications,
                                      [key]: { ...value, slack: e.target.checked },
                                    },
                                  })
                                }
                                disabled={!isEditMode}
                              />
                            </td>
                            <td className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded text-primary-500"
                                checked={value.push}
                                onChange={(e) =>
                                  setEmailSettings({
                                    ...emailSettings,
                                    notifications: {
                                      ...emailSettings.notifications,
                                      [key]: { ...value, push: e.target.checked },
                                    },
                                  })
                                }
                                disabled={!isEditMode}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
