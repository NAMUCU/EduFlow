'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import {
  Plus,
  Search,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import {
  ClassListItem,
  formatScheduleToString,
  CLASS_STATUS_LABELS,
} from '@/types/class'
import { useClasses } from '@/hooks/useClasses'

// Vercel Best Practice: bundle-dynamic-imports
// 모달 컴포넌트는 초기 렌더링에 필요하지 않으므로 동적 임포트
const CreateClassModal = dynamic(
  () => import('./CreateClassModal').then(m => m.CreateClassModal),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-pulse bg-white rounded-2xl w-96 h-64" /></div>
  }
)

// Vercel Best Practice: rerender-memo
// 반 카드 컴포넌트를 memo로 분리하여 불필요한 리렌더링 방지
const ClassCard = memo(function ClassCard({ cls }: { cls: ClassListItem }) {
  // 상태별 색상
  const statusColor = useMemo(() => {
    switch (cls.status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-700'
      case 'archived':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }, [cls.status])

  // 수용률 색상
  const capacityColor = useMemo(() => {
    if (cls.max_students === null) return 'text-gray-500'
    const percentage = (cls.student_count / cls.max_students) * 100
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }, [cls.student_count, cls.max_students])

  return (
    <Link
      href={`/dashboard/classes/${cls.id}`}
      className="class-card-item card p-6 hover:shadow-lg transition-all group"
    >
      {/* 상단: 반 이름과 상태 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cls.color || '#3B82F6' }}
          />
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              {cls.name}
            </h3>
            <p className="text-sm text-gray-500">
              {cls.grade} | {cls.subject}
            </p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
        >
          {CLASS_STATUS_LABELS[cls.status]}
        </span>
      </div>

      {/* 선생님 정보 */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          담당: <span className="font-medium">{cls.teacher_name}</span> 선생님
        </p>
      </div>

      {/* 수업 일정 */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        <Clock className="w-4 h-4 text-gray-400" />
        <span>{formatScheduleToString(cls.schedule)}</span>
      </div>

      {/* 학생 수 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className={`font-medium ${capacityColor}`}>
            {cls.student_count}명
            {cls.max_students && ` / ${cls.max_students}명`}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
      </div>
    </Link>
  )
})

// Vercel Best Practice: rerender-memo
// 통계 카드 컴포넌트를 memo로 분리
const StatsCards = memo(function StatsCards({
  totalClasses,
  activeClasses,
  totalStudents
}: {
  totalClasses: number
  activeClasses: number
  totalStudents: number
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 반</p>
            <p className="text-2xl font-bold text-gray-900">{totalClasses}개</p>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">운영중인 반</p>
            <p className="text-2xl font-bold text-gray-900">{activeClasses}개</p>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 학생</p>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}명</p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')

  // Vercel Best Practice: client-swr-dedup
  // SWR 훅 사용으로 자동 요청 중복 제거 및 캐싱
  const {
    classes,
    isLoading,
    stats,
    subjects,
    getClassesByStatus,
    getClassesBySubject,
    refresh
  } = useClasses()

  // Vercel Best Practice: js-index-maps
  // 필터링에 Map 인덱스 활용하여 성능 최적화
  const filteredClasses = useMemo(() => {
    let result = classes

    // 상태 필터 (Map 인덱스 활용)
    if (statusFilter !== 'all') {
      result = getClassesByStatus(statusFilter)
    }

    // 과목 필터 - 상태 필터와 함께 사용시 교집합 계산
    if (subjectFilter !== 'all') {
      const subjectClasses = new Set(getClassesBySubject(subjectFilter).map(c => c.id))
      result = result.filter(cls => subjectClasses.has(cls.id))
    }

    // 검색어 필터 (검색어가 있을 때만 실행)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter((cls) =>
        cls.name.toLowerCase().includes(lowerSearchTerm) ||
        cls.teacher_name.toLowerCase().includes(lowerSearchTerm) ||
        cls.subject.toLowerCase().includes(lowerSearchTerm)
      )
    }

    return result
  }, [classes, statusFilter, subjectFilter, searchTerm, getClassesByStatus, getClassesBySubject])

  // 모달 성공 핸들러
  const handleModalSuccess = () => {
    setShowAddModal(false)
    refresh()
  }

  return (
    <div>
      <Header
        title="반 관리"
        subtitle={`총 ${stats.totalClasses}개의 반, ${stats.totalStudents}명의 학생을 관리하고 있습니다`}
      />

      <div className="p-8">
        {/* 통계 카드 - memo로 분리하여 props 변경 시에만 리렌더링 */}
        <StatsCards
          totalClasses={stats.totalClasses}
          activeClasses={stats.activeClasses}
          totalStudents={stats.totalStudents}
        />

        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="반 이름, 선생님, 과목 검색..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 상태 필터 */}
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">전체 상태</option>
              <option value="active">운영중</option>
              <option value="inactive">휴강</option>
              <option value="archived">종료</option>
            </select>

            {/* 과목 필터 */}
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="all">전체 과목</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* 반 추가 버튼 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            반 생성
          </button>
        </div>

        {/* 반 목록 카드 그리드 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <BookOpen className="w-12 h-12 mb-4 text-gray-300" />
            <p>등록된 반이 없습니다.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              첫 번째 반 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Vercel Best Practice: rendering-content-visibility
             * .class-card-item 클래스로 content-visibility 적용
             */}
            {filteredClasses.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        )}

        {/* Vercel Best Practice: bundle-dynamic-imports
         * 모달은 동적 임포트로 초기 번들에서 제외
         */}
        {showAddModal && (
          <CreateClassModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </div>
  )
}
