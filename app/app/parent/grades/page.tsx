'use client'

import { useState } from 'react'
import {
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  ChevronDown,
  BarChart2,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'

// 필터 옵션
type FilterType = 'all' | 'algebra' | 'geometry' | 'functions' | 'statistics'

// 목업 데이터
const gradesSummary = {
  currentAverage: 82,
  previousAverage: 78,
  highestScore: 95,
  lowestScore: 68,
  totalTests: 24,
  improvement: '+4점',
}

const monthlyScores = [
  { month: '9월', score: 75 },
  { month: '10월', score: 78 },
  { month: '11월', score: 80 },
  { month: '12월', score: 78 },
  { month: '1월', score: 82 },
]

const subjectScores = [
  { subject: '대수', currentScore: 88, previousScore: 82, change: '+6', trend: 'up' },
  { subject: '기하', currentScore: 75, previousScore: 78, change: '-3', trend: 'down' },
  { subject: '함수', currentScore: 85, previousScore: 80, change: '+5', trend: 'up' },
  { subject: '확률/통계', currentScore: 80, previousScore: 75, change: '+5', trend: 'up' },
]

const testHistory = [
  {
    id: 1,
    title: '이차방정식 단원 테스트',
    date: '2025-01-18',
    category: 'algebra',
    score: 92,
    totalScore: 100,
    rank: '3/24',
    status: 'excellent',
  },
  {
    id: 2,
    title: '도형의 성질 퀴즈',
    date: '2025-01-15',
    category: 'geometry',
    score: 68,
    totalScore: 100,
    rank: '15/24',
    status: 'needs_work',
  },
  {
    id: 3,
    title: '인수분해 연습',
    date: '2025-01-12',
    category: 'algebra',
    score: 88,
    totalScore: 100,
    rank: '5/24',
    status: 'good',
  },
  {
    id: 4,
    title: '일차함수 그래프',
    date: '2025-01-10',
    category: 'functions',
    score: 85,
    totalScore: 100,
    rank: '6/24',
    status: 'good',
  },
  {
    id: 5,
    title: '연립방정식 종합',
    date: '2025-01-08',
    category: 'algebra',
    score: 78,
    totalScore: 100,
    rank: '10/24',
    status: 'average',
  },
  {
    id: 6,
    title: '확률의 기초',
    date: '2025-01-05',
    category: 'statistics',
    score: 82,
    totalScore: 100,
    rank: '8/24',
    status: 'good',
  },
]

const categoryLabels: Record<string, string> = {
  all: '전체',
  algebra: '대수',
  geometry: '기하',
  functions: '함수',
  statistics: '확률/통계',
}

export default function ParentGradesPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTests = testHistory.filter((test) => {
    const matchesFilter = filter === 'all' || test.category === filter
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">성적 확인</h1>
            <p className="text-gray-500 mt-1">김민준 학생의 과목별 성적과 테스트 결과</p>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* 성적 요약 카드 */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <p className="text-indigo-200 text-sm mb-2">현재 평균 점수</p>
            <div className="flex items-end gap-4">
              <span className="text-5xl font-bold">{gradesSummary.currentAverage}</span>
              <span className="text-2xl mb-1">점</span>
              <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full ml-auto">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">{gradesSummary.improvement}</span>
              </div>
            </div>
            <p className="text-sm text-indigo-200 mt-4">지난 달 평균: {gradesSummary.previousAverage}점</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">최고 점수</p>
            <p className="text-3xl font-bold text-green-600">{gradesSummary.highestScore}점</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">최저 점수</p>
            <p className="text-3xl font-bold text-red-500">{gradesSummary.lowestScore}점</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">응시 테스트</p>
            <p className="text-3xl font-bold text-gray-900">{gradesSummary.totalTests}회</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* 월별 성적 추이 차트 */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              월별 평균 점수 추이
            </h3>
            <div className="flex items-end justify-between h-48 gap-6 px-4">
              {monthlyScores.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-lg font-bold text-indigo-600">{item.score}</span>
                  <div className="w-full bg-gray-100 rounded-lg overflow-hidden" style={{ height: '140px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-lg transition-all"
                      style={{ height: `${(item.score / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 과목별 현황 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">과목별 성적</h3>
            <div className="space-y-4">
              {subjectScores.map((subject, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{subject.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{subject.currentScore}점</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${
                        subject.trend === 'up' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {subject.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {subject.change}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        subject.currentScore >= 85 ? 'bg-green-500' :
                        subject.currentScore >= 70 ? 'bg-blue-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${subject.currentScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 테스트 기록 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">테스트 기록</h3>
            <div className="flex items-center gap-3">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="테스트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-48 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* 필터 */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 테스트 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">테스트명</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">날짜</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">과목</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">점수</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">등수</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => (
                  <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{test.title}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {test.date}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {categoryLabels[test.category]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-lg font-bold ${
                        test.score >= 90 ? 'text-green-600' :
                        test.score >= 80 ? 'text-blue-600' :
                        test.score >= 70 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {test.score}/{test.totalScore}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-gray-700 font-medium">{test.rank}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {test.status === 'excellent' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          우수
                        </span>
                      )}
                      {test.status === 'good' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          양호
                        </span>
                      )}
                      {test.status === 'average' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          보통
                        </span>
                      )}
                      {test.status === 'needs_work' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          보완 필요
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTests.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
