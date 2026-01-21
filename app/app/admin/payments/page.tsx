'use client'

import { useState } from 'react'
import {
  CreditCard,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw,
  X,
  CreditCard as CardIcon,
  Banknote,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react'

// 결제 상태 타입
type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded'

// 결제 데이터 타입
interface Payment {
  id: string
  academy: string
  academyId: number
  plan: string
  amount: number
  status: PaymentStatus
  method: '카드' | '계좌이체' | '가상계좌'
  cardLast4: string | null
  bankName: string | null
  paidAt: string | null
  createdAt: string
  period: string
  refundedAt: string | null
  refundReason: string | null
  invoiceUrl: string | null
  transactionId: string
}

// 목업 데이터 - 이번 달
const mockPaymentsThisMonth: Payment[] = [
  {
    id: 'PAY-2025-0121-001',
    academy: '스마트 수학학원',
    academyId: 1,
    plan: 'Pro',
    amount: 99000,
    status: 'completed',
    method: '카드',
    cardLast4: '1234',
    bankName: null,
    paidAt: '2025-01-21 09:30',
    createdAt: '2025-01-21 09:30',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2025-0121-001.pdf',
    transactionId: 'TXN-A1B2C3D4E5',
  },
  {
    id: 'PAY-2025-0120-002',
    academy: '국어논술학원',
    academyId: 2,
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '카드',
    cardLast4: '5678',
    bankName: null,
    paidAt: '2025-01-20 14:22',
    createdAt: '2025-01-20 14:20',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2025-0120-002.pdf',
    transactionId: 'TXN-F6G7H8I9J0',
  },
  {
    id: 'PAY-2025-0119-003',
    academy: '영어마을학원',
    academyId: 3,
    plan: 'Basic',
    amount: 49000,
    status: 'completed',
    method: '카드',
    cardLast4: '9012',
    bankName: null,
    paidAt: '2025-01-19 11:45',
    createdAt: '2025-01-19 11:45',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2025-0119-003.pdf',
    transactionId: 'TXN-K1L2M3N4O5',
  },
  {
    id: 'PAY-2025-0118-004',
    academy: '명문학원',
    academyId: 4,
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '계좌이체',
    cardLast4: null,
    bankName: '신한은행',
    paidAt: '2025-01-18 16:00',
    createdAt: '2025-01-18 10:00',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2025-0118-004.pdf',
    transactionId: 'TXN-P6Q7R8S9T0',
  },
  {
    id: 'PAY-2025-0117-005',
    academy: '수학의정석',
    academyId: 5,
    plan: 'Pro',
    amount: 99000,
    status: 'failed',
    method: '카드',
    cardLast4: '3456',
    bankName: null,
    paidAt: null,
    createdAt: '2025-01-17 09:00',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: null,
    transactionId: 'TXN-U1V2W3X4Y5',
  },
  {
    id: 'PAY-2025-0116-006',
    academy: '영재교육원',
    academyId: 6,
    plan: 'Pro',
    amount: 99000,
    status: 'pending',
    method: '가상계좌',
    cardLast4: null,
    bankName: '우리은행',
    paidAt: null,
    createdAt: '2025-01-16 14:30',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: null,
    transactionId: 'TXN-Z6A7B8C9D0',
  },
  {
    id: 'PAY-2025-0115-007',
    academy: '과학탐구교실',
    academyId: 7,
    plan: 'Basic',
    amount: 49000,
    status: 'refunded',
    method: '카드',
    cardLast4: '7890',
    bankName: null,
    paidAt: '2025-01-15 10:00',
    createdAt: '2025-01-15 10:00',
    period: '2025-01',
    refundedAt: '2025-01-17 15:30',
    refundReason: '서비스 불만족',
    invoiceUrl: '/invoices/PAY-2025-0115-007.pdf',
    transactionId: 'TXN-E1F2G3H4I5',
  },
  {
    id: 'PAY-2025-0114-008',
    academy: '종합학습센터',
    academyId: 8,
    plan: 'Pro',
    amount: 99000,
    status: 'refunded',
    method: '카드',
    cardLast4: '2468',
    bankName: null,
    paidAt: '2025-01-14 11:20',
    createdAt: '2025-01-14 11:20',
    period: '2025-01',
    refundedAt: '2025-01-16 09:00',
    refundReason: '요금제 변경',
    invoiceUrl: '/invoices/PAY-2025-0114-008.pdf',
    transactionId: 'TXN-J6K7L8M9N0',
  },
  {
    id: 'PAY-2025-0113-009',
    academy: '창의력교실',
    academyId: 9,
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '계좌이체',
    cardLast4: null,
    bankName: '국민은행',
    paidAt: '2025-01-13 14:00',
    createdAt: '2025-01-13 09:00',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2025-0113-009.pdf',
    transactionId: 'TXN-O1P2Q3R4S5',
  },
  {
    id: 'PAY-2025-0112-010',
    academy: '논리수학학원',
    academyId: 10,
    plan: 'Pro',
    amount: 99000,
    status: 'pending',
    method: '가상계좌',
    cardLast4: null,
    bankName: '하나은행',
    paidAt: null,
    createdAt: '2025-01-12 16:45',
    period: '2025-01',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: null,
    transactionId: 'TXN-T6U7V8W9X0',
  },
]

// 목업 데이터 - 지난 달
const mockPaymentsLastMonth: Payment[] = [
  {
    id: 'PAY-2024-1231-001',
    academy: '스마트 수학학원',
    academyId: 1,
    plan: 'Pro',
    amount: 99000,
    status: 'completed',
    method: '카드',
    cardLast4: '1234',
    bankName: null,
    paidAt: '2024-12-31 09:30',
    createdAt: '2024-12-31 09:30',
    period: '2024-12',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2024-1231-001.pdf',
    transactionId: 'TXN-DEC001',
  },
  {
    id: 'PAY-2024-1230-002',
    academy: '국어논술학원',
    academyId: 2,
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '카드',
    cardLast4: '5678',
    bankName: null,
    paidAt: '2024-12-30 14:22',
    createdAt: '2024-12-30 14:20',
    period: '2024-12',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2024-1230-002.pdf',
    transactionId: 'TXN-DEC002',
  },
  {
    id: 'PAY-2024-1229-003',
    academy: '영어마을학원',
    academyId: 3,
    plan: 'Basic',
    amount: 49000,
    status: 'completed',
    method: '카드',
    cardLast4: '9012',
    bankName: null,
    paidAt: '2024-12-29 11:45',
    createdAt: '2024-12-29 11:45',
    period: '2024-12',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2024-1229-003.pdf',
    transactionId: 'TXN-DEC003',
  },
  {
    id: 'PAY-2024-1228-004',
    academy: '명문학원',
    academyId: 4,
    plan: 'Enterprise',
    amount: 299000,
    status: 'completed',
    method: '계좌이체',
    cardLast4: null,
    bankName: '신한은행',
    paidAt: '2024-12-28 16:00',
    createdAt: '2024-12-28 10:00',
    period: '2024-12',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2024-1228-004.pdf',
    transactionId: 'TXN-DEC004',
  },
  {
    id: 'PAY-2024-1227-005',
    academy: '수학의정석',
    academyId: 5,
    plan: 'Pro',
    amount: 99000,
    status: 'completed',
    method: '카드',
    cardLast4: '3456',
    bankName: null,
    paidAt: '2024-12-27 09:00',
    createdAt: '2024-12-27 09:00',
    period: '2024-12',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2024-1227-005.pdf',
    transactionId: 'TXN-DEC005',
  },
  {
    id: 'PAY-2024-1226-006',
    academy: '영재교육원',
    academyId: 6,
    plan: 'Pro',
    amount: 99000,
    status: 'completed',
    method: '카드',
    cardLast4: '1357',
    bankName: null,
    paidAt: '2024-12-26 14:30',
    createdAt: '2024-12-26 14:30',
    period: '2024-12',
    refundedAt: null,
    refundReason: null,
    invoiceUrl: '/invoices/PAY-2024-1226-006.pdf',
    transactionId: 'TXN-DEC006',
  },
]

// 모든 결제 데이터 합치기
const allPayments = [...mockPaymentsThisMonth, ...mockPaymentsLastMonth]

// 상태별 설정
const statusConfig: Record<PaymentStatus, { color: string; bgColor: string; icon: typeof CheckCircle; label: string }> = {
  completed: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, label: '완료' },
  pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, label: '대기' },
  failed: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle, label: '실패' },
  refunded: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: RotateCcw, label: '환불' },
}

