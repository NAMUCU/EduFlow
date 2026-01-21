'use client'

/**
 * 개선된 AI 문제 검수 컴포넌트
 *
 * 주요 기능:
 * - 오류/경고/제안 구분 표시
 * - 수정 제안 적용 버튼
 * - 모델별 검수 결과 비교
 * - 일괄 검수 지원
 * - 검수 통계 대시보드
 */

import { useState, useCallback } from 'react'
import {
  Shield,
  Check,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  Loader2,
  BarChart3,
  Edit3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Zap,
  Target,
  FileCheck,
} from 'lucide-react'
import {
  AIModel,
  AI_MODEL_LABELS,
  AI_MODEL_COLORS,
  ProblemForReview,
  ProblemReviewSummary,
  ReviewResult,
  ReviewStatistics,
} from '@/types/review'
import {
  ScoreBadge,
  StatusBadge,
  IssueCountBadge,
  CompactReviewBadge,
  ReviewProgressBadge,
  ReviewStatus,
} from './ReviewBadge'

/** 이슈 타입 정의 */
type IssueType = 'error' | 'warning' | 'suggestion'

/** 이슈 타입별 스타일 */
const ISSUE_TYPE_STYLES: Record<IssueType, {
  bg: string
  border: string
  text: string
  icon: React.ElementType
  label: string
}> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    label: '오류',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: AlertTriangle,
    label: '경고',
  },
  suggestion: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: Lightbulb,
    label: '제안',
  },
}

// 이슈 타입 분류 (모듈 레벨 함수)
function categorizeIssues(issues: string[]): Record<IssueType, string[]> {
  const result: Record<IssueType, string[]> = {
    error: [],
    warning: [],
    suggestion: [],
  }

  issues.forEach((issue: string) => {
    const lowerIssue = issue.toLowerCase()
    if (
      lowerIssue.includes('오류') ||
      lowerIssue.includes('틀') ||
      lowerIssue.includes('잘못') ||
      lowerIssue.includes('error')
    ) {
      result.error.push(issue)
    } else if (
      lowerIssue.includes('주의') ||
      lowerIssue.includes('확인') ||
      lowerIssue.includes('warning')
    ) {
      result.warning.push(issue)
    } else {
      result.suggestion.push(issue)
    }
  })

  return result
}

interface Problem {
  id: number
  question: string
  answer: string
  solution: string
  difficulty: string
  type: string
  unit?: string
}

interface ProblemReviewProps {
  /** 검수할 문제 목록 */
  problems: Problem[]
  /** 과목 */
  subject?: string
  /** 학년 */
  grade?: string
  /** 자동 검수 활성화 */
  autoReview?: boolean
  /** 검수 완료 후 콜백 */
  onReviewComplete?: (summaries: ProblemReviewSummary[]) => void
  /** 수정 제안 적용 콜백 */
  onApplyCorrection?: (
    problemId: number,
    correctedAnswer?: string,
    correctedSolution?: string
  ) => void
}

