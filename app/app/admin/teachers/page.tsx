'use client'

import { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Calendar,
  GraduationCap,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'

// 목업 데이터
const mockTeachers = [
  {
    id: 1,
    name: '김민수',
    email: 'kim.minsoo@academy.kr',
    phone: '010-1234-5678',
    academy: '스마트 수학학원',
    academyId: 1,
    subjects: ['수학', '과학'],
    joinDate: '2024-03-15',
    lastActive: '2025-01-21 14:30',
    studentCount: 32,
    status: 'active',
    role: '담당강사',
    totalClasses: 5,
    totalProblemsCreated: 450,
  },
  {
    id: 2,
    name: '이영희',
    email: 'lee.yh@engvillage.kr',
    phone: '010-2345-6789',
    academy: '영어마을학원',
    academyId: 2,
    subjects: ['영어'],
    joinDate: '2024-05-20',
    lastActive: '2025-01-21 10:15',
    studentCount: 28,
    status: 'active',
    role: '원장',
    totalClasses: 4,
    totalProblemsCreated: 320,
  },
  {
    id: 3,
    name: '박지훈',
    email: 'park.jh@smartmath.kr',
    phone: '010-3456-7890',
    academy: '스마트 수학학원',
    academyId: 1,
    subjects: ['수학'],
    joinDate: '2024-08-10',
    lastActive: '2025-01-20 18:45',
    studentCount: 24,
    status: 'active',
    role: '담당강사',
    totalClasses: 3,
    totalProblemsCreated: 180,
  },
  {
    id: 4,
    name: '최수진',
    email: 'choi.sj@koreanwriting.kr',
    phone: '010-4567-8901',
    academy: '국어논술학원',
    academyId: 4,
    subjects: ['국어', '논술'],
    joinDate: '2024-02-01',
    lastActive: '2025-01-21 09:00',
    studentCount: 45,
    status: 'active',
    role: '원장',
    totalClasses: 6,
    totalProblemsCreated: 890,
  },
  {
    id: 5,
    name: '정호진',
    email: 'jung.hj@sciencelab.kr',
    phone: '010-5678-9012',
    academy: '과학탐구교실',
    academyId: 3,
    subjects: ['과학', '물리'],
    joinDate: '2025-01-10',
    lastActive: '-',
    studentCount: 0,
    status: 'pending',
    role: '담당강사',
    totalClasses: 0,
    totalProblemsCreated: 0,
  },
  {
    id: 6,
    name: '강태호',
    email: 'kang.th@myungmoon.kr',
    phone: '010-6789-0123',
    academy: '명문학원',
    academyId: 6,
    subjects: ['수학', '영어', '과학'],
    joinDate: '2023-09-01',
    lastActive: '2024-12-15 16:20',
    studentCount: 56,
    status: 'inactive',
    role: '원장',
    totalClasses: 8,
    totalProblemsCreated: 1250,
  },
  {
    id: 7,
    name: '윤서연',
    email: 'yoon.sy@smartmath.kr',
    phone: '010-7890-1234',
    academy: '스마트 수학학원',
    academyId: 1,
    subjects: ['수학'],
    joinDate: '2024-11-01',
    lastActive: '2025-01-21 11:30',
    studentCount: 18,
    status: 'active',
    role: '담당강사',
    totalClasses: 2,
    totalProblemsCreated: 95,
  },
  {
    id: 8,
    name: '한지민',
    email: 'han.jm@engvillage.kr',
    phone: '010-8901-2345',
    academy: '영어마을학원',
    academyId: 2,
    subjects: ['영어', '회화'],
    joinDate: '2024-06-15',
    lastActive: '2025-01-19 14:00',
    studentCount: 22,
    status: 'active',
    role: '담당강사',
    totalClasses: 3,
    totalProblemsCreated: 210,
  },
]

// 학원 목록 (필터용)
const academyOptions = [
  { id: 1, name: '스마트 수학학원' },
  { id: 2, name: '영어마을학원' },
  { id: 3, name: '과학탐구교실' },
  { id: 4, name: '국어논술학원' },
  { id: 6, name: '명문학원' },
]

const statusColors: Record<string, string> = {
  'active': 'bg-green-100 text-green-700',
  'pending': 'bg-yellow-100 text-yellow-700',
  'inactive': 'bg-gray-100 text-gray-600',
}

const statusLabels: Record<string, string> = {
  'active': '활성',
  'pending': '승인대기',
  'inactive': '비활성',
}

const ITEMS_PER_PAGE = 10

export default function SuperAdminTeachersPage() {
  const [teachers] = useState(mockTeachers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAcademy, setFilterAcademy] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTeacher, setSelectedTeacher] = useState<typeof mockTeachers[0] | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 필터링된 강사 목록
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAcademy = filterAcademy === 'all' || teacher.academyId === Number(filterAcademy)
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus
    return matchesSearch && matchesAcademy && matchesStatus
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE)
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // 필터 변경 시 첫 페이지로 이동
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  // 상세 모달 열기
  const openDetail = (teacher: typeof mockTeachers[0]) => {
    setSelectedTeacher(teacher)
    setShowDetailModal(true)
  }

  // 통계 계산
  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === 'active').length,
    pending: teachers.filter(t => t.status === 'pending').length,
    totalStudents: teachers.reduce((sum, t) => sum + t.studentCount, 0),
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">강사 관리</h1>
          <p className="text-gray-500">전체 학원의 강사를 관리하고 현황을 확인합니다</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          강사 목록 내보내기
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 강사</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">활성 강사</p>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <UserX className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">승인 대기</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 담당 학생</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 필터 & 검색 */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="이름, 이메일로 검색..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            />
          </div>
          <select
            className="input w-48"
            value={filterAcademy}
            onChange={(e) => handleFilterChange(setFilterAcademy, e.target.value)}
          >
            <option value="all">전체 학원</option>
            {academyOptions.map((academy) => (
              <option key={academy.id} value={academy.id}>
                {academy.name}
              </option>
            ))}
          </select>
          <select
            className="input w-40"
            value={filterStatus}
            onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="pending">승인대기</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">이메일</th>
              <th className="px-4 py-3 font-medium">소속 학원</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">담당 학생</th>
              <th className="px-4 py-3 font-medium">마지막 활동</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTeachers.map((teacher) => (
              <tr key={teacher.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-sm text-gray-500">{teacher.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{teacher.email}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{teacher.academy}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {teacher.joinDate}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{teacher.studentCount}명</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {teacher.lastActive === '-' ? '-' : teacher.lastActive}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[teacher.status]}`}>
                    {statusLabels[teacher.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openDetail(teacher)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="상세 보기"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="수정">
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="더보기">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 결과 없음 */}
        {paginatedTeachers.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            총 {filteredTeachers.length}명의 강사
            {totalPages > 1 && ` (${currentPage}/${totalPages} 페이지)`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    currentPage === page
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">강사 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 프로필 헤더 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-2xl">
                    {selectedTeacher.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTeacher.name}</h3>
                  <p className="text-gray-500">{selectedTeacher.role} | {selectedTeacher.academy}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${statusColors[selectedTeacher.status]}`}>
                    {statusLabels[selectedTeacher.status]}
                  </span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">연락처 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-500">이메일</p>
                    </div>
                    <p className="font-medium text-gray-900">{selectedTeacher.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-500">전화번호</p>
                    </div>
                    <p className="font-medium text-gray-900">{selectedTeacher.phone}</p>
                  </div>
                </div>
              </div>

              {/* 소속 및 담당 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">소속 및 담당</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-500">소속 학원</p>
                    </div>
                    <p className="font-medium text-gray-900">{selectedTeacher.academy}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">담당 과목</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTeacher.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 활동 현황 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">활동 현황</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{selectedTeacher.studentCount}</p>
                    <p className="text-sm text-blue-600">담당 학생</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedTeacher.totalClasses}</p>
                    <p className="text-sm text-green-600">담당 반</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl text-center">
                    <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-700">{selectedTeacher.totalProblemsCreated.toLocaleString()}</p>
                    <p className="text-sm text-purple-600">생성 문제</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl text-center">
                    <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-orange-700">{selectedTeacher.joinDate}</p>
                    <p className="text-sm text-orange-600">가입일</p>
                  </div>
                </div>
              </div>

              {/* 마지막 활동 */}
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">마지막 활동</p>
                    <p className="font-medium text-gray-900">
                      {selectedTeacher.lastActive === '-' ? '활동 기록 없음' : selectedTeacher.lastActive}
                    </p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {selectedTeacher.status === 'pending' && (
                  <button className="btn-primary flex-1">가입 승인</button>
                )}
                {selectedTeacher.status === 'active' && (
                  <button className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50">
                    계정 비활성화
                  </button>
                )}
                {selectedTeacher.status === 'inactive' && (
                  <button className="btn-primary flex-1">계정 활성화</button>
                )}
                <button className="btn-secondary flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  메일 발송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
