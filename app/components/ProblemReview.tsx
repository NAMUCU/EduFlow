'use client'

/**
 * 문제 검수 컴포넌트
 *
 * AI 모델을 선택하여 문제를 검수하고 결과를 비교 표시합니다.
 * Claude, Gemini, ChatGPT 중 원하는 모델을 선택할 수 있습니다.
 */

import { useState } from 'react'
import {
  Shield,
  Check,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  Loader2,
  BarChart3,
  Edit3,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  AIModel,
  AI_MODEL_LABELS,
  AI_MODEL_COLORS,
  ProblemForReview,
  ProblemReviewSummary,
  ReviewResult,
} from '@/types/review'

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
  /** 검수 완료 후 콜백 */
  onReviewComplete?: (summaries: ProblemReviewSummary[]) => void
  /** 수정 제안 적용 콜백 */
  onApplyCorrection?: (problemId: number, correctedAnswer?: string, correctedSolution?: string) => void
}

export default function ProblemReview({
  problems,
  subject,
  grade,
  onReviewComplete,
  onApplyCorrection,
}: ProblemReviewProps) {
  // 선택된 AI 모델
  const [selectedModels, setSelectedModels] = useState<AIModel[]>(['gemini'])
  // 검수 상태
  const [isReviewing, setIsReviewing] = useState(false)
  // 검수 결과
  const [reviewSummaries, setReviewSummaries] = useState<ProblemReviewSummary[]>([])
  // 에러 메시지
  const [error, setError] = useState<string>('')
  // 확장된 문제 ID
  const [expandedProblem, setExpandedProblem] = useState<number | null>(null)
  // 검수 통계
  const [statistics, setStatistics] = useState<any>(null)

  // AI 모델 토글
  const toggleModel = (model: AIModel) => {
    setSelectedModels((prev) =>
      prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model]
    )
  }

  // 검수 실행
  const handleReview = async () => {
    if (selectedModels.length === 0) {
      setError('검수에 사용할 AI 모델을 선택해주세요.')
      return
    }

    setIsReviewing(true)
    setError('')
    setReviewSummaries([])
    setStatistics(null)

    try {
      const response = await fetch('/api/review-problems', {
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

      if (onReviewComplete) {
        onReviewComplete(data.summaries)
      }
    } catch (err: any) {
      setError(err.message || '검수 중 오류가 발생했습니다')
    } finally {
      setIsReviewing(false)
    }
  }

  // 수정 제안 적용
  const handleApplyCorrection = (
    problemId: number,
    correctedAnswer?: string,
    correctedSolution?: string
  ) => {
    if (onApplyCorrection) {
      onApplyCorrection(problemId, correctedAnswer, correctedSolution)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* AI 모델 선택 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI 문제 검수</h3>
            <p className="text-sm text-gray-500">
              여러 AI 모델로 문제를 검수하여 정확성을 확인합니다
            </p>
          </div>
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
                  disabled={isReviewing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedModels.includes(model)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  } ${isReviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: AI_MODEL_COLORS[model] }}
                  />
                  {AI_MODEL_LABELS[model]}
                  {selectedModels.includes(model) && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 검수 버튼 */}
          <button
            onClick={handleReview}
            disabled={isReviewing || selectedModels.length === 0 || problems.length === 0}
            className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              isReviewing || selectedModels.length === 0 || problems.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                검수 진행 중...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                {problems.length}개 문제 검수 시작
              </>
            )}
          </button>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 검수 통계 */}
      {statistics && (
        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-gray-900">검수 결과 요약</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalProblems}
              </p>
              <p className="text-xs text-gray-500">검수 문제</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
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
              <p className="text-2xl font-bold text-orange-600">
                {statistics.problemsWithIssues}
              </p>
              <p className="text-xs text-gray-500">문제점 발견</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-blue-600">
                {selectedModels.length}
              </p>
              <p className="text-xs text-gray-500">사용 모델</p>
            </div>
          </div>

          {/* 모델별 정확도 */}
          {Object.entries(statistics.modelAccuracies).filter(([, v]) => (v as number) > 0).length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-100">
              <p className="text-sm font-medium text-gray-700 mb-2">모델별 평균 정확도</p>
              <div className="space-y-2">
                {Object.entries(statistics.modelAccuracies)
                  .filter(([, accuracy]) => (accuracy as number) > 0)
                  .map(([model, accuracy]) => (
                    <div key={model} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-24">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: AI_MODEL_COLORS[model as AIModel] }}
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
        </div>
      )}

      {/* 검수 결과 목록 */}
      {reviewSummaries.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-gray-900">문제별 검수 결과</h4>
          {reviewSummaries.map((summary) => (
            <div
              key={summary.problemId}
              className="card border border-gray-100"
            >
              {/* 헤더 */}
              <button
                onClick={() =>
                  setExpandedProblem(
                    expandedProblem === summary.problemId
                      ? null
                      : summary.problemId
                  )
                }
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary-600">
                    문제 {summary.problemId}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-lg text-sm font-medium ${getAccuracyColor(
                      summary.averageAccuracy
                    )}`}
                  >
                    {summary.averageAccuracy}%
                  </span>
                  {summary.consensusIssues.length > 0 && (
                    <span className="flex items-center gap-1 text-orange-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {summary.consensusIssues.length}개 문제점
                    </span>
                  )}
                  {summary.consensusSuggestions.length > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 text-sm">
                      <Lightbulb className="w-4 h-4" />
                      {summary.consensusSuggestions.length}개 제안
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedProblem === summary.problemId ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 상세 내용 */}
              {expandedProblem === summary.problemId && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* 원본 문제 */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">문제</p>
                    <p className="text-gray-900">
                      {summary.originalProblem.question}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>정답: {summary.originalProblem.answer}</span>
                      <span>난이도: {summary.originalProblem.difficulty}</span>
                    </div>
                  </div>

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
                            handleApplyCorrection(
                              review.problemId,
                              review.correctedAnswer,
                              review.correctedSolution
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* 합의된 문제점 */}
                  {summary.consensusIssues.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        합의된 문제점
                      </div>
                      <ul className="space-y-1">
                        {summary.consensusIssues.map((issue, i) => (
                          <li key={i} className="text-sm text-orange-800">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 합의된 개선 제안 */}
                  {summary.consensusSuggestions.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                        <Lightbulb className="w-4 h-4" />
                        합의된 개선 제안
                      </div>
                      <ul className="space-y-1">
                        {summary.consensusSuggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-blue-800">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
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
          <span
            className={`px-2 py-0.5 rounded text-sm font-medium ${
              review.accuracy >= 90
                ? 'bg-green-100 text-green-700'
                : review.accuracy >= 70
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {review.accuracy}%
          </span>
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
