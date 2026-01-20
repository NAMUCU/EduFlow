// 문제지 출력 관련 커스텀 훅
// SWR을 사용하여 문제 데이터 캐싱 및 중복 요청 방지

import useSWR from 'swr';
import { Problem } from '@/types/pdf';

// 문제 데이터 구조 타입
export interface ProblemDataByCategory {
  [category: string]: { [unit: string]: Problem[] };
}

// 전체 문제 데이터 구조 타입
export interface ProblemData {
  [subject: string]: ProblemDataByCategory;
}

// 문제 데이터 fetcher 함수
const problemsFetcher = async (url: string): Promise<ProblemDataByCategory> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('문제 데이터를 불러오는데 실패했습니다.');
    }
    const data: ProblemData = await response.json();
    // 수학 데이터만 반환 (현재 구조에 맞게)
    return data['수학'] || {};
  } catch (error) {
    console.error('문제 데이터 로드 실패:', error);
    return {};
  }
};

// SWR 설정 옵션
const swrOptions = {
  revalidateOnFocus: false, // 포커스 시 재검증 비활성화
  revalidateOnReconnect: false, // 재연결 시 재검증 비활성화
  dedupingInterval: 60000, // 60초 동안 중복 요청 방지
};

/**
 * 문제 데이터를 SWR로 캐싱하여 가져오는 훅
 * - 자동 캐싱 및 중복 요청 방지
 * - 여러 컴포넌트에서 같은 데이터 공유
 */
export function useProblems() {
  const { data, error, isLoading, mutate } = useSWR<ProblemDataByCategory>(
    '/data/example-problems.json',
    problemsFetcher,
    swrOptions
  );

  return {
    problemData: data || {},
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * 특정 카테고리의 문제만 가져오는 훅
 */
export function useProblemsByCategory(category: string) {
  const { problemData, isLoading, isError } = useProblems();

  const categoryData = category ? problemData[category] || {} : {};
  const units = Object.keys(categoryData);

  return {
    units,
    problems: categoryData,
    isLoading,
    isError,
  };
}

/**
 * 검색 필터링 유틸리티 함수
 */
export function filterProblems(
  problems: Problem[],
  searchQuery: string
): Problem[] {
  if (!searchQuery) return problems;
  const query = searchQuery.toLowerCase();
  return problems.filter(
    (p) =>
      p.question.toLowerCase().includes(query) ||
      p.answer.toLowerCase().includes(query) ||
      p.type.toLowerCase().includes(query)
  );
}

/**
 * 선택된 문제 관리를 위한 유틸리티 함수들
 */
export function createProblemSelectionHelpers(
  selectedProblems: Problem[],
  setSelectedProblems: React.Dispatch<React.SetStateAction<Problem[]>>
) {
  // 문제 선택 토글
  const toggleProblem = (problem: Problem) => {
    setSelectedProblems((prev) => {
      const isSelected = prev.some((p) => p.id === problem.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== problem.id);
      }
      return [...prev, problem];
    });
  };

  // 단원 전체 선택/해제
  const toggleUnit = (unitProblems: Problem[]) => {
    const allSelected = unitProblems.every((p) =>
      selectedProblems.some((sp) => sp.id === p.id)
    );

    if (allSelected) {
      setSelectedProblems((prev) =>
        prev.filter((p) => !unitProblems.some((up) => up.id === p.id))
      );
    } else {
      setSelectedProblems((prev) => {
        const newProblems = unitProblems.filter(
          (p) => !prev.some((sp) => sp.id === p.id)
        );
        return [...prev, ...newProblems];
      });
    }
  };

  // 선택 초기화
  const clearSelection = () => {
    setSelectedProblems([]);
  };

  // 문제 선택 여부 확인
  const isProblemSelected = (problemId: string) => {
    return selectedProblems.some((p) => p.id === problemId);
  };

  // 단원 내 선택된 문제 수
  const getUnitSelectedCount = (unitProblems: Problem[]) => {
    return unitProblems.filter((p) => selectedProblems.some((sp) => sp.id === p.id)).length;
  };

  // 단원 전체 선택 여부
  const isUnitFullySelected = (unitProblems: Problem[]) => {
    return unitProblems.every((p) => selectedProblems.some((sp) => sp.id === p.id));
  };

  return {
    toggleProblem,
    toggleUnit,
    clearSelection,
    isProblemSelected,
    getUnitSelectedCount,
    isUnitFullySelected,
  };
}
