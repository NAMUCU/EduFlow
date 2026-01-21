'use client'

/**
 * 오답 문제 카드 컴포넌트
 *
 * 기능:
 * - 오답 문제 표시
 * - 내 풀이 vs 정답 비교
 * - AI 해설 보기
 * - 복습 완료/다시 풀기
 * - 유사 문제 생성
 */

import React, { useState, useCallback, memo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  BookOpen,
  Calendar,
  RotateCcw,
  Clock,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react'
import type { WrongAnswer, SimilarProblem } from '@/lib/services/wrong-answers'
import type { ProblemDifficulty } from '@/types/database'

// UI 텍스트 상수
const UI_TEXT = {
  myAnswer: '내 답안',
  correctAnswer: '정답',
  explanation: '해설',
  relatedConcept: '관련 개념',
  retry: '다시 풀기',
  markAsReviewed: '복습 완료',
  markAsResolved: '해결 완료',
  showAnswer: '정답 보기',
  hideAnswer: '정답 숨기기',
  difficulty: '난이도',
  wrongDate: '틀린 날짜',
  retryCount: '재시도',
  generateSimilar: 'AI 유사 문제',
  generateExplanation: 'AI 해설',
  generating: '생성 중...',
  copied: '복사됨!',
  copyProblem: '문제 복사',
  reviewed: '복습 완료',
  notReviewed: '복습 안함',
  resolved: '해결 완료',
  similarProblem: '유사 문제',
  similarityReason: '유사성',
  solveSimilar: '풀어보기',
}

// 과목별 색상
const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  수학: { bg: 'bg-blue-100', text: 'text-blue-700' },
  영어: { bg: 'bg-purple-100', text: 'text-purple-700' },
  국어: { bg: 'bg-green-100', text: 'text-green-700' },
  과학: { bg: 'bg-orange-100', text: 'text-orange-700' },
  사회: { bg: 'bg-pink-100', text: 'text-pink-700' },
  역사: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

// 난이도별 색상
const DIFFICULTY_COLORS: Record<ProblemDifficulty, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

// 난이도 한국어 라벨
const DIFFICULTY_LABELS: Record<ProblemDifficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
}

interface WrongAnswerCardProps {
  wrongAnswer: WrongAnswer
  isSelected?: boolean
  onSelect?: (id: string) => void
  onMarkAsReviewed?: (id: string) => Promise<void>
  onMarkAsResolved?: (id: string) => Promise<void>
  onRetry?: (wrongAnswer: WrongAnswer) => void
  onGenerateSimilar?: (problemId: string) => Promise<SimilarProblem | null>
  onGenerateExplanation?: (problemId: string) => Promise<{ explanation: string; relatedConcept: string } | null>
}

