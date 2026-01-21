'use client'

/**
 * 학습 보고서 대시보드 페이지
 *
 * 학생별 학습 리포트를 조회, 생성, 관리하는 페이지입니다.
 * - AI 보고서 생성 (학부모용/강사용)
 * - 학생/기간 선택으로 리포트 생성
 * - 리포트 목록 조회 및 필터링
 * - 리포트 상세 보기 및 PDF 다운로드
 * - 학부모 발송 기능 (카카오/문자)
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
  Sparkles,
} from 'lucide-react'
import {
  Report,
  ReportListItem,
  ReportGenerateRequest,
  ReportPeriodType,
  ReportStatus,
  ReportTargetType,
  AutoReportGenerateRequest,
  ParentReport,
  TeacherReport,
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

// AI 보고서 생성 컴포넌트 동적 로딩
const ReportGenerator = dynamic(
  () => import('@/components/reports/ReportGenerator'),
  {
    ssr: false,
    loading: () => (
      <div className="card flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="ml-3 text-gray-500">로딩 중...</span>
      </div>
    ),
  }
)

// 보고서 미리보기 컴포넌트 동적 로딩
const ReportPreview = dynamic(
  () => import('@/components/reports/ReportPreview'),
  {
    ssr: false,
    loading: () => (
      <div className="card flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <span className="ml-3 text-gray-500">로딩 중...</span>
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

const preloadReportGenerator = () => {
  if (typeof window !== 'undefined') {
    void import('@/components/reports/ReportGenerator')
  }
}

const preloadReportPreview = () => {
  if (typeof window !== 'undefined') {
    void import('@/components/reports/ReportPreview')
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
  aiGenerateReport: 'AI 보고서 생성',
  cancel: '취소',
  create: '생성',
  error: '오류가 발생했습니다',
  success: '성공적으로 처리되었습니다',
  aiReportGenerating: 'AI 보고서 생성 중...',
  aiReportComplete: 'AI 보고서 생성 완료',
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
// AI 보고서 생성 결과 타입
interface AIGeneratedReports {
  studentId: string
  studentName: string
  parentReport?: ParentReport
  teacherReport?: TeacherReport
}

export default function ReportsPage() {
  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  // AI 보고서 생성 관련 상태
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false)
  const [isAIGenerating, setIsAIGenerating] = useState(false)
  const [aiGenerateProgress, setAIGenerateProgress] = useState(0)
  const [currentGeneratingStudent, setCurrentGeneratingStudent] = useState<string>('')
  const [aiGeneratedReports, setAIGeneratedReports] = useState<AIGeneratedReports[]>([])
  const [showAIPreview, setShowAIPreview] = useState(false)
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0)

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

  // ============================================
  // AI 보고서 생성 관련 핸들러
  // ============================================

  // AI 보고서 생성 요청
  const handleAIGenerateReport = useCallback(async (request: AutoReportGenerateRequest) => {
    setIsAIGenerating(true)
    setAIGenerateProgress(0)
    setAIGeneratedReports([])
    setError(null)

    const studentIds = request.studentIds || []
    const totalStudents = studentIds.length

    try {
      // Mock: 학생별로 보고서 생성 시뮬레이션
      // 실제로는 서버 API를 호출해야 함
      const results: AIGeneratedReports[] = []

      for (let i = 0; i < totalStudents; i++) {
        const studentId = studentIds[i]
        const student = students.find((s) => s.id === studentId)

        if (student) {
          setCurrentGeneratingStudent(student.name)

          // 보고서 생성 시뮬레이션 (실제로는 API 호출)
          await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

          const result: AIGeneratedReports = {
            studentId: student.id,
            studentName: student.name,
          }

          // 학부모용 보고서 생성
          if (request.targetTypes.includes('parent')) {
            result.parentReport = generateMockParentReport(student, request)
          }

          // 강사용 보고서 생성
          if (request.targetTypes.includes('teacher')) {
            result.teacherReport = generateMockTeacherReport(student, request)
          }

          results.push(result)
        }

        setAIGenerateProgress(((i + 1) / totalStudents) * 100)
      }

      setAIGeneratedReports(results)
      setShowAIGenerateModal(false)
      setShowAIPreview(true)
      setCurrentPreviewIndex(0)
    } catch (err) {
      console.error('AI 보고서 생성 오류:', err)
      setError('AI 보고서 생성에 실패했습니다.')
    } finally {
      setIsAIGenerating(false)
      setCurrentGeneratingStudent('')
    }
  }, [students])

  // AI 미리보기에서 이전 학생
  const handleAIPreviouStudent = useCallback(() => {
    setCurrentPreviewIndex((prev) => Math.max(0, prev - 1))
  }, [])

  // AI 미리보기에서 다음 학생
  const handleAINextStudent = useCallback(() => {
    setCurrentPreviewIndex((prev) => Math.min(aiGeneratedReports.length - 1, prev + 1))
  }, [aiGeneratedReports.length])

  // AI 보고서 PDF 다운로드
  const handleAIPdfDownload = useCallback(async (reportType: ReportTargetType) => {
    // Mock: PDF 다운로드 기능 구현 예정
    alert(`${reportType === 'parent' ? '학부모용' : '강사용'} 보고서 PDF 다운로드 기능이 추후 구현됩니다.`)
  }, [])

  // AI 보고서 카카오 발송
  const handleAISendKakao = useCallback(async (reportType: ReportTargetType) => {
    // Mock: 카카오 발송 기능 구현 예정
    await new Promise((resolve) => setTimeout(resolve, 1000))
    alert(`${reportType === 'parent' ? '학부모용' : '강사용'} 보고서가 카카오톡으로 발송되었습니다.`)
  }, [])

  // AI 보고서 문자 발송
  const handleAISendSms = useCallback(async (reportType: ReportTargetType) => {
    // Mock: 문자 발송 기능 구현 예정
    await new Promise((resolve) => setTimeout(resolve, 1000))
    alert(`${reportType === 'parent' ? '학부모용' : '강사용'} 보고서가 문자로 발송되었습니다.`)
  }, [])

  // AI 미리보기 닫기
  const handleCloseAIPreview = useCallback(() => {
    setShowAIPreview(false)
    setAIGeneratedReports([])
    setCurrentPreviewIndex(0)
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

          {/* AI 보고서 생성 버튼 - 새로 추가 */}
          <button
            onClick={() => setShowAIGenerateModal(true)}
            onMouseEnter={preloadReportGenerator}
            onFocus={preloadReportGenerator}
            className="btn-primary flex items-center gap-2 ml-auto bg-gradient-to-r from-purple-500 to-primary-500 hover:from-purple-600 hover:to-primary-600"
          >
            <Sparkles className="w-4 h-4" />
            {UI_TEXT.aiGenerateReport}
          </button>

          {/* 일반 리포트 생성 버튼 */}
          <button
            onClick={() => setShowGenerateModal(true)}
            onMouseEnter={preloadReportViewer}
            onFocus={preloadReportViewer}
            className="btn-secondary flex items-center gap-2"
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

      {/* AI 보고서 생성 모달 */}
      {showAIGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              }
            >
              <ReportGenerator
                students={students}
                onGenerate={handleAIGenerateReport}
                onCancel={() => setShowAIGenerateModal(false)}
                isGenerating={isAIGenerating}
                progress={aiGenerateProgress}
                currentStudent={currentGeneratingStudent}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* AI 보고서 미리보기 모달 */}
      {showAIPreview && aiGeneratedReports.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl">
            <Suspense
              fallback={
                <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
              }
            >
              <ReportPreview
                studentName={aiGeneratedReports[currentPreviewIndex]?.studentName || ''}
                studentInfo={{
                  grade: students.find((s) => s.id === aiGeneratedReports[currentPreviewIndex]?.studentId)?.grade || '',
                  school: students.find((s) => s.id === aiGeneratedReports[currentPreviewIndex]?.studentId)?.school || '',
                }}
                periodLabel={
                  aiGeneratedReports[currentPreviewIndex]?.parentReport?.period.label ||
                  aiGeneratedReports[currentPreviewIndex]?.teacherReport?.period.label ||
                  ''
                }
                parentReport={aiGeneratedReports[currentPreviewIndex]?.parentReport}
                teacherReport={aiGeneratedReports[currentPreviewIndex]?.teacherReport}
                onClose={handleCloseAIPreview}
                onDownloadPdf={handleAIPdfDownload}
                onSendKakao={handleAISendKakao}
                onSendSms={handleAISendSms}
                onPrevious={currentPreviewIndex > 0 ? handleAIPreviouStudent : undefined}
                onNext={currentPreviewIndex < aiGeneratedReports.length - 1 ? handleAINextStudent : undefined}
                showNavigation={aiGeneratedReports.length > 1}
              />
            </Suspense>
            {/* 학생 네비게이션 표시 */}
            {aiGeneratedReports.length > 1 && (
              <div className="text-center mt-4 text-white">
                {currentPreviewIndex + 1} / {aiGeneratedReports.length} 학생
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Mock 데이터 생성 함수 (실제로는 서버에서 생성)
// ============================================

function generateMockParentReport(
  student: ReportStudent,
  request: AutoReportGenerateRequest
): ParentReport {
  const today = new Date()
  const startDate = new Date(request.startDate)
  const endDate = new Date(request.endDate)

  return {
    id: `parent-${student.id}-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    period: {
      type: request.periodType,
      startDate: request.startDate,
      endDate: request.endDate,
      label: request.periodType === 'weekly'
        ? `${startDate.getMonth() + 1}월 ${Math.ceil(startDate.getDate() / 7)}주차`
        : `${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월`,
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      week: request.periodType === 'weekly' ? Math.ceil(startDate.getDate() / 7) : undefined,
    },
    generatedAt: today.toISOString(),
    summary: `${student.name} 학생은 이번 주에 전반적으로 좋은 학습 태도를 보여주었습니다. 특히 수학 과목에서 집중력 있게 문제를 풀어나가는 모습이 인상적이었습니다.`,
    praisePoints: [
      {
        title: '꾸준한 출석',
        description: '이번 주 모든 수업에 빠지지 않고 참석했습니다.',
        emoji: '🌟',
      },
      {
        title: '적극적인 질문',
        description: '수업 중 모르는 부분을 적극적으로 질문하며 이해하려는 모습을 보였습니다.',
        emoji: '💪',
      },
    ],
    conversationTopics: [
      {
        topic: '이번 주 배운 수학 개념',
        suggestedQuestion: '이번 주에 수학 시간에 어떤 걸 배웠어? 어려운 부분은 없었어?',
        context: '일차방정식 단원을 학습하며 새로운 개념을 배웠습니다.',
      },
      {
        topic: '학원에서 친구들과의 관계',
        suggestedQuestion: '학원에서 친구들이랑 잘 지내고 있어?',
        context: '그룹 학습 시간에 친구들과 협력하며 문제를 풀었습니다.',
      },
    ],
    encouragementMessage: `${student.name} 학생이 영어 독해 부분에서 조금 어려워하고 있지만, 꾸준히 노력하면 분명 좋아질 것입니다. 집에서도 하루 10분씩 영어 지문을 읽는 습관을 들여보세요.`,
    upcomingGoals: [
      {
        goal: '수학 연산 정확도 높이기',
        howToSupport: '계산 실수를 줄일 수 있도록 검산하는 습관을 격려해 주세요.',
      },
      {
        goal: '영어 어휘 20개 암기',
        howToSupport: '저녁 시간에 잠깐 단어 퀴즈를 내주시면 도움이 됩니다.',
      },
    ],
    attendanceSummary: {
      totalDays: 5,
      presentDays: 5,
      message: '이번 주 출석 상태가 매우 좋습니다! 꾸준한 출석이 성적 향상의 기본입니다.',
    },
    gradeSummary: {
      trend: 'improving',
      trendMessage: '전반적으로 성적이 향상되고 있는 추세입니다. 특히 수학 과목에서 눈에 띄는 성장을 보이고 있습니다.',
      strongSubjects: ['수학', '과학'],
      focusAreas: ['영어 독해', '국어 문법'],
    },
    aiComment: `AI 분석 결과, ${student.name} 학생은 논리적 사고력이 뛰어나 수학과 과학 과목에서 강점을 보이고 있습니다. 언어 영역에서는 꾸준한 독서를 통해 어휘력과 독해력을 키워나가면 더욱 균형 잡힌 학습이 가능할 것으로 보입니다.`,
  }
}

function generateMockTeacherReport(
  student: ReportStudent,
  request: AutoReportGenerateRequest
): TeacherReport {
  const today = new Date()
  const startDate = new Date(request.startDate)

  return {
    id: `teacher-${student.id}-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    period: {
      type: request.periodType,
      startDate: request.startDate,
      endDate: request.endDate,
      label: request.periodType === 'weekly'
        ? `${startDate.getMonth() + 1}월 ${Math.ceil(startDate.getDate() / 7)}주차`
        : `${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월`,
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      week: request.periodType === 'weekly' ? Math.ceil(startDate.getDate() / 7) : undefined,
    },
    generatedAt: today.toISOString(),
    gradeAnalysis: {
      overallAverage: 78,
      changeFromPrevious: 5,
      bySubject: [
        { subject: '수학', average: 85, change: 8, testsCount: 3, highestScore: 92, lowestScore: 78 },
        { subject: '영어', average: 72, change: 2, testsCount: 2, highestScore: 78, lowestScore: 66 },
        { subject: '국어', average: 75, change: 3, testsCount: 2, highestScore: 80, lowestScore: 70 },
      ],
      byUnit: [
        { subject: '수학', unit: '일차방정식', correctRate: 90, totalProblems: 20, isWeak: false },
        { subject: '수학', unit: '부등식', correctRate: 75, totalProblems: 16, isWeak: false },
        { subject: '영어', unit: '독해', correctRate: 55, totalProblems: 20, isWeak: true },
        { subject: '영어', unit: '문법', correctRate: 70, totalProblems: 15, isWeak: false },
      ],
    },
    weaknessAnalysis: {
      weakUnits: [
        {
          subject: '영어',
          unit: '독해',
          correctRate: 55,
          suggestedAction: '긴 지문 읽기 연습과 핵심 파악 훈련 필요',
        },
        {
          subject: '국어',
          unit: '비문학',
          correctRate: 60,
          suggestedAction: '논리적 글 구조 파악 연습 권장',
        },
      ],
      errorPatterns: [
        { pattern: '문맥 파악 오류', frequency: 8, description: '지문의 전체 맥락을 놓치는 경향' },
        { pattern: '계산 실수', frequency: 5, description: '단순 연산 과정에서의 실수' },
      ],
    },
    attendanceDetails: {
      totalDays: 5,
      presentDays: 5,
      absentDays: 0,
      lateDays: 0,
      attendanceRate: 100,
      notes: [],
    },
    assignmentStatus: {
      totalAssigned: 8,
      completed: 7,
      pending: 1,
      averageScore: 82,
      onTimeRate: 88,
    },
    recommendations: [
      {
        priority: 1,
        type: 'concept_review',
        title: '영어 독해 집중 훈련',
        description: '매 수업 시작 시 10분간 짧은 영어 지문 독해 실시',
        targetUnit: '영어 독해',
      },
      {
        priority: 2,
        type: 'practice',
        title: '계산 실수 방지 훈련',
        description: '검산 습관 형성을 위한 단계별 풀이 연습',
        targetUnit: '수학 연산',
      },
      {
        priority: 3,
        type: 'challenge',
        title: '심화 수학 문제 도전',
        description: '기본기가 탄탄하므로 응용 문제 도전 권장',
        targetUnit: '수학 심화',
      },
    ],
    nextClassPrep: {
      suggestedTopics: ['이차방정식 도입', '영어 독해 전략'],
      reviewNeeded: ['일차방정식 응용', '영어 문법 기초'],
      challengeReady: ['수학 심화 문제', '과학 실험 보고서'],
    },
    aiAnalysis: {
      summary: `${student.name} 학생은 수리 영역에서 강점을 보이며, 논리적 사고력이 뛰어납니다. 언어 영역, 특히 영어 독해에서 보완이 필요하며, 꾸준한 훈련을 통해 충분히 개선 가능합니다.`,
      keyInsights: [
        '수학: 개념 이해도 높음, 응용력 발휘 가능',
        '영어: 문법은 안정적, 독해는 집중 훈련 필요',
        '학습 태도: 적극적이며 질문을 두려워하지 않음',
      ],
      actionItems: [
        '다음 주부터 영어 독해 시간 10분 추가 배정',
        '수학 심화 문제집 2단원부터 시작',
        '월말 테스트 전 취약 단원 집중 복습 시간 확보',
      ],
    },
  }
}
