'use client'

import { useState, useCallback } from 'react'
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Pin,
  X,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Building2,
  GraduationCap,
  Globe,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

// 타입 정의
type NoticeType = '공지' | '업데이트' | '점검'
type NoticeTarget = '전체' | '학원' | '학생'
type NoticeStatus = '공개' | '비공개'

interface Notice {
  id: number
  title: string
  content: string
  type: NoticeType
  target: NoticeTarget
  status: NoticeStatus
  isPinned: boolean
  views: number
  createdAt: string
  updatedAt: string
  author: string
}

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '공지사항 관리',
  pageSubtitle: '학원과 학생에게 전달할 공지사항을 작성하고 관리합니다',
  addNotice: '새 공지 작성',
  searchPlaceholder: '제목으로 검색...',
  filterAll: '전체',
  totalNotices: '전체 공지',
  publishedNotices: '공개',
  draftNotices: '비공개',
  pinnedNotices: '고정됨',
  noNotices: '등록된 공지사항이 없습니다.',
  noSearchResults: '검색 결과가 없습니다.',
  deleteConfirm: '정말 이 공지사항을 삭제하시겠습니까?',
  deleteSuccess: '공지사항이 삭제되었습니다.',
  saveSuccess: '공지사항이 저장되었습니다.',
  refresh: '새로고침',
}

// 유형 옵션
const TYPE_OPTIONS: NoticeType[] = ['공지', '업데이트', '점검']

// 대상 옵션
const TARGET_OPTIONS: NoticeTarget[] = ['전체', '학원', '학생']

// 유형별 색상
const TYPE_COLORS: Record<NoticeType, string> = {
  '공지': 'bg-blue-100 text-blue-700',
  '업데이트': 'bg-green-100 text-green-700',
  '점검': 'bg-red-100 text-red-700',
}

// 대상별 아이콘
const TARGET_ICONS: Record<NoticeTarget, React.ReactNode> = {
  '전체': <Globe className="w-4 h-4" />,
  '학원': <Building2 className="w-4 h-4" />,
  '학생': <GraduationCap className="w-4 h-4" />,
}

// 목업 데이터
const mockNotices: Notice[] = [
  {
    id: 1,
    title: '[긴급] 1월 20일 서버 점검 안내',
    content: '안녕하세요, EduFlow입니다.\n\n서비스 안정성 향상을 위해 아래와 같이 서버 점검을 진행합니다.\n\n- 일시: 2025년 1월 20일 02:00 ~ 06:00 (4시간)\n- 영향: 모든 서비스 일시 중단\n\n점검 시간 동안에는 서비스 이용이 불가하오니 양해 부탁드립니다.',
    type: '점검',
    target: '전체',
    status: '공개',
    isPinned: true,
    views: 342,
    createdAt: '2025-01-19',
    updatedAt: '2025-01-19',
    author: '관리자',
  },
  {
    id: 2,
    title: '2025년 1월 신규 기능 업데이트',
    content: '안녕하세요, EduFlow입니다.\n\n1월 업데이트로 다음 기능들이 추가되었습니다.\n\n1. 모의고사 생성 모드 추가\n2. 단원별 태그 기능\n3. PDF 출력 개선\n\n많은 이용 부탁드립니다.',
    type: '업데이트',
    target: '학원',
    status: '공개',
    isPinned: false,
    views: 156,
    createdAt: '2025-01-15',
    updatedAt: '2025-01-15',
    author: '관리자',
  },
  {
    id: 3,
    title: '설 연휴 고객센터 운영 안내',
    content: '설 연휴 기간 고객센터 운영 시간을 안내드립니다.\n\n- 1월 28일(화) ~ 1월 30일(목): 휴무\n- 긴급 문의: support@eduflow.kr\n\n서비스는 정상 운영됩니다.',
    type: '공지',
    target: '전체',
    status: '공개',
    isPinned: false,
    views: 89,
    createdAt: '2025-01-12',
    updatedAt: '2025-01-12',
    author: '관리자',
  },
  {
    id: 4,
    title: '[작성중] 2월 요금제 개편 안내',
    content: '2월부터 적용되는 요금제 개편 내용입니다...',
    type: '공지',
    target: '학원',
    status: '비공개',
    isPinned: false,
    views: 0,
    createdAt: '2025-01-19',
    updatedAt: '2025-01-19',
    author: '관리자',
  },
  {
    id: 5,
    title: '학습 리포트 기능 사용 가이드',
    content: '학생 여러분께 학습 리포트 기능 사용법을 안내드립니다.\n\n1. 대시보드에서 리포트 메뉴 클릭\n2. 기간 선택\n3. PDF 다운로드\n\n궁금한 점은 선생님께 문의해주세요.',
    type: '공지',
    target: '학생',
    status: '공개',
    isPinned: false,
    views: 234,
    createdAt: '2025-01-10',
    updatedAt: '2025-01-10',
    author: '관리자',
  },
]

