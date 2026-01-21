'use client';

/**
 * 취약점 카드 컴포넌트
 *
 * - 취약 단원 카드
 * - 추천 학습 내용
 */

import { memo, ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lightbulb,
  Play,
} from 'lucide-react';

// ============================================
// 타입 정의
// ============================================

/** 취약 단원 정보 */
export interface WeakUnitInfo {
  id?: string;
  name: string;           // 단원명
  subject: string;        // 과목
  accuracy: number;       // 정답률 (0-100)
  totalQuestions: number; // 총 문제 수
  wrongQuestions: number; // 오답 수
  lastAttemptDate?: string; // 마지막 시도 날짜
  difficulty?: 'easy' | 'medium' | 'hard'; // 난이도
}

/** 추천 학습 정보 */
export interface RecommendedStudy {
  id?: string;
  title: string;          // 학습 제목
  description: string;    // 설명
  type: 'video' | 'practice' | 'concept' | 'review'; // 학습 유형
  duration?: number;      // 예상 소요 시간 (분)
  relatedUnit?: string;   // 관련 단원
  priority?: 'high' | 'medium' | 'low'; // 우선순위
  completed?: boolean;    // 완료 여부
}

// ============================================
// 색상 및 스타일 설정
// ============================================

const ACCURACY_COLORS = {
  danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  warning: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  caution: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
};

