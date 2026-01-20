'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { Plus, Search, Filter, Send, Eye, MoreVertical, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react'

// 목업 데이터
const mockAssignments = [
  {
    id: 1,
    title: '중2 이차방정식 테스트',
    description: '근의 공식과 판별식 활용',
    problemCount: 10,
    targetStudents: 24,
    submittedCount: 20,
    dueDate: '2025-01-20',
    createdAt: '2025-01-18',
    status: 'active',
    grade: '중2',
  },
  {
    id: 2,
    title: '중3 피타고라스 정리 복습',
    description: '직각삼각형 응용 문제',
    problemCount: 8,
    targetStudents: 18,
    submittedCount: 18,
    dueDate: '2025-01-19',
    createdAt: '2025-01-17',
    status: 'completed',
    grade: '중3',
  },
  {
    id: 3,
    title: '중1 일차방정식 기초',
    description: '방정식의 풀이 기본',
    problemCount: 12,
    targetStudents: 23,
    submittedCount: 19,
    dueDate: '2025-01-18',
    createdAt: '2025-01-16',
    status: 'completed',
    grade: '중1',
  },
  {
    id: 4,
    title: '중2 연립방정식 심화',
    description: '대입법과 가감법 활용',
    problemCount: 10,
    targetStudents: 24,
    submittedCount: 0,
    dueDate: '2025-01-25',
    createdAt: '2025-01-20',
    status: 'draft',
    grade: '중2',
  },
]

export default function AssignmentsPage() {
  const [assignments] = useState(mockAssignments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.includes(searchTerm) || assignment.description.includes(searchTerm)
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">진행중</span>
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">완료</span>
      case 'draft':
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">임시저장</span>
      default:
        return null
    }
  }

  const getSubmissionRate = (submitted: number, total: number) => {
    const rate = (submitted / total) * 100
    return rate
  }

  return (
    <div>
      <Header
        title="과제 관리"
        subtitle="문제지를 배포하고 제출 현황을 관리합니다"
      />

      <div className="p-8">
        {/* 상단 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 과제</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">진행중</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'active').length}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 제출률</p>
              <p className="text-2xl font-bold text-gray-900">87%</p>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="과제 검색..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'completed', 'draft'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '전체' : status === 'active' ? '진행중' : status === 'completed' ? '완료' : '임시저장'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 과제 배포
          </button>
        </div>

        {/* 과제 목록 */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">{assignment.grade}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{assignment.title}</h3>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <p className="text-sm text-gray-500">{assignment.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>문제 {assignment.problemCount}개</span>
                      <span>•</span>
                      <span>마감: {assignment.dueDate}</span>
                      <span>•</span>
                      <span>생성: {assignment.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* 제출 현황 */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-gray-900">
                        {assignment.submittedCount}/{assignment.targetStudents}
                      </span>
                      <span className="text-sm text-gray-500">명 제출</span>
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          getSubmissionRate(assignment.submittedCount, assignment.targetStudents) === 100
                            ? 'bg-green-500'
                            : 'bg-primary-500'
                        }`}
                        style={{ width: `${getSubmissionRate(assignment.submittedCount, assignment.targetStudents)}%` }}
                      />
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      상세보기
                    </button>
                    {assignment.status === 'draft' && (
                      <button className="btn-primary flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        배포하기
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 과제 생성 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">새 과제 배포</h3>
              <form className="space-y-4">
                <div>
                  <label className="label">과제 제목</label>
                  <input type="text" className="input" placeholder="예: 중2 이차방정식 테스트" />
                </div>
                <div>
                  <label className="label">설명</label>
                  <textarea className="input min-h-[80px]" placeholder="과제에 대한 간단한 설명..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">대상 학년</label>
                    <select className="input">
                      <option>중1</option>
                      <option>중2</option>
                      <option>중3</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">마감일</label>
                    <input type="date" className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">문제지 선택</label>
                  <select className="input">
                    <option>저장된 문제지에서 선택...</option>
                    <option>중2 이차방정식 기본 (10문제)</option>
                    <option>중2 이차방정식 심화 (8문제)</option>
                    <option>중3 피타고라스 정리 (12문제)</option>
                  </select>
                </div>
                <div>
                  <label className="label">배포 대상</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    중2 전체 (24명) 선택됨
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    취소
                  </button>
                  <button type="button" className="flex-1 btn-ghost">
                    임시저장
                  </button>
                  <button type="submit" className="flex-1 btn-primary flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    배포하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
