'use client'

import { useState } from 'react'
import {
  BookX,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  BookOpen,
  Calendar,
  Tag,
  Play,
  Clock,
} from 'lucide-react'

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '오답노트',
  pageSubtitle: '틀린 문제들을 다시 풀어보며 실력을 키워보세요',
  totalWrongAnswers: '총 틀린 문제',
  notReviewed: '복습 안함',
  reviewed: '복습 완료',
  allSubjects: '전체 과목',
  filterBySubject: '과목별',
  filterByDate: '날짜별',
  filterByStatus: '상태별',
  retryAll: '전체 다시 풀기',
  retrySelected: '선택 다시 풀기',
  myAnswer: '내 답안',
  correctAnswer: '정답',
  explanation: '해설',
  relatedConcept: '관련 개념',
  problemCount: '문제',
  retry: '다시 풀기',
  markAsReviewed: '복습 완료',
  showAnswer: '정답 보기',
  hideAnswer: '정답 숨기기',
  difficulty: '난이도',
  wrongDate: '틀린 날짜',
}

// Mock 데이터 - 틀린 문제
const wrongAnswers = [
  {
    id: 1,
    subject: '수학',
    chapter: '이차함수',
    question: '이차함수 y = 2x² - 4x + 3 의 꼭짓점의 좌표를 구하시오.',
    type: 'multiple_choice',
    choices: [
      { id: 1, text: '(1, 1)' },
      { id: 2, text: '(1, 2)' },
      { id: 3, text: '(2, 1)' },
      { id: 4, text: '(2, 3)' },
    ],
    myAnswer: 3,
    correctAnswer: 1,
    explanation: '주어진 이차함수를 완전제곱식으로 변형하면 y = 2(x-1)² + 1 이 됩니다. 따라서 꼭짓점의 좌표는 (1, 1)입니다.',
    relatedConcept: '이차함수의 표준형 y = a(x-p)² + q 에서 꼭짓점은 (p, q)입니다.',
    difficulty: '중',
    wrongDate: '2024-01-18',
    reviewed: false,
    retryCount: 0,
  },
  {
    id: 2,
    subject: '수학',
    chapter: '인수분해',
    question: 'x² - 5x + 6 을 인수분해 하시오.',
    type: 'short_answer',
    myAnswer: '(x-2)(x-4)',
    correctAnswer: '(x-2)(x-3)',
    explanation: '상수항 6을 두 수의 곱으로 나타내면 1×6, 2×3이 있고, 이 중 합이 -5가 되는 조합은 (-2)+(-3)=-5 입니다.',
    relatedConcept: 'x² + (a+b)x + ab = (x+a)(x+b) 공식을 활용합니다.',
    difficulty: '하',
    wrongDate: '2024-01-15',
    reviewed: true,
    retryCount: 1,
  },
  {
    id: 3,
    subject: '영어',
    chapter: '관계대명사',
    question: '다음 빈칸에 알맞은 관계대명사를 넣으시오: The man _____ I met yesterday is my teacher.',
    type: 'multiple_choice',
    choices: [
      { id: 1, text: 'who' },
      { id: 2, text: 'whom' },
      { id: 3, text: 'which' },
      { id: 4, text: 'whose' },
    ],
    myAnswer: 1,
    correctAnswer: 2,
    explanation: '관계대명사가 목적어 역할을 할 때는 whom을 사용합니다. "I met the man"에서 the man은 목적어이므로 whom이 정답입니다.',
    relatedConcept: '관계대명사 who는 주격, whom은 목적격으로 사용됩니다.',
    difficulty: '중',
    wrongDate: '2024-01-17',
    reviewed: false,
    retryCount: 0,
  },
  {
    id: 4,
    subject: '국어',
    chapter: '비문학 독해',
    question: '다음 글의 중심 내용으로 가장 적절한 것은?',
    type: 'multiple_choice',
    choices: [
      { id: 1, text: '환경 보호의 중요성' },
      { id: 2, text: '경제 발전의 필요성' },
      { id: 3, text: '기술 혁신의 가치' },
      { id: 4, text: '지속 가능한 발전' },
    ],
    myAnswer: 1,
    correctAnswer: 4,
    explanation: '글에서는 환경 보호와 경제 발전이 조화를 이루는 "지속 가능한 발전"의 개념을 설명하고 있습니다.',
    relatedConcept: '비문학 독해에서 중심 내용 파악하기',
    difficulty: '상',
    wrongDate: '2024-01-14',
    reviewed: false,
    retryCount: 0,
  },
]

// 과목별 색상
const subjectColors: { [key: string]: { bg: string; text: string } } = {
  수학: { bg: 'bg-blue-100', text: 'text-blue-700' },
  영어: { bg: 'bg-purple-100', text: 'text-purple-700' },
  국어: { bg: 'bg-green-100', text: 'text-green-700' },
  과학: { bg: 'bg-orange-100', text: 'text-orange-700' },
}

// 난이도별 색상
const difficultyColors: { [key: string]: string } = {
  상: 'bg-red-100 text-red-700',
  중: 'bg-yellow-100 text-yellow-700',
  하: 'bg-green-100 text-green-700',
}

