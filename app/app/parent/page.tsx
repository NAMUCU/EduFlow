import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import ParentDashboardContent from './parent-dashboard-content'

/**
 * 학부모 대시보드 페이지
 *
 * Vercel Best Practices 적용:
 * - async-suspense-boundaries: Suspense로 스트리밍 렌더링
 * - Server Component로 초기 렌더링 최적화
 *
 * 정적 레이아웃은 즉시 표시하고, 데이터가 필요한 부분만 스트리밍합니다.
 */

// UI 텍스트 상수
const UI_TEXT = {
  greeting: '안녕하세요, 김영희님',
  loading: '데이터를 불러오는 중...',
}

// 로딩 스켈레톤 컴포넌트
function DashboardSkeleton() {
  return (
    <div className="p-8 animate-pulse">
      {/* 자녀 정보 카드 스켈레톤 */}
      <div className="bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl p-6 mb-8 h-28" />

      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-32" />
        ))}
      </div>

      {/* 차트 영역 스켈레톤 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-200 rounded-xl h-72" />
        <div className="bg-gray-200 rounded-xl h-72" />
      </div>
    </div>
  )
}

export default function ParentDashboardPage() {
  return (
    <div className="min-h-screen">
      {/* 헤더 - 정적 콘텐츠로 즉시 렌더링 */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.greeting}</h1>
      </header>

      {/* 대시보드 콘텐츠 - Suspense로 스트리밍 */}
      <Suspense
        fallback={
          <div>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
              <span className="text-gray-500">{UI_TEXT.loading}</span>
            </div>
            <DashboardSkeleton />
          </div>
        }
      >
        <ParentDashboardContent />
      </Suspense>
    </div>
  )
}