// 요금제 색상
const planColors: Record<string, string> = {
  'Basic': 'bg-gray-100 text-gray-600',
  'Pro': 'bg-blue-100 text-blue-700',
  'Enterprise': 'bg-purple-100 text-purple-700',
}

export default function PaymentsPage() {
  const [payments] = useState<Payment[]>(allPayments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all')
  const [filterPeriod, setFilterPeriod] = useState('2025-01')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 기간별 필터링
  const paymentsByPeriod = payments.filter(p => p.period === filterPeriod)
  const lastMonthPayments = payments.filter(p => p.period === '2024-12')

  // 검색 및 상태 필터링
  const filteredPayments = paymentsByPeriod.filter(payment => {
    const matchesSearch = payment.academy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // 페이지네이션
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 통계 계산 - 이번 달
  const thisMonthRevenue = paymentsByPeriod
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const thisMonthRefundTotal = paymentsByPeriod
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0)

  // 통계 계산 - 지난 달
  const lastMonthRevenue = lastMonthPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  // 전월 대비 변화율
  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : '0'
  const isRevenueUp = thisMonthRevenue >= lastMonthRevenue

  // 상태별 건수
  const completedCount = paymentsByPeriod.filter(p => p.status === 'completed').length
  const pendingCount = paymentsByPeriod.filter(p => p.status === 'pending').length
  const failedCount = paymentsByPeriod.filter(p => p.status === 'failed').length
  const refundedCount = paymentsByPeriod.filter(p => p.status === 'refunded').length

  // 상세 모달 열기
  const openDetail = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowDetailModal(true)
  }

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return dateStr
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
          <p className="text-gray-500">학원 결제 내역을 관리하고 정산 현황을 확인합니다</p>
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* 이번 달 매출 */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">이번 달 매출</p>
              <p className="text-2xl font-bold text-gray-900">
                {thisMonthRevenue.toLocaleString()}원
              </p>
              <div className={`flex items-center gap-1 mt-2 text-sm ${isRevenueUp ? 'text-green-600' : 'text-red-600'}`}>
                {isRevenueUp ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>전월 대비 {revenueChange}%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* 결제 완료 */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">결제 완료</p>
              <p className="text-2xl font-bold text-gray-900">{completedCount}건</p>
              <p className="text-sm text-gray-400 mt-2">정상 처리됨</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 미결제 (대기 + 실패) */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">미결제</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount + failedCount}건</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <span className="text-yellow-600">대기 {pendingCount}</span>
                <span className="text-gray-300">|</span>
                <span className="text-red-600">실패 {failedCount}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* 환불 */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">환불</p>
              <p className="text-2xl font-bold text-gray-900">{refundedCount}건</p>
              <p className="text-sm text-purple-600 mt-2">
                {thisMonthRefundTotal.toLocaleString()}원
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-purple-600" />
            </div>
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
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              className="input w-40"
              value={filterPeriod}
              onChange={(e) => {
                setFilterPeriod(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="2025-01">2025년 1월</option>
              <option value="2024-12">2024년 12월</option>
              <option value="2024-11">2024년 11월</option>
            </select>
          </div>
          <select
            className="input w-40"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as 'all' | PaymentStatus)
              setCurrentPage(1)
            }}
          >
            <option value="all">전체 상태</option>
            <option value="completed">완료</option>
            <option value="pending">대기</option>
            <option value="failed">실패</option>
            <option value="refunded">환불</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium">날짜</th>
              <th className="px-4 py-3 font-medium">결제번호</th>
              <th className="px-4 py-3 font-medium">학원명</th>
              <th className="px-4 py-3 font-medium">금액</th>
              <th className="px-4 py-3 font-medium">결제방법</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  검색 결과가 없습니다
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => {
                const status = statusConfig[payment.status]
                const StatusIcon = status.icon
                return (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {payment.createdAt.split(' ')[0]}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-mono text-sm text-gray-600">{payment.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{payment.academy}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${planColors[payment.plan]}`}>
                          {payment.plan}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {payment.amount.toLocaleString()}원
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        {payment.method === '카드' ? (
                          <CardIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Banknote className="w-4 h-4 text-gray-400" />
                        )}
                        <span>{payment.method}</span>
                        {payment.cardLast4 && (
                          <span className="text-gray-400">(*{payment.cardLast4})</span>
                        )}
                        {payment.bankName && (
                          <span className="text-gray-400">({payment.bankName})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(payment)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        {payment.invoiceUrl && (
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="영수증"
                          >
                            <Receipt className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            총 {filteredPayments.length}건 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredPayments.length)}건
          </p>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  page === currentPage
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 결제 상세 모달 */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">결제 상세 정보</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedPayment.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 결제 상태 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  {(() => {
                    const status = statusConfig[selectedPayment.status]
                    const StatusIcon = status.icon
                    return (
                      <>
                        <div className={`w-10 h-10 rounded-full ${status.bgColor} flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">결제 {status.label}</p>
                          <p className="text-sm text-gray-500">
                            {selectedPayment.paidAt
                              ? `결제일: ${formatDate(selectedPayment.paidAt)}`
                              : `요청일: ${formatDate(selectedPayment.createdAt)}`}
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedPayment.amount.toLocaleString()}원
                </p>
              </div>

              {/* 학원 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">학원 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">학원명</p>
                    <p className="font-medium text-gray-900">{selectedPayment.academy}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">요금제</p>
                    <span className={`text-sm px-3 py-1 rounded-full ${planColors[selectedPayment.plan]}`}>
                      {selectedPayment.plan}
                    </span>
                  </div>
                </div>
              </div>

              {/* 결제 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">결제 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">결제 수단</p>
                    <div className="flex items-center gap-2">
                      {selectedPayment.method === '카드' ? (
                        <CardIcon className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Banknote className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {selectedPayment.method}
                        {selectedPayment.cardLast4 && ` (*${selectedPayment.cardLast4})`}
                        {selectedPayment.bankName && ` (${selectedPayment.bankName})`}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">정산 기간</p>
                    <p className="font-medium text-gray-900">
                      {selectedPayment.period.replace('-', '년 ')}월
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">거래 번호</p>
                    <p className="font-mono text-sm text-gray-900">{selectedPayment.transactionId}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">결제 요청일</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* 환불 정보 (환불된 경우만) */}
              {selectedPayment.status === 'refunded' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">환불 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-sm text-purple-600 mb-1">환불일</p>
                      <p className="font-medium text-purple-900">{formatDate(selectedPayment.refundedAt)}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-sm text-purple-600 mb-1">환불 사유</p>
                      <p className="font-medium text-purple-900">{selectedPayment.refundReason || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {selectedPayment.status === 'pending' && (
                  <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    결제 확인
                  </button>
                )}
                {selectedPayment.status === 'failed' && (
                  <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    재결제 요청
                  </button>
                )}
                {selectedPayment.status === 'completed' && (
                  <button className="btn-secondary flex-1 flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
                    <RotateCcw className="w-4 h-4" />
                    환불 처리
                  </button>
                )}
                {selectedPayment.invoiceUrl && (
                  <button className="btn-secondary flex items-center justify-center gap-2">
                    <Receipt className="w-4 h-4" />
                    영수증 다운로드
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
