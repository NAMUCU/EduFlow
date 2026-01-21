'use client';

/**
 * GradingResult - 문제별 채점 결과 표시 컴포넌트
 *
 * 기능:
 * - 문제별 채점 결과 표시 (정답/오답/부분점수)
 * - 학생 답안과 정답 비교
 * - 수학 문제의 풀이 과정 피드백
 * - 문제별 상세 해설 표시
 */

import { memo, useState } from 'react';
import {
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Calculator,
  FileText,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Problem, ProblemType, PROBLEM_TYPE_LABELS, PROBLEM_DIFFICULTY_LABELS } from '@/types/database';

// ============================================
// 타입 정의
// ============================================

/** 문제별 채점 결과 */
export interface ProblemGradingResult {
  problemId: string;
  problem: Problem;
  studentAnswer: string;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  feedback?: string;
  solutionSteps?: SolutionStep[];
  answeredAt?: string;
}

/** 수학 풀이 단계 */
export interface SolutionStep {
  step: number;
  description: string;
  formula?: string;
  isCorrect: boolean;
  feedback?: string;
}

interface GradingResultProps {
  results: ProblemGradingResult[];
  showSolution?: boolean;
  showFeedback?: boolean;
  onFeedbackEdit?: (problemId: string, feedback: string) => void;
}

// ============================================
// 보조 컴포넌트
// ============================================

/** 정답/오답 배지 */
const ResultBadge = memo(function ResultBadge({
  isCorrect,
  score,
  maxScore,
}: {
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
}) {
  if (isCorrect === null) {
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        미채점
      </span>
    );
  }

  if (isCorrect) {
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <Check className="w-4 h-4" />
        정답 ({score}/{maxScore}점)
      </span>
    );
  }

  // 부분 점수
  if (score > 0 && score < maxScore) {
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
        <Star className="w-4 h-4" />
        부분 정답 ({score}/{maxScore}점)
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
      <X className="w-4 h-4" />
      오답 ({score}/{maxScore}점)
    </span>
  );
});

/** 풀이 단계 컴포넌트 (수학용) */
const SolutionStepItem = memo(function SolutionStepItem({
  step,
}: {
  step: SolutionStep;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${
        step.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          step.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}
      >
        {step.step}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-700">{step.description}</p>
        {step.formula && (
          <div className="mt-2 px-3 py-2 bg-white rounded border border-gray-200 font-mono text-sm">
            {step.formula}
          </div>
        )}
        {step.feedback && (
          <p
            className={`mt-2 text-xs ${
              step.isCorrect ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {step.isCorrect ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
            {step.feedback}
          </p>
        )}
      </div>
    </div>
  );
});

/** 문제 유형 아이콘 */
const ProblemTypeIcon = memo(function ProblemTypeIcon({
  type,
}: {
  type: ProblemType;
}) {
  switch (type) {
    case 'multiple_choice':
      return <FileText className="w-4 h-4" />;
    case 'short_answer':
      return <Calculator className="w-4 h-4" />;
    case 'essay':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
});

/** 개별 문제 채점 결과 */
const ProblemResultCard = memo(function ProblemResultCard({
  result,
  index,
  showSolution,
  showFeedback,
  onFeedbackEdit,
}: {
  result: ProblemGradingResult;
  index: number;
  showSolution?: boolean;
  showFeedback?: boolean;
  onFeedbackEdit?: (problemId: string, feedback: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(result.feedback || '');
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  const handleSaveFeedback = () => {
    if (onFeedbackEdit) {
      onFeedbackEdit(result.problemId, localFeedback);
    }
    setIsEditingFeedback(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* 문제 번호 */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
              result.isCorrect === true
                ? 'bg-green-100 text-green-700'
                : result.isCorrect === false
                ? result.score > 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {index + 1}
          </div>

          {/* 문제 정보 */}
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <ProblemTypeIcon type={result.problem.type} />
                {PROBLEM_TYPE_LABELS[result.problem.type]}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className={`px-2 py-0.5 rounded-full ${
                result.problem.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : result.problem.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {PROBLEM_DIFFICULTY_LABELS[result.problem.difficulty]}
              </span>
              {result.problem.unit && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{result.problem.unit}</span>
                </>
              )}
            </div>
            <p className="text-gray-900 line-clamp-1">{result.problem.question}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ResultBadge
            isCorrect={result.isCorrect}
            score={result.score}
            maxScore={result.maxScore}
          />
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 확장된 상세 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          {/* 문제 전문 */}
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">문제</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{result.problem.question}</p>

            {/* 객관식 보기 */}
            {result.problem.type === 'multiple_choice' && result.problem.options && (
              <div className="mt-3 space-y-2">
                {result.problem.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      option.id === result.problem.answer
                        ? 'bg-green-50 border border-green-200'
                        : option.id === result.studentAnswer
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-sm text-gray-600">{option.id}.</span>
                    <span className="text-gray-900">{option.text}</span>
                    {option.id === result.problem.answer && (
                      <Check className="w-4 h-4 text-green-500 ml-auto" />
                    )}
                    {option.id === result.studentAnswer && option.id !== result.problem.answer && (
                      <X className="w-4 h-4 text-red-500 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 학생 답안 vs 정답 비교 */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">학생 답안</h4>
              <p className={`font-medium ${
                result.isCorrect ? 'text-green-600' : result.score > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {result.studentAnswer || '(미작성)'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">정답</h4>
              <p className="text-green-600 font-medium">{result.problem.answer}</p>
            </div>
          </div>

          {/* 수학 풀이 단계 (수학 문제의 경우) */}
          {result.solutionSteps && result.solutionSteps.length > 0 && (
            <div className="mt-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Calculator className="w-4 h-4" />
                풀이 과정 분석
              </h4>
              <div className="space-y-2">
                {result.solutionSteps.map((step) => (
                  <SolutionStepItem key={step.step} step={step} />
                ))}
              </div>
            </div>
          )}

          {/* 해설 */}
          {showSolution && result.problem.solution && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                <Lightbulb className="w-4 h-4" />
                해설
              </h4>
              <p className="text-blue-900 text-sm whitespace-pre-wrap">
                {result.problem.solution}
              </p>
            </div>
          )}

          {/* 피드백 */}
          {showFeedback && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquare className="w-4 h-4" />
                  선생님 피드백
                </h4>
                {onFeedbackEdit && !isEditingFeedback && (
                  <button
                    onClick={() => setIsEditingFeedback(true)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    수정
                  </button>
                )}
              </div>

              {isEditingFeedback ? (
                <div>
                  <textarea
                    value={localFeedback}
                    onChange={(e) => setLocalFeedback(e.target.value)}
                    placeholder="피드백을 입력하세요..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setLocalFeedback(result.feedback || '');
                        setIsEditingFeedback(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveFeedback}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    {result.feedback || '피드백이 없습니다.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================
// 메인 컴포넌트
// ============================================

export const GradingResult = memo(function GradingResult({
  results,
  showSolution = true,
  showFeedback = true,
  onFeedbackEdit,
}: GradingResultProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">채점 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <ProblemResultCard
          key={result.problemId}
          result={result}
          index={index}
          showSolution={showSolution}
          showFeedback={showFeedback}
          onFeedbackEdit={onFeedbackEdit}
        />
      ))}
    </div>
  );
});

export default GradingResult;
