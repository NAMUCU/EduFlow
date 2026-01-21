'use client';

/**
 * 취약점 분석 탭 컴포넌트
 *
 * - 단원별 취약점 레이더 차트
 * - 시간별 점수 추이 그래프
 * - 취약 단원 카드
 * - 추천 학습 내용
 */

import { memo, useCallback, useMemo } from 'react';
import { StudentDetail } from '@/types/student';
import {
  WeaknessRadarChart,
  WeaknessTrendChart,
  UnitScore,
  ScoreTrend,
} from '@/components/analysis/WeaknessChart';
import {
  WeakUnitList,
  RecommendedStudyList,
  WeakUnitInfo,
  RecommendedStudy,
} from '@/components/analysis/WeaknessCard';
import { StatCard, TrendIcon } from '../components/StatCard';
import { AlertTriangle, Target, TrendingUp, BookOpen } from 'lucide-react';

// ============================================
// 타입 정의
// ============================================

interface WeaknessTabProps {
  student: StudentDetail;
}

// ============================================
// 샘플 데이터 생성 함수 (실제로는 API에서 가져옴)
// ============================================

function generateSampleRadarData(student: StudentDetail): UnitScore[] {
  // 학생의 과목 기반 단원 데이터 생성
  const subjects = student.subjects || ['수학'];
  const units: UnitScore[] = [];

  const mathUnits = ['수와 연산', '문자와 식', '함수', '기하', '확률과 통계', '미적분'];
  const englishUnits = ['문법', '독해', '어휘', '듣기', '작문', '회화'];
  const koreanUnits = ['문학', '비문학', '문법', '화법', '작문', '매체'];

  subjects.forEach(subject => {
    let subjectUnits: string[] = [];
    switch (subject) {
      case '수학':
        subjectUnits = mathUnits;
        break;
      case '영어':
        subjectUnits = englishUnits;
        break;
      case '국어':
        subjectUnits = koreanUnits;
        break;
      default:
        subjectUnits = ['단원1', '단원2', '단원3', '단원4', '단원5'];
    }

    subjectUnits.forEach(unit => {
      // 기존 취약 단원 데이터가 있으면 활용
      const weakUnit = student.weakUnits?.find(w => w.name === unit);
      const score = weakUnit ? weakUnit.accuracy : Math.floor(Math.random() * 40) + 50;

      units.push({
        unit: `${unit}`,
        score,
        fullMark: 100,
      });
    });
  });

  return units.slice(0, 8); // 최대 8개 단원
}

function generateSampleTrendData(): ScoreTrend[] {
  const months = ['9월', '10월', '11월', '12월', '1월', '2월'];
  let score = Math.floor(Math.random() * 20) + 55;

  return months.map(date => {
    // 약간의 변동성 추가
    const change = Math.floor(Math.random() * 10) - 3;
    score = Math.max(40, Math.min(95, score + change));

    return {
      date,
      score,
      average: Math.floor(Math.random() * 10) + 65,
    };
  });
}

function generateWeakUnitsData(student: StudentDetail): WeakUnitInfo[] {
  // 기존 weakUnits 데이터 활용
  if (student.weakUnits && student.weakUnits.length > 0) {
    return student.weakUnits.map((unit, index) => ({
      id: `weak-${index}`,
      name: unit.name,
      subject: unit.subject || '수학',
      accuracy: unit.accuracy,
      totalQuestions: Math.floor(Math.random() * 30) + 10,
      wrongQuestions: Math.floor((100 - unit.accuracy) / 100 * (Math.floor(Math.random() * 30) + 10)),
      lastAttemptDate: '2025-01-15',
      difficulty: unit.accuracy < 40 ? 'hard' : unit.accuracy < 60 ? 'medium' : 'easy',
    }));
  }

  // 샘플 데이터 생성
  const sampleUnits = [
    { name: '이차함수', subject: '수학', accuracy: 35 },
    { name: '관계대명사', subject: '영어', accuracy: 42 },
    { name: '삼각함수', subject: '수학', accuracy: 48 },
    { name: '현재완료', subject: '영어', accuracy: 55 },
  ];

  return sampleUnits.map((unit, index) => ({
    id: `weak-${index}`,
    ...unit,
    totalQuestions: Math.floor(Math.random() * 30) + 10,
    wrongQuestions: Math.floor((100 - unit.accuracy) / 100 * 20),
    lastAttemptDate: '2025-01-15',
    difficulty: unit.accuracy < 40 ? 'hard' : unit.accuracy < 60 ? 'medium' : 'easy',
  }));
}

