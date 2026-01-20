'use client';

// 문제지 출력 페이지
// 저장된 문제를 선택하여 PDF로 출력할 수 있는 페이지
// 적용된 Best Practices:
// - bundle-dynamic-imports: PdfPreview, PrintOptions lazy loading
// - rerender-memo: ProblemCard 메모이제이션
// - bundle-conditional: 모달 조건부 로딩
// - client-swr-dedup: usePrint 훅으로 데이터 캐싱

import { useState, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import {
  Printer,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  FileText,
} from 'lucide-react';
import { Problem, PrintOptions, DEFAULT_PRINT_OPTIONS, PDF_UI_TEXT } from '@/types/pdf';
import { useProblems, filterProblems, createProblemSelectionHelpers } from '@/hooks/usePrint';

// [bundle-dynamic-imports] 무거운 컴포넌트 lazy loading
// PrintOptions: 많은 UI 요소를 포함한 설정 패널
const PrintOptionsComponent = dynamic(
  () => import('@/components/PrintOptions'),
  {
    loading: () => (
      <div className="card animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

// [bundle-conditional] PDF 미리보기 모달 - 열릴 때만 로드
const PdfPreview = dynamic(
  () => import('@/components/PdfPreview'),
  { ssr: false }
);

// [rerender-memo] ProblemCard - 불필요한 리렌더 방지
// props가 변경되지 않으면 리렌더링을 건너뜀
interface ProblemCardProps {
  problem: Problem;
  isSelected: boolean;
  onToggle: () => void;
}

const ProblemCard = memo(function ProblemCard({
  problem,
  isSelected,
  onToggle,
}: ProblemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '상':
        return 'bg-red-100 text-red-700';
      case '중':
        return 'bg-yellow-100 text-yellow-700';
      case '하':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div
      className={`border rounded-xl p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isSelected
              ? 'border-primary-500 bg-primary-500'
              : 'border-gray-300'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* 문제 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(
                problem.difficulty
              )}`}
            >
              {problem.difficulty}
            </span>
            <span className="text-xs text-gray-500">{problem.type}</span>
          </div>
          <p className="text-gray-800 text-sm line-clamp-2 whitespace-pre-wrap">
            {problem.question}
          </p>

          {/* 확장 버튼 */}
          <button
            onClick={handleExpandClick}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                접기 <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                자세히 보기 <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>

          {/* 확장된 내용 */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">정답</p>
                <p className="text-sm text-blue-600 whitespace-pre-wrap">
                  {problem.answer}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">풀이</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {problem.solution}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// [rerender-memo] 단원 헤더 컴포넌트 메모이제이션
interface UnitHeaderProps {
  unitName: string;
  problemCount: number;
  selectedCount: number;
  allSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
}

const UnitHeader = memo(function UnitHeader({
  unitName,
  problemCount,
  selectedCount,
  allSelected,
  isExpanded,
  onToggleExpand,
  onToggleSelect,
}: UnitHeaderProps) {
  const handleSelectClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect();
  }, [onToggleSelect]);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onToggleExpand}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handleSelectClick}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            allSelected
              ? 'border-primary-500 bg-primary-500'
              : selectedCount > 0
              ? 'border-primary-500 bg-primary-100'
              : 'border-gray-300'
          }`}
        >
          {allSelected && <Check className="w-3 h-3 text-white" />}
          {!allSelected && selectedCount > 0 && (
            <div className="w-2 h-2 bg-primary-500 rounded-sm" />
          )}
        </button>
        <div>
          <h3 className="font-medium text-gray-800">{unitName}</h3>
          <p className="text-xs text-gray-500">
            {problemCount}개 문제
            {selectedCount > 0 && ` (${selectedCount}개 선택)`}
          </p>
        </div>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );
});

export default function PrintPage() {
  // [client-swr-dedup] SWR로 문제 데이터 캐싱 및 중복 요청 방지
  const { problemData, isLoading } = useProblems();

  // 상태 관리
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);
  const [printOptions, setPrintOptions] = useState<PrintOptions>(
    DEFAULT_PRINT_OPTIONS
  );
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // 선택 헬퍼 함수들
  const selectionHelpers = createProblemSelectionHelpers(
    selectedProblems,
    setSelectedProblems
  );

  // 카테고리 초기 설정
  useEffect(() => {
    const categories = Object.keys(problemData);
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
      // 첫 번째 단원 확장
      const units = Object.keys(problemData[categories[0]] || {});
      if (units.length > 0) {
        setExpandedUnits(new Set([units[0]]));
      }
    }
  }, [problemData, selectedCategory]);

  // 단원 확장 토글
  const toggleUnitExpand = useCallback((unitName: string) => {
    setExpandedUnits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(unitName)) {
        newSet.delete(unitName);
      } else {
        newSet.add(unitName);
      }
      return newSet;
    });
  }, []);

  // 검색 쿼리 변경 핸들러
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  }, []);

  // 미리보기 열기/닫기
  const openPreview = useCallback(() => setShowPreview(true), []);
  const closePreview = useCallback(() => setShowPreview(false), []);

  // 카테고리 목록
  const categories = Object.keys(problemData);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Printer className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">문제지 출력</h1>
                <p className="text-sm text-gray-500">
                  문제를 선택하고 PDF로 출력하세요
                </p>
              </div>
            </div>

            {/* 선택된 문제 수 & 액션 버튼 */}
            <div className="flex items-center gap-3">
              {selectedProblems.length > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-primary-600">
                      {selectedProblems.length}개
                    </span>
                    {' '}문제 선택됨
                  </span>
                  <button
                    onClick={selectionHelpers.clearSelection}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    선택 초기화
                  </button>
                  <button
                    onClick={openPreview}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {PDF_UI_TEXT.PREVIEW}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* 왼쪽: 문제 선택 영역 */}
          <div className="flex-1 min-w-0">
            {/* 검색 & 필터 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex gap-3">
                {/* 검색 */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="문제 검색..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="input pl-10"
                  />
                </div>

                {/* 학년/단원 필터 */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="input pr-10 appearance-none"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 문제 목록 */}
            {isLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">문제를 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCategory &&
                  Object.entries(problemData[selectedCategory] || {}).map(
                    ([unitName, problems]) => {
                      const filteredProblems = filterProblems(problems, searchQuery);
                      if (filteredProblems.length === 0) return null;

                      const isExpanded = expandedUnits.has(unitName);
                      const selectedCount = selectionHelpers.getUnitSelectedCount(filteredProblems);
                      const allSelected = selectionHelpers.isUnitFullySelected(filteredProblems);

                      return (
                        <div
                          key={unitName}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          {/* 단원 헤더 - 메모이제이션 적용 */}
                          <UnitHeader
                            unitName={unitName}
                            problemCount={filteredProblems.length}
                            selectedCount={selectedCount}
                            allSelected={allSelected}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleUnitExpand(unitName)}
                            onToggleSelect={() => selectionHelpers.toggleUnit(filteredProblems)}
                          />

                          {/* 문제 목록 */}
                          {isExpanded && (
                            <div className="p-4 space-y-3">
                              {filteredProblems.map((problem) => (
                                <ProblemCard
                                  key={problem.id}
                                  problem={problem}
                                  isSelected={selectionHelpers.isProblemSelected(problem.id)}
                                  onToggle={() => selectionHelpers.toggleProblem(problem)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}

                {/* 검색 결과 없음 */}
                {searchQuery &&
                  Object.values(problemData[selectedCategory] || {}).every(
                    (problems) => filterProblems(problems, searchQuery).length === 0
                  ) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* 오른쪽: 출력 옵션 영역 - [bundle-dynamic-imports] lazy loading 적용 */}
          <div className="w-96 flex-shrink-0">
            <div className="sticky top-6">
              <PrintOptionsComponent
                options={printOptions}
                onChange={setPrintOptions}
              />

              {/* 출력 버튼 */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={openPreview}
                  disabled={selectedProblems.length === 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
                >
                  <Eye className="w-5 h-5" />
                  {PDF_UI_TEXT.PREVIEW}
                </button>
              </div>

              {selectedProblems.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-3">
                  출력할 문제를 선택해주세요
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* [bundle-conditional] PDF 미리보기 모달 - 조건부 렌더링으로 필요할 때만 로드 */}
      {showPreview && (
        <PdfPreview
          problems={selectedProblems}
          options={printOptions}
          isOpen={showPreview}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
