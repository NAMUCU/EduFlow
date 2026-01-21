'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Search,
  Eye,
  Users,
  GraduationCap,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  CreditCard,
} from 'lucide-react'

// Mock 데이터 타입
interface Academy {
  id: number
  name: string
  owner: string
  phone: string
  joinDate: string
  subscriptionStatus: 'active' | 'expired' | 'unpaid'
  students: number
  teachers: number
}

// Mock 데이터
const mockAcademies: Academy[] = [
  {
    id: 1,
    name: '스마트 수학학원',
    owner: '김영희',
    phone: '010-1234-5678',
    joinDate: '2024-08-15',
    subscriptionStatus: 'active',
    students: 45,
    teachers: 5,
  },
  {
    id: 2,
    name: '영어마을학원',
    owner: '이철수',
    phone: '010-2345-6789',
    joinDate: '2024-10-20',
    subscriptionStatus: 'active',
    students: 32,
    teachers: 3,
  },
  {
    id: 3,
    name: '과학탐구교실',
    owner: '박지민',
    phone: '010-3456-7890',
    joinDate: '2025-01-16',
    subscriptionStatus: 'unpaid',
    students: 0,
    teachers: 0,
  },
  {
    id: 4,
    name: '국어논술학원',
    owner: '최수진',
    phone: '010-4567-8901',
    joinDate: '2024-03-10',
    subscriptionStatus: 'active',
    students: 128,
    teachers: 12,
  },
  {
    id: 5,
    name: '종합학습센터',
    owner: '정민호',
    phone: '010-5678-9012',
    joinDate: '2024-06-05',
    subscriptionStatus: 'expired',
    students: 67,
    teachers: 4,
  },
  {
    id: 6,
    name: '명문학원',
    owner: '강태호',
    phone: '010-6789-0123',
    joinDate: '2023-11-20',
    subscriptionStatus: 'active',
    students: 210,
    teachers: 15,
  },
  {
    id: 7,
    name: '수리수리 수학교실',
    owner: '한미영',
    phone: '010-7890-1234',
    joinDate: '2024-02-14',
    subscriptionStatus: 'active',
    students: 56,
    teachers: 4,
  },
  {
    id: 8,
    name: '글로벌영어학원',
    owner: '서정훈',
    phone: '010-8901-2345',
    joinDate: '2024-05-22',
    subscriptionStatus: 'expired',
    students: 42,
    teachers: 3,
  },
  {
    id: 9,
    name: '창의력교실',
    owner: '오승현',
    phone: '010-9012-3456',
    joinDate: '2024-09-30',
    subscriptionStatus: 'unpaid',
    students: 15,
    teachers: 2,
  },
  {
    id: 10,
    name: '에듀플러스학원',
    owner: '임재현',
    phone: '010-0123-4567',
    joinDate: '2024-01-08',
    subscriptionStatus: 'active',
    students: 89,
    teachers: 7,
  },
  {
    id: 11,
    name: '한빛학원',
    owner: '윤소희',
    phone: '010-1111-2222',
    joinDate: '2024-04-18',
    subscriptionStatus: 'active',
    students: 73,
    teachers: 6,
  },
  {
    id: 12,
    name: '다솜학원',
    owner: '조민준',
    phone: '010-3333-4444',
    joinDate: '2024-07-25',
    subscriptionStatus: 'active',
    students: 38,
    teachers: 3,
  },
]

// 구독 상태 라벨 및 색상
const subscriptionStatusLabels: Record<string, string> = {
  active: '활성',
  expired: '만료',
  unpaid: '미결제',
}

const subscriptionStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  unpaid: 'bg-yellow-100 text-yellow-700',
}

// 정렬 타입
type SortField = 'joinDate' | 'students'
type SortOrder = 'asc' | 'desc'

// 페이지당 항목 수
const ITEMS_PER_PAGE = 5

