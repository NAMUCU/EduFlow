'use client'

/**
 * ReportViewer 컴포넌트
 *
 * 학생 학습 리포트를 상세하게 보여주는 컴포넌트입니다.
 * 성적 분석, 출결 분석, AI 추천 사항 등을 시각적으로 표시하며
 * PDF 다운로드 기능을 제공합니다.
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Send,
  X,
  BookOpen,
  Target,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  User,
  GraduationCap,
} from 'lucide-react'
import {
  Report,
  getReportStatusLabel,
  getReportStatusColor,
  formatScoreChange,
} from '@/types/report'

// UI 텍스트 상수
const UI_TEXT = {
  title: '학습 보고서',
  period: '리포트 기간',
  overallScore: '종합 점수',
  previousScore: '이전 점수',
  change: '변화',
  gradeAnalysis: '성적 분석',
  subjectGrades: '과목별 성적',
  unitAnalysis: '단원별 분석',
  weakUnits: '보완이 필요한 단원',
  strongUnits: '잘하는 단원',
  attendanceAnalysis: '출결 분석',
  attendanceRate: '출석률',
  totalDays: '총 수업일',
  presentDays: '출석',
  absentDays: '결석',
  lateDays: '지각',
  aiAnalysis: 'AI 분석 리포트',
  scoreTrend: '성적 추이 분석',
  studyRecommendation: '학습 추천',
  shortTermGoals: '단기 목표 (다음 주)',
  midTermGoals: '중기 목표 (다음 달)',
  recommendedMaterials: '추천 학습 자료',
  studyStrategies: '학습 전략',
  parentMessage: '학부모님께 드리는 말씀',
  studentMessage: '학생에게 보내는 메시지',
  teacherComment: '선생님 코멘트',
  downloadPdf: 'PDF 다운로드',
  sendToParent: '학부모 발송',
  close: '닫기',
  correctRate: '정답률',
  priority: '우선순위',
  difficulty: '난이도',
  difficultyLabels: {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  } as Record<string, string>,
}

interface ReportViewerProps {
  report: Report
  onClose?: () => void
  onSend?: (reportId: string) => void
  onDownloadPdf?: (reportId: string) => void
}

export default function ReportViewer({
  report,
  onClose,
  onSend,
  onDownloadPdf,
}: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState<'grade' | 'attendance' | 'ai'>('grade')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // 추이 아이콘 반환
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Minus className="w-5 h-5 text-gray-400" />
    }
  }

  // 추이 색상 반환
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // 난이도 색상 반환
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'hard':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // PDF 다운로드 핸들러
  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      if (onDownloadPdf) {
        await onDownloadPdf(report.id)
      } else {
        // 기본 PDF 다운로드 로직 (Mock)
        // 실제로는 서버에서 PDF를 생성하여 다운로드
        await new Promise((resolve) => setTimeout(resolve, 1500))
        alert('PDF 다운로드 기능이 구현되지 않았습니다.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  // 학부모 발송 핸들러
  const handleSend = async () => {
    setIsSending(true)
    try {
      if (onSend) {
        await onSend(report.id)
      } else {
        // 기본 발송 로직 (Mock)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        alert('발송 기능이 구현되지 않았습니다.')
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600">
                {report.student.name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {report.student.name} {UI_TEXT.title}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  {report.student.grade} | {report.student.school}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getReportStatusColor(report.status)}`}>
                  {getReportStatusLabel(report.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                {report.period.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? '생성 중...' : UI_TEXT.downloadPdf}
            </button>
            {report.status !== 'sent' && (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? '발송 중...' : UI_TEXT.sendToParent}
              </button>
            )}
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

        {/* 점수 요약 */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{UI_TEXT.overallScore}</p>
            <p className="text-3xl font-bold text-primary-600">
              {report.gradeAnalysis.overallScore}점
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{UI_TEXT.previousScore}</p>
            <p className="text-3xl font-bold text-gray-400">
              {report.gradeAnalysis.previousOverallScore}점
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl text-center shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{UI_TEXT.change}</p>
            <div className="flex items-center justify-center gap-2">
              {getTrendIcon(report.gradeAnalysis.overallTrend)}
              <p className={`text-2xl font-bold ${getTrendColor(report.gradeAnalysis.overallTrend)}`}>
                {formatScoreChange(report.gradeAnalysis.overallChangeAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('grade')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'grade'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          {UI_TEXT.gradeAnalysis}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'attendance'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          {UI_TEXT.attendanceAnalysis}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'ai'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-2" />
          {UI_TEXT.aiAnalysis}
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 성적 분석 탭 */}
        {activeTab === 'grade' && (
          <div className="space-y-6">
            {/* 과목별 성적 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.subjectGrades}</h3>
              <div className="space-y-3">
                {report.gradeAnalysis.subjectGrades.map((grade, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{grade.subject}</p>
                        <p className="text-sm text-gray-500">
                          테스트 {grade.testCount}회 | 평균 {grade.averageScore}점
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{grade.currentScore}점</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(grade.trend)}
                          <span className={`text-sm ${getTrendColor(grade.trend)}`}>
                            {formatScoreChange(grade.changeAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 취약/강점 단원 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 취약 단원 */}
              <div className="p-4 bg-red-50 rounded-xl">
                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {UI_TEXT.weakUnits}
                </h4>
                {report.gradeAnalysis.weakUnits.length > 0 ? (
                  <ul className="space-y-2">
                    {report.gradeAnalysis.weakUnits.map((unit, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span className="text-red-700">
                          {unit.subject} - {unit.unitName}
                        </span>
                        <span className="text-red-600 font-medium">{unit.correctRate}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-red-600">취약 단원이 없습니다!</p>
                )}
              </div>

              {/* 강점 단원 */}
              <div className="p-4 bg-green-50 rounded-xl">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {UI_TEXT.strongUnits}
                </h4>
                {report.gradeAnalysis.strongUnits.length > 0 ? (
                  <ul className="space-y-2">
                    {report.gradeAnalysis.strongUnits.map((unit, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span className="text-green-700">
                          {unit.subject} - {unit.unitName}
                        </span>
                        <span className="text-green-600 font-medium">{unit.correctRate}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-600">계속 노력해주세요!</p>
                )}
              </div>
            </div>

            {/* 단원별 상세 분석 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{UI_TEXT.unitAnalysis}</h3>
              <div className="space-y-2">
                {report.gradeAnalysis.unitAnalysis.map((unit, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      unit.isWeak ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">{unit.subject}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                      <span className="font-medium text-gray-900">{unit.unitName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {unit.correctCount}/{unit.totalCount}
                      </span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            unit.correctRate >= 80
                              ? 'bg-green-500'
                              : unit.correctRate >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${unit.correctRate}%` }}
                        />
                      </div>
                      <span
                        className={`font-bold ${
                          unit.correctRate >= 80
                            ? 'text-green-600'
                            : unit.correctRate >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {unit.correctRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 출결 분석 탭 */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* 출결 요약 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{UI_TEXT.totalDays}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {report.attendanceAnalysis.totalClassDays}일
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{UI_TEXT.presentDays}</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.attendanceAnalysis.presentDays}일
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{UI_TEXT.absentDays}</p>
                <p className="text-2xl font-bold text-red-600">
                  {report.attendanceAnalysis.absentDays}일
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl text-center">
                <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{UI_TEXT.lateDays}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {report.attendanceAnalysis.lateDays}일
                </p>
              </div>
            </div>

            {/* 출석률 */}
            <div className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">{UI_TEXT.attendanceRate}</h4>
                <div className="flex items-center gap-2">
                  {getTrendIcon(report.attendanceAnalysis.attendanceRateTrend)}
                  <span className={getTrendColor(report.attendanceAnalysis.attendanceRateTrend)}>
                    이전: {report.attendanceAnalysis.previousAttendanceRate}%
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <span className="text-5xl font-bold text-primary-600">
                  {report.attendanceAnalysis.attendanceRate}%
                </span>
                <div className="flex-1">
                  <div className="h-4 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${report.attendanceAnalysis.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 일별 출결 기록 */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">일별 출결 기록</h4>
              <div className="space-y-2">
                {report.attendanceAnalysis.dailyAttendance.map((record, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{record.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.checkInTime && (
                        <span className="text-sm text-gray-500">
                          {record.checkInTime} - {record.checkOutTime}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'late'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status === 'present'
                          ? '출석'
                          : record.status === 'late'
                          ? '지각'
                          : record.status === 'absent'
                          ? '결석'
                          : record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 특이사항 */}
            {report.attendanceAnalysis.notes && (
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-2">특이사항</h4>
                <p className="text-yellow-700">{report.attendanceAnalysis.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* AI 분석 탭 */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {/* 성적 추이 분석 */}
            <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                {UI_TEXT.scoreTrend}
              </h4>
              <p className="text-gray-700 mb-4">{report.aiAnalysis.scoreTrendAnalysis.summary}</p>
              <p className="text-sm text-gray-600 mb-4">
                {report.aiAnalysis.scoreTrendAnalysis.trendDescription}
              </p>
              <div className="space-y-2">
                {report.aiAnalysis.scoreTrendAnalysis.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 학습 추천 */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                {UI_TEXT.studyRecommendation}
              </h4>

              {/* 단기 목표 */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-500 mb-2">{UI_TEXT.shortTermGoals}</h5>
                <div className="space-y-2">
                  {report.aiAnalysis.studyRecommendation.shortTermGoals.map((goal, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{goal.goal}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(
                            goal.difficulty
                          )}`}
                        >
                          {UI_TEXT.difficultyLabels[goal.difficulty] || goal.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{goal.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 중기 목표 */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-500 mb-2">{UI_TEXT.midTermGoals}</h5>
                <div className="space-y-2">
                  {report.aiAnalysis.studyRecommendation.midTermGoals.map((goal, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-gray-900">{goal.goal}</span>
                      <p className="text-sm text-blue-600 mt-1">{goal.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 학습 전략 */}
              <div className="p-4 bg-primary-50 rounded-xl">
                <h5 className="font-medium text-primary-900 mb-3">{UI_TEXT.studyStrategies}</h5>
                <ul className="space-y-2">
                  {report.aiAnalysis.studyRecommendation.studyStrategies.map((strategy, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-primary-700">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-primary-500" />
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 동기부여 메시지 */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-gray-800 leading-relaxed">
                    {report.aiAnalysis.studyRecommendation.motivationMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* 학부모 메시지 */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                {UI_TEXT.parentMessage}
              </h4>
              <p className="text-green-700 leading-relaxed">{report.aiAnalysis.parentMessage}</p>
              <p className="text-xs text-green-600 mt-3">
                * AI가 생성한 메시지입니다. 발송 전 내용을 확인하세요.
              </p>
            </div>

            {/* 선생님 코멘트 */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                {UI_TEXT.teacherComment}
              </h4>
              <p className="text-blue-700 leading-relaxed">
                {report.teacherComment || report.aiAnalysis.teacherCommentDraft}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
