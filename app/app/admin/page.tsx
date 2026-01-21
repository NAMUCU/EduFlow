'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  GraduationCap,
  CreditCard,
  CheckCircle,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Loader2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard, BarChart } from '@/components/charts'

// ============================================
// UI 텍스트 상수
// ============================================
const UI_TEXT = {
  pageTitle: '슈퍼 어드민 대시보드',
  pageSubtitle: 'EduFlow 전체 서비스 현황을 한눈에 확인하세요',
  totalAcademies: '총 학원 수',
  totalStudents: '총 학생 수',
  totalTeachers: '총 강사 수',
  monthlyRevenue: '이번 달 매출',
  activeSubscriptions: '활성 구독 수',
  todayInquiries: '오늘 문의 건수',
  recentAcademies: '최근 가입 학원',
  recentInquiries: '최근 고객 문의',
  academyActivity: '학원별 활동 현황',
  viewAll: '전체 보기',
  loading: '데이터를 불러오는 중...',
  error: '데이터를 불러오는 중 오류가 발생했습니다.',
  retry: '다시 시도',
  academyName: '학원명',
  owner: '원장',
  plan: '요금제',
  studentCount: '학생 수',
  joinDate: '가입일',
  status: '상태',
  active: '활성',
  pending: '대기중',
  inquiry: '문의',
  customer: '고객',
  date: '날짜',
  type: '유형',
  new: '신규',
  inProgress: '처리중',
  resolved: '완료',
  problemsGenerated: '문제 생성 수',
}

// ============================================
// Mock 데이터
// ============================================
interface AdminDashboardStats {
  totalAcademies: number
  totalAcademiesChange: number
  totalStudents: number
  totalStudentsChange: number
  totalTeachers: number
  totalTeachersChange: number
  monthlyRevenue: number
  monthlyRevenueChange: number
  activeSubscriptions: number
  activeSubscriptionsChange: number
  todayInquiries: number
  todayInquiriesChange: number
  recentAcademies: {
    id: string
    name: string
    owner: string
    plan: 'enterprise' | 'pro' | 'basic' | 'free'
    studentCount: number
    status: 'active' | 'pending'
    joinDate: string
  }[]
  recentInquiries: {
    id: string
    customer: string
    academy: string
    type: string
    status: 'new' | 'in_progress' | 'resolved'
    date: string
    summary: string
  }[]
  academyActivityData: {
    label: string
    value: number
  }[]
}

const MOCK_STATS: AdminDashboardStats = {
  totalAcademies: 156,
  totalAcademiesChange: 12,
  totalStudents: 8432,
  totalStudentsChange: 234,
  totalTeachers: 423,
  totalTeachersChange: 18,
  monthlyRevenue: 45600000,
  monthlyRevenueChange: 15.2,
  activeSubscriptions: 142,
  activeSubscriptionsChange: 8,
  todayInquiries: 7,
  todayInquiriesChange: -2,
  recentAcademies: [
    {
      id: '1',
      name: '수학의 정석 학원',
      owner: '김정훈',
      plan: 'pro',
      studentCount: 45,
      status: 'active',
      joinDate: '2025-01-20',
    },
    {
      id: '2',
      name: '영어왕 어학원',
      owner: '이수진',
      plan: 'enterprise',
      studentCount: 120,
      status: 'active',
      joinDate: '2025-01-19',
    },
    {
      id: '3',
      name: '과학탐구 학원',
      owner: '박민수',
      plan: 'basic',
      studentCount: 28,
      status: 'pending',
      joinDate: '2025-01-18',
    },
    {
      id: '4',
      name: '국어논술 전문학원',
      owner: '최영희',
      plan: 'pro',
      studentCount: 65,
      status: 'active',
      joinDate: '2025-01-17',
    },
    {
      id: '5',
      name: '코딩스쿨',
      owner: '정대현',
      plan: 'free',
      studentCount: 15,
      status: 'active',
      joinDate: '2025-01-16',
    },
  ],
  recentInquiries: [
    {
      id: '1',
      customer: '김철수',
      academy: '수학의 정석 학원',
      type: '결제 문의',
      status: 'new',
      date: '2025-01-21 14:30',
      summary: '구독 결제 실패 문제 문의',
    },
    {
      id: '2',
      customer: '이영희',
      academy: '영어왕 어학원',
      type: '기능 문의',
      status: 'in_progress',
      date: '2025-01-21 11:20',
      summary: 'AI 문제 생성 기능 사용 방법 문의',
    },
    {
      id: '3',
      customer: '박지민',
      academy: '과학탐구 학원',
      type: '기술 지원',
      status: 'in_progress',
      date: '2025-01-21 09:45',
      summary: '학생 데이터 일괄 등록 오류',
    },
    {
      id: '4',
      customer: '최동욱',
      academy: '국어논술 전문학원',
      type: '환불 요청',
      status: 'resolved',
      date: '2025-01-20 16:00',
      summary: '요금제 다운그레이드 관련 환불 요청',
    },
    {
      id: '5',
      customer: '정서연',
      academy: '코딩스쿨',
      type: '기능 제안',
      status: 'new',
      date: '2025-01-20 10:15',
      summary: '코딩 문제 유형 추가 제안',
    },
  ],
  academyActivityData: [
    { label: '수학의 정석', value: 450 },
    { label: '영어왕', value: 380 },
    { label: '과학탐구', value: 320 },
    { label: '국어논술', value: 290 },
    { label: '코딩스쿨', value: 210 },
    { label: '물리마스터', value: 180 },
    { label: '화학천재', value: 150 },
  ],
}

