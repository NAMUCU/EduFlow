'use client'

/**
 * 보고서 미리보기 컴포넌트
 *
 * 생성된 보고서를 미리보고 발송할 수 있는 컴포넌트입니다.
 * - 보고서 내용 미리보기
 * - PDF 다운로드
 * - 카카오/문자 발송
 * - 보고서 수정
 */

import { useState, useCallback, memo } from 'react'
import {
  FileText,
  Download,
  Send,
  MessageSquare,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Share2,
  Printer,
  User,
  GraduationCap,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Heart,
  MessageCircle,
  Target,
  Lightbulb,
} from 'lucide-react'
import {
  ParentReport,
  TeacherReport,
  ReportTargetType,
  REPORT_TARGET_LABELS,
} from '@/types/report'

// UI 텍스트 상수
const UI_TEXT = {
  title: '보고서 미리보기',
  downloadPdf: 'PDF 다운로드',
  sendKakao: '카카오톡 발송',
  sendSms: '문자 발송',
  edit: '수정하기',
  print: '인쇄하기',
  share: '공유하기',
  close: '닫기',
  previousStudent: '이전 학생',
  nextStudent: '다음 학생',
  parentReport: '학부모용 보고서',
  teacherReport: '강사용 보고서',
  sending: '발송 중...',
  sendSuccess: '발송 완료!',
  sendFailed: '발송 실패',
  selectSendMethod: '발송 방법 선택',
  confirmSend: '발송하시겠습니까?',
  cancel: '취소',
  confirm: '확인',
  // 학부모 보고서 섹션
  summary: '이번 주 요약',
  praisePoints: '칭찬 포인트',
  conversationTopics: '대화거리',
  encouragement: '격려 메시지',
  upcomingGoals: '다음 목표',
  attendanceSummary: '출결 요약',
  gradeSummary: '학습 현황',
  aiComment: 'AI 분석 코멘트',
  // 강사 보고서 섹션
  gradeAnalysis: '성적 분석',
  weaknessAnalysis: '취약점 분석',
  attendanceDetails: '출결 상세',
  assignmentStatus: '과제 현황',
  recommendations: '학습 추천',
  nextClassPrep: '다음 수업 준비',
}

// 추이 아이콘
const getTrendIcon = (trend: 'improving' | 'stable' | 'needs_attention' | 'up' | 'down') => {
  switch (trend) {
    case 'improving':
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'needs_attention':
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />
    default:
      return <Minus className="w-4 h-4 text-gray-400" />
  }
}

// 학부모 보고서 미리보기 컴포넌트
interface ParentReportPreviewProps {
  report: ParentReport
}