function generateRecommendedStudies(weakUnits: WeakUnitInfo[]): RecommendedStudy[] {
  const studies: RecommendedStudy[] = [];

  weakUnits.slice(0, 4).forEach((unit, index) => {
    // 각 취약 단원에 대한 추천 학습 생성
    studies.push({
      id: `study-concept-${index}`,
      title: `${unit.name} 개념 정리`,
      description: `${unit.name} 단원의 핵심 개념을 다시 정리하고 이해도를 높입니다.`,
      type: 'concept',
      duration: 20,
      relatedUnit: unit.name,
      priority: unit.accuracy < 40 ? 'high' : 'medium',
      completed: false,
    });

    studies.push({
      id: `study-practice-${index}`,
      title: `${unit.name} 연습 문제`,
      description: `${unit.name} 관련 문제를 풀어보며 실력을 향상시킵니다.`,
      type: 'practice',
      duration: 30,
      relatedUnit: unit.name,
      priority: unit.accuracy < 40 ? 'high' : 'medium',
      completed: false,
    });
  });

  // 일부 완료 표시
  if (studies.length > 2) {
    studies[0].completed = true;
  }

  return studies;
}

// ============================================
// WeaknessTab 컴포넌트
// ============================================

export const WeaknessTab = memo(function WeaknessTab({ student }: WeaknessTabProps) {
  // 데이터 준비 (메모이제이션)
  const radarData = useMemo(() => generateSampleRadarData(student), [student]);
  const trendData = useMemo(() => generateSampleTrendData(), []);
  const weakUnits = useMemo(() => generateWeakUnitsData(student), [student]);
  const recommendedStudies = useMemo(() => generateRecommendedStudies(weakUnits), [weakUnits]);

  // 통계 계산
  const stats = useMemo(() => {
    const avgAccuracy = radarData.length > 0
      ? Math.round(radarData.reduce((sum, d) => sum + d.score, 0) / radarData.length)
      : 0;

    const weakCount = radarData.filter(d => d.score < 60).length;

    const trendChange = trendData.length >= 2
      ? trendData[trendData.length - 1].score - trendData[0].score
      : 0;

    const trend: 'up' | 'down' | 'stable' =
      trendChange > 5 ? 'up' : trendChange < -5 ? 'down' : 'stable';

    const completedStudies = recommendedStudies.filter(s => s.completed).length;

    return {
      avgAccuracy,
      weakCount,
      trend,
      trendChange,
      completedStudies,
      totalStudies: recommendedStudies.length,
    };
  }, [radarData, trendData, recommendedStudies]);

  // 이벤트 핸들러
  const handlePracticeUnit = useCallback((unit: WeakUnitInfo) => {
    // TODO: 실제 연습 페이지로 이동
    console.log('연습 시작:', unit.name);
    alert(`${unit.name} 단원 연습 문제를 준비합니다.`);
  }, []);

  const handleStartStudy = useCallback((study: RecommendedStudy) => {
    // TODO: 실제 학습 페이지로 이동
    console.log('학습 시작:', study.title);
    alert(`${study.title} 학습을 시작합니다.`);
  }, []);

  return (
    <div className="space-y-6">
      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="평균 정답률"
          value={`${stats.avgAccuracy}%`}
          subtitle={
            <div className="flex items-center gap-1">
              <TrendIcon trend={stats.trend} />
              {stats.trendChange > 0 ? '+' : ''}{stats.trendChange.toFixed(1)}점
            </div>
          }
          icon={<Target className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="취약 단원"
          value={`${stats.weakCount}개`}
          subtitle="정답률 60% 미만"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="추천 학습"
          value={`${stats.totalStudies}개`}
          subtitle={`${stats.completedStudies}개 완료`}
          icon={<BookOpen className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="성장 추이"
          value={stats.trend === 'up' ? '상승' : stats.trend === 'down' ? '하락' : '유지'}
          subtitle="최근 6개월"
          icon={<TrendingUp className="w-5 h-5" />}
          color={stats.trend === 'up' ? 'green' : stats.trend === 'down' ? 'red' : 'orange'}
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeaknessRadarChart
          data={radarData}
          title="단원별 정답률 분석"
        />
        <WeaknessTrendChart
          data={trendData}
          title="점수 변화 추이"
          showAverage={true}
        />
      </div>

      {/* 취약 단원 목록 */}
      <WeakUnitList
        units={weakUnits}
        title="취약 단원 상세"
        onPractice={handlePracticeUnit}
        maxDisplay={6}
      />

      {/* 추천 학습 */}
      <RecommendedStudyList
        studies={recommendedStudies}
        title="맞춤 추천 학습"
        onStart={handleStartStudy}
      />
    </div>
  );
});

export default WeaknessTab;
