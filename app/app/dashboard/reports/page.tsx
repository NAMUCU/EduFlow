'use client'

/**
 * 학습 보고서 대시보드 페이지
 *
 * 학생별 학습 리포트를 조회, 생성, 관리하는 페이지입니다.
 * - 학생/기간 선택으로 리포트 생성
 * - 리포트 목록 조회 및 필터링
 * - 리포트 상세 보기 및 PDF 다운로드
 * - 학부모 발송 기능
 *
 * Vercel Best Practices 적용:
 * - async-parallel: Promise.all로 병렬 데이터 fetching (useReportsTeacher 훅에서 처리)
 * - bundle-dynamic-imports: next/dynamic으로 ReportViewer lazy loading
 * - client-swr-dedup: SWR로 클라이언트 캐싱 및 요청 중복 제거
 * - rerender-memo: React.memo로 ReportCard 컴포넌트 메모이제이션
 * - bundle-preload: hover/focus 시 ReportViewer prefetch
 * - js-combine-iterations: 통계를 한 번의 순회로 계산
 */

import { useState, useCallback, memo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import {
  FileText,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Calendar,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Users,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import {
  Report,
  ReportListItem,
  ReportGenerateRequest,
  ReportPeriodType,
  ReportStatus,
  REPORT_STATUS_LABELS,
  getReportStatusColor,
} from '@/types/report'
import useReportsTeacher, { ReportStudent, TeacherReportFilter } from '@/hooks/useReportsTeacher'

// ============================================
// bundle-dynamic-imports: ReportViewer lazy loading
// 차트와 복잡한 UI가 포함된 무거운 컴포넌트를 동적 로딩
// ============================================
const ReportViewer = dynamic(
  () => import('@/components/ReportViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="card h-full flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="ml-3 text-gray-500">보고서 뷰어 로딩 중...</span>
      </div>
    ),
  }
)

// ============================================
// bundle-preload: ReportViewer 모듈 사전 로딩
// hover/focus 시 사용자 의도를 예측하여 미리 로딩
// ============================================
const preloadReportViewer = () => {
  if (typeof window !== 'undefined') {
    void import('@/components/ReportViewer')
  }
}

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '학습 보고서',
  pageSubtitle: '학생별 학습 현황을 분석하고 학부모님께 보고서를 발송합니다',
  thisWeekReports: '이번 주 보고서',
  sentReports: '발송 완료',
  improvedStudents: '성적 향상',
  averageScore: '평균 점수',
  generateReport: '리포트 생성',
  bulkSend: '전체 보고서 일괄 발송',
  selectStudent: '학생을 선택하세요',
  selectPeriod: '기간을 선택하세요',
  startDate: '시작일',
  endDate: '종료일',
  periodType: '기간 유형',
  weekly: '주간',
  monthly: '월간',
  generating: '생성 중...',
  loading: '불러오는 중...',
  noReports: '생성된 리포트가 없습니다',
  selectReportPrompt: '왼쪽에서 학생을 선택하세요',
  filterByStatus: '상태 필터',
  allStatus: '전체',
  searchPlaceholder: '학생 이름으로 검색...',
  generateNewReport: '새 리포트 생성',
  cancel: '취소',
  create: '생성',
  error: '오류가 발생했습니다',
  success: '성공적으로 처리되었습니다',
}

// ============================================
// rerender-memo: ReportCard 컴포넌트 메모이제이션
// 목록에서 개별 카드의 불필요한 리렌더링 방지
// ============================================
interface ReportCardProps {
  report: ReportListItem
  isSelected: boolean
  onSelect: (reportId: string) => void
  onMouseEnter: () => void
  onFocus: () => void
}

const ReportCard = memo(function ReportCard({
  report,
  isSelected,
  onSelect,
  onMouseEnter,
  onFocus,
}: ReportCardProps) {
  // 추이 아이콘 반환
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div
      onClick={() => onSelect(report.id)}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      tabIndex={0}
      role="button"
      aria-label={`${report.studentName} 학생의 보고서 보기`}
      className={`card cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary-500 bg-primary-50'
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
            {report.studentName[0]}
          </div>
          <div>
            <p className="font-bold text-gray-900">{report.studentName}</p>
            <p className="text-xs text-gray-500">
              {report.studentGrade} | {report.studentSchool}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {report.period.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{report.overallScore}점</span>
          {getTrendIcon(report.scoreTrend)}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getReportStatusColor(report.status)}`}>
          {REPORT_STATUS_LABELS[report.status]}
        </span>
      </div>
    </div>
  )
})

