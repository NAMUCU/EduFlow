'use client'

import Header from '@/components/Header'
import { Users, FileText, CheckCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react'

// 목업 데이터
const stats = [
  { label: '전체 학생', value: '65', icon: Users, change: '+3', changeType: 'positive' },
  { label: '이번 주 생성 문제', value: '142', icon: FileText, change: '+28', changeType: 'positive' },
  { label: '과제 제출률', value: '87%', icon: CheckCircle, change: '+5%', changeType: 'positive' },
  { label: '평균 성적 향상', value: '+12점', icon: TrendingUp, change: '', changeType: 'neutral' },
]

const recentStudents = [
  { name: '김민준', grade: '중2', score: 85, status: '향상' },
  { name: '이서연', grade: '중3', score: 92, status: '유지' },
  { name: '박지호', grade: '중2', score: 78, status: '주의' },
  { name: '최수아', grade: '중1', score: 88, status: '향상' },
]

const recentAssignments = [
  { title: '중2 이차방정식 테스트', students: 24, submitted: 20, date: '2025-01-18' },
  { title: '중3 피타고라스 정리', students: 18, submitted: 18, date: '2025-01-17' },
  { title: '중1 일차방정식 복습', students: 23, submitted: 19, date: '2025-01-16' },
]

export default function DashboardPage() {
  return (
    <div>
      <Header
        title="대시보드"
        subtitle="오늘도 좋은 하루 되세요, 박정훈 원장님!"
      />

      <div className="p-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  index === 0 ? 'bg-blue-100' :
                  index === 1 ? 'bg-purple-100' :
                  index === 2 ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-purple-600' :
                    index === 2 ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                {stat.change && (
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 빠른 작업 */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">빠른 작업</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">새 문제 생성</p>
                  <p className="text-sm text-gray-500">AI로 맞춤 문제 만들기</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">학생 등록</p>
                  <p className="text-sm text-gray-500">새 학생 추가하기</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">과제 배포</p>
                  <p className="text-sm text-gray-500">문자로 문제 보내기</p>
                </div>
              </button>
            </div>
          </div>

          {/* 최근 학생 현황 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">학생 현황</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                전체 보기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                      {student.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{student.score}점</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      student.status === '향상' ? 'bg-green-100 text-green-700' :
                      student.status === '유지' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 과제 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">최근 과제</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                전체 보기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentAssignments.map((assignment, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl">
                  <p className="font-medium text-gray-900 mb-2">{assignment.title}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      제출: {assignment.submitted}/{assignment.students}명
                    </span>
                    <span className="text-gray-400">{assignment.date}</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(assignment.submitted / assignment.students) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