// 필터 카테고리 (유형 기준)
const filterCategories = ['전체', '공지', '업데이트', '점검']

// 통계 카드 컴포넌트
function StatCard({
  icon,
  label,
  value,
  bgColor,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bgColor: string
  iconColor: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(mockNotices)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('전체')
  const [filterTarget, setFilterTarget] = useState<NoticeTarget | '전체'>('전체')
  const [filterStatus, setFilterStatus] = useState<NoticeStatus | '전체'>('전체')
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '공지' as NoticeType,
    target: '전체' as NoticeTarget,
    isPinned: false,
  })

  // 필터링된 공지사항 목록
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === '전체' || notice.type === filterType
    const matchesTarget = filterTarget === '전체' || notice.target === filterTarget
    const matchesStatus = filterStatus === '전체' || notice.status === filterStatus
    return matchesSearch && matchesType && matchesTarget && matchesStatus
  })

  // 통계
  const stats = {
    total: notices.length,
    published: notices.filter(n => n.status === '공개').length,
    draft: notices.filter(n => n.status === '비공개').length,
    pinned: notices.filter(n => n.isPinned).length,
  }

  // 새 공지 작성 모달 열기
  const openCreateModal = useCallback(() => {
    setEditingNotice(null)
    setFormData({ title: '', content: '', type: '공지', target: '전체', isPinned: false })
    setShowModal(true)
  }, [])

  // 공지 수정 모달 열기
  const openEditModal = useCallback((notice: Notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      target: notice.target,
      isPinned: notice.isPinned,
    })
    setShowModal(true)
  }, [])

  // 공지 저장 (작성/수정)
  const handleSave = useCallback(async (publish: boolean) => {
    setIsSaving(true)

    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 500))

    const newStatus: NoticeStatus = publish ? '공개' : '비공개'
    const now = new Date().toISOString().split('T')[0]

    if (editingNotice) {
      // 수정
      setNotices(prev => prev.map(n =>
        n.id === editingNotice.id
          ? { ...n, ...formData, status: newStatus, updatedAt: now }
          : n
      ))
    } else {
      // 작성
      const newNotice: Notice = {
        id: Math.max(...notices.map(n => n.id)) + 1,
        ...formData,
        status: newStatus,
        views: 0,
        createdAt: now,
        updatedAt: now,
        author: '관리자',
      }
      setNotices(prev => [newNotice, ...prev])
    }

    setIsSaving(false)
    setShowModal(false)
  }, [editingNotice, formData, notices])

  // 공지 삭제 확인
  const handleDeleteConfirm = useCallback((notice: Notice) => {
    setDeleteTarget(notice)
  }, [])

  // 공지 삭제 실행
  const handleDeleteExecute = useCallback(async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 500))

    setNotices(prev => prev.filter(n => n.id !== deleteTarget.id))
    setDeleteTarget(null)
    setIsDeleting(false)
  }, [deleteTarget])

  // 공지 상태 변경 (공개/비공개 토글)
  const handleToggleStatus = useCallback(async (notice: Notice) => {
    const newStatus: NoticeStatus = notice.status === '공개' ? '비공개' : '공개'

    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 300))

    setNotices(prev => prev.map(n =>
      n.id === notice.id ? { ...n, status: newStatus } : n
    ))
  }, [])

  // 공지 고정 토글
  const handleTogglePin = useCallback(async (notice: Notice) => {
    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 300))

    setNotices(prev => prev.map(n =>
      n.id === notice.id ? { ...n, isPinned: !n.isPinned } : n
    ))
  }, [])

  // 새로고침
  const handleRefresh = useCallback(() => {
    // 실제로는 API 재호출
    setNotices(mockNotices)
  }, [])

  // 필터 초기화
  const hasFilters = searchTerm || filterType !== '전체' || filterTarget !== '전체' || filterStatus !== '전체'

  const handleResetFilters = useCallback(() => {
    setSearchTerm('')
    setFilterType('전체')
    setFilterTarget('전체')
    setFilterStatus('전체')
  }, [])

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {UI_TEXT.refresh}
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {UI_TEXT.addNotice}
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Bell className="w-6 h-6" />}
          label={UI_TEXT.totalNotices}
          value={stats.total}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Eye className="w-6 h-6" />}
          label={UI_TEXT.publishedNotices}
          value={stats.published}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<EyeOff className="w-6 h-6" />}
          label={UI_TEXT.draftNotices}
          value={stats.draft}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={<Pin className="w-6 h-6" />}
          label={UI_TEXT.pinnedNotices}
          value={stats.pinned}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 검색 */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={UI_TEXT.searchPlaceholder}
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 유형 필터 */}
          <div className="flex gap-2">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filterType === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 대상 필터 */}
          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value as NoticeTarget | '전체')}
            className="input w-auto"
          >
            <option value="전체">대상: 전체</option>
            {TARGET_OPTIONS.map(target => (
              <option key={target} value={target}>{target}</option>
            ))}
          </select>

          {/* 상태 필터 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as NoticeStatus | '전체')}
            className="input w-auto"
          >
            <option value="전체">상태: 전체</option>
            <option value="공개">공개</option>
            <option value="비공개">비공개</option>
          </select>

          {/* 필터 초기화 */}
          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-4">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`card hover:shadow-md transition-all ${
                notice.isPinned ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {notice.isPinned && (
                      <Pin className="w-4 h-4 text-primary-500" />
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[notice.type]}`}>
                      {notice.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                      {TARGET_ICONS[notice.target]}
                      {notice.target}
                    </span>
                    {notice.status === '비공개' && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        비공개
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
                  <p className="text-gray-600 line-clamp-2 whitespace-pre-line">{notice.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {notice.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      조회 {notice.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {notice.author}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePin(notice)}
                    className={`p-2 rounded-lg transition-colors ${
                      notice.isPinned
                        ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title={notice.isPinned ? '고정 해제' : '상단 고정'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(notice)}
                    className={`p-2 rounded-lg transition-colors ${
                      notice.status === '공개'
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title={notice.status === '공개' ? '비공개로 변경' : '공개로 변경'}
                  >
                    {notice.status === '공개' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(notice)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-primary-600"
                    title="수정"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(notice)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12 text-gray-500">
            {hasFilters ? UI_TEXT.noSearchResults : UI_TEXT.noNotices}
          </div>
        )}
      </div>

      {/* 작성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* 유형 & 대상 & 고정 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">유형</label>
                  <select
                    className="input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as NoticeType })}
                  >
                    {TYPE_OPTIONS.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">대상</label>
                  <select
                    className="input"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value as NoticeTarget })}
                  >
                    {TARGET_OPTIONS.map(target => (
                      <option key={target} value={target}>{target}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Pin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">상단 고정</span>
                  </label>
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="label">제목</label>
                <input
                  type="text"
                  className="input"
                  placeholder="공지사항 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="label">내용</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* 에디터 툴바 */}
                  <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                    <button className="p-2 hover:bg-gray-200 rounded" type="button">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded" type="button">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded" type="button">
                      <List className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded" type="button">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    className="w-full p-4 min-h-[200px] resize-none focus:outline-none"
                    placeholder="공지 내용을 입력하세요..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleSave(false)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  disabled={isSaving || !formData.title.trim()}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  임시 저장
                </button>
                <button
                  onClick={() => handleSave(true)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isSaving || !formData.title.trim()}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  게시하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">공지사항 삭제</h3>
            </div>
            <p className="text-gray-600 mb-6">
              <strong>{deleteTarget.title}</strong>
              <br />
              <span className="text-sm text-gray-500">이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteExecute}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
