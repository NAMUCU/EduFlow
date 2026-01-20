'use client'

import { useState } from 'react'
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Pin,
  X,
  Bold,
  Italic,
  List,
  Link as LinkIcon
} from 'lucide-react'

// 목업 데이터
const mockNotices = [
  {
    id: 1,
    title: '[긴급] 1월 20일 서버 점검 안내',
    content: '안녕하세요, EduFlow입니다.\n\n서비스 안정성 향상을 위해 아래와 같이 서버 점검을 진행합니다.\n\n- 일시: 2025년 1월 20일 02:00 ~ 06:00 (4시간)\n- 영향: 모든 서비스 일시 중단\n\n점검 시간 동안에는 서비스 이용이 불가하오니 양해 부탁드립니다.',
    category: '점검',
    isPinned: true,
    isPublished: true,
    views: 342,
    createdAt: '2025-01-19',
    author: '관리자',
  },
  {
    id: 2,
    title: '2025년 1월 신규 기능 업데이트',
    content: '안녕하세요, EduFlow입니다.\n\n1월 업데이트로 다음 기능들이 추가되었습니다.\n\n1. 모의고사 생성 모드 추가\n2. 단원별 태그 기능\n3. PDF 출력 개선\n\n많은 이용 부탁드립니다.',
    category: '업데이트',
    isPinned: false,
    isPublished: true,
    views: 156,
    createdAt: '2025-01-15',
    author: '관리자',
  },
  {
    id: 3,
    title: '설 연휴 고객센터 운영 안내',
    content: '설 연휴 기간 고객센터 운영 시간을 안내드립니다.\n\n- 1월 28일(화) ~ 1월 30일(목): 휴무\n- 긴급 문의: support@eduflow.kr\n\n서비스는 정상 운영됩니다.',
    category: '안내',
    isPinned: false,
    isPublished: true,
    views: 89,
    createdAt: '2025-01-12',
    author: '관리자',
  },
  {
    id: 4,
    title: '[작성중] 2월 요금제 개편 안내',
    content: '2월부터 적용되는 요금제 개편 내용입니다...',
    category: '안내',
    isPinned: false,
    isPublished: false,
    views: 0,
    createdAt: '2025-01-19',
    author: '관리자',
  },
]

const categories = ['전체', '공지', '업데이트', '점검', '안내', '이벤트']

export default function NoticesPage() {
  const [notices, setNotices] = useState(mockNotices)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('전체')
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<typeof mockNotices[0] | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '공지',
    isPinned: false,
  })

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === '전체' || notice.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const openCreateModal = () => {
    setEditingNotice(null)
    setFormData({ title: '', content: '', category: '공지', isPinned: false })
    setShowModal(true)
  }

  const openEditModal = (notice: typeof mockNotices[0]) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      isPinned: notice.isPinned,
    })
    setShowModal(true)
  }

  const handleSave = (publish: boolean) => {
    // 실제로는 API 호출
    console.log('저장:', { ...formData, isPublished: publish })
    setShowModal(false)
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-gray-500">학원에 전달할 공지사항을 작성하고 관리합니다</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          새 공지 작성
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 공지</p>
            <p className="text-2xl font-bold text-gray-900">{notices.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">게시됨</p>
            <p className="text-2xl font-bold text-gray-900">
              {notices.filter(n => n.isPublished).length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Edit className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">작성중</p>
            <p className="text-2xl font-bold text-gray-900">
              {notices.filter(n => !n.isPublished).length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Pin className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">고정됨</p>
            <p className="text-2xl font-bold text-gray-900">
              {notices.filter(n => n.isPinned).length}
            </p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="공지사항 제목으로 검색..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filterCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className={`card hover:shadow-md transition-all ${
              notice.isPinned ? 'border-l-4 border-primary-500' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {notice.isPinned && (
                    <Pin className="w-4 h-4 text-primary-500" />
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    notice.category === '점검' ? 'bg-red-100 text-red-700' :
                    notice.category === '업데이트' ? 'bg-blue-100 text-blue-700' :
                    notice.category === '이벤트' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {notice.category}
                  </span>
                  {!notice.isPublished && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                      작성중
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
                  onClick={() => openEditModal(notice)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="수정"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
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
              {/* 카테고리 & 고정 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label">카테고리</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>공지</option>
                    <option>업데이트</option>
                    <option>점검</option>
                    <option>안내</option>
                    <option>이벤트</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer">
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
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <List className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded">
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
                  className="btn-secondary flex-1"
                >
                  임시 저장
                </button>
                <button
                  onClick={() => handleSave(true)}
                  className="btn-primary flex-1"
                >
                  게시하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
