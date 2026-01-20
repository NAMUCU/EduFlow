'use client'

import { useState } from 'react'
import {
  CreditCard,
  Download,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw
} from 'lucide-react'

// 목업 데이터
const mockPayments = [
  {
    id: 'PAY-2025-0119-001',
    academy: '스마트 수학학원',
    plan: 'Pro',
    amount: 99000,
    status: 'completed',
    method: '카드',
    cardLast4: '1234',
    paidAt: '2025-01-19 09:30',
    period: '2025-01',
  },
  {
    id: 'PAY-2025-0118-002',
    academy: '국어논술학원',
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '카드',
    cardLast4: '5678',
    paidAt: '2025-01-18 14:22',
    period: '2025-01',
  },
  {
    id: 'PAY-2025-0117-003',
    academy: '영어마을학원',
    plan: 'Basic',
    amount: 49000,
    status: 'completed',
    method: '카드',
    cardLast4: '9012',
    paidAt: '2025-01-17 11:45',
    period: '2025-01',
  },
  {
    id: 'PAY-2025-0116-004',
    academy: '명문학원',
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '계좌이체',
    cardLast4: null,
    paidAt: '2025-01-16 16:00',
    period: '2025-01',
  },
  {
    id: 'PAY-2025-0115-005',
    academy: '수학의정석',
    plan: 'Pro',
    amount: 99000,
    status: 'failed',
    method: '카드',
    cardLast4: '3456',
    paidAt: null,
    period: '2025-01',
  },
  {
    id: 'PAY-2025-0115-006',
    academy: '영재교육원',
    plan: 'Pro',
    amount: 99000,
    status: 'pending',
    method: '계좌이체',
    cardLast4: null,
    paidAt: null,
    period: '2025-01',
  },
]

const plans = [
  { name: 'Basic', price: 49000, features: ['월 1,000문제', '선생님 3명', '기본 통계'] },
  { name: 'Pro', price: 99000, features: ['월 5,000문제', '선생님 10명', '상세 분석', '우선 지원'] },
  { name: 'Enterprise', price: 299000, features: ['무제한 문제', '무제한 선생님', '맞춤 기능', '전담 매니저'] },
]

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  completed: { color: 'text-green-600 bg-green-100', icon: CheckCircle, label: '완료' },
  pending: { color: 'text-yellow-600 bg-yellow-100', icon: Clock, label: '대기' },
  failed: { color: 'text-red-600 bg-red-100', icon: XCircle, label: '실패' },
}

export default function PaymentsPage() {
  const [payments] = useState(mockPayments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('2025-01')
  const [activeTab, setActiveTab] = useState<'payments' | 'plans'>('payments')

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.academy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    const matchesPeriod = payment.period === filterPeriod
    return matchesSearch && matchesStatus && matchesPeriod
  })

  const totalRevenue = payments
    .filter(p => p.status === 'completed' && p.period === filterPeriod)
    .reduce((sum, p) => sum + p.amount, 0)

  const completedCount = payments.filter(p => p.status === 'completed' && p.period === filterPeriod).length
  const pendingCount = payments.filter(p => p.status === 'pending' && p.period === filterPeriod).length
  const failedCount = payments.filter(p => p.status === 'failed' && p.period === filterPeriod).length

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제/정산 관리</h1>
          <p className="text-gray-500">학원 결제 내역과 요금제를 관리합니다</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            동기화
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            정산 리포트
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'payments'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          결제 내역
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'plans'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          요금제 관리
        </button>
      </div>

      {activeTab === 'payments' ? (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">이번 달 매출</p>
                <p className="text-2xl font-bold text-gray-900">₩{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">결제 완료</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}건</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">입금 대기</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}건</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">결제 실패</p>
                <p className="text-2xl font-bold text-gray-900">{failedCount}건</p>
              </div>
            </div>
          </div>

          {/* 필터 */}
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="학원명 또는 결제번호로 검색..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="input w-40"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="2025-01">2025년 1월</option>
                <option value="2024-12">2024년 12월</option>
                <option value="2024-11">2024년 11월</option>
              </select>
              <select
                className="input w-40"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">전체 상태</option>
                <option value="completed">완료</option>
                <option value="pending">대기</option>
                <option value="failed">실패</option>
              </select>
            </div>
          </div>

          {/* 테이블 */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium">결제번호</th>
                  <th className="px-4 py-3 font-medium">학원</th>
                  <th className="px-4 py-3 font-medium">요금제</th>
                  <th className="px-4 py-3 font-medium">금액</th>
                  <th className="px-4 py-3 font-medium">결제수단</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">결제일시</th>
                  <th className="px-4 py-3 font-medium text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const status = statusConfig[payment.status]
                  return (
                    <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-mono text-sm text-gray-600">{payment.id}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{payment.academy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                          payment.plan === 'Pro' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {payment.plan}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900">
                        ₩{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {payment.method}
                        {payment.cardLast4 && (
                          <span className="text-gray-400"> (*{payment.cardLast4})</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.color}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {payment.paidAt || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="상세">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="영수증">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                총 {filteredPayments.length}건
              </p>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm">1</span>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 요금제 관리 탭 */
        <div>
          <div className="grid grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div key={plan.name} className={`card border-2 ${
                index === 1 ? 'border-primary-500 relative' : 'border-transparent'
              }`}>
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs rounded-full">
                    인기
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-primary-600">
                    ₩{plan.price.toLocaleString()}
                    <span className="text-sm text-gray-400 font-normal">/월</span>
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full btn-secondary">수정</button>
              </div>
            ))}
          </div>

          <div className="card mt-6">
            <h3 className="font-bold text-gray-900 mb-4">요금제 통계</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">Basic 사용</p>
                <p className="text-2xl font-bold text-gray-900">45개 학원</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">Pro 사용</p>
                <p className="text-2xl font-bold text-blue-700">67개 학원</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-1">Enterprise 사용</p>
                <p className="text-2xl font-bold text-purple-700">15개 학원</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
