'use client'

import { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  BookOpen,
  ChevronRight,
  Calendar,
  Award,
  Minus,
} from 'lucide-react'
import Link from 'next/link'

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '내 성적',
  pageSubtitle: '과목별, 단원별 성적을 확인하고 학습 현황을 파악하세요',
  overallStats: '전체 통계',
  averageScore: '평균 점수',
  totalProblems: '총 풀이 문제',
  correctRate: '정답률',
  improvement: '지난 달 대비',
  subjectGrades: '과목별 성적',
  chapterGrades: '단원별 성적',
  recentTests: '최근 테스트',
  wrongAnswersReview: '틀린 문제 다시 풀기',
  problemCount: '문제',
  viewMore: '더보기',
  date: '날짜',
  score: '점수',
  trend: '추세',
  retryWrong: '오답 다시 풀기',
  noData: '데이터가 없습니다',
}

// Mock 데이터 - 과목별 성적
const subjectGrades = [
  { subject: '수학', average: 82, trend: 5, problems: 120, correct: 98 },
  { subject: '영어', average: 88, trend: -2, problems: 95, correct: 84 },
  { subject: '국어', average: 75, trend: 8, problems: 80, correct: 60 },
  { subject: '과학', average: 90, trend: 3, problems: 60, correct: 54 },
]

// Mock 데이터 - 단원별 성적 (수학)
const chapterGrades = [
  { chapter: '이차함수', score: 85, problems: 30, wrong: 5, date: '2024-01-18' },
  { chapter: '인수분해', score: 78, problems: 25, wrong: 6, date: '2024-01-15' },
  { chapter: '제곱근', score: 92, problems: 20, wrong: 2, date: '2024-01-12' },
  { chapter: '다항식', score: 80, problems: 25, wrong: 5, date: '2024-01-10' },
  { chapter: '방정식', score: 88, problems: 20, wrong: 3, date: '2024-01-08' },
]

// Mock 데이터 - 최근 테스트
const recentTests = [
  { id: 1, subject: '수학', title: '이차함수 종합 테스트', score: 85, total: 100, date: '2024-01-18', wrongCount: 3 },
  { id: 2, subject: '영어', title: '관계대명사 문법 테스트', score: 92, total: 100, date: '2024-01-17', wrongCount: 2 },
  { id: 3, subject: '국어', title: '비문학 독해력 테스트', score: 78, total: 100, date: '2024-01-15', wrongCount: 5 },
  { id: 4, subject: '수학', title: '인수분해 기초 테스트', score: 88, total: 100, date: '2024-01-12', wrongCount: 3 },
]

// 과목별 색상
const subjectColors: { [key: string]: { bg: string; text: string; bar: string } } = {
  수학: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  영어: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
  국어: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
  과학: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
}

// 점수에 따른 색상
function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

// 점수에 따른 등급
function getGrade(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export default function GradesPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>('수학')

  // 전체 통계 계산
  const totalStats = {
    average: Math.round(subjectGrades.reduce((acc, g) => acc + g.average, 0) / subjectGrades.length),
    totalProblems: subjectGrades.reduce((acc, g) => acc + g.problems, 0),
    correctRate: Math.round(
      (subjectGrades.reduce((acc, g) => acc + g.correct, 0) / subjectGrades.reduce((acc, g) => acc + g.problems, 0)) * 100
    ),
    improvement: 4,
  }

  return (
    <div className="p-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          {UI_TEXT.pageTitle}
        </h1>
        <p className="text-gray-500 mt-1">{UI_TEXT.pageSubtitle}</p>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 평균 점수 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.averageScore}</p>
              <p className={`text-3xl font-bold mt-1 ${getScoreColor(totalStats.average)}`}>
                {totalStats.average}
                <span className="text-lg text-gray-400">/100</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {totalStats.improvement > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600">+{totalStats.improvement}%</span>
              </>
            ) : totalStats.improvement < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-red-600">{totalStats.improvement}%</span>
              </>
            ) : (
              <>
                <Minus className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">0%</span>
              </>
            )}
            <span className="text-gray-400">{UI_TEXT.improvement}</span>
          </div>
        </div>

        {/* 총 풀이 문제 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.totalProblems}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {totalStats.totalProblems}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* 정답률 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.correctRate}</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {totalStats.correctRate}
                <span className="text-lg">%</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${totalStats.correctRate}%` }}
            />
          </div>
        </div>

        {/* 오답 다시 풀기 버튼 */}
        <Link href="/student/wrong-answers" className="block">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 shadow-sm h-full flex flex-col justify-center text-white hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-100">{UI_TEXT.wrongAnswersReview}</p>
                <p className="text-2xl font-bold mt-1">12개</p>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        </Link>
      </div>

      {/* 과목별 성적 & 단원별 성적 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 과목별 성적 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              {UI_TEXT.subjectGrades}
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {subjectGrades.map((grade) => {
              const colors = subjectColors[grade.subject]
              return (
                <button
                  key={grade.subject}
                  onClick={() => setSelectedSubject(grade.subject)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedSubject === grade.subject
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {grade.subject}
                      </span>
                      <span className="text-sm text-gray-500">{grade.problems}문제</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${getScoreColor(grade.average)}`}>
                        {grade.average}
                      </span>
                      {grade.trend > 0 ? (
                        <span className="flex items-center text-xs text-green-600">
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          +{grade.trend}
                        </span>
                      ) : grade.trend < 0 ? (
                        <span className="flex items-center text-xs text-red-600">
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          {grade.trend}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${grade.average}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 단원별 성적 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              {UI_TEXT.chapterGrades}
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${subjectColors[selectedSubject]?.bg} ${subjectColors[selectedSubject]?.text}`}>
                {selectedSubject}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {chapterGrades.map((chapter, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{chapter.chapter}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{chapter.date} | {chapter.problems}문제</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getScoreColor(chapter.score)}`}>
                      {chapter.score}
                    </p>
                    <p className="text-xs text-gray-500">등급: {getGrade(chapter.score)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                    <div
                      className={`h-full rounded-full ${subjectColors[selectedSubject]?.bar || 'bg-blue-500'}`}
                      style={{ width: `${chapter.score}%` }}
                    />
                  </div>
                  {chapter.wrong > 0 && (
                    <Link
                      href="/student/wrong-answers"
                      className="text-xs text-red-600 hover:text-red-700 whitespace-nowrap"
                    >
                      오답 {chapter.wrong}개
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 테스트 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            {UI_TEXT.recentTests}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  테스트명
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과목
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  점수
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  오답
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTests.map((test) => {
                const colors = subjectColors[test.subject]
                return (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{test.title}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {test.subject}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-500">
                      {test.date}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-bold ${getScoreColor(test.score)}`}>
                        {test.score}/{test.total}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`w-8 h-8 inline-flex items-center justify-center rounded-lg font-bold text-sm ${
                        getGrade(test.score) === 'A' ? 'bg-green-100 text-green-700' :
                        getGrade(test.score) === 'B' ? 'bg-blue-100 text-blue-700' :
                        getGrade(test.score) === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getGrade(test.score)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {test.wrongCount > 0 ? (
                        <Link
                          href="/student/wrong-answers"
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                          {test.wrongCount}개
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
