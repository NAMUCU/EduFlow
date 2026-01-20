'use client'

import { useState } from 'react'
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Users,
  FileQuestion,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Download
} from 'lucide-react'

// 목업 데이터
const mockAcademies = [
  {
    id: 1,
    name: '스마트 수학학원',
    owner: '김영희',
    email: 'kim@smartmath.kr',
    phone: '010-1234-5678',
    plan: 'Pro',
    status: 'active',
    joinDate: '2024-08-15',
    lastActive: '2025-01-19',
    teachers: 5,
    students: 45,
    problemsGenerated: 3240,
    monthlyUsage: 892,
  },
  {
    id: 2,
    name: '영어마을학원',
    owner: '이철수',
    email: 'lee@engvillage.kr',
    phone: '010-2345-6789',
    plan: 'Basic',
    status: 'active',
    joinDate: '2024-10-20',
    lastActive: '2025-01-19',
    teachers: 3,
    students: 32,
    problemsGenerated: 1856,
    monthlyUsage: 421,
  },
  {
    id: 3,
    name: '과학탐구교실',
    owner: '박지민',
    email: 'park@sciencelab.kr',
    phone: '010-3456-7890',
    plan: 'Pro',
    status: 'pending',
    joinDate: '2025-01-16',
    lastActive: '-',
    teachers: 0,
    students: 0,
    problemsGenerated: 0,
    monthlyUsage: 0,
  },
  {
    id: 4,
    name: '국어논술학원',
    owner: '최수진',
    email: 'choi@koreanwriting.kr',
    phone: '010-4567-8901',
    plan: 'Enterprise',
    status: 'active',
    joinDate: '2024-03-10',
    lastActive: '2025-01-18',
    teachers: 12,
    students: 128,
    problemsGenerated: 8920,
    monthlyUsage: 1543,
  },
  {
    id: 5,
    name: '종합학습센터',
    owner: '정민호',
    email: 'jung@learningcenter.kr',
    phone: '010-5678-9012',
    plan: 'Basic',
    status: 'suspended',
    joinDate: '2024-06-05',
    lastActive: '2024-12-20',
    teachers: 4,
    students: 67,
    problemsGenerated: 2134,
    monthlyUsage: 0,
  },
  {
    id: 6,
    name: '명문학원',
    owner: '강태호',
    email: 'kang@myungmoon.kr',
    phone: '010-6789-0123',
    plan: 'Enterprise',
    status: 'active',
    joinDate: '2023-11-20',
    lastActive: '2025-01-19',
    teachers: 15,
    students: 210,
    problemsGenerated: 15680,
    monthlyUsage: 2341,
  },
]

const planColors: Record<string, string> = {
  'Basic': 'bg-gray-100 text-gray-600',
  'Pro': 'bg-blue-100 text-blue-700',
  'Enterprise': 'bg-purple-100 text-purple-700',
}

const statusColors: Record<string, string> = {
  'active': 'bg-green-100 text-green-700',
  'pending': 'bg-yellow-100 text-yellow-700',
  'suspended': 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  'active': '활성',
  'pending': '승인대기',
  'suspended': '정지',
}

export default function AcademiesPage() {
  const [academies] = useState(mockAcademies)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedAcademy, setSelectedAcademy] = useState<typeof mockAcademies[0] | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const filteredAcademies = academies.filter(academy => {
    const matchesSearch = academy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      academy.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      academy.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = filterPlan === 'all' || academy.plan === filterPlan
    const matchesStatus = filterStatus === 'all' || academy.status === filterStatus
    return matchesSearch && matchesPlan && matchesStatus
  })

  const openDetail = (academy: typeof mockAcademies[0]) => {
    setSelectedAcademy(academy)
    setShowDetailModal(true)
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학원 관리</h1>
          <p className="text-gray-500">등록된 학원을 관리하고 현황을 확인합니다</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          학원 목록 내보내기
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 학원</p>
            <p className="text-2xl font-bold text-gray-900">{academies.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">활성 학원</p>
            <p className="text-2xl font-bold text-gray-900">
              {academies.filter(a => a.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <UserX className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">승인 대기</p>
            <p className="text-2xl font-bold text-gray-900">
              {academies.filter(a => a.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 학생 수</p>
            <p className="text-2xl font-bold text-gray-900">
              {academies.reduce((sum, a) => sum + a.students, 0).toLocaleString()}
            </p>
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
              placeholder="학원명, 원장명, 이메일로 검색..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-40"
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
          >
            <option value="all">전체 요금제</option>
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <select
            className="input w-40"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="pending">승인대기</option>
            <option value="suspended">정지</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium">학원 정보</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">요금제</th>
              <th className="px-4 py-3 font-medium">사용 현황</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredAcademies.map((academy) => (
              <tr key={academy.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{academy.name}</p>
                      <p className="text-sm text-gray-500">{academy.owner}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-600">{academy.email}</p>
                  <p className="text-sm text-gray-400">{academy.phone}</p>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${planColors[academy.plan]}`}>
                    {academy.plan}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      {academy.students}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <FileQuestion className="w-4 h-4" />
                      {academy.monthlyUsage.toLocaleString()}/월
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[academy.status]}`}>
                    {statusLabels[academy.status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {academy.joinDate}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openDetail(academy)}
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

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            총 {filteredAcademies.length}개 학원
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm">1</span>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg text-sm">2</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded-lg text-sm">3</button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {showDetailModal && selectedAcademy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">학원 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">학원명</p>
                    <p className="font-medium text-gray-900">{selectedAcademy.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">원장</p>
                    <p className="font-medium text-gray-900">{selectedAcademy.owner}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">이메일</p>
                    <p className="font-medium text-gray-900">{selectedAcademy.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">전화번호</p>
                    <p className="font-medium text-gray-900">{selectedAcademy.phone}</p>
                  </div>
                </div>
              </div>

              {/* 서비스 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">서비스 정보</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-1">요금제</p>
                    <span className={`text-sm px-3 py-1 rounded-full ${planColors[selectedAcademy.plan]}`}>
                      {selectedAcademy.plan}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-1">가입일</p>
                    <p className="font-medium text-gray-900">{selectedAcademy.joinDate}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-1">최근 접속</p>
                    <p className="font-medium text-gray-900">{selectedAcademy.lastActive}</p>
                  </div>
                </div>
              </div>

              {/* 사용 현황 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">사용 현황</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{selectedAcademy.teachers}</p>
                    <p className="text-sm text-blue-600">선생님</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{selectedAcademy.students}</p>
                    <p className="text-sm text-green-600">학생</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl text-center">
                    <FileQuestion className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-700">{selectedAcademy.problemsGenerated.toLocaleString()}</p>
                    <p className="text-sm text-purple-600">총 문제 생성</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl text-center">
                    <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-700">{selectedAcademy.monthlyUsage.toLocaleString()}</p>
                    <p className="text-sm text-orange-600">이번 달 사용</p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {selectedAcademy.status === 'pending' && (
                  <button className="btn-primary flex-1">승인하기</button>
                )}
                {selectedAcademy.status === 'active' && (
                  <button className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50">
                    서비스 정지
                  </button>
                )}
                {selectedAcademy.status === 'suspended' && (
                  <button className="btn-primary flex-1">정지 해제</button>
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
