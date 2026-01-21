'use client';

/**
 * GradingSummary - 전체 점수 요약 컴포넌트
 *
 * 기능:
 * - 전체 점수 및 등급 표시
 * - 정답률 도넛 차트
 * - 난이도별 정답률
 * - 유형별 정답률
 * - 소요 시간 표시
 * - 취약 단원 분석
 */

import { memo, useMemo } from 'react';
import {
  Award,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { ProblemGradingResult } from './GradingResult';
import { ProblemDifficulty, ProblemType, PROBLEM_DIFFICULTY_LABELS, PROBLEM_TYPE_LABELS } from '@/types/database';

// ============================================
// 타입 정의
// ============================================

export interface GradingSummaryData {
  /** 학생 정보 */
  studentName: string;
  studentGrade?: string;

  /** 과제 정보 */
  assignmentTitle: string;
  assignmentDate?: string;

  /** 점수 정보 */
  totalScore: number;
  maxScore: number;
  previousScore?: number;

  /** 문제별 결과 */
  results: ProblemGradingResult[];

  /** 시간 정보 */
  startedAt?: string;
  submittedAt?: string;
  timeLimit?: number;
}

interface GradingSummaryProps {
  data: GradingSummaryData;
  showChart?: boolean;
  showAnalysis?: boolean;
}

// ============================================
// 유틸리티 함수
// ============================================

/** 점수 등급 계산 */
function getScoreGrade(percentage: number): { grade: string; color: string; bgColor: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bgColor: 'bg-green-100' };
  if (percentage >= 85) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100' };
  if (percentage >= 80) return { grade: 'B+', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  if (percentage >= 75) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  if (percentage >= 70) return { grade: 'C+', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  if (percentage >= 65) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  if (percentage >= 60) return { grade: 'D+', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  if (percentage >= 55) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100' };
}

/** 소요 시간 계산 */
function calculateDuration(startedAt?: string, submittedAt?: string): string {
  if (!startedAt || !submittedAt) return '-';

  const start = new Date(startedAt);
  const end = new Date(submittedAt);
  const diffMs = end.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${seconds}초`;
  return `${seconds}초`;
}

/** 시간 제한 초과 여부 */
function isOverTime(startedAt?: string, submittedAt?: string, timeLimit?: number): boolean {
  if (!startedAt || !submittedAt || !timeLimit) return false;

  const start = new Date(startedAt);
  const end = new Date(submittedAt);
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  return diffMinutes > timeLimit;
}

// ============================================
// 보조 컴포넌트
// ============================================

/** 점수 카드 */
const ScoreCard = memo(function ScoreCard({
  totalScore,
  maxScore,
  previousScore,
}: {
  totalScore: number;
  maxScore: number;
  previousScore?: number;
}) {
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const grade = getScoreGrade(percentage);

  const scoreDiff = previousScore !== undefined ? totalScore - previousScore : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">총점</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{totalScore}</span>
            <span className="text-lg text-gray-500">/ {maxScore}점</span>
          </div>

          {/* 점수 변화 */}
          {scoreDiff !== null && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {scoreDiff > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : scoreDiff < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
              <span>
                이전 대비 {scoreDiff > 0 ? '+' : ''}{scoreDiff}점
              </span>
            </div>
          )}
        </div>

        {/* 등급 */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${grade.bgColor}`}>
          <span className={`text-3xl font-bold ${grade.color}`}>{grade.grade}</span>
        </div>
      </div>
    </div>
  );
});

