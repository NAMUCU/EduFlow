'use client';

/**
 * 학부모 보고서 열람 페이지
 *
 * 자녀의 학습 보고서를 열람하고 관리하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 자녀 학습 보고서 목록 조회
 * 2. 주간/월간 리포트 상세 보기
 * 3. 취약점 분석 결과 시각화
 * 4. 실천 가이드 (Action Plan) 표시
 * 5. 보고서 PDF 다운로드
 *
 * Vercel Best Practices 적용:
 * - bundle-dynamic-imports: 차트 컴포넌트 lazy load
 * - client-swr-dedup: 보고서 목록 SWR로 관리
 * - server-parallel-fetching: 여러 자녀 보고서 병렬 조회
 */

import { useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  FileBarChart,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Target,
  AlertCircle,
  Lightbulb,
  User,
  Minus,
  RefreshCw,
} from 'lucide-react';

// 커스텀 훅 임포트
import { useReports, useReport, downloadReportPdf, generateReportPdf } from '@/hooks/useReports';
import { MOCK_CHILDREN } from '@/hooks/useChildren';

// 타입 임포트
import {
  ReportListItem,
  UnitGradeInfo,
  getReportStatusLabel,
  getReportStatusColor,
  formatScoreChange,
} from '@/types/report';

// 차트 컴포넌트 동적 임포트 (bundle-dynamic-imports 적용)
const LineChart = dynamic(() => import('@/components/charts/LineChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const BarChart = dynamic(() => import('@/components/charts/BarChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// PieChart는 필요 시 사용
// const PieChart = dynamic(() => import('@/components/charts/PieChart'), {
//   loading: () => <ChartSkeleton />,
//   ssr: false,
// });

// ReportViewer 동적 임포트
const ReportViewer = dynamic(() => import('@/components/ReportViewer'), {
  loading: () => <ReportViewerSkeleton />,
  ssr: false,
});

// 차트 스켈레톤 컴포넌트
function ChartSkeleton() {
  return (
    <div className="h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-sm">차트 로딩 중...</span>
    </div>
  );
}

// 리포트 뷰어 스켈레톤
function ReportViewerSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
      <div className="space-y-4">
        <div className="h-20 bg-gray-200 rounded" />
        <div className="h-20 bg-gray-200 rounded" />
        <div className="h-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// 보고서 카드 스켈레톤
function ReportCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

// UI 텍스트 상수
const UI_TEXT = {
  title: '학습 리포트',
  subtitle: '자녀의 학습 분석 보고서',
  selectChild: '자녀 선택',
  weekly: '주간 리포트',
  monthly: '월간 리포트',
  downloadPdf: 'PDF 다운로드',
  viewDetail: '상세 보기',
  noReports: '아직 생성된 리포트가 없습니다.',
  loading: '로딩 중...',
  error: '데이터를 불러오는데 실패했습니다.',
  refresh: '새로고침',
  totalStudyTime: '총 학습 시간',
  completedAssignments: '과제 완료',
  averageScore: '평균 점수',
  scoreChange: '점수 변화',
  weakUnits: '보완이 필요한 영역',
  strongUnits: '잘하는 영역',
  actionPlan: '실천 가이드',
  teacherComment: '선생님 코멘트',
  parentMessage: '학부모님께 드리는 말씀',
  shortTermGoals: '이번 주 목표',
  studyStrategies: '학습 전략',
};

// 탭 타입
type ReportType = 'weekly' | 'monthly';

export default function ParentReportsPage() {
  // 상태 관리
  const [selectedChildId, setSelectedChildId] = useState<string>(MOCK_CHILDREN[0]?.id || '');
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 커스텀 훅 사용 (client-swr-dedup 적용)
  // 실제 API 연동 시 useChildren 훅 사용
  // const { children, isLoading: isLoadingChildren } = useChildren();
  const children = MOCK_CHILDREN; // Mock 데이터 사용

  // 보고서 목록 조회 (SWR 사용)
  const {
    reports,
    total,
    isLoading: isLoadingReports,
    isError,
    error,
    refreshReports,
  } = useReports({
    studentId: selectedChildId,
    periodType: reportType,
    page: currentPage,
    pageSize: 10,
  });

  // 선택된 보고서 상세 조회
  const { report: selectedReport, isLoading: isLoadingDetail } = useReport(selectedReportId);

  // 현재 선택된 자녀 정보
  const selectedChild = children.find((c) => c.id === selectedChildId);

  // 자녀 선택 핸들러
  const handleChildSelect = useCallback((childId: string) => {
    setSelectedChildId(childId);
    setSelectedReportId(null);
    setCurrentPage(1);
  }, []);

  // 보고서 타입 변경 핸들러
  const handleReportTypeChange = useCallback((type: ReportType) => {
    setReportType(type);
    setSelectedReportId(null);
    setCurrentPage(1);
  }, []);

  // 보고서 상세 보기 핸들러
  const handleViewReport = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
  }, []);

  // 보고서 상세 닫기 핸들러
  const handleCloseReport = useCallback(() => {
    setSelectedReportId(null);
  }, []);

  // PDF 다운로드 핸들러
  const handleDownloadPdf = useCallback(async (reportId: string) => {
    setIsDownloading(true);
    try {
      await downloadReportPdf(reportId);
    } catch (err) {
      // Mock 구현: 실제 PDF가 없으면 텍스트 파일로 대체
      if (selectedReport) {
        const blob = await generateReportPdf(selectedReport);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${reportId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsDownloading(false);
    }
  }, [selectedReport]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 추이 아이콘 반환
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  // 추이 색상 반환
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.title}</h1>
            <p className="text-gray-500 mt-1">
              {selectedChild
                ? `${selectedChild.name} 학생의 ${UI_TEXT.subtitle}`
                : UI_TEXT.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 새로고침 버튼 */}
            <button
              onClick={refreshReports}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              disabled={isLoadingReports}
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingReports ? 'animate-spin' : ''}`} />
              {UI_TEXT.refresh}
            </button>

            {/* PDF 다운로드 버튼 */}
            {selectedReport && (
              <button
                onClick={() => handleDownloadPdf(selectedReport.id)}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {isDownloading ? '다운로드 중...' : UI_TEXT.downloadPdf}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* 자녀 선택 및 필터 */}
        <div className="flex items-center gap-4 mb-6">
          {/* 자녀 선택 */}
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <select
              value={selectedChildId}
              onChange={(e) => handleChildSelect(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} ({child.grade})
                </option>
              ))}
            </select>
          </div>

          {/* 탭 선택 */}
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => handleReportTypeChange('weekly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                reportType === 'weekly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {UI_TEXT.weekly}
            </button>
            <button
              onClick={() => handleReportTypeChange('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                reportType === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {UI_TEXT.monthly}
            </button>
          </div>
        </div>

        {/* 에러 표시 */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error || UI_TEXT.error}</span>
            </div>
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 보고서 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-indigo-600" />
                보고서 목록
              </h3>

              {isLoadingReports ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <ReportCardSkeleton key={i} />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileBarChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{UI_TEXT.noReports}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report: ReportListItem) => (
                    <button
                      key={report.id}
                      onClick={() => handleViewReport(report.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedReportId === report.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {report.period.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getReportStatusColor(
                            report.status
                          )}`}
                        >
                          {getReportStatusLabel(report.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          종합 점수: {report.overallScore}점
                        </span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(report.scoreTrend)}
                          <span className={`text-sm ${getTrendColor(report.scoreTrend)}`}>
                            {formatScoreChange(report.overallScore - report.previousScore)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 페이지네이션 */}
              {total > 10 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {Math.ceil(total / 10)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(total / 10)}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 보고서 상세 */}
          <div className="lg:col-span-2">
            {isLoadingDetail ? (
              <ReportViewerSkeleton />
            ) : selectedReport ? (
              <div className="space-y-6">
                {/* ReportViewer 컴포넌트 사용 */}
                <Suspense fallback={<ReportViewerSkeleton />}>
                  <ReportViewer
                    report={selectedReport}
                    onClose={handleCloseReport}
                    onDownloadPdf={handleDownloadPdf}
                  />
                </Suspense>

                {/* 취약점 분석 차트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    취약점 분석
                  </h3>
                  <Suspense fallback={<ChartSkeleton />}>
                    <BarChart
                      data={selectedReport.gradeAnalysis.unitAnalysis.map((unit: UnitGradeInfo) => ({
                        label: unit.unitName,
                        value: unit.correctRate,
                        color: unit.isWeak ? '#f97316' : '#10b981',
                      }))}
                      height={250}
                      title="단원별 정답률"
                    />
                  </Suspense>
                </div>

                {/* 성적 추이 차트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    성적 추이
                  </h3>
                  <Suspense fallback={<ChartSkeleton />}>
                    <LineChart
                      data={selectedReport.gradeAnalysis.dailyScoreTrend.map((d: { date: string; score: number }) => ({
                        label: d.date.slice(5), // MM-DD 형식
                        value: d.score,
                      }))}
                      height={250}
                      title="일별 성적 변화"
                    />
                  </Suspense>
                </div>

                {/* 실천 가이드 (Action Plan) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    {UI_TEXT.actionPlan}
                  </h3>

                  {/* 단기 목표 */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">{UI_TEXT.shortTermGoals}</h4>
                    <div className="space-y-3">
                      {selectedReport.aiAnalysis.studyRecommendation.shortTermGoals.map(
                        (goal: { goal: string; reason: string; difficulty: 'easy' | 'medium' | 'hard' }, index: number) => (
                          <div
                            key={index}
                            className="p-4 bg-purple-50 rounded-xl border border-purple-100"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{goal.goal}</p>
                                <p className="text-sm text-gray-600 mt-1">{goal.reason}</p>
                                <span
                                  className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                    goal.difficulty === 'easy'
                                      ? 'bg-green-100 text-green-700'
                                      : goal.difficulty === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {goal.difficulty === 'easy'
                                    ? '쉬움'
                                    : goal.difficulty === 'medium'
                                    ? '보통'
                                    : '어려움'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* 학습 전략 */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">{UI_TEXT.studyStrategies}</h4>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <ul className="space-y-2">
                        {selectedReport.aiAnalysis.studyRecommendation.studyStrategies.map(
                          (strategy: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700">
                              <CheckCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                              <span>{strategy}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 학부모 메시지 */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    {UI_TEXT.parentMessage}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedReport.aiAnalysis.parentMessage}
                  </p>
                </div>

                {/* 선생님 코멘트 */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    {UI_TEXT.teacherComment}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedReport.teacherComment ||
                      selectedReport.aiAnalysis.teacherCommentDraft}
                  </p>
                  <p className="text-sm text-indigo-600 font-medium mt-4">
                    - {selectedReport.academy.teacherName} 선생님
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <FileBarChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  왼쪽 목록에서 보고서를 선택해주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
