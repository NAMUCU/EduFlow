'use client'

import { useState } from 'react'
import {
  FileQuestion,
  BookOpen,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Check,
  X,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  Edit,
  Globe,
  Lock,
  AlertCircle,
  FolderOpen
} from 'lucide-react'

// Mock 데이터 - 문제
const mockProblems = [
  {
    id: 1,
    title: '이차방정식의 근의 공식 적용',
    subject: '수학',
    grade: '중3',
    unit: '이차방정식',
    difficulty: '중',
    status: 'approved',
    isPublic: true,
    createdBy: '김선생',
    academyName: '스마트수학학원',
    createdAt: '2025-01-15',
    reviewedAt: '2025-01-16',
    views: 234,
  },
  {
    id: 2,
    title: '피타고라스 정리 증명 문제',
    subject: '수학',
    grade: '중2',
    unit: '피타고라스 정리',
    difficulty: '상',
    status: 'pending',
    isPublic: false,
    createdBy: '이선생',
    academyName: '영재수학학원',
    createdAt: '2025-01-18',
    reviewedAt: null,
    views: 0,
  },
  {
    id: 3,
    title: '연립방정식 활용 - 거리, 속력, 시간',
    subject: '수학',
    grade: '중2',
    unit: '연립방정식',
    difficulty: '중',
    status: 'approved',
    isPublic: true,
    createdBy: '박선생',
    academyName: '명문학원',
    createdAt: '2025-01-10',
    reviewedAt: '2025-01-11',
    views: 567,
  },
  {
    id: 4,
    title: '일차함수의 그래프 해석',
    subject: '수학',
    grade: '중2',
    unit: '일차함수',
    difficulty: '하',
    status: 'rejected',
    isPublic: false,
    createdBy: '최선생',
    academyName: '과학탐구교실',
    createdAt: '2025-01-17',
    reviewedAt: '2025-01-18',
    views: 0,
    rejectReason: '문제 내용이 불명확함',
  },
  {
    id: 5,
    title: '인수분해 공식 응용',
    subject: '수학',
    grade: '중3',
    unit: '인수분해',
    difficulty: '상',
    status: 'pending',
    isPublic: false,
    createdBy: '정선생',
    academyName: '종합학습센터',
    createdAt: '2025-01-19',
    reviewedAt: null,
    views: 0,
  },
]

// Mock 데이터 - 문제집
const mockProblemSets = [
  {
    id: 1,
    title: '중2 1학기 기말고사 대비',
    subject: '수학',
    grade: '중2',
    problemCount: 25,
    status: 'approved',
    isPublic: true,
    createdBy: '김선생',
    academyName: '스마트수학학원',
    createdAt: '2025-01-10',
    downloads: 89,
  },
  {
    id: 2,
    title: '이차방정식 마스터',
    subject: '수학',
    grade: '중3',
    problemCount: 30,
    status: 'pending',
    isPublic: false,
    createdBy: '이선생',
    academyName: '영재수학학원',
    createdAt: '2025-01-18',
    downloads: 0,
  },
  {
    id: 3,
    title: '도형의 성질 완벽 정리',
    subject: '수학',
    grade: '중1',
    problemCount: 20,
    status: 'approved',
    isPublic: true,
    createdBy: '박선생',
    academyName: '명문학원',
    createdAt: '2025-01-05',
    downloads: 156,
  },
]

// Mock 데이터 - RAG 문서
const mockRagDocuments = [
  {
    id: 1,
    title: '2024 개정 수학 교육과정',
    fileName: 'math_curriculum_2024.pdf',
    fileSize: '2.4MB',
    type: 'PDF',
    status: 'indexed',
    uploadedBy: 'admin',
    uploadedAt: '2025-01-01',
    chunks: 156,
    lastQueried: '2025-01-19',
    queryCount: 1234,
  },
  {
    id: 2,
    title: '중학교 수학 개념 정리',
    fileName: 'middle_math_concepts.pdf',
    fileSize: '5.8MB',
    type: 'PDF',
    status: 'indexed',
    uploadedBy: 'admin',
    uploadedAt: '2025-01-05',
    chunks: 342,
    lastQueried: '2025-01-19',
    queryCount: 892,
  },
  {
    id: 3,
    title: '고등학교 수학 기출문제 분석',
    fileName: 'high_math_analysis.pdf',
    fileSize: '8.2MB',
    type: 'PDF',
    status: 'processing',
    uploadedBy: 'admin',
    uploadedAt: '2025-01-19',
    chunks: 0,
    lastQueried: null,
    queryCount: 0,
  },
  {
    id: 4,
    title: '수학 문제 풀이 가이드',
    fileName: 'problem_solving_guide.docx',
    fileSize: '1.2MB',
    type: 'DOCX',
    status: 'indexed',
    uploadedBy: 'admin',
    uploadedAt: '2025-01-08',
    chunks: 89,
    lastQueried: '2025-01-18',
    queryCount: 456,
  },
]

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  indexed: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  error: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  approved: '승인됨',
  pending: '검수 대기',
  rejected: '거부됨',
  indexed: '색인 완료',
  processing: '처리 중',
  error: '오류',
}