function WrongAnswerCardComponent({
  wrongAnswer,
  isSelected = false,
  onSelect,
  onMarkAsReviewed,
  onMarkAsResolved,
  onRetry,
  onGenerateSimilar,
  onGenerateExplanation,
}: WrongAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false)
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [similarProblem, setSimilarProblem] = useState<SimilarProblem | null>(null)
  const [aiExplanation, setAiExplanation] = useState<{ explanation: string; relatedConcept: string } | null>(null)
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false)
  const [isMarkingResolved, setIsMarkingResolved] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subjectColor = SUBJECT_COLORS[wrongAnswer.subject] || { bg: 'bg-gray-100', text: 'text-gray-700' }

  // 확장 토글
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // 정답 표시 토글
  const toggleShowAnswer = useCallback(() => {
    setShowAnswer((prev) => !prev)
  }, [])

  // 선택 토글
  const handleSelect = useCallback(() => {
    onSelect?.(wrongAnswer.id)
  }, [onSelect, wrongAnswer.id])

  // 복습 완료 처리
  const handleMarkAsReviewed = useCallback(async () => {
    if (!onMarkAsReviewed || isMarkingReviewed) return
    setIsMarkingReviewed(true)
    setError(null)
    try {
      await onMarkAsReviewed(wrongAnswer.id)
    } catch (err) {
      setError('복습 완료 처리에 실패했습니다.')
    } finally {
      setIsMarkingReviewed(false)
    }
  }, [onMarkAsReviewed, wrongAnswer.id, isMarkingReviewed])

  // 해결 완료 처리
  const handleMarkAsResolved = useCallback(async () => {
    if (!onMarkAsResolved || isMarkingResolved) return
    setIsMarkingResolved(true)
    setError(null)
    try {
      await onMarkAsResolved(wrongAnswer.id)
    } catch (err) {
      setError('해결 완료 처리에 실패했습니다.')
    } finally {
      setIsMarkingResolved(false)
    }
  }, [onMarkAsResolved, wrongAnswer.id, isMarkingResolved])

  // 다시 풀기
  const handleRetry = useCallback(() => {
    onRetry?.(wrongAnswer)
  }, [onRetry, wrongAnswer])

  // 유사 문제 생성
  const handleGenerateSimilar = useCallback(async () => {
    if (!onGenerateSimilar || isGeneratingSimilar) return
    setIsGeneratingSimilar(true)
    setError(null)
    try {
      const result = await onGenerateSimilar(wrongAnswer.problem_id)
      if (result) {
        setSimilarProblem(result)
      }
    } catch (err) {
      setError('유사 문제 생성에 실패했습니다.')
    } finally {
      setIsGeneratingSimilar(false)
    }
  }, [onGenerateSimilar, wrongAnswer.problem_id, isGeneratingSimilar])

  // AI 해설 생성
  const handleGenerateExplanation = useCallback(async () => {
    if (!onGenerateExplanation || isGeneratingExplanation) return
    setIsGeneratingExplanation(true)
    setError(null)
    try {
      const result = await onGenerateExplanation(wrongAnswer.problem_id)
      if (result) {
        setAiExplanation(result)
      }
    } catch (err) {
      setError('AI 해설 생성에 실패했습니다.')
    } finally {
      setIsGeneratingExplanation(false)
    }
  }, [onGenerateExplanation, wrongAnswer.problem_id, isGeneratingExplanation])

  // 문제 복사
  const handleCopyProblem = useCallback(async () => {
    const text = `문제: ${wrongAnswer.question}\n정답: ${wrongAnswer.correct_answer}\n해설: ${wrongAnswer.explanation || '없음'}`
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      setError('복사에 실패했습니다.')
    }
  }, [wrongAnswer])

  // 답안 표시 함수
  const getAnswerDisplay = (answer: string | number, options?: WrongAnswer['options']) => {
    if (wrongAnswer.type === 'multiple_choice' && options) {
      const option = options.find((o) => o.id === String(answer) || o.id === answer)
      return option ? `${option.id}. ${option.text}` : String(answer)
    }
    return String(answer)
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
        isSelected ? 'border-blue-500' : 'border-gray-100'
      }`}
    >
      {/* 문제 헤더 */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              className="w-5 h-5 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          )}
          <div className="flex-1">
            {/* 태그 영역 */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${subjectColor.bg} ${subjectColor.text}`}>
                {wrongAnswer.subject}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {wrongAnswer.chapter}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${DIFFICULTY_COLORS[wrongAnswer.difficulty]}`}>
                {UI_TEXT.difficulty}: {DIFFICULTY_LABELS[wrongAnswer.difficulty]}
              </span>
              {wrongAnswer.resolved ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {UI_TEXT.resolved}
                </span>
              ) : wrongAnswer.reviewed ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {UI_TEXT.reviewed}
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {UI_TEXT.notReviewed}
                </span>
              )}
            </div>

            {/* 문제 내용 */}
            <p className="font-medium text-gray-800">{wrongAnswer.question}</p>

            {/* 메타 정보 */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {UI_TEXT.wrongDate}: {wrongAnswer.wrong_date}
              </span>
              {wrongAnswer.retry_count > 0 && (
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  {UI_TEXT.retryCount}: {wrongAnswer.retry_count}회
                </span>
              )}
            </div>
          </div>

          {/* 확장 버튼 */}
          <button
            onClick={toggleExpand}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50">
          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-600 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 객관식 보기 */}
          {wrongAnswer.type === 'multiple_choice' && wrongAnswer.options && (
            <div className="mb-4 space-y-2">
              {wrongAnswer.options.map((choice) => {
                const isMyAnswer = String(choice.id) === String(wrongAnswer.my_answer)
                const isCorrect = String(choice.id) === String(wrongAnswer.correct_answer)
                let bgColor = 'bg-white border-gray-200'
                if (showAnswer) {
                  if (isCorrect) bgColor = 'bg-green-50 border-green-300'
                  else if (isMyAnswer) bgColor = 'bg-red-50 border-red-300'
                }

                return (
                  <div
                    key={choice.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 ${bgColor}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        showAnswer && isCorrect
                          ? 'bg-green-500 text-white'
                          : showAnswer && isMyAnswer
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {choice.id}
                    </span>
                    <span className="flex-1">{choice.text}</span>
                    {showAnswer && isMyAnswer && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {showAnswer && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 단답형/서술형 답안 비교 */}
          {wrongAnswer.type !== 'multiple_choice' && (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {UI_TEXT.myAnswer}
                </p>
                <p className="font-medium text-red-700">{String(wrongAnswer.my_answer)}</p>
              </div>
              {showAnswer && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {UI_TEXT.correctAnswer}
                  </p>
                  <p className="font-medium text-green-700">{String(wrongAnswer.correct_answer)}</p>
                </div>
              )}
            </div>
          )}

          {/* 해설 (기존) */}
          {showAnswer && wrongAnswer.explanation && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-3">
              <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {UI_TEXT.explanation}
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">{wrongAnswer.explanation}</p>
            </div>
          )}

          {/* 관련 개념 (기존) */}
          {showAnswer && wrongAnswer.related_concept && (
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 mb-3">
              <p className="text-xs font-medium text-yellow-600 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {UI_TEXT.relatedConcept}
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">{wrongAnswer.related_concept}</p>
            </div>
          )}

          {/* AI 해설 (생성된 경우) */}
          {aiExplanation && (
            <div className="space-y-3 mb-3">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <p className="text-xs font-medium text-purple-600 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI {UI_TEXT.explanation}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{aiExplanation.explanation}</p>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <p className="text-xs font-medium text-indigo-600 mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  AI {UI_TEXT.relatedConcept}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{aiExplanation.relatedConcept}</p>
              </div>
            </div>
          )}

          {/* 유사 문제 (생성된 경우) */}
          {similarProblem && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 mb-3">
              <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {UI_TEXT.similarProblem}
              </p>
              <p className="font-medium text-gray-800 mb-2">{similarProblem.question}</p>
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{UI_TEXT.similarityReason}:</span> {similarProblem.similarity_reason}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSimilarProblem(null)}
                  className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    // 유사 문제 풀기 로직
                    alert(`정답: ${similarProblem.answer}\n\n풀이: ${similarProblem.solution}`)
                  }}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {UI_TEXT.solveSimilar}
                </button>
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            {/* 왼쪽: 정답 보기/AI 기능 */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleShowAnswer}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                {showAnswer ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {UI_TEXT.hideAnswer}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {UI_TEXT.showAnswer}
                  </>
                )}
              </button>

              {onGenerateExplanation && (
                <button
                  onClick={handleGenerateExplanation}
                  disabled={isGeneratingExplanation}
                  className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isGeneratingExplanation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {UI_TEXT.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {UI_TEXT.generateExplanation}
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleCopyProblem}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    {UI_TEXT.copied}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {UI_TEXT.copyProblem}
                  </>
                )}
              </button>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div className="flex items-center gap-2">
              {onGenerateSimilar && (
                <button
                  onClick={handleGenerateSimilar}
                  disabled={isGeneratingSimilar}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isGeneratingSimilar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {UI_TEXT.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {UI_TEXT.generateSimilar}
                    </>
                  )}
                </button>
              )}

              {!wrongAnswer.reviewed && onMarkAsReviewed && (
                <button
                  onClick={handleMarkAsReviewed}
                  disabled={isMarkingReviewed}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isMarkingReviewed ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {UI_TEXT.markAsReviewed}
                </button>
              )}

              {!wrongAnswer.resolved && onMarkAsResolved && (
                <button
                  onClick={handleMarkAsResolved}
                  disabled={isMarkingResolved}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isMarkingResolved ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {UI_TEXT.markAsResolved}
                </button>
              )}

              {onRetry && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {UI_TEXT.retry}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
const WrongAnswerCard = memo(WrongAnswerCardComponent)
WrongAnswerCard.displayName = 'WrongAnswerCard'

export default WrongAnswerCard