const ParentReportPreview = memo(function ParentReportPreview({
  report,
}: ParentReportPreviewProps) {
  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl">
        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary-500" />
          {UI_TEXT.summary}
        </h4>
        <p className="text-gray-700 leading-relaxed">{report.summary}</p>
      </div>

      {/* 칭찬 포인트 */}
      <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5" />
          {UI_TEXT.praisePoints}
        </h4>
        <div className="space-y-3">
          {report.praisePoints.map((point, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-2xl">{point.emoji || '🌟'}</span>
              <div>
                <p className="font-medium text-yellow-900">{point.title}</p>
                <p className="text-sm text-yellow-700">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 대화거리 */}
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {UI_TEXT.conversationTopics}
        </h4>
        <div className="space-y-4">
          {report.conversationTopics.map((topic, index) => (
            <div key={index} className="p-3 bg-white rounded-lg">
              <p className="font-medium text-green-900">{topic.topic}</p>
              <p className="text-sm text-green-700 mt-1">
                <span className="font-medium">질문 예시:</span> &ldquo;{topic.suggestedQuestion}&rdquo;
              </p>
              <p className="text-xs text-green-600 mt-1">{topic.context}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 격려 메시지 */}
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
        <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
          <Target className="w-5 h-5" />
          {UI_TEXT.encouragement}
        </h4>
        <p className="text-purple-700 leading-relaxed">{report.encouragementMessage}</p>
      </div>

      {/* 다음 목표 */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-3">{UI_TEXT.upcomingGoals}</h4>
        <div className="space-y-3">
          {report.upcomingGoals.map((goal, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">{goal.goal}</p>
                <p className="text-sm text-blue-700">{goal.howToSupport}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 출결 요약 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-3">{UI_TEXT.attendanceSummary}</h4>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1">
            <p className="text-sm text-gray-500">출석</p>
            <p className="text-2xl font-bold text-gray-900">
              {report.attendanceSummary.presentDays}/{report.attendanceSummary.totalDays}일
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">출석률</p>
            <p className="text-2xl font-bold text-primary-600">
              {Math.round(
                (report.attendanceSummary.presentDays / report.attendanceSummary.totalDays) * 100
              )}
              %
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{report.attendanceSummary.message}</p>
      </div>

      {/* 학습 현황 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          {UI_TEXT.gradeSummary}
          {getTrendIcon(report.gradeSummary.trend)}
        </h4>
        <p className="text-gray-700 mb-3">{report.gradeSummary.trendMessage}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">잘하는 과목</p>
            <div className="flex flex-wrap gap-1">
              {report.gradeSummary.strongSubjects.map((subject, i) => (
                <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  {subject}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">집중 필요</p>
            <div className="flex flex-wrap gap-1">
              {report.gradeSummary.focusAreas.map((area, i) => (
                <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI 코멘트 */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-2">{UI_TEXT.aiComment}</h4>
        <p className="text-gray-700 leading-relaxed">{report.aiComment}</p>
        <p className="text-xs text-gray-500 mt-2">* AI가 생성한 분석입니다.</p>
      </div>
    </div>
  )
})

// 강사 보고서 미리보기 컴포넌트
interface TeacherReportPreviewProps {
  report: TeacherReport
}

const TeacherReportPreview = memo(function TeacherReportPreview({
  report,
}: TeacherReportPreviewProps) {
  return (
    <div className="space-y-6">
      {/* 성적 분석 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-3">{UI_TEXT.gradeAnalysis}</h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-500">전체 평균</p>
            <p className="text-2xl font-bold text-gray-900">{report.gradeAnalysis.overallAverage}점</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-500">변화</p>
            <p
              className={`text-2xl font-bold ${
                report.gradeAnalysis.changeFromPrevious > 0
                  ? 'text-green-600'
                  : report.gradeAnalysis.changeFromPrevious < 0
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {report.gradeAnalysis.changeFromPrevious > 0 ? '+' : ''}
              {report.gradeAnalysis.changeFromPrevious}점
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-500">테스트 수</p>
            <p className="text-2xl font-bold text-gray-900">
              {report.gradeAnalysis.bySubject.reduce((sum, s) => sum + s.testsCount, 0)}회
            </p>
          </div>
        </div>

        {/* 과목별 성적 */}
        <div className="space-y-2">
          {report.gradeAnalysis.bySubject.map((subject, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{subject.subject}</span>
                <span className="text-xs text-gray-500">({subject.testsCount}회)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-900">{subject.average}점</span>
                <span
                  className={`text-sm ${
                    subject.change > 0 ? 'text-green-600' : subject.change < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {subject.change > 0 ? '+' : ''}
                  {subject.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 취약점 분석 */}
      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
        <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {UI_TEXT.weaknessAnalysis}
        </h4>
        <div className="space-y-3">
          {report.weaknessAnalysis.weakUnits.map((unit, index) => (
            <div key={index} className="p-3 bg-white rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">
                  {unit.subject} - {unit.unit}
                </span>
                <span className="text-red-600 font-bold">{unit.correctRate}%</span>
              </div>
              <p className="text-sm text-gray-600">{unit.suggestedAction}</p>
            </div>
          ))}
        </div>
        {report.weaknessAnalysis.errorPatterns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-medium text-red-800 mb-2">오답 패턴</p>
            <div className="space-y-2">
              {report.weaknessAnalysis.errorPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">{pattern.pattern}</span>
                  <span className="text-red-600">{pattern.frequency}회</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 출결 상세 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-3">{UI_TEXT.attendanceDetails}</h4>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-600">총 수업일</p>
            <p className="text-xl font-bold text-blue-800">{report.attendanceDetails.totalDays}</p>
          </div>
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <p className="text-xs text-green-600">출석</p>
            <p className="text-xl font-bold text-green-800">{report.attendanceDetails.presentDays}</p>
          </div>
          <div className="text-center p-3 bg-red-100 rounded-lg">
            <p className="text-xs text-red-600">결석</p>
            <p className="text-xl font-bold text-red-800">{report.attendanceDetails.absentDays}</p>
          </div>
          <div className="text-center p-3 bg-yellow-100 rounded-lg">
            <p className="text-xs text-yellow-600">지각</p>
            <p className="text-xl font-bold text-yellow-800">{report.attendanceDetails.lateDays}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
          <span className="text-gray-600">출석률</span>
          <span className="text-2xl font-bold text-primary-600">
            {report.attendanceDetails.attendanceRate}%
          </span>
        </div>
        {report.attendanceDetails.notes.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">특이사항</p>
            <ul className="text-sm text-yellow-700 list-disc list-inside">
              {report.attendanceDetails.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 과제 현황 */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-3">{UI_TEXT.assignmentStatus}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">완료율</span>
              <span className="font-bold text-gray-900">
                {report.assignmentStatus.completed}/{report.assignmentStatus.totalAssigned}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{
                  width: `${
                    (report.assignmentStatus.completed / report.assignmentStatus.totalAssigned) * 100
                  }%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">정시 제출률</span>
              <span className="font-bold text-gray-900">{report.assignmentStatus.onTimeRate}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${report.assignmentStatus.onTimeRate}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-white rounded-lg text-center">
          <span className="text-sm text-gray-500">과제 평균 점수</span>
          <span className="ml-2 text-lg font-bold text-primary-600">
            {report.assignmentStatus.averageScore}점
          </span>
        </div>
      </div>

      {/* 학습 추천 */}
      <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
        <h4 className="font-bold text-primary-800 mb-3">{UI_TEXT.recommendations}</h4>
        <div className="space-y-3">
          {report.recommendations.map((rec, index) => (
            <div key={index} className="p-3 bg-white rounded-lg flex items-start gap-3">
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  rec.priority === 1
                    ? 'bg-red-100 text-red-700'
                    : rec.priority === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {rec.priority}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{rec.title}</p>
                <p className="text-sm text-gray-600">{rec.description}</p>
                {rec.targetUnit && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {rec.targetUnit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 다음 수업 준비 */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-3">{UI_TEXT.nextClassPrep}</h4>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">수업 주제 제안</p>
            <div className="flex flex-wrap gap-2">
              {report.nextClassPrep.suggestedTopics.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">복습 필요</p>
            <div className="flex flex-wrap gap-2">
              {report.nextClassPrep.reviewNeeded.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">심화 가능</p>
            <div className="flex flex-wrap gap-2">
              {report.nextClassPrep.challengeReady.map((topic, i) => (
                <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI 분석 */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <h4 className="font-bold text-gray-800 mb-2">AI 종합 분석</h4>
        <p className="text-gray-700 mb-3">{report.aiAnalysis.summary}</p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">주요 인사이트:</p>
          {report.aiAnalysis.keyInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
              {insight}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-purple-200">
          <p className="text-sm font-medium text-gray-600 mb-2">액션 아이템:</p>
          {report.aiAnalysis.actionItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

// 메인 컴포넌트 Props
interface ReportPreviewProps {
  /** 학생 이름 */
  studentName: string
  /** 학생 정보 */
  studentInfo?: {
    grade: string
    school: string
  }
  /** 보고서 기간 */
  periodLabel: string
  /** 학부모용 보고서 */
  parentReport?: ParentReport | null
  /** 강사용 보고서 */
  teacherReport?: TeacherReport | null
  /** 닫기 콜백 */
  onClose?: () => void
  /** PDF 다운로드 콜백 */
  onDownloadPdf?: (reportType: ReportTargetType) => Promise<void>
  /** 카카오 발송 콜백 */
  onSendKakao?: (reportType: ReportTargetType) => Promise<void>
  /** 문자 발송 콜백 */
  onSendSms?: (reportType: ReportTargetType) => Promise<void>
  /** 이전 학생 콜백 */
  onPrevious?: () => void
  /** 다음 학생 콜백 */
  onNext?: () => void
  /** 이전/다음 버튼 표시 여부 */
  showNavigation?: boolean
  /** 클래스명 */
  className?: string
}

export default function ReportPreview({
  studentName,
  studentInfo,
  periodLabel,
  parentReport,
  teacherReport,
  onClose,
  onDownloadPdf,
  onSendKakao,
  onSendSms,
  onPrevious,
  onNext,
  showNavigation = false,
  className = '',
}: ReportPreviewProps) {
  // 현재 보고서 유형
  const [currentReportType, setCurrentReportType] = useState<ReportTargetType>(
    parentReport ? 'parent' : 'teacher'
  )

  // 발송 관련 상태
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [showSendOptions, setShowSendOptions] = useState(false)

  // 현재 보고서
  const currentReport = currentReportType === 'parent' ? parentReport : teacherReport

  // PDF 다운로드
  const handleDownloadPdf = useCallback(async () => {
    if (!onDownloadPdf) return
    setIsSending(true)
    try {
      await onDownloadPdf(currentReportType)
    } finally {
      setIsSending(false)
    }
  }, [onDownloadPdf, currentReportType])

  // 카카오 발송
  const handleSendKakao = useCallback(async () => {
    if (!onSendKakao) return
    setIsSending(true)
    setSendResult(null)
    setShowSendOptions(false)
    try {
      await onSendKakao(currentReportType)
      setSendResult({ type: 'success', message: UI_TEXT.sendSuccess })
    } catch (error) {
      setSendResult({ type: 'error', message: UI_TEXT.sendFailed })
    } finally {
      setIsSending(false)
    }
  }, [onSendKakao, currentReportType])

  // 문자 발송
  const handleSendSms = useCallback(async () => {
    if (!onSendSms) return
    setIsSending(true)
    setSendResult(null)
    setShowSendOptions(false)
    try {
      await onSendSms(currentReportType)
      setSendResult({ type: 'success', message: UI_TEXT.sendSuccess })
    } catch (error) {
      setSendResult({ type: 'error', message: UI_TEXT.sendFailed })
    } finally {
      setIsSending(false)
    }
  }, [onSendSms, currentReportType])

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${className}`}>
      {/* 헤더 */}
      <div className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600">{studentName[0]}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{studentName} {UI_TEXT.title}</h2>
              {studentInfo && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  {studentInfo.grade} | {studentInfo.school}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {periodLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* PDF 다운로드 */}
            {onDownloadPdf && (
              <button
                onClick={handleDownloadPdf}
                disabled={isSending}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {UI_TEXT.downloadPdf}
              </button>
            )}

            {/* 발송 버튼 */}
            {(onSendKakao || onSendSms) && (
              <div className="relative">
                <button
                  onClick={() => setShowSendOptions(!showSendOptions)}
                  disabled={isSending}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSending ? UI_TEXT.sending : '발송하기'}
                </button>

                {/* 발송 옵션 드롭다운 */}
                {showSendOptions && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                    {onSendKakao && (
                      <button
                        onClick={handleSendKakao}
                        className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-yellow-500" />
                        {UI_TEXT.sendKakao}
                      </button>
                    )}
                    {onSendSms && (
                      <button
                        onClick={handleSendSms}
                        className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors border-t"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        {UI_TEXT.sendSms}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 닫기 */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 발송 결과 */}
        {sendResult && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              sendResult.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {sendResult.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {sendResult.message}
          </div>
        )}

        {/* 보고서 유형 탭 */}
        {parentReport && teacherReport && (
          <div className="flex mt-4 bg-white rounded-lg p-1">
            <button
              onClick={() => setCurrentReportType('parent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                currentReportType === 'parent'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              {UI_TEXT.parentReport}
            </button>
            <button
              onClick={() => setCurrentReportType('teacher')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                currentReportType === 'teacher'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              {UI_TEXT.teacherReport}
            </button>
          </div>
        )}
      </div>

      {/* 보고서 내용 */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentReportType === 'parent' && parentReport ? (
          <ParentReportPreview report={parentReport} />
        ) : currentReportType === 'teacher' && teacherReport ? (
          <TeacherReportPreview report={teacherReport} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <FileText className="w-12 h-12 opacity-50" />
            <p className="ml-3">보고서가 없습니다</p>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      {showNavigation && (
        <div className="p-4 bg-gray-50 border-t flex justify-between">
          <button
            onClick={onPrevious}
            disabled={!onPrevious}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {UI_TEXT.previousStudent}
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            className="btn-secondary flex items-center gap-2"
          >
            {UI_TEXT.nextStudent}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