const STUDY_TYPE_CONFIG: Record<string, { icon: ReactNode; label: string; color: string }> = {
  video: {
    icon: <Play className="w-4 h-4" />,
    label: '강의 영상',
    color: 'bg-blue-100 text-blue-600',
  },
  practice: {
    icon: <Target className="w-4 h-4" />,
    label: '연습 문제',
    color: 'bg-green-100 text-green-600',
  },
  concept: {
    icon: <Lightbulb className="w-4 h-4" />,
    label: '개념 정리',
    color: 'bg-purple-100 text-purple-600',
  },
  review: {
    icon: <BookOpen className="w-4 h-4" />,
    label: '복습',
    color: 'bg-orange-100 text-orange-600',
  },
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

// ============================================
// 유틸리티 함수
// ============================================

function getAccuracyStyle(accuracy: number) {
  if (accuracy < 40) return ACCURACY_COLORS.danger;
  if (accuracy < 60) return ACCURACY_COLORS.warning;
  return ACCURACY_COLORS.caution;
}

function getAccuracyLabel(accuracy: number) {
  if (accuracy < 40) return '매우 취약';
  if (accuracy < 60) return '취약';
  return '보통';
}

// ============================================
// WeakUnitCard 컴포넌트
// ============================================

interface WeakUnitCardProps {
  unit: WeakUnitInfo;
  onPractice?: (unit: WeakUnitInfo) => void;
}

export const WeakUnitCard = memo(function WeakUnitCard({
  unit,
  onPractice,
}: WeakUnitCardProps) {
  const style = getAccuracyStyle(unit.accuracy);

  return (
    <div className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${style.text}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {getAccuracyLabel(unit.accuracy)}
          </span>
        </div>
        <span className="text-xs text-gray-500">{unit.subject}</span>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2">{unit.name}</h4>

      <div className="space-y-2 text-sm">
        {/* 정답률 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">정답률</span>
          <span className={`font-medium ${style.text}`}>{unit.accuracy}%</span>
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-white rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              unit.accuracy < 40 ? 'bg-red-500' :
              unit.accuracy < 60 ? 'bg-orange-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${unit.accuracy}%` }}
          />
        </div>

        {/* 통계 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>총 {unit.totalQuestions}문제 중 {unit.wrongQuestions}문제 오답</span>
          {unit.lastAttemptDate && (
            <span>최근: {unit.lastAttemptDate}</span>
          )}
        </div>
      </div>

      {/* 연습 버튼 */}
      {onPractice && (
        <button
          onClick={() => onPractice(unit)}
          className="w-full mt-4 py-2 bg-white text-primary-600 font-medium text-sm rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
        >
          이 단원 연습하기
        </button>
      )}
    </div>
  );
});

// ============================================
// WeakUnitList 컴포넌트
// ============================================

interface WeakUnitListProps {
  units: WeakUnitInfo[];
  title?: string;
  onPractice?: (unit: WeakUnitInfo) => void;
  maxDisplay?: number;
}

export const WeakUnitList = memo(function WeakUnitList({
  units,
  title = '취약 단원',
  onPractice,
  maxDisplay = 6,
}: WeakUnitListProps) {
  // 정답률 기준 정렬 (낮은 순)
  const sortedUnits = [...units]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, maxDisplay);

  if (sortedUnits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
          <p>취약한 단원이 없습니다!</p>
          <p className="text-sm text-gray-400">모든 단원의 정답률이 양호합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">
          총 {units.length}개 단원 중 {sortedUnits.length}개 표시
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedUnits.map((unit, index) => (
          <WeakUnitCard
            key={unit.id || index}
            unit={unit}
            onPractice={onPractice}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================
// RecommendedStudyCard 컴포넌트
// ============================================

interface RecommendedStudyCardProps {
  study: RecommendedStudy;
  onStart?: (study: RecommendedStudy) => void;
}

export const RecommendedStudyCard = memo(function RecommendedStudyCard({
  study,
  onStart,
}: RecommendedStudyCardProps) {
  const typeConfig = STUDY_TYPE_CONFIG[study.type] || STUDY_TYPE_CONFIG.concept;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${study.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
          {typeConfig.icon}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{study.title}</h4>
            {study.completed && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
            {study.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className={`px-2 py-0.5 rounded-full ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            {study.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {study.duration}분
              </span>
            )}
            {study.priority && (
              <span className={`px-2 py-0.5 rounded-full ${PRIORITY_COLORS[study.priority]}`}>
                {study.priority === 'high' ? '높음' :
                 study.priority === 'medium' ? '보통' : '낮음'}
              </span>
            )}
          </div>

          {study.relatedUnit && (
            <div className="mt-2 text-xs text-gray-400">
              관련 단원: {study.relatedUnit}
            </div>
          )}
        </div>

        {/* 시작 버튼 */}
        {onStart && !study.completed && (
          <button
            onClick={() => onStart(study)}
            className="flex-shrink-0 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            시작
          </button>
        )}
      </div>
    </div>
  );
});

// ============================================
// RecommendedStudyList 컴포넌트
// ============================================

interface RecommendedStudyListProps {
  studies: RecommendedStudy[];
  title?: string;
  onStart?: (study: RecommendedStudy) => void;
}

export const RecommendedStudyList = memo(function RecommendedStudyList({
  studies,
  title = '추천 학습',
  onStart,
}: RecommendedStudyListProps) {
  // 완료되지 않은 것 먼저, 우선순위 순으로 정렬
  const sortedStudies = [...studies].sort((a, b) => {
    // 완료 여부 먼저
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 우선순위 순
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2);
  });

  const completedCount = studies.filter(s => s.completed).length;
  const totalCount = studies.length;

  if (sortedStudies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Lightbulb className="w-12 h-12 text-yellow-500 mb-3" />
          <p>추천 학습이 없습니다</p>
          <p className="text-sm text-gray-400">더 많은 문제를 풀어보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          {title}
          <TrendingUp className="w-4 h-4 text-primary-500" />
        </h3>
        <span className="text-sm text-gray-500">
          {completedCount}/{totalCount} 완료
        </span>
      </div>

      {/* 진행 바 */}
      <div className="mb-4">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="h-2 bg-primary-500 rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {sortedStudies.map((study, index) => (
          <RecommendedStudyCard
            key={study.id || index}
            study={study}
            onStart={onStart}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================
// WeaknessCard 컴포넌트 (통합)
// ============================================

interface WeaknessCardProps {
  weakUnits?: WeakUnitInfo[];
  recommendedStudies?: RecommendedStudy[];
  onPracticeUnit?: (unit: WeakUnitInfo) => void;
  onStartStudy?: (study: RecommendedStudy) => void;
}

export const WeaknessCard = memo(function WeaknessCard({
  weakUnits,
  recommendedStudies,
  onPracticeUnit,
  onStartStudy,
}: WeaknessCardProps) {
  return (
    <div className="space-y-6">
      <WeakUnitList
        units={weakUnits || []}
        onPractice={onPracticeUnit}
      />
      <RecommendedStudyList
        studies={recommendedStudies || []}
        onStart={onStartStudy}
      />
    </div>
  );
});

export default WeaknessCard;