const difficultyColors: Record<string, string> = {
  상: 'bg-red-100 text-red-700',
  중: 'bg-yellow-100 text-yellow-700',
  하: 'bg-green-100 text-green-700',
}

type TabType = 'problems' | 'problemSets' | 'ragDocuments'

export default function ContentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('problems')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [problems, setProblems] = useState(mockProblems)
  const [problemSets, setProblemSets] = useState(mockProblemSets)
  const [ragDocuments] = useState(mockRagDocuments)
  const [selectedItem, setSelectedItem] = useState<typeof mockProblems[0] | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // 통계 계산
  const stats = {
    totalProblems: problems.length,
    publicProblems: problems.filter(p => p.isPublic && p.status === 'approved').length,
    pendingProblems: problems.filter(p => p.status === 'pending').length,
    totalProblemSets: problemSets.length,
    publicProblemSets: problemSets.filter(p => p.isPublic && p.status === 'approved').length,
    totalRagDocs: ragDocuments.length,
    indexedRagDocs: ragDocuments.filter(d => d.status === 'indexed').length,
  }

  // 필터링된 데이터
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredProblemSets = problemSets.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredRagDocuments = ragDocuments.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // 승인 처리
  const handleApprove = (id: number, type: 'problem' | 'problemSet') => {
    if (type === 'problem') {
      setProblems(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'approved', isPublic: true, reviewedAt: new Date().toISOString().split('T')[0] } : p
      ))
    } else {
      setProblemSets(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'approved', isPublic: true } : p
      ))
    }
    setShowDetailModal(false)
    alert('승인되었습니다.')
  }

  // 거부 처리
  const handleReject = (id: number, type: 'problem' | 'problemSet') => {
    if (type === 'problem') {
      setProblems(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'rejected', reviewedAt: new Date().toISOString().split('T')[0], rejectReason } : p
      ))
    } else {
      setProblemSets(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'rejected' } : p
      ))
    }
    setShowRejectModal(false)
    setShowDetailModal(false)
    setRejectReason('')
    alert('거부되었습니다.')
  }

  // 상세 보기
  const openDetail = (item: typeof mockProblems[0]) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const tabs = [
    { id: 'problems' as TabType, label: '문제 관리', icon: FileQuestion, count: stats.pendingProblems },
    { id: 'problemSets' as TabType, label: '문제집 관리', icon: BookOpen, count: problemSets.filter(p => p.status === 'pending').length },
    { id: 'ragDocuments' as TabType, label: 'RAG 문서', icon: FileText, count: ragDocuments.filter(d => d.status === 'processing').length },
  ]

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-gray-500">문제, 문제집, RAG 문서를 관리하고 검수합니다</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            내보내기
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            문서 업로드
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileQuestion className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 문제 수</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProblems}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">공개 문제</p>
            <p className="text-2xl font-bold text-gray-900">{stats.publicProblems}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">문제집 수</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalProblemSets}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">RAG 문서</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRagDocs}</p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setSearchTerm('')
              setFilterStatus('all')
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 필터 & 검색 */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="제목, 과목, 작성자로 검색..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input w-40"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">전체 상태</option>
            {activeTab === 'ragDocuments' ? (
              <>
                <option value="indexed">색인 완료</option>
                <option value="processing">처리 중</option>
                <option value="error">오류</option>
              </>
            ) : (
              <>
                <option value="approved">승인됨</option>
                <option value="pending">검수 대기</option>
                <option value="rejected">거부됨</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* 문제 관리 탭 */}
      {activeTab === 'problems' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-medium">문제 정보</th>
                <th className="px-4 py-3 font-medium">과목/학년</th>
                <th className="px-4 py-3 font-medium">난이도</th>
                <th className="px-4 py-3 font-medium">작성자</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">공개</th>
                <th className="px-4 py-3 font-medium">조회수</th>
                <th className="px-4 py-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem) => (
                <tr key={problem.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileQuestion className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 max-w-xs truncate">{problem.title}</p>
                        <p className="text-sm text-gray-500">{problem.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{problem.subject}</p>
                    <p className="text-sm text-gray-400">{problem.grade}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{problem.createdBy}</p>
                    <p className="text-xs text-gray-400">{problem.academyName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[problem.status]}`}>
                      {statusLabels[problem.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {problem.isPublic ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {problem.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetail(problem)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="상세 보기"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      {problem.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(problem.id, 'problem')}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="승인"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(problem)
                              setShowRejectModal(true)
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="거부"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
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
              총 {filteredProblems.length}개 문제
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm">1</span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문제집 관리 탭 */}
      {activeTab === 'problemSets' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-medium">문제집 정보</th>
                <th className="px-4 py-3 font-medium">과목/학년</th>
                <th className="px-4 py-3 font-medium">문제 수</th>
                <th className="px-4 py-3 font-medium">작성자</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">공개</th>
                <th className="px-4 py-3 font-medium">다운로드</th>
                <th className="px-4 py-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblemSets.map((problemSet) => (
                <tr key={problemSet.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 max-w-xs truncate">{problemSet.title}</p>
                        <p className="text-sm text-gray-500">{problemSet.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{problemSet.subject}</p>
                    <p className="text-sm text-gray-400">{problemSet.grade}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900">{problemSet.problemCount}문제</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{problemSet.createdBy}</p>
                    <p className="text-xs text-gray-400">{problemSet.academyName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[problemSet.status]}`}>
                      {statusLabels[problemSet.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {problemSet.isPublic ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {problemSet.downloads.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="상세 보기">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      {problemSet.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(problemSet.id, 'problemSet')}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="승인"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(problemSet as any)
                              setShowRejectModal(true)
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="거부"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
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
              총 {filteredProblemSets.length}개 문제집
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm">1</span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAG 문서 탭 */}
      {activeTab === 'ragDocuments' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-medium">문서 정보</th>
                <th className="px-4 py-3 font-medium">파일</th>
                <th className="px-4 py-3 font-medium">청크 수</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">쿼리 수</th>
                <th className="px-4 py-3 font-medium">마지막 쿼리</th>
                <th className="px-4 py-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredRagDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 max-w-xs truncate">{doc.title}</p>
                        <p className="text-sm text-gray-500">업로드: {doc.uploadedAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{doc.fileName}</p>
                    <p className="text-xs text-gray-400">{doc.fileSize} | {doc.type}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {doc.chunks > 0 ? `${doc.chunks}개` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[doc.status]}`}>
                      {statusLabels[doc.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {doc.queryCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {doc.lastQueried || '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="상세 보기">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="다운로드">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="삭제">
                        <Trash2 className="w-4 h-4 text-red-400" />
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
              총 {filteredRagDocuments.length}개 문서
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm">1</span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문제 상세 모달 */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">문제 상세 정보</h2>
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
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">문제 제목</p>
                    <p className="font-medium text-gray-900">{selectedItem.title}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">과목</p>
                      <p className="font-medium text-gray-900">{selectedItem.subject}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">학년</p>
                      <p className="font-medium text-gray-900">{selectedItem.grade}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">단원</p>
                      <p className="font-medium text-gray-900">{selectedItem.unit}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 작성자 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">작성자 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">작성자</p>
                    <p className="font-medium text-gray-900">{selectedItem.createdBy}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">학원</p>
                    <p className="font-medium text-gray-900">{selectedItem.academyName}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">작성일</p>
                    <p className="font-medium text-gray-900">{selectedItem.createdAt}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">검수일</p>
                    <p className="font-medium text-gray-900">{selectedItem.reviewedAt || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 상태 정보 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">상태 정보</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-2">상태</p>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[selectedItem.status]}`}>
                      {statusLabels[selectedItem.status]}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-2">난이도</p>
                    <span className={`text-xs px-3 py-1 rounded-full ${difficultyColors[selectedItem.difficulty]}`}>
                      {selectedItem.difficulty}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-2">공개 여부</p>
                    <div className="flex items-center justify-center gap-2">
                      {selectedItem.isPublic ? (
                        <>
                          <Globe className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 font-medium">공개</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 font-medium">비공개</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 거부 사유 (거부된 경우) */}
              {selectedItem.status === 'rejected' && (selectedItem as any).rejectReason && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">거부 사유</p>
                      <p className="text-sm text-red-600">{(selectedItem as any).rejectReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {selectedItem.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedItem.id, 'problem')}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      승인하기
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      거부하기
                    </button>
                  </>
                )}
                {selectedItem.status === 'approved' && (
                  <button className="btn-secondary flex-1 text-red-600 border-red-200 hover:bg-red-50">
                    공개 해제
                  </button>
                )}
                <button className="btn-secondary flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  미리보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거부 모달 */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">콘텐츠 거부</h3>
            <p className="text-sm text-gray-500 mb-4">
              거부 사유를 입력해주세요. 작성자에게 전달됩니다.
            </p>
            <textarea
              className="input w-full h-32 resize-none mb-4"
              placeholder="거부 사유를 입력하세요..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={() => handleReject(selectedItem.id, 'problem')}
                className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                disabled={!rejectReason.trim()}
              >
                거부하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