// ============================================
// 스타일 상수
// ============================================
const planStyles: Record<string, string> = {
  enterprise: 'bg-purple-100 text-purple-700',
  pro: 'bg-blue-100 text-blue-700',
  basic: 'bg-gray-100 text-gray-600',
  free: 'bg-green-100 text-green-600',
}

const planLabels: Record<string, string> = {
  enterprise: 'Enterprise',
  pro: 'Pro',
  basic: 'Basic',
  free: 'Free',
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

const inquiryStatusStyles: Record<string, string> = {
  new: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
}

const inquiryStatusLabels: Record<string, string> = {
  new: '신규',
  in_progress: '처리중',
  resolved: '완료',
}

// ============================================
// 매출 포맷 함수
// ============================================
const formatRevenue = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`
  }
  if (value >= 10000) {
    return `${Math.floor(value / 10000).toLocaleString()}만원`
  }
  return `${value.toLocaleString()}원`
}

// ============================================
// 메인 컴포넌트
// ============================================
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock 데이터 로드 (실제로는 API 호출)
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock: 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 500))
      setStats(MOCK_STATS)
    } catch (err) {
      console.error('통계 로드 오류:', err)
      setError(UI_TEXT.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // 로딩 상태
  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-gray-500">{UI_TEXT.loading}</p>
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-500">{error || UI_TEXT.error}</p>
            <button onClick={fetchStats} className="btn-primary">
              {UI_TEXT.retry}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
        <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
      </div>

      {/* 통계 카드 - 6개 */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <StatCard
          label={UI_TEXT.totalAcademies}
          value={stats.totalAcademies.toLocaleString()}
          change={stats.totalAcademiesChange > 0 ? `+${stats.totalAcademiesChange}` : `${stats.totalAcademiesChange}`}
          changeType={stats.totalAcademiesChange >= 0 ? 'positive' : 'negative'}
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label={UI_TEXT.totalStudents}
          value={stats.totalStudents.toLocaleString()}
          change={stats.totalStudentsChange > 0 ? `+${stats.totalStudentsChange}` : `${stats.totalStudentsChange}`}
          changeType={stats.totalStudentsChange >= 0 ? 'positive' : 'negative'}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label={UI_TEXT.totalTeachers}
          value={stats.totalTeachers.toLocaleString()}
          change={stats.totalTeachersChange > 0 ? `+${stats.totalTeachersChange}` : `${stats.totalTeachersChange}`}
          changeType={stats.totalTeachersChange >= 0 ? 'positive' : 'negative'}
          icon={<GraduationCap className="w-5 h-5" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label={UI_TEXT.monthlyRevenue}
          value={formatRevenue(stats.monthlyRevenue)}
          change={`+${stats.monthlyRevenueChange}%`}
          changeType={stats.monthlyRevenueChange >= 0 ? 'positive' : 'negative'}
          icon={<CreditCard className="w-5 h-5" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          label={UI_TEXT.activeSubscriptions}
          value={stats.activeSubscriptions.toLocaleString()}
          change={stats.activeSubscriptionsChange > 0 ? `+${stats.activeSubscriptionsChange}` : `${stats.activeSubscriptionsChange}`}
          changeType={stats.activeSubscriptionsChange >= 0 ? 'positive' : 'negative'}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBgColor="bg-teal-100"
          iconColor="text-teal-600"
        />
        <StatCard
          label={UI_TEXT.todayInquiries}
          value={stats.todayInquiries.toLocaleString()}
          change={stats.todayInquiriesChange > 0 ? `+${stats.todayInquiriesChange}` : `${stats.todayInquiriesChange}`}
          changeType={stats.todayInquiriesChange >= 0 ? 'positive' : 'negative'}
          icon={<MessageSquare className="w-5 h-5" />}
          iconBgColor="bg-pink-100"
          iconColor="text-pink-600"
        />
      </div>

      {/* 하단 섹션: 최근 가입 학원 + 최근 문의 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* 최근 가입 학원 (5개) */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              {UI_TEXT.recentAcademies}
            </h3>
            <Link href="/admin/academies" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              {UI_TEXT.viewAll}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentAcademies.map((academy) => (
              <div
                key={academy.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{academy.name}</p>
                    <p className="text-sm text-gray-500">{academy.owner} · {academy.studentCount}명</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${planStyles[academy.plan]}`}>
                    {planLabels[academy.plan]}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[academy.status]}`}>
                    {academy.status === 'active' ? UI_TEXT.active : UI_TEXT.pending}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 고객 문의 (5개) */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              {UI_TEXT.recentInquiries}
            </h3>
            <Link href="/admin/support" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              {UI_TEXT.viewAll}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    inquiry.status === 'new' ? 'bg-red-100' :
                    inquiry.status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <MessageSquare className={`w-5 h-5 ${
                      inquiry.status === 'new' ? 'text-red-600' :
                      inquiry.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{inquiry.summary}</p>
                    <p className="text-xs text-gray-500">{inquiry.customer} · {inquiry.academy}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${inquiryStatusStyles[inquiry.status]}`}>
                    {inquiryStatusLabels[inquiry.status]}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {inquiry.date.split(' ')[1]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 학원별 활동 차트 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            {UI_TEXT.academyActivity}
          </h3>
          <span className="text-sm text-gray-500">{UI_TEXT.problemsGenerated}</span>
        </div>
        <BarChart
          data={stats.academyActivityData}
          height={280}
          showGrid={true}
          showTooltip={true}
        />
      </div>
    </div>
  )
}
