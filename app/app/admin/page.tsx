'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  FileQuestion,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Calendar,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard, LineChart, PieChart, BarChart } from '@/components/charts'
import type { AdminStats, AdminStatsResponse, PeriodType } from '@/types/stats'

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '대시보드',
  pageSubtitle: 'EduFlow 서비스 현황을 한눈에 확인하세요',
  totalAcademies: '총 학원 수',
  totalUsers: '총 사용자 수',
  monthlyProblems: '이번 달 문제 생성',
  monthlyRevenue: '이번 달 매출',
  problemTrend: '문제 생성 추이',
  subjectDistribution: '과목별 문제 생성',
  recentAcademies: '최근 가입 학원',
  topAcademies: '이번 달 TOP 학원',
  viewAll: '전체 보기',
  downloadReport: '리포트 다운로드',
  loading: '데이터를 불러오는 중...',
  error: '데이터를 불러오는 중 오류가 발생했습니다.',
  retry: '다시 시도',
  periodWeek: '이번 주',
  periodMonth: '이번 달',
  periodQuarter: '이번 분기',
  periodYear: '올해',
  daily: '일별',
  weekly: '주별',
  academyName: '학원명',
  owner: '원장',
  plan: '요금제',
  studentCount: '학생 수',
  status: '상태',
  joinDate: '가입일',
  active: '활성',
  pending: '대기',
  problems: '문제',
  totalProblems: '총 문제 생성 수',
}

// 요금제 스타일
const planStyles = {
  enterprise: 'bg-purple-100 text-purple-700',
  pro: 'bg-blue-100 text-blue-700',
  basic: 'bg-gray-100 text-gray-600',
  free: 'bg-green-100 text-green-600',
}

// 요금제 라벨
const planLabels = {
  enterprise: 'Enterprise',
  pro: 'Pro',
  basic: 'Basic',
  free: 'Free',
}

// 순위 스타일
const rankStyles = [
  'bg-yellow-100 text-yellow-700',
  'bg-gray-200 text-gray-600',
  'bg-orange-100 text-orange-700',
  'bg-gray-100 text-gray-500',
  'bg-gray-100 text-gray-500',
]

// 색상 팔레트
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodType>('month')

  // 통계 데이터 로드
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/stats/admin?period=${period}`)
      const data: AdminStatsResponse = await response.json()

      if (data.success && data.data) {
        setStats(data.data)
      } else {
        setError(data.error || UI_TEXT.error)
      }
    } catch (err) {
      console.error('통계 로드 오류:', err)
      setError(UI_TEXT.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  // 로딩 상태
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
            <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
          </div>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
            <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
          </div>
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

  // 차트 데이터 변환
  const problemsTrendData = stats.dailyProblemsTrend.map(item => ({
    label: item.label,
    value: item.value,
  }))

  const subjectPieData = stats.problemsBySubject.map((item, index) => ({
    name: item.subject,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  // 매출 포맷터
  const formatRevenue = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억원`
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만원`
    }
    return `${value.toLocaleString()}원`
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input w-auto"
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
          >
            <option value="week">{UI_TEXT.periodWeek}</option>
            <option value="month">{UI_TEXT.periodMonth}</option>
            <option value="quarter">{UI_TEXT.periodQuarter}</option>
            <option value="year">{UI_TEXT.periodYear}</option>
          </select>
          <button className="btn-primary flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {UI_TEXT.downloadReport}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label={UI_TEXT.totalAcademies}
          value={stats.totalAcademies.toLocaleString()}
          change={stats.totalAcademiesChange > 0 ? `+${stats.totalAcademiesChange}` : `${stats.totalAcademiesChange}`}
          changeType={stats.totalAcademiesChange >= 0 ? 'positive' : 'negative'}
          icon={<Building2 className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label={UI_TEXT.totalUsers}
          value={stats.totalUsers.toLocaleString()}
          change={stats.totalUsersChange > 0 ? `+${stats.totalUsersChange}` : `${stats.totalUsersChange}`}
          changeType={stats.totalUsersChange >= 0 ? 'positive' : 'negative'}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label={UI_TEXT.monthlyProblems}
          value={stats.monthlyProblems.toLocaleString()}
          change={stats.monthlyProblemsChange > 0 ? `+${stats.monthlyProblemsChange.toLocaleString()}` : `${stats.monthlyProblemsChange.toLocaleString()}`}
          changeType={stats.monthlyProblemsChange >= 0 ? 'positive' : 'negative'}
          icon={<FileQuestion className="w-6 h-6" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label={UI_TEXT.monthlyRevenue}
          value={formatRevenue(stats.monthlyRevenue)}
          change={`+${stats.monthlyRevenueChange}%`}
          changeType={stats.monthlyRevenueChange >= 0 ? 'positive' : 'negative'}
          icon={<CreditCard className="w-6 h-6" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* 문제 생성 추이 */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              {UI_TEXT.problemTrend}
            </h3>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{UI_TEXT.daily}</span>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full cursor-pointer hover:bg-gray-200">{UI_TEXT.weekly}</span>
            </div>
          </div>
          <LineChart
            data={problemsTrendData}
            height={240}
            color="#6366f1"
            showGrid={true}
            showTooltip={true}
          />
        </div>

        {/* 과목별 분포 */}
        <div className="card">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
            {UI_TEXT.subjectDistribution}
          </h3>
          <PieChart
            data={subjectPieData}
            height={180}
            showLabel={true}
            showLegend={false}
            innerRadius={50}
            outerRadius={80}
          />
          <div className="space-y-3 mt-4">
            {stats.problemsBySubject.map((subject, index) => (
              <div key={subject.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{subject.subject}</span>
                  <span className="text-gray-500">{subject.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${subject.percentage}%`,
                      backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">{UI_TEXT.totalProblems}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.monthlyProblems.toLocaleString()}{UI_TEXT.problems}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 최근 가입 학원 */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              {UI_TEXT.recentAcademies}
            </h3>
            <Link href="/admin/academies" className="text-sm text-primary-600 hover:underline">
              {UI_TEXT.viewAll} →
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">{UI_TEXT.academyName}</th>
                <th className="pb-3 font-medium">{UI_TEXT.owner}</th>
                <th className="pb-3 font-medium">{UI_TEXT.plan}</th>
                <th className="pb-3 font-medium">{UI_TEXT.studentCount}</th>
                <th className="pb-3 font-medium">{UI_TEXT.status}</th>
                <th className="pb-3 font-medium">{UI_TEXT.joinDate}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAcademies.map((academy) => (
                <tr key={academy.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{academy.name}</td>
                  <td className="py-3 text-gray-600">{academy.owner}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${planStyles[academy.plan]}`}>
                      {planLabels[academy.plan]}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{academy.studentCount}명</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      academy.status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {academy.status === 'active' ? UI_TEXT.active : UI_TEXT.pending}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 text-sm">{academy.joinDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 문제 생성 TOP 학원 */}
        <div className="card">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            {UI_TEXT.topAcademies}
          </h3>
          <div className="space-y-4">
            {stats.topAcademies.map((academy, index) => (
              <div key={academy.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankStyles[index]}`}>
                  {academy.rank}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{academy.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(academy.problems / 5000) * 100}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{academy.problems.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