// ============================================
// rerender-memo: StatsCard 컴포넌트 메모이제이션
// 통계 카드의 불필요한 리렌더링 방지
// ============================================
interface StatsCardProps {
  icon: React.ReactNode
  iconBgColor: string
  label: string
  value: string
}

const StatsCard = memo(function StatsCard({
  icon,
  iconBgColor,
  label,
  value,
}: StatsCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
})

// ============================================
// 리포트 생성 모달 컴포넌트
// ============================================
interface GenerateModalProps {
  students: ReportStudent[]
  isGenerating: boolean
  onClose: () => void
  onGenerate: (request: ReportGenerateRequest) => void
}

const GenerateModal = memo(function GenerateModal({
  students,
  isGenerating,
  onClose,
  onGenerate,
}: GenerateModalProps) {
  const [form, setForm] = useState({
    studentId: '',
    periodType: 'weekly' as ReportPeriodType,
    startDate: '',
    endDate: '',
  })

  const handleSubmit = () => {
    if (!form.studentId || !form.startDate || !form.endDate) {
      return
    }

    onGenerate({
      studentId: form.studentId,
      periodType: form.periodType,
      startDate: form.startDate,
      endDate: form.endDate,
      includeAIAnalysis: true,
    })
  }

  const isValid = form.studentId && form.startDate && form.endDate

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">{UI_TEXT.generateNewReport}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 학생 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              학생 선택
            </label>
            <select
              className="input w-full"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            >
              <option value="">{UI_TEXT.selectStudent}</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.grade} | {student.school})
                </option>
              ))}
            </select>
          </div>

          {/* 기간 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {UI_TEXT.periodType}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, periodType: 'weekly' })}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  form.periodType === 'weekly'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {UI_TEXT.weekly}
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, periodType: 'monthly' })}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  form.periodType === 'monthly'
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {UI_TEXT.monthly}
              </button>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {UI_TEXT.startDate}
              </label>
              <input
                type="date"
                className="input w-full"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {UI_TEXT.endDate}
              </label>
              <input
                type="date"
                className="input w-full"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isGenerating}
          >
            {UI_TEXT.cancel}
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={isGenerating || !isValid}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {UI_TEXT.generating}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {UI_TEXT.create}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})

// ============================================
// 메인 페이지 컴포넌트
// ============================================
export default function ReportsPage() {
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // 선택된 리포트 상태
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // 에러 상태
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // client-swr-dedup: SWR 훅으로 데이터 페칭
  // async-parallel: 보고서와 학생 목록이 병렬로 로딩됨
  // ============================================
  const filter: TeacherReportFilter = {
    status: statusFilter,
    search: searchQuery,
  }

  const {
    reports,
    students,
    stats,
    isLoading,
    isGenerating,
    error: hookError,
    generateReport,
    sendReport,
    getReportDetail,
    downloadPdf,
    refresh,
  } = useReportsTeacher({ filter })

  // 에러 동기화
  if (hookError && !error) {
    setError(hookError)
  }

  // ============================================
  // 이벤트 핸들러
  // ============================================

  // 리포트 선택 (상세 조회)
  const handleSelectReport = useCallback(async (reportId: string) => {
    setIsLoadingDetail(true)
    setError(null)

    try {
      const detail = await getReportDetail(reportId)
      if (detail) {
        setSelectedReport(detail)
        setIsViewerOpen(true)
      } else {
        setError('리포트를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      console.error('리포트 상세 조회 오류:', err)
      setError('리포트를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingDetail(false)
    }
  }, [getReportDetail])

  // 리포트 생성
  const handleGenerateReport = useCallback(async (request: ReportGenerateRequest) => {
    setError(null)

    try {
      const result = await generateReport(request)
      if (result?.success && result.data) {
        setSelectedReport(result.data)
        setIsViewerOpen(true)
        setShowGenerateModal(false)
      } else {
        setError(result?.error || '리포트 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('리포트 생성 오류:', err)
      setError('리포트 생성에 실패했습니다.')
    }
  }, [generateReport])

  // 학부모 발송
  const handleSendReport = useCallback(async (reportId: string) => {
    try {
      const result = await sendReport(reportId)
      if (result.success) {
        // 선택된 리포트 상태 업데이트
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport({
            ...selectedReport,
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
        }
        alert('학부모님께 발송되었습니다.')
      } else {
        setError(result.error || '발송에 실패했습니다.')
      }
    } catch (err) {
      console.error('리포트 발송 오류:', err)
      setError('리포트 발송에 실패했습니다.')
    }
  }, [sendReport, selectedReport])

  // PDF 다운로드
  const handleDownloadPdf = useCallback(async (reportId: string) => {
    try {
      await downloadPdf(reportId)
    } catch (err) {
      console.error('PDF 다운로드 오류:', err)
      setError('PDF 다운로드에 실패했습니다.')
    }
  }, [downloadPdf])

  // 뷰어 닫기
  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false)
    setSelectedReport(null)
  }, [])

  return (
    <div>
      <Header title={UI_TEXT.pageTitle} subtitle={UI_TEXT.pageSubtitle} />

      <div className="p-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 상단 통계 - rerender-memo로 최적화된 StatsCard 사용 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            iconBgColor="bg-blue-100"
            label={UI_TEXT.thisWeekReports}
            value={`${stats.total}건`}
          />
          <StatsCard
            icon={<Send className="w-6 h-6 text-green-600" />}
            iconBgColor="bg-green-100"
            label={UI_TEXT.sentReports}
            value={`${stats.sent}건`}
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            iconBgColor="bg-orange-100"
            label={UI_TEXT.improvedStudents}
            value={`${stats.improved}명`}
          />
          <StatsCard
            icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
            iconBgColor="bg-purple-100"
            label={UI_TEXT.averageScore}
            value={`${stats.avgScore}점`}
          />
        </div>

        {/* 필터 및 액션 */}
        <div className="flex items-center gap-4 mb-6">
          {/* 검색 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={UI_TEXT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
            >
              <option value="">{UI_TEXT.allStatus}</option>
              {Object.entries(REPORT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 새로고침 */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="btn-secondary p-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* 리포트 생성 버튼 - bundle-preload: hover 시 모달 컴포넌트 사전 로딩 */}
          <button
            onClick={() => setShowGenerateModal(true)}
            onMouseEnter={preloadReportViewer}
            onFocus={preloadReportViewer}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            <Plus className="w-4 h-4" />
            {UI_TEXT.generateNewReport}
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-3 gap-6">
          {/* 보고서 목록 */}
          <div className="col-span-1 space-y-3">
            {isLoading ? (
              <div className="card flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <span className="ml-3 text-gray-500">{UI_TEXT.loading}</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{UI_TEXT.noReports}</p>
              </div>
            ) : (
              // rerender-memo: 각 ReportCard는 memo로 최적화됨
              reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  isSelected={selectedReport?.id === report.id}
                  onSelect={handleSelectReport}
                  // bundle-preload: hover/focus 시 ReportViewer 사전 로딩
                  onMouseEnter={preloadReportViewer}
                  onFocus={preloadReportViewer}
                />
              ))
            )}
          </div>

          {/* 보고서 미리보기 - bundle-dynamic-imports: lazy loading 적용 */}
          <div className="col-span-2">
            {isLoadingDetail ? (
              <div className="card h-full flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <span className="ml-3 text-gray-500">{UI_TEXT.loading}</span>
              </div>
            ) : selectedReport && isViewerOpen ? (
              <Suspense
                fallback={
                  <div className="card h-full flex items-center justify-center min-h-[500px]">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    <span className="ml-3 text-gray-500">보고서 뷰어 로딩 중...</span>
                  </div>
                }
              >
                <ReportViewer
                  report={selectedReport}
                  onClose={handleCloseViewer}
                  onSend={handleSendReport}
                  onDownloadPdf={handleDownloadPdf}
                />
              </Suspense>
            ) : (
              <div className="card h-full flex items-center justify-center text-gray-400 min-h-[500px]">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{UI_TEXT.selectReportPrompt}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 리포트 생성 모달 */}
      {showGenerateModal && (
        <GenerateModal
          students={students}
          isGenerating={isGenerating}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerateReport}
        />
      )}
    </div>
  )
}
