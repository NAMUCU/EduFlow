'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { Sparkles, RefreshCw, Check, X, Edit3, Copy, Download, ChevronDown } from 'lucide-react'

// 목업 생성된 문제
const mockGeneratedProblems = [
  {
    id: 1,
    question: '이차방정식 x² - 5x + 6 = 0의 두 근의 합을 구하시오.',
    answer: '5',
    solution: '근과 계수의 관계에 의해 두 근의 합 = -(-5)/1 = 5',
    difficulty: '중',
    type: '계산형',
  },
  {
    id: 2,
    question: '이차방정식 2x² + 3x - 2 = 0을 인수분해하여 풀이하시오.',
    answer: 'x = 1/2 또는 x = -2',
    solution: '2x² + 3x - 2 = (2x - 1)(x + 2) = 0\n따라서 x = 1/2 또는 x = -2',
    difficulty: '중',
    type: '서술형',
  },
  {
    id: 3,
    question: '이차방정식 x² - 4x + k = 0이 중근을 가질 때, 상수 k의 값을 구하시오.',
    answer: '4',
    solution: '중근 조건: 판별식 D = b² - 4ac = 0\n16 - 4k = 0\nk = 4',
    difficulty: '상',
    type: '계산형',
  },
]

const subjects = ['수학', '영어', '국어', '과학']
const mathUnits = {
  '중1': ['정수와 유리수', '문자와 식', '일차방정식', '좌표평면과 그래프'],
  '중2': ['유리수와 순환소수', '식의 계산', '일차부등식', '연립방정식', '일차함수'],
  '중3': ['제곱근과 실수', '다항식의 곱셈', '이차방정식', '이차함수'],
}
const difficulties = ['하', '중', '상']
const problemTypes = ['객관식', '단답형', '계산형', '서술형']

export default function ProblemsPage() {
  const [step, setStep] = useState<'config' | 'generating' | 'result'>('config')
  const [config, setConfig] = useState({
    subject: '수학',
    grade: '중3',
    unit: '이차방정식',
    difficulty: '중',
    type: '계산형',
    count: 3,
    school: '',
  })
  const [generatedProblems, setGeneratedProblems] = useState(mockGeneratedProblems)
  const [selectedProblems, setSelectedProblems] = useState<number[]>([1, 2, 3])

  const handleGenerate = () => {
    setStep('generating')
    // 실제로는 Gemini API 호출
    setTimeout(() => {
      setStep('result')
    }, 2000)
  }

  const toggleProblem = (id: number) => {
    setSelectedProblems(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <Header
        title="AI 문제 생성"
        subtitle="Gemini AI가 맞춤형 문제를 생성해드립니다"
      />

      <div className="p-8">
        {step === 'config' && (
          <div className="max-w-2xl mx-auto">
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">문제 생성 조건 설정</h2>
                  <p className="text-sm text-gray-500">원하는 조건을 선택하면 AI가 문제를 생성합니다</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 과목 & 학년 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">과목</label>
                    <select
                      className="input"
                      value={config.subject}
                      onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                    >
                      {subjects.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">학년</label>
                    <select
                      className="input"
                      value={config.grade}
                      onChange={(e) => setConfig({ ...config, grade: e.target.value })}
                    >
                      {Object.keys(mathUnits).map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {/* 단원 */}
                <div>
                  <label className="label">단원</label>
                  <select
                    className="input"
                    value={config.unit}
                    onChange={(e) => setConfig({ ...config, unit: e.target.value })}
                  >
                    {mathUnits[config.grade as keyof typeof mathUnits]?.map(u => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* 난이도 & 유형 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">난이도</label>
                    <div className="flex gap-2">
                      {difficulties.map(d => (
                        <button
                          key={d}
                          onClick={() => setConfig({ ...config, difficulty: d })}
                          className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${
                            config.difficulty === d
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">문제 유형</label>
                    <select
                      className="input"
                      value={config.type}
                      onChange={(e) => setConfig({ ...config, type: e.target.value })}
                    >
                      {problemTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* 문제 수 */}
                <div>
                  <label className="label">생성할 문제 수</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.count}
                      onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold text-primary-600 w-12 text-center">
                      {config.count}문제
                    </span>
                  </div>
                </div>

                {/* 학교 (선택) */}
                <div>
                  <label className="label">
                    학교 <span className="text-gray-400 font-normal">(선택 - 기출 경향 반영)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="예: 분당중학교"
                    value={config.school}
                    onChange={(e) => setConfig({ ...config, school: e.target.value })}
                  />
                </div>

                {/* 생성 버튼 */}
                <button
                  onClick={handleGenerate}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  문제 생성하기
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">문제를 생성하고 있습니다</h2>
            <p className="text-gray-500 mb-6">Gemini AI가 {config.unit} 관련 문제를 만들고 있어요...</p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div>
            {/* 상단 정보 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  생성된 문제 ({generatedProblems.length}개)
                </h2>
                <p className="text-sm text-gray-500">
                  {config.grade} {config.unit} | 난이도: {config.difficulty}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('config')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 생성
                </button>
                <button className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  선택 문제 저장 ({selectedProblems.length})
                </button>
              </div>
            </div>

            {/* 문제 목록 */}
            <div className="space-y-4">
              {generatedProblems.map((problem, index) => (
                <div
                  key={problem.id}
                  className={`card border-2 transition-all ${
                    selectedProblems.includes(problem.id)
                      ? 'border-primary-500 bg-primary-50/30'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 체크박스 */}
                    <button
                      onClick={() => toggleProblem(problem.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                        selectedProblems.includes(problem.id)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedProblems.includes(problem.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* 문제 내용 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-primary-600">문제 {index + 1}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {problem.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                          {problem.type}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-4">{problem.question}</p>

                      {/* 정답 & 풀이 */}
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                          정답 및 풀이 보기
                        </summary>
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">정답</span>
                            <p className="text-primary-600 font-bold">{problem.answer}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">풀이</span>
                            <p className="text-gray-700 whitespace-pre-line">{problem.solution}</p>
                          </div>
                        </div>
                      </details>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="수정">
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="복사">
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="삭제">
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
