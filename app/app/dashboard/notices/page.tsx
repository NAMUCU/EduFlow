'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Eye,
  X,
  Megaphone,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react'
import {
  AcademyNotice,
  NOTICE_CATEGORY_LABELS,
  NOTICE_TARGET_LABELS,
  NOTICE_CATEGORY_COLORS,
} from '@/types/academy-notice'
import {
  useNotices,
  useNotice,
  deleteNotice,
  toggleNoticePin,
} from '@/hooks/useNotices'

// 공지 작성/수정 모달 - lazy load (에디터 컴포넌트가 포함되어 있어 초기 로드에서 제외)
const NoticeFormModal = dynamic(
  () => import('./NoticeFormModal').then((m) => ({ default: m.NoticeFormModal })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-pulse text-gray-500">로딩 중...</div>
        </div>
      </div>
    ),
  }
)

// 날짜 포맷팅 함수 (컴포넌트 외부로 호이스트)
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '오늘'
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
}

// 날짜 전체 포맷
const formatFullDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 메모이제이션된 공지사항 카드 컴포넌트 (rerender-memo)
const NoticeCard = memo(function NoticeCard({
  notice,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  notice: AcademyNotice
  onView: (notice: AcademyNotice) => void
  onEdit: (notice: AcademyNotice) => void
  onDelete: (noticeId: string) => void
  onTogglePin: (notice: AcademyNotice) => void
}) {
  return (
    <div
      className={`notice-card-item card p-6 hover:shadow-lg transition-all ${
        notice.isPinned ? 'border-l-4 border-l-yellow-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        {/* 좌측: 공지 내용 */}
        <div className="flex-1 min-w-0">
          {/* 상단: 카테고리, 고정 배지 */}
          <div className="flex items-center gap-2 mb-2">
            {notice.isPinned && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                <Pin className="w-3 h-3" />
                고정
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                NOTICE_CATEGORY_COLORS[notice.category]
              }`}
            >
              {NOTICE_CATEGORY_LABELS[notice.category]}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {NOTICE_TARGET_LABELS[notice.target]}
            </span>
          </div>

          {/* 제목 */}
          <h3
            className="font-bold text-gray-900 text-lg mb-2 cursor-pointer hover:text-primary-600 transition-colors"
            onClick={() => onView(notice)}
          >
            {notice.title}
          </h3>

          {/* 내용 미리보기 */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{notice.content}</p>

          {/* 하단: 작성자, 날짜, 조회수 */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {notice.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(notice.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              조회 {notice.viewCount}
            </span>
          </div>
        </div>

        {/* 우측: 액션 버튼 */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onTogglePin(notice)}
            className={`p-2 rounded-lg transition-colors ${
              notice.isPinned
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'hover:bg-gray-100 text-gray-400'
            }`}
            title={notice.isPinned ? '고정 해제' : '상단 고정'}
          >
            {notice.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(notice)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
            title="수정"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(notice.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
})

// 메모이제이션된 통계 카드 컴포넌트
const StatCard = memo(function StatCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBgColor: string
  iconColor: string
  label: string
  value: string
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
})

// 공지사항 상세 모달 컴포넌트
const NoticeDetailModal = memo(function NoticeDetailModal({
  notice,
  onClose,
}: {
  notice: AcademyNotice
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {notice.isPinned && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                <Pin className="w-3 h-3" />
                고정
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                NOTICE_CATEGORY_COLORS[notice.category]
              }`}
            >
              {NOTICE_CATEGORY_LABELS[notice.category]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{notice.title}</h2>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {notice.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatFullDate(notice.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              조회 {notice.viewCount}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {NOTICE_TARGET_LABELS[notice.target]} 대상
            </span>
          </div>

          {/* 내용 */}
          <div className="prose prose-gray max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {notice.content}
            </pre>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="w-full btn-secondary">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
})

export default function NoticesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [targetFilter, setTargetFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)

  // SWR을 사용한 공지사항 목록 조회 (client-swr-dedup)
  const { notices, pinnedCount, total, isLoading, revalidate } = useNotices(
    categoryFilter,
    targetFilter
  )

  // 선택된 공지사항 조회 (상세 보기용)
  const { notice: selectedNotice } = useNotice(
    showDetailModal || showEditModal ? selectedNoticeId : null
  )

  // 검색 필터링 (useMemo로 최적화)
  const filteredNotices = useMemo(() => {
    if (!searchTerm) return notices
    const lowerSearchTerm = searchTerm.toLowerCase()
    return notices.filter(
      (notice) =>
        notice.title.toLowerCase().includes(lowerSearchTerm) ||
        notice.content.toLowerCase().includes(lowerSearchTerm)
    )
  }, [notices, searchTerm])

  // 통계 계산 (useMemo로 최적화)
  const stats = useMemo(() => {
    const urgentCount = notices.filter((n) => n.category === 'urgent').length
    const totalViews = notices.reduce((sum, n) => sum + n.viewCount, 0)
    return { urgentCount, totalViews }
  }, [notices])

  // 공지사항 상세 보기
  const handleViewNotice = useCallback((notice: AcademyNotice) => {
    setSelectedNoticeId(notice.id)
    setShowDetailModal(true)
  }, [])

  // 공지사항 수정
  const handleEditNotice = useCallback((notice: AcademyNotice) => {
    setSelectedNoticeId(notice.id)
    setShowEditModal(true)
  }, [])

  // 공지사항 삭제
  const handleDeleteNotice = useCallback(
    async (noticeId: string) => {
      if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return

      const success = await deleteNotice(noticeId)
      if (success) {
        revalidate()
      } else {
        alert('삭제에 실패했습니다.')
      }
    },
    [revalidate]
  )

  // 고정 토글
  const handleTogglePin = useCallback(
    async (notice: AcademyNotice) => {
      const success = await toggleNoticePin(notice)
      if (success) {
        revalidate()
      }
    },
    [revalidate]
  )

  // 모달 닫기 핸들러
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false)
  }, [])

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false)
    setSelectedNoticeId(null)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false)
    setSelectedNoticeId(null)
  }, [])

  // 폼 성공 핸들러
  const handleFormSuccess = useCallback(() => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedNoticeId(null)
    revalidate()
  }, [revalidate])

  return (
    <div>
      <Header
        title="공지사항"
        subtitle={`총 ${total}개의 공지사항 (고정 ${pinnedCount}개)`}
      />

      <div className="p-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Megaphone}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            label="전체 공지"
            value={`${total}개`}
          />
          <StatCard
            icon={Pin}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            label="고정 공지"
            value={`${pinnedCount}개`}
          />
          <StatCard
            icon={AlertCircle}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            label="긴급 공지"
            value={`${stats.urgentCount}개`}
          />
          <StatCard
            icon={Eye}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            label="총 조회수"
            value={`${stats.totalViews.toLocaleString()}회`}
          />
        </div>

        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="공지사항 검색..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 카테고리 필터 */}
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">전체 카테고리</option>
              {Object.entries(NOTICE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* 대상 필터 */}
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
            >
              <option value="all">전체 대상</option>
              {Object.entries(NOTICE_TARGET_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 공지 작성 버튼 */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            공지 작성
          </button>
        </div>

        {/* 공지사항 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Megaphone className="w-12 h-12 mb-4 text-gray-300" />
            <p>등록된 공지사항이 없습니다.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              첫 번째 공지 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onView={handleViewNotice}
                onEdit={handleEditNotice}
                onDelete={handleDeleteNotice}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}

        {/* 공지 작성 모달 (dynamic import) */}
        {showCreateModal && (
          <NoticeFormModal onClose={handleCloseCreateModal} onSuccess={handleFormSuccess} />
        )}

        {/* 공지 수정 모달 (dynamic import) */}
        {showEditModal && selectedNotice && (
          <NoticeFormModal
            notice={selectedNotice}
            onClose={handleCloseEditModal}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* 공지 상세 모달 */}
        {showDetailModal && selectedNotice && (
          <NoticeDetailModal notice={selectedNotice} onClose={handleCloseDetailModal} />
        )}
      </div>
    </div>
  )
}