export default function ProblemReview({
  problems,
  subject,
  grade,
  autoReview = false,
  onReviewComplete,
  onApplyCorrection,
}: ProblemReviewProps) {
  // 선택된 AI 모델
  const [selectedModels, setSelectedModels] = useState<AIModel[]>(['gemini'])
  // 검수 상태
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('pending')
  // 현재 검수 중인 모델
  const [currentModel, setCurrentModel] = useState<AIModel | null>(null)
  // 검수 진행률
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  // 검수 결과
  const [reviewSummaries, setReviewSummaries] = useState<ProblemReviewSummary[]>([])
  // 에러 메시지
  const [error, setError] = useState<string>('')
  // 확장된 문제 ID
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null)
  // 검수 통계
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null)
  // 이슈 타입 필터
  const [issueFilter, setIssueFilter] = useState<IssueType | 'all'>('all')

  // AI 모델 토글
  const toggleModel = useCallback((model: AIModel) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    )
  }, [])

  // 검수 실행
  const handleReview = useCallback(async () => {
    if (selectedModels.length === 0) {
      setError('검수에 사용할 AI 모델을 선택해주세요.')
      return
    }

    setReviewStatus('reviewing')
    setError('')
    setReviewSummaries([])
    setStatistics(null)
    setProgress({ completed: 0, total: problems.length * selectedModels.length })

    try {
      const response = await fetch('/api/problems/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problems: problems.map((p) => ({
            ...p,
            subject,
            grade,
          })),
          models: selectedModels,
          subject,
          grade,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '검수에 실패했습니다')
      }

      setReviewSummaries(data.summaries)
      setStatistics(data.statistics)

      // 수정 필요 여부 판단
      const hasIssues = data.summaries.some(
        (s: ProblemReviewSummary) => s.consensusIssues.length > 0
      )
      setReviewStatus(hasIssues ? 'needs_revision' : 'completed')

      if (onReviewComplete) {
        onReviewComplete(data.summaries)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '검수 중 오류가 발생했습니다'
      setError(errorMessage)
      setReviewStatus('error')
    }
  }, [selectedModels, problems, subject, grade, onReviewComplete])

  // 일괄 수정 적용
  const handleBatchApplyCorrections = useCallback(() => {
    reviewSummaries.forEach((summary) => {
      const bestReview = summary.reviews.reduce((best, current) =>
        current.accuracy > best.accuracy ? current : best
      )
      if (bestReview.correctedAnswer || bestReview.correctedSolution) {
        onApplyCorrection?.(
          summary.problemId,
          bestReview.correctedAnswer,
          bestReview.correctedSolution
        )
      }
    })
  }, [reviewSummaries, onApplyCorrection])

  // 정확도에 따른 색상
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 90) return 'text-green-600 bg-green-50'
    if (accuracy >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // 정확도 바 색상
  const getAccuracyBarColor = (accuracy: number): string => {
    if (accuracy >= 90) return 'bg-green-500'
    if (accuracy >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // 수정 제안이 있는 문제 수
  const problemsWithCorrections = reviewSummaries.filter((s) =>
    s.reviews.some((r) => r.correctedAnswer || r.correctedSolution)
  ).length

  return (
    <div className="space-y-6">
      {/* AI 모델 선택 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">AI 문제 검수</h3>
            <p className="text-sm text-gray-500">
              여러 AI 모델로 문제를 검수하여 정확성을 확인합니다
            </p>
          </div>
          <StatusBadge status={reviewStatus} />
        </div>

        <div className="space-y-4">
          {/* 모델 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검수에 사용할 AI 모델 선택
            </label>
            <div className="flex flex-wrap gap-3">
              {(['claude', 'gemini', 'openai'] as AIModel[]).map((model) => (
                <button
                  key={model}
                  onClick={() => toggleModel(model)}
                  disabled={reviewStatus === 'reviewing'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedModels.includes(model)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  } ${reviewStatus === 'reviewing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: AI_MODEL_COLORS[model] }}
                  />
                  {AI_MODEL_LABELS[model]}
                  {selectedModels.includes(model) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* 검수 진행률 */}
          {reviewStatus === 'reviewing' && (
            <ReviewProgressBadge
              completed={progress.completed}
              total={progress.total}
              currentModel={currentModel ? AI_MODEL_LABELS[currentModel] : undefined}
            />
          )}

          {/* 검수 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleReview}
              disabled={
                reviewStatus === 'reviewing' ||
                selectedModels.length === 0 ||
                problems.length === 0
              }
              className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                reviewStatus === 'reviewing' ||
                selectedModels.length === 0 ||
                problems.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {reviewStatus === 'reviewing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  검수 진행 중...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  {problems.length}개 문제 검수
                </>
              )}
            </button>

            {reviewSummaries.length > 0 && (
              <button
                onClick={handleReview}
                disabled={reviewStatus === 'reviewing'}
                className="px-4 py-3 rounded-xl font-medium flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                재검수
              </button>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">검수 오류</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 검수 통계 대시보드 */}
      {statistics && (
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-gray-900">검수 결과 요약</h4>
            </div>
            {problemsWithCorrections > 0 && (
              <button
                onClick={handleBatchApplyCorrections}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                수정 일괄 적용 ({problemsWithCorrections})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <FileCheck className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalProblems}
              </p>
              <p className="text-xs text-gray-500">검수 문제</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p
                className={`text-2xl font-bold ${
                  statistics.averageAccuracy >= 90
                    ? 'text-green-600'
                    : statistics.averageAccuracy >= 70
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {statistics.averageAccuracy}%
              </p>
              <p className="text-xs text-gray-500">평균 정확도</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-600">
                {statistics.problemsWithIssues}
              </p>
              <p className="text-xs text-gray-500">문제점 발견</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Shield className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">
                {selectedModels.length}
              </p>
              <p className="text-xs text-gray-500">사용 모델</p>
            </div>
          </div>

          {/* 모델별 정확도 */}
          {Object.entries(statistics.modelAccuracies).filter(
            ([, v]) => (v as number) > 0
          ).length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-100">
              <p className="text-sm font-medium text-gray-700 mb-2">
                모델별 평균 정확도
              </p>
              <div className="space-y-2">
                {Object.entries(statistics.modelAccuracies)
                  .filter(([, accuracy]) => (accuracy as number) > 0)
                  .map(([model, accuracy]) => (
                    <div key={model} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-24">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: AI_MODEL_COLORS[model as AIModel],
                          }}
                        />
                        <span className="text-sm text-gray-600">
                          {AI_MODEL_LABELS[model as AIModel]}
                        </span>
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getAccuracyBarColor(accuracy as number)}`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {accuracy as number}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 주요 발견 이슈 */}
          {statistics.topIssues && statistics.topIssues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-100">
              <p className="text-sm font-medium text-gray-700 mb-2">
                주요 발견 이슈
              </p>
              <div className="space-y-1">
                {statistics.topIssues.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.issue}
                    </span>
                    <span className="text-gray-400 flex-shrink-0">
                      {item.count}건
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 이슈 타입 필터 */}
      {reviewSummaries.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">필터:</span>
          {(['all', 'error', 'warning', 'suggestion'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setIssueFilter(filter)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                issueFilter === filter
                  ? filter === 'all'
                    ? 'bg-gray-800 text-white'
                    : ISSUE_TYPE_STYLES[filter as IssueType].bg +
                      ' ' +
                      ISSUE_TYPE_STYLES[filter as IssueType].text
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? '전체' : ISSUE_TYPE_STYLES[filter].label}
            </button>
          ))}
        </div>
      )}

      {/* 검수 결과 목록 */}
      {reviewSummaries.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-gray-900">문제별 검수 결과</h4>
          {reviewSummaries.map((summary) => {
            const categorizedIssues = categorizeIssues(summary.consensusIssues)
            const showItem =
              issueFilter === 'all' ||
              categorizedIssues[issueFilter as IssueType].length > 0

            if (!showItem) return null

            return (
              <ProblemReviewCard
                key={summary.problemId}
                summary={summary}
                isExpanded={expandedProblem === summary.problemId}
                onToggle={() =>
                  setExpandedProblem(
                    expandedProblem === summary.problemId
                      ? null
                      : summary.problemId
                  )
                }
                onApplyCorrection={onApplyCorrection}
                issueFilter={issueFilter}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * 문제별 검수 결과 카드
 */
interface ProblemReviewCardProps {
  summary: ProblemReviewSummary
  isExpanded: boolean
  onToggle: () => void
  onApplyCorrection?: (
    problemId: number,
    correctedAnswer?: string,
    correctedSolution?: string
  ) => void
  issueFilter: IssueType | 'all'
}

function ProblemReviewCard({
  summary,
  isExpanded,
  onToggle,
  onApplyCorrection,
  issueFilter,
}: ProblemReviewCardProps) {
  const categorizedIssues = categorizeIssues(summary.consensusIssues)
  const categorizedSuggestions = categorizeIssues(summary.consensusSuggestions)

  // 수정 제안이 있는지 확인
  const hasCorrections = summary.reviews.some(
    (r) => r.correctedAnswer || r.correctedSolution
  )

  // 가장 높은 점수의 수정 제안 가져오기
  const bestCorrection = summary.reviews
    .filter((r) => r.correctedAnswer || r.correctedSolution)
    .sort((a, b) => b.accuracy - a.accuracy)[0]

  // 검수 상태 결정
  const getReviewStatus = (): ReviewStatus => {
    if (summary.averageAccuracy >= 90 && summary.consensusIssues.length === 0) {
      return 'completed'
    }
    if (summary.averageAccuracy < 60 || categorizedIssues.error.length > 0) {
      return 'needs_revision'
    }
    return 'completed'
  }

  return (
    <div className="card border border-gray-100">
      {/* 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary-600">
            문제 {summary.problemId}
          </span>
          <CompactReviewBadge
            score={summary.averageAccuracy}
            status={getReviewStatus()}
            errors={categorizedIssues.error.length}
            warnings={categorizedIssues.warning.length}
            suggestions={categorizedSuggestions.suggestion.length}
          />
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 상세 내용 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* 원본 문제 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-500 mb-1">문제</p>
            <p className="text-gray-900">{summary.originalProblem.question}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>정답: {summary.originalProblem.answer}</span>
              <span>난이도: {summary.originalProblem.difficulty}</span>
            </div>
          </div>

          {/* 오류/경고/제안 섹션 */}
          {Object.entries(ISSUE_TYPE_STYLES).map(([type, style]) => {
            const issues =
              type === 'suggestion'
                ? categorizedSuggestions[type as IssueType]
                : categorizedIssues[type as IssueType]

            if (issues.length === 0) return null
            if (issueFilter !== 'all' && issueFilter !== type) return null

            const Icon = style.icon

            return (
              <div
                key={type}
                className={`p-3 rounded-lg border ${style.bg} ${style.border}`}
              >
                <div className={`flex items-center gap-2 font-medium mb-2 ${style.text}`}>
                  <Icon className="w-4 h-4" />
                  {style.label} ({issues.length})
                </div>
                <ul className="space-y-1">
                  {issues.map((issue, i) => (
                    <li key={i} className={`text-sm ${style.text} opacity-90`}>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          {/* 수정 제안 적용 */}
          {hasCorrections && bestCorrection && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Edit3 className="w-4 h-4" />
                  수정 제안 ({AI_MODEL_LABELS[bestCorrection.model]})
                </div>
                <button
                  onClick={() =>
                    onApplyCorrection?.(
                      summary.problemId,
                      bestCorrection.correctedAnswer,
                      bestCorrection.correctedSolution
                    )
                  }
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  적용
                </button>
              </div>
              {bestCorrection.correctedAnswer && (
                <div className="mb-2">
                  <p className="text-xs text-purple-600 font-medium">수정된 정답</p>
                  <p className="text-purple-800 bg-white p-2 rounded mt-1">
                    {bestCorrection.correctedAnswer}
                  </p>
                </div>
              )}
              {bestCorrection.correctedSolution && (
                <div>
                  <p className="text-xs text-purple-600 font-medium">수정된 풀이</p>
                  <p className="text-purple-800 bg-white p-2 rounded mt-1 whitespace-pre-wrap">
                    {bestCorrection.correctedSolution}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 모델별 결과 비교 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              모델별 검수 결과
            </p>
            <div className="grid gap-3">
              {summary.reviews.map((review) => (
                <ReviewResultCard
                  key={`${review.problemId}-${review.model}`}
                  review={review}
                  onApplyCorrection={() =>
                    onApplyCorrection?.(
                      review.problemId,
                      review.correctedAnswer,
                      review.correctedSolution
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 개별 모델 검수 결과 카드
 */
function ReviewResultCard({
  review,
  onApplyCorrection,
}: {
  review: ReviewResult
  onApplyCorrection: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const hasCorrection = review.correctedAnswer || review.correctedSolution

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: AI_MODEL_COLORS[review.model] }}
          />
          <span className="font-medium text-gray-700">
            {AI_MODEL_LABELS[review.model]}
          </span>
          <ScoreBadge score={review.accuracy} size="sm" showIcon={false} />
          {review.reviewTime && (
            <span className="text-xs text-gray-400">
              {(review.reviewTime / 1000).toFixed(1)}초
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasCorrection && (
            <button
              onClick={onApplyCorrection}
              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              수정 적용
            </button>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showDetails ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 text-sm">
          {/* 문제점 */}
          {review.issues.length > 0 && (
            <div>
              <p className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                발견된 문제점
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {review.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 개선 제안 */}
          {review.suggestions.length > 0 && (
            <div>
              <p className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-yellow-500" />
                개선 제안
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {review.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 수정된 정답 */}
          {review.correctedAnswer && (
            <div>
              <p className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                수정된 정답
              </p>
              <p className="p-2 bg-green-50 rounded text-green-800">
                {review.correctedAnswer}
              </p>
            </div>
          )}

          {/* 수정된 풀이 */}
          {review.correctedSolution && (
            <div>
              <p className="text-gray-500 font-medium mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                수정된 풀이
              </p>
              <p className="p-2 bg-green-50 rounded text-green-800 whitespace-pre-wrap">
                {review.correctedSolution}
              </p>
            </div>
          )}

          {/* 난이도 평가 */}
          {review.difficultyScore !== undefined && (
            <div>
              <p className="text-gray-500 font-medium mb-1">난이도 적절성</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      review.difficultyScore >= 80
                        ? 'bg-green-500'
                        : review.difficultyScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${review.difficultyScore}%` }}
                  />
                </div>
                <span className="text-gray-700 font-medium">
                  {review.difficultyScore}%
                </span>
              </div>
              {review.difficultyComment && (
                <p className="mt-1 text-gray-600">{review.difficultyComment}</p>
              )}
            </div>
          )}

          {/* 문제 없음 표시 */}
          {review.issues.length === 0 && review.suggestions.length === 0 && (
            <p className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              문제점이 발견되지 않았습니다.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