export default function WrongAnswersPage() {
  const [filter, setFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<number[]>([])
  const [showAnswers, setShowAnswers] = useState<number[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // 필터링된 문제
  const filteredProblems = wrongAnswers.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'not_reviewed') return !p.reviewed
    if (filter === 'reviewed') return p.reviewed
    return p.subject === filter
  })

  // 통계
  const stats = {
    total: wrongAnswers.length,
    notReviewed: wrongAnswers.filter((p) => !p.reviewed).length,
    reviewed: wrongAnswers.filter((p) => p.reviewed).length,
  }

  // 확장 토글
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // 정답 표시 토글
  const toggleShowAnswer = (id: number) => {
    setShowAnswers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // 선택 토글
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // 전체 선택
  const selectAll = () => {
    if (selectedIds.length === filteredProblems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProblems.map((p) => p.id))
    }
  }

  return (
    <div className="p-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookX className="w-7 h-7 text-red-500" />
          {UI_TEXT.pageTitle}
        </h1>
        <p className="text-gray-500 mt-1">{UI_TEXT.pageSubtitle}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.totalWrongAnswers}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats.total}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <BookX className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.notReviewed}</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">
                {stats.notReviewed}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{UI_TEXT.reviewed}</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.reviewed}
                <span className="text-lg text-gray-400 ml-1">{UI_TEXT.problemCount}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 액션 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {UI_TEXT.allSubjects}
          </button>
          {Object.keys(subjectColors).map((subject) => (
            <button
              key={subject}
              onClick={() => setFilter(subject)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === subject ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {subject}
            </button>
          ))}
          <button
            onClick={() => setFilter('not_reviewed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'not_reviewed' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {UI_TEXT.notReviewed}
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === 'reviewed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {UI_TEXT.reviewed}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              <RotateCcw className="w-4 h-4" />
              {UI_TEXT.retrySelected} ({selectedIds.length})
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
            <Play className="w-4 h-4" />
            {UI_TEXT.retryAll}
          </button>
        </div>
      </div>

      {/* 전체 선택 */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.length === filteredProblems.length && filteredProblems.length > 0}
            onChange={selectAll}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">전체 선택 ({filteredProblems.length}개)</span>
        </label>
      </div>

      {/* 문제 목록 */}
      <div className="space-y-4">
        {filteredProblems.map((problem) => {
          const isExpanded = expandedIds.includes(problem.id)
          const isShowAnswer = showAnswers.includes(problem.id)
          const isSelected = selectedIds.includes(problem.id)
          const colors = subjectColors[problem.subject]

          return (
            <div
              key={problem.id}
              className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${
                isSelected ? 'border-blue-500' : 'border-gray-100'
              }`}
            >
              {/* 문제 헤더 */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(problem.id)}
                    className="w-5 h-5 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {problem.subject}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {problem.chapter}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${difficultyColors[problem.difficulty]}`}>
                        {UI_TEXT.difficulty}: {problem.difficulty}
                      </span>
                      {problem.reviewed ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {UI_TEXT.reviewed}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {UI_TEXT.notReviewed}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-800">{problem.question}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {UI_TEXT.wrongDate}: {problem.wrongDate}
                      </span>
                      {problem.retryCount > 0 && (
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          재시도: {problem.retryCount}회
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpand(problem.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* 확장 영역 */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  {/* 객관식 보기 */}
                  {problem.type === 'multiple_choice' && problem.choices && (
                    <div className="mb-4 space-y-2">
                      {problem.choices.map((choice) => {
                        const isMyAnswer = choice.id === problem.myAnswer
                        const isCorrect = choice.id === problem.correctAnswer
                        let bgColor = 'bg-white border-gray-200'
                        if (isShowAnswer) {
                          if (isCorrect) bgColor = 'bg-green-50 border-green-300'
                          else if (isMyAnswer) bgColor = 'bg-red-50 border-red-300'
                        }

                        return (
                          <div
                            key={choice.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 ${bgColor}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              isShowAnswer && isCorrect
                                ? 'bg-green-500 text-white'
                                : isShowAnswer && isMyAnswer
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {choice.id}
                            </span>
                            <span className="flex-1">{choice.text}</span>
                            {isShowAnswer && isMyAnswer && !isCorrect && (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            {isShowAnswer && isCorrect && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 단답형 */}
                  {problem.type === 'short_answer' && (
                    <div className="mb-4 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          {UI_TEXT.myAnswer}
                        </p>
                        <p className="font-medium text-red-700">{problem.myAnswer}</p>
                      </div>
                      {isShowAnswer && (
                        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                          <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {UI_TEXT.correctAnswer}
                          </p>
                          <p className="font-medium text-green-700">{problem.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 해설 */}
                  {isShowAnswer && (
                    <>
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-3">
                        <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {UI_TEXT.explanation}
                        </p>
                        <p className="text-gray-700">{problem.explanation}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                        <p className="text-xs font-medium text-yellow-600 mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          {UI_TEXT.relatedConcept}
                        </p>
                        <p className="text-gray-700">{problem.relatedConcept}</p>
                      </div>
                    </>
                  )}

                  {/* 버튼 */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleShowAnswer(problem.id)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      {isShowAnswer ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          {UI_TEXT.hideAnswer}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          {UI_TEXT.showAnswer}
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        {UI_TEXT.markAsReviewed}
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                        <RotateCcw className="w-4 h-4" />
                        {UI_TEXT.retry}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredProblems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookX className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">해당하는 오답이 없습니다.</p>
        </div>
      )}
    </div>
  )
}