/** 정답률 도넛 차트 */
const AccuracyChart = memo(function AccuracyChart({
  correct,
  partial,
  incorrect,
  unanswered,
}: {
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
}) {
  const total = correct + partial + incorrect + unanswered;
  const correctPercent = total > 0 ? (correct / total) * 100 : 0;
  const partialPercent = total > 0 ? (partial / total) * 100 : 0;
  const incorrectPercent = total > 0 ? (incorrect / total) * 100 : 0;
  const unansweredPercent = total > 0 ? (unanswered / total) * 100 : 0;

  // SVG 도넛 차트를 위한 계산
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const correctOffset = 0;
  const partialOffset = (correctPercent / 100) * circumference;
  const incorrectOffset = ((correctPercent + partialPercent) / 100) * circumference;
  const unansweredOffset = ((correctPercent + partialPercent + incorrectPercent) / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">정답률</h3>

      <div className="flex items-center gap-8">
        {/* 도넛 차트 */}
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 140 140">
            {/* 배경 원 */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="16"
            />

            {/* 정답 (초록) */}
            {correctPercent > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#22c55e"
                strokeWidth="16"
                strokeDasharray={`${(correctPercent / 100) * circumference} ${circumference}`}
                strokeDashoffset={-correctOffset}
                strokeLinecap="round"
              />
            )}

            {/* 부분 정답 (노랑) */}
            {partialPercent > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#eab308"
                strokeWidth="16"
                strokeDasharray={`${(partialPercent / 100) * circumference} ${circumference}`}
                strokeDashoffset={-partialOffset}
                strokeLinecap="round"
              />
            )}

            {/* 오답 (빨강) */}
            {incorrectPercent > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth="16"
                strokeDasharray={`${(incorrectPercent / 100) * circumference} ${circumference}`}
                strokeDashoffset={-incorrectOffset}
                strokeLinecap="round"
              />
            )}

            {/* 미답변 (회색) */}
            {unansweredPercent > 0 && (
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="16"
                strokeDasharray={`${(unansweredPercent / 100) * circumference} ${circumference}`}
                strokeDashoffset={-unansweredOffset}
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">
              {Math.round(correctPercent + partialPercent * 0.5)}%
            </span>
            <span className="text-xs text-gray-500">정답률</span>
          </div>
        </div>

        {/* 범례 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600">정답</span>
            </div>
            <span className="font-medium text-gray-900">{correct}문제</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-600">부분 정답</span>
            </div>
            <span className="font-medium text-gray-900">{partial}문제</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">오답</span>
            </div>
            <span className="font-medium text-gray-900">{incorrect}문제</span>
          </div>
          {unanswered > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">미응답</span>
              </div>
              <span className="font-medium text-gray-900">{unanswered}문제</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/** 소요 시간 카드 */
const TimeCard = memo(function TimeCard({
  startedAt,
  submittedAt,
  timeLimit,
}: {
  startedAt?: string;
  submittedAt?: string;
  timeLimit?: number;
}) {
  const duration = calculateDuration(startedAt, submittedAt);
  const overTime = isOverTime(startedAt, submittedAt, timeLimit);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900">소요 시간</h3>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${overTime ? 'text-red-600' : 'text-gray-900'}`}>
          {duration}
        </span>
        {timeLimit && (
          <span className="text-sm text-gray-500">/ {timeLimit}분</span>
        )}
      </div>

      {overTime && (
        <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          제한 시간 초과
        </div>
      )}
    </div>
  );
});

/** 난이도별 정답률 */
const DifficultyAnalysis = memo(function DifficultyAnalysis({
  results,
}: {
  results: ProblemGradingResult[];
}) {
  const analysis = useMemo(() => {
    const difficultyMap: Record<ProblemDifficulty, { correct: number; total: number }> = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };

    results.forEach((result) => {
      const difficulty = result.problem.difficulty;
      difficultyMap[difficulty].total++;
      if (result.isCorrect) {
        difficultyMap[difficulty].correct++;
      } else if (result.score > 0) {
        difficultyMap[difficulty].correct += 0.5;
      }
    });

    return Object.entries(difficultyMap).map(([difficulty, data]) => ({
      difficulty: difficulty as ProblemDifficulty,
      label: PROBLEM_DIFFICULTY_LABELS[difficulty as ProblemDifficulty],
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));
  }, [results]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900">난이도별 정답률</h3>
      </div>

      <div className="space-y-4">
        {analysis.map((item) => (
          <div key={item.difficulty}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                item.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : item.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {item.label}
              </span>
              <span className="text-sm text-gray-600">
                {item.correct}/{item.total}문제 ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.difficulty === 'easy'
                    ? 'bg-green-500'
                    : item.difficulty === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/** 유형별 정답률 */
const TypeAnalysis = memo(function TypeAnalysis({
  results,
}: {
  results: ProblemGradingResult[];
}) {
  const analysis = useMemo(() => {
    const typeMap: Record<ProblemType, { correct: number; total: number }> = {
      multiple_choice: { correct: 0, total: 0 },
      short_answer: { correct: 0, total: 0 },
      true_false: { correct: 0, total: 0 },
      essay: { correct: 0, total: 0 },
    };

    results.forEach((result) => {
      const type = result.problem.type;
      typeMap[type].total++;
      if (result.isCorrect) {
        typeMap[type].correct++;
      } else if (result.score > 0) {
        typeMap[type].correct += 0.5;
      }
    });

    return Object.entries(typeMap)
      .filter(([, data]) => data.total > 0)
      .map(([type, data]) => ({
        type: type as ProblemType,
        label: PROBLEM_TYPE_LABELS[type as ProblemType],
        correct: data.correct,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }));
  }, [results]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900">유형별 정답률</h3>
      </div>

      <div className="space-y-4">
        {analysis.map((item) => (
          <div key={item.type}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm text-gray-600">
                {item.correct}/{item.total}문제 ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/** 취약 단원 분석 */
const WeakUnitsAnalysis = memo(function WeakUnitsAnalysis({
  results,
}: {
  results: ProblemGradingResult[];
}) {
  const weakUnits = useMemo(() => {
    const unitMap: Record<string, { correct: number; total: number }> = {};

    results.forEach((result) => {
      const unit = result.problem.unit || '기타';
      if (!unitMap[unit]) {
        unitMap[unit] = { correct: 0, total: 0 };
      }
      unitMap[unit].total++;
      if (result.isCorrect) {
        unitMap[unit].correct++;
      } else if (result.score > 0) {
        unitMap[unit].correct += 0.5;
      }
    });

    return Object.entries(unitMap)
      .map(([unit, data]) => ({
        unit,
        correct: data.correct,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }))
      .filter((item) => item.percentage < 70) // 70% 미만만 취약 단원으로
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);
  }, [results]);

  if (weakUnits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">취약 단원</h3>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">모든 단원에서 우수한 성적을 보이고 있습니다!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold text-gray-900">취약 단원</h3>
      </div>

      <div className="space-y-3">
        {weakUnits.map((item) => (
          <div
            key={item.unit}
            className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-900">{item.unit}</span>
            </div>
            <span className="text-sm text-red-600 font-medium">
              {item.percentage}% ({item.correct}/{item.total})
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        * 정답률 70% 미만 단원이 표시됩니다.
      </p>
    </div>
  );
});

// ============================================
// 메인 컴포넌트
// ============================================

export const GradingSummary = memo(function GradingSummary({
  data,
  showChart = true,
  showAnalysis = true,
}: GradingSummaryProps) {
  // 정답/오답/부분 정답 계산
  const resultCounts = useMemo(() => {
    let correct = 0;
    let partial = 0;
    let incorrect = 0;
    let unanswered = 0;

    data.results.forEach((result) => {
      if (result.isCorrect === null) {
        unanswered++;
      } else if (result.isCorrect) {
        correct++;
      } else if (result.score > 0) {
        partial++;
      } else {
        incorrect++;
      }
    });

    return { correct, partial, incorrect, unanswered };
  }, [data.results]);

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{data.assignmentTitle}</h2>
          <p className="text-sm text-gray-500">
            {data.studentName}
            {data.studentGrade && ` (${data.studentGrade})`}
            {data.assignmentDate && ` - ${data.assignmentDate}`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-lg">
          <Award className="w-5 h-5 text-primary-600" />
          <span className="font-semibold text-primary-700">
            {data.results.length}문제 중 {resultCounts.correct}문제 정답
          </span>
        </div>
      </div>

      {/* 점수 및 시간 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreCard
          totalScore={data.totalScore}
          maxScore={data.maxScore}
          previousScore={data.previousScore}
        />
        <TimeCard
          startedAt={data.startedAt}
          submittedAt={data.submittedAt}
          timeLimit={data.timeLimit}
        />
      </div>

      {/* 정답률 차트 */}
      {showChart && (
        <AccuracyChart
          correct={resultCounts.correct}
          partial={resultCounts.partial}
          incorrect={resultCounts.incorrect}
          unanswered={resultCounts.unanswered}
        />
      )}

      {/* 분석 */}
      {showAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DifficultyAnalysis results={data.results} />
          <TypeAnalysis results={data.results} />
          <WeakUnitsAnalysis results={data.results} />
        </div>
      )}
    </div>
  );
});

export default GradingSummary;