export default function AcademiesPage() {
  const router = useRouter()

  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState('')

  // 구독상태 필터 상태
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'expired' | 'unpaid'>('all')

  // 정렬 상태
  const [sortField, setSortField] = useState<SortField>('joinDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)

  // 필터링 및 정렬된 데이터
  const filteredAndSortedAcademies = useMemo(() => {
    let result = [...mockAcademies]

    // 검색 필터 (학원명, 대표자명)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (academy) =>
          academy.name.toLowerCase().includes(term) ||
          academy.owner.toLowerCase().includes(term)
      )
    }

    // 구독상태 필터
    if (subscriptionFilter !== 'all') {
      result = result.filter((academy) => academy.subscriptionStatus === subscriptionFilter)
    }

    // 정렬
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === 'joinDate') {
        comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
      } else if (sortField === 'students') {
        comparison = a.students - b.students
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [searchTerm, subscriptionFilter, sortField, sortOrder])

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredAndSortedAcademies.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedAcademies = filteredAndSortedAcademies.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary-600" />
    )
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // 필터 변경 시 페이지 리셋
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSubscriptionFilterChange = (value: 'all' | 'active' | 'expired' | 'unpaid') => {
    setSubscriptionFilter(value)
    setCurrentPage(1)
  }

  // 학원 상세 페이지로 이동
  const handleViewDetail = (academyId: number) => {
    router.push(`/admin/academies/${academyId}`)
  }

  // 통계 계산
  const stats = useMemo(() => ({
    total: mockAcademies.length,
    active: mockAcademies.filter((a) => a.subscriptionStatus === 'active').length,
    expired: mockAcademies.filter((a) => a.subscriptionStatus === 'expired').length,
    unpaid: mockAcademies.filter((a) => a.subscriptionStatus === 'unpaid').length,
    totalStudents: mockAcademies.reduce((sum, a) => sum + a.students, 0),
    totalTeachers: mockAcademies.reduce((sum, a) => sum + a.teachers, 0),
  }), [])

  // 페이지 버튼 생성
  const renderPageButtons = () => {
    const buttons = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            currentPage === i
              ? 'bg-primary-500 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {i}
        </button>
      )
    }

    return buttons
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">학원 관리</h1>
        <p className="text-gray-500">등록된 학원 목록을 관리합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 학원</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">활성 구독</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 학생수</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 강사수</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
          </div>
        </div>
      </div>

      {/* 검색/필터 */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          {/* 검색어 입력 */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="학원명, 대표자명으로 검색..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* 구독상태 필터 */}
          <select
            className="input w-40"
            value={subscriptionFilter}
            onChange={(e) => handleSubscriptionFilterChange(e.target.value as 'all' | 'active' | 'expired' | 'unpaid')}
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="expired">만료</option>
            <option value="unpaid">미결제</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium">학원명</th>
              <th className="px-4 py-3 font-medium">대표자</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('joinDate')}
              >
                <div className="flex items-center gap-1">
                  가입일
                  {renderSortIcon('joinDate')}
                </div>
              </th>
              <th className="px-4 py-3 font-medium">구독상태</th>
              <th
                className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('students')}
              >
                <div className="flex items-center gap-1">
                  학생수
                  {renderSortIcon('students')}
                </div>
              </th>
              <th className="px-4 py-3 font-medium">강사수</th>
              <th className="px-4 py-3 font-medium text-right">상세</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAcademies.length > 0 ? (
              paginatedAcademies.map((academy) => (
                <tr key={academy.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{academy.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{academy.owner}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {academy.phone}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {academy.joinDate}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${subscriptionStatusColors[academy.subscriptionStatus]}`}>
                      {subscriptionStatusLabels[academy.subscriptionStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Users className="w-4 h-4 text-gray-400" />
                      {academy.students}명
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-gray-700">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      {academy.teachers}명
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleViewDetail(academy.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="상세 보기"
                      >
                        <Eye className="w-4 h-4" />
                        상세
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  검색 결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            총 {filteredAndSortedAcademies.length}개 학원 중 {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedAcademies.length)}개 표시
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {renderPageButtons()}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
