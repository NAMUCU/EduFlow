'use client'

import { useState, useCallback, useContext } from 'react'
import Header from '@/components/Header'
import dynamic from 'next/dynamic'
import { AuthContext } from '@/contexts/AuthContext'

// bundle-dynamic-imports 규칙: AI 검수 패널은 조건부 렌더링이므로 lazy load
const ProblemReview = dynamic(
  () => import('@/components/problems/ProblemReview'),
  {
    loading: () => <div className="bg-gray-50 rounded-xl p-4 text-gray-500 text-center">검수 패널 로딩 중...</div>,
    ssr: false
  }
)
import { Sparkles, RefreshCw, Check, X, Edit3, Copy, Download, ChevronDown, AlertCircle, BookOpen, FileQuestion, Tag, Plus, Trash2, Settings2, Shield, Zap } from 'lucide-react'
import curriculumData from '@/data/curriculum.json'
import { ProblemReviewSummary } from '@/types/review'
import { ScoreBadge, StatusBadge, IssueCountBadge, ReviewStatus } from '@/components/problems/ReviewBadge'

interface Problem {
  id: number
  question: string
  answer: string
  solution: string
  difficulty: string
  type: string
  unit?: string
}

interface AdditionalRequest {
  id: number
  option: string
  value: string
}

const subjects = ['수학', '영어', '국어', '과학']

const unitsBySubject: Record<string, Record<string, string[]>> = {
  '수학': {
    '중1': ['정수와 유리수', '문자와 식', '일차방정식', '좌표평면과 그래프'],
    '중2': ['유리수와 순환소수', '식의 계산', '일차부등식', '연립방정식', '일차함수'],
    '중3': ['제곱근과 실수', '다항식의 곱셈', '이차방정식', '이차함수'],
  },
  '영어': {
    '중1': ['be동사와 일반동사', '명사와 관사', '형용사와 부사', '현재시제'],
    '중2': ['과거시제', '미래시제', '조동사', '비교급과 최상급', '접속사'],
    '중3': ['현재완료', '관계대명사', '수동태', '분사', '가정법'],
  },
  '국어': {
    '중1': ['품사의 이해', '문장 성분', '비유와 상징', '시의 이해'],
    '중2': ['문장의 짜임', '어휘의 체계', '소설의 이해', '논설문 쓰기'],
    '중3': ['국어의 역사', '문학의 갈래', '매체 언어', '토론과 협상'],
  },
  '과학': {
    '중1': ['힘과 운동', '물질의 상태 변화', '생물의 다양성', '지구계와 지권'],
    '중2': ['전기와 자기', '화학 반응', '소화와 순환', '수권과 해수'],
    '중3': ['운동과 에너지', '화학 반응의 규칙', '생식과 유전', '태양계'],
  },
}

const difficulties = ['하', '중', '상']
const problemTypes = ['객관식', '단답형', '계산형', '서술형']

// 추가 요청사항 옵션
const requestOptions = [
  { value: 'focus_concept', label: '특정 개념 집중', placeholder: '예: 판별식, 근의 공식' },
  { value: 'avoid_concept', label: '특정 개념 제외', placeholder: '예: 완전제곱식' },
  { value: 'problem_style', label: '문제 스타일', placeholder: '예: 계산 위주, 서술형 위주' },
  { value: 'difficulty_detail', label: '난이도 세부 요청', placeholder: '예: 상 난이도 중에서도 쉬운 편' },
  { value: 'mistake_prevention', label: '실수 방지 유형', placeholder: '예: 부호 실수, 계산 실수' },
  { value: 'real_life', label: '실생활 연계', placeholder: '예: 실생활 응용 문제 포함' },
  { value: 'step_by_step', label: '단계별 풀이', placeholder: '예: 풀이 과정 상세히' },
  { value: 'custom', label: '기타 요청', placeholder: '자유롭게 입력' },
]

export default function ProblemsPage() {
  const { user } = useContext(AuthContext)
  const academyId = user?.academyId || null

  const [mode, setMode] = useState<'unit' | 'mockexam'>('unit')
  const [step, setStep] = useState<'config' | 'generating' | 'result' | 'error'>('config')
  const [config, setConfig] = useState({
    subject: '수학',
    grade: '중3',
    unit: '이차방정식',
    difficulty: '중',
    type: '계산형',
    count: 3,
    school: '',
  })
  const [mockExamConfig, setMockExamConfig] = useState({
    subject: '수학',
    grade: '중3',
    count: 10,
    difficultyMix: true,
    typeMix: true,
  })
  const [additionalRequests, setAdditionalRequests] = useState<AdditionalRequest[]>([])
  const [showCurriculum, setShowCurriculum] = useState(false)
  const [generatedProblems, setGeneratedProblems] = useState<Problem[]>([])
  const [selectedProblems, setSelectedProblems] = useState<number[]>([])
  const [error, setError] = useState<string>('')

  // 검수 관련 상태
  const [showReview, setShowReview] = useState(false)
  const [reviewSummaries, setReviewSummaries] = useState<ProblemReviewSummary[]>([])
  // 자동 검수 설정
  const [autoReview, setAutoReview] = useState(false)
  // 일괄 검수 진행 상태
  const [isBatchReviewing, setIsBatchReviewing] = useState(false)
  // 저장 진행 상태
  const [isSaving, setIsSaving] = useState(false)

  // 현재 선택된 단원의 커리큘럼 정보
  const getCurrentCurriculum = () => {
    const subject = mode === 'unit' ? config.subject : mockExamConfig.subject
    const grade = mode === 'unit' ? config.grade : mockExamConfig.grade
    const unit = config.unit

    try {
      const subjectData = (curriculumData as any)[subject]
      if (!subjectData) return null
      const gradeData = subjectData[grade]
      if (!gradeData) return null
      return gradeData[unit] || null
    } catch {
      return null
    }
  }

  const curriculum = getCurrentCurriculum()

  const addRequest = () => {
    setAdditionalRequests([
      ...additionalRequests,
      { id: Date.now(), option: 'focus_concept', value: '' }
    ])
  }

  const updateRequest = (id: number, field: 'option' | 'value', value: string) => {
    setAdditionalRequests(additionalRequests.map(req =>
      req.id === id ? { ...req, [field]: value } : req
    ))
  }

  const removeRequest = (id: number) => {
    setAdditionalRequests(additionalRequests.filter(req => req.id !== id))
  }

  const handleGenerate = async () => {
    setStep('generating')
    setError('')
    setShowReview(false)
    setReviewSummaries([])

    try {
      const requestBody = mode === 'unit'
        ? {
            ...config,
            mode: 'unit',
            curriculum,
            additionalRequests: additionalRequests.filter(r => r.value.trim()),
            academyId, // RAG 검색용
            useRag: !!academyId, // academyId가 있으면 RAG 사용
          }
        : {
            ...mockExamConfig,
            mode: 'mockexam',
            units: unitsBySubject[mockExamConfig.subject]?.[mockExamConfig.grade] || [],
            additionalRequests: additionalRequests.filter(r => r.value.trim()),
            academyId, // RAG 검색용
            useRag: !!academyId, // academyId가 있으면 RAG 사용
          }

      const response = await fetch('/api/generate-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '문제 생성에 실패했습니다')
      }

      setGeneratedProblems(data.problems)
      setSelectedProblems(data.problems.map((p: Problem) => p.id))
      setStep('result')

      // 자동 검수가 활성화되어 있으면 검수 패널 표시
      if (autoReview) {
        setShowReview(true)
      }
    } catch (err: any) {
      console.error('문제 생성 에러:', err)
      setError(err.message || '문제 생성 중 오류가 발생했습니다')
      setStep('error')
    }
  }

  const toggleProblem = (id: number) => {
    setSelectedProblems(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  // 검수 완료 핸들러
  const handleReviewComplete = (summaries: ProblemReviewSummary[]) => {
    setReviewSummaries(summaries)
  }

  // 수정 제안 적용 핸들러
  const handleApplyCorrection = useCallback((
    problemId: number,
    correctedAnswer?: string,
    correctedSolution?: string
  ) => {
    setGeneratedProblems(prev =>
      prev.map(problem => {
        if (problem.id === problemId) {
          return {
            ...problem,
            answer: correctedAnswer || problem.answer,
            solution: correctedSolution || problem.solution,
          }
        }
        return problem
      })
    )
  }, [])

  // 일괄 검수 핸들러
  const handleBatchReview = useCallback(async () => {
    if (generatedProblems.length === 0) return

    setIsBatchReviewing(true)
    setShowReview(true)
  }, [generatedProblems.length])

  // 저장 핸들러
  const handleSave = async () => {
    if (selectedProblems.length === 0) {
      alert('저장할 문제를 선택해주세요.')
      return
    }

    setIsSaving(true)
    const currentConfig = mode === 'unit' ? config : mockExamConfig

    try {
      const problemsToSave = generatedProblems.filter(p => selectedProblems.includes(p.id))
      let savedCount = 0

      for (const problem of problemsToSave) {
        const response = await fetch('/api/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: currentConfig.subject,
            grade: currentConfig.grade,
            unit: problem.unit || (mode === 'unit' ? config.unit : null),
            question: problem.question,
            answer: problem.answer,
            solution: problem.solution,
            difficulty: problem.difficulty,
            type: problem.type,
            ai_generated: true,
          }),
        })

        if (response.ok) {
          savedCount++
        }
      }

      alert(`${savedCount}개의 문제가 저장되었습니다.`)
      // 저장 후 저장된 문제 페이지로 이동하거나 상태 초기화
    } catch (err) {
      console.error('저장 오류:', err)
      alert('문제 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 문제별 검수 상태 가져오기
  const getReviewStatusForProblem = useCallback((problemId: number): {
    status: ReviewStatus
    score?: number
    errors?: number
    warnings?: number
    suggestions?: number
  } => {
    const summary = reviewSummaries.find(s => s.problemId === problemId)
    if (!summary) {
      return { status: 'pending' }
    }

    // 이슈 분류
    const categorizeIssue = (issue: string): 'error' | 'warning' | 'suggestion' => {
      const lower = issue.toLowerCase()
      if (lower.includes('오류') || lower.includes('틀') || lower.includes('잘못')) {
        return 'error'
      }
      if (lower.includes('주의') || lower.includes('확인')) {
        return 'warning'
      }
      return 'suggestion'
    }

    const errors = summary.consensusIssues.filter(i => categorizeIssue(i) === 'error').length
    const warnings = summary.consensusIssues.filter(i => categorizeIssue(i) === 'warning').length
    const suggestions = summary.consensusSuggestions.length

    let status: ReviewStatus = 'completed'
    if (summary.averageAccuracy < 60 || errors > 0) {
      status = 'needs_revision'
    }

    return {
      status,
      score: summary.averageAccuracy,
      errors,
      warnings,
      suggestions,
    }
  }, [reviewSummaries])

  // 현재 과목/학년 가져오기
  const currentSubject = mode === 'unit' ? config.subject : mockExamConfig.subject
  const currentGrade = mode === 'unit' ? config.grade : mockExamConfig.grade

  return (
    <div>
      <Header
        title="AI 문제 생성"
        subtitle="Gemini AI가 맞춤형 문제를 생성해드립니다"
      />

      <div className="p-8">
        {step === 'config' && (
          <div className="max-w-2xl mx-auto">
            {/* 모드 선택 탭 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('unit')}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  mode === 'unit'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-bold">단원별 생성</p>
                  <p className="text-xs opacity-70">특정 단원의 문제만 집중 생성</p>
                </div>
              </button>
              <button
                onClick={() => setMode('mockexam')}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  mode === 'mockexam'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <FileQuestion className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-bold">모의고사 생성</p>
                  <p className="text-xs opacity-70">여러 단원 혼합 + 단원 태그</p>
                </div>
              </button>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  {mode === 'unit' ? (
                    <BookOpen className="w-6 h-6 text-primary-600" />
                  ) : (
                    <FileQuestion className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {mode === 'unit' ? '단원별 문제 생성' : '모의고사 생성'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {mode === 'unit'
                      ? '원하는 단원을 선택하면 AI가 문제를 생성합니다'
                      : '여러 단원에서 랜덤하게 문제를 출제합니다'}
                  </p>
                </div>
              </div>

              {mode === 'unit' ? (
                <div className="space-y-5">
                  {/* 과목 & 학년 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">과목</label>
                      <select
                        className="input"
                        value={config.subject}
                        onChange={(e) => {
                          const newSubject = e.target.value
                          const units = unitsBySubject[newSubject]?.[config.grade] || []
                          setConfig({ ...config, subject: newSubject, unit: units[0] || '' })
                        }}
                      >
                        {subjects.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">학년</label>
                      <select
                        className="input"
                        value={config.grade}
                        onChange={(e) => {
                          const newGrade = e.target.value
                          const units = unitsBySubject[config.subject]?.[newGrade] || []
                          setConfig({ ...config, grade: newGrade, unit: units[0] || '' })
                        }}
                      >
                        {Object.keys(unitsBySubject[config.subject] || {}).map(g => <option key={g}>{g}</option>)}
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
                      {(unitsBySubject[config.subject]?.[config.grade] || []).map(u => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  {/* 커리큘럼 정보 표시 */}
                  {curriculum && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <button
                        onClick={() => setShowCurriculum(!showCurriculum)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-blue-800">단원 커리큘럼 정보</span>
                        <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${showCurriculum ? 'rotate-180' : ''}`} />
                      </button>
                      {showCurriculum && (
                        <div className="mt-3 space-y-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">핵심 개념</p>
                            <div className="flex flex-wrap gap-1">
                              {curriculum.concepts?.map((c: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-white rounded text-blue-800">{c}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">주요 용어</p>
                            <div className="flex flex-wrap gap-1">
                              {curriculum.terms?.map((t: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-100 rounded text-blue-700">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                </div>
              ) : (
                /* 모의고사 생성 폼 */
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">과목</label>
                      <select
                        className="input"
                        value={mockExamConfig.subject}
                        onChange={(e) => setMockExamConfig({ ...mockExamConfig, subject: e.target.value })}
                      >
                        {subjects.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">학년</label>
                      <select
                        className="input"
                        value={mockExamConfig.grade}
                        onChange={(e) => setMockExamConfig({ ...mockExamConfig, grade: e.target.value })}
                      >
                        {Object.keys(unitsBySubject[mockExamConfig.subject] || {}).map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">출제 범위</label>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">
                        {mockExamConfig.grade} 전체 단원에서 랜덤 출제됩니다
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(unitsBySubject[mockExamConfig.subject]?.[mockExamConfig.grade] || []).map(u => (
                          <span key={u} className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label">문제 수</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="5"
                        max="25"
                        step="5"
                        value={mockExamConfig.count}
                        onChange={(e) => setMockExamConfig({ ...mockExamConfig, count: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-lg font-bold text-primary-600 w-16 text-center">
                        {mockExamConfig.count}문제
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">난이도 혼합</p>
                      <p className="text-sm text-gray-500">하/중/상 난이도를 골고루 출제</p>
                    </div>
                    <button
                      onClick={() => setMockExamConfig({ ...mockExamConfig, difficultyMix: !mockExamConfig.difficultyMix })}
                      className={`w-12 h-6 rounded-full transition-all ${
                        mockExamConfig.difficultyMix ? 'bg-primary-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        mockExamConfig.difficultyMix ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">문제 유형 혼합</p>
                      <p className="text-sm text-gray-500">객관식/단답형/서술형 등 다양하게 출제</p>
                    </div>
                    <button
                      onClick={() => setMockExamConfig({ ...mockExamConfig, typeMix: !mockExamConfig.typeMix })}
                      className={`w-12 h-6 rounded-full transition-all ${
                        mockExamConfig.typeMix ? 'bg-primary-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        mockExamConfig.typeMix ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* 추가 요청사항 섹션 */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900">추가 요청사항</span>
                    <span className="text-xs text-gray-400">(선택)</span>
                  </div>
                  <button
                    onClick={addRequest}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </div>

                {additionalRequests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    추가 요청사항이 없습니다. 위 버튼을 눌러 추가하세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {additionalRequests.map((req) => (
                      <div key={req.id} className="flex gap-2">
                        <select
                          className="input w-40 flex-shrink-0"
                          value={req.option}
                          onChange={(e) => updateRequest(req.id, 'option', e.target.value)}
                        >
                          {requestOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder={requestOptions.find(o => o.value === req.option)?.placeholder}
                          value={req.value}
                          onChange={(e) => updateRequest(req.id, 'value', e.target.value)}
                        />
                        <button
                          onClick={() => removeRequest(req.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 자동 검수 설정 */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">자동 AI 검수</p>
                      <p className="text-sm text-gray-500">문제 생성 후 자동으로 검수합니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoReview(!autoReview)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      autoReview ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      autoReview ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerate}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 mt-6"
              >
                {mode === 'unit' ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <FileQuestion className="w-5 h-5" />
                )}
                {mode === 'unit' ? '문제 생성하기' : '모의고사 생성하기'}
              </button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">문제를 생성하고 있습니다</h2>
            <p className="text-gray-500 mb-6">
              {mode === 'unit'
                ? `Gemini AI가 ${config.unit} 관련 문제를 만들고 있어요...`
                : `Gemini AI가 ${mockExamConfig.grade} 모의고사를 만들고 있어요...`}
            </p>
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

        {step === 'error' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">문제 생성 실패</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => setStep('config')}
              className="btn-primary"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {step === 'result' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 생성된 문제 목록 */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {mode === 'unit' ? '생성된 문제' : '모의고사'} ({generatedProblems.length}개)
                  </h2>
                  <p className="text-sm text-gray-500">
                    {mode === 'unit'
                      ? `${config.grade} ${config.unit} | 난이도: ${config.difficulty}`
                      : `${mockExamConfig.grade} ${mockExamConfig.subject} | 전 단원 혼합`}
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
                  <button
                    onClick={handleBatchReview}
                    disabled={isBatchReviewing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      showReview
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    } ${isBatchReviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Shield className="w-4 h-4" />
                    {reviewSummaries.length > 0 ? '검수 결과' : '일괄 검수'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || selectedProblems.length === 0}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {isSaving ? '저장 중...' : `저장 (${selectedProblems.length})`}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {generatedProblems.map((problem, index) => {
                  // 검수 결과에서 해당 문제 찾기
                  const reviewSummary = reviewSummaries.find(
                    (s) => s.problemId === problem.id
                  )
                  const hasIssues =
                    reviewSummary && reviewSummary.consensusIssues.length > 0

                  return (
                    <div
                      key={problem.id}
                      className={`card border-2 transition-all ${
                        selectedProblems.includes(problem.id)
                          ? hasIssues
                            ? 'border-orange-300 bg-orange-50/30'
                            : 'border-primary-500 bg-primary-50/30'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-4">
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

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-bold text-primary-600">문제 {index + 1}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                              {problem.difficulty}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                              {problem.type}
                            </span>
                            {mode === 'mockexam' && problem.unit && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {problem.unit}
                              </span>
                            )}
                            {/* 검수 결과 배지 - 개선된 UI */}
                            {reviewSummary ? (
                              <div className="flex items-center gap-1">
                                <ScoreBadge score={reviewSummary.averageAccuracy} size="sm" showIcon={false} />
                                {(getReviewStatusForProblem(problem.id).errors || 0) > 0 ||
                                 (getReviewStatusForProblem(problem.id).warnings || 0) > 0 ||
                                 (getReviewStatusForProblem(problem.id).suggestions || 0) > 0 ? (
                                  <IssueCountBadge
                                    errors={getReviewStatusForProblem(problem.id).errors}
                                    warnings={getReviewStatusForProblem(problem.id).warnings}
                                    suggestions={getReviewStatusForProblem(problem.id).suggestions}
                                    size="sm"
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <p className="text-gray-900 font-medium mb-4">{problem.question}</p>

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

                          {/* 검수 결과 표시 - 개선된 오류/경고/제안 분류 */}
                          {reviewSummary?.consensusIssues && reviewSummary.consensusIssues.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {/* 오류 */}
                              {reviewSummary.consensusIssues.filter(i =>
                                i.toLowerCase().includes('오류') ||
                                i.toLowerCase().includes('틀') ||
                                i.toLowerCase().includes('잘못')
                              ).length > 0 && (
                                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-xs font-medium text-red-700 flex items-center gap-1 mb-1">
                                    <AlertCircle className="w-3 h-3" />
                                    오류
                                  </p>
                                  <ul className="text-sm text-red-600">
                                    {reviewSummary.consensusIssues
                                      .filter(i =>
                                        i.toLowerCase().includes('오류') ||
                                        i.toLowerCase().includes('틀') ||
                                        i.toLowerCase().includes('잘못')
                                      )
                                      .map((issue, i) => (
                                        <li key={i}>{issue}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                              {/* 경고 */}
                              {reviewSummary.consensusIssues.filter(i =>
                                i.toLowerCase().includes('주의') ||
                                i.toLowerCase().includes('확인')
                              ).length > 0 && (
                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-xs font-medium text-yellow-700 flex items-center gap-1 mb-1">
                                    <AlertCircle className="w-3 h-3" />
                                    경고
                                  </p>
                                  <ul className="text-sm text-yellow-600">
                                    {reviewSummary.consensusIssues
                                      .filter(i =>
                                        i.toLowerCase().includes('주의') ||
                                        i.toLowerCase().includes('확인')
                                      )
                                      .map((issue, i) => (
                                        <li key={i}>{issue}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                              {/* 제안 */}
                              {reviewSummary.consensusIssues.filter(i =>
                                !i.toLowerCase().includes('오류') &&
                                !i.toLowerCase().includes('틀') &&
                                !i.toLowerCase().includes('잘못') &&
                                !i.toLowerCase().includes('주의') &&
                                !i.toLowerCase().includes('확인')
                              ).length > 0 && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-xs font-medium text-blue-700 flex items-center gap-1 mb-1">
                                    <Zap className="w-3 h-3" />
                                    제안
                                  </p>
                                  <ul className="text-sm text-blue-600">
                                    {reviewSummary.consensusIssues
                                      .filter(i =>
                                        !i.toLowerCase().includes('오류') &&
                                        !i.toLowerCase().includes('틀') &&
                                        !i.toLowerCase().includes('잘못') &&
                                        !i.toLowerCase().includes('주의') &&
                                        !i.toLowerCase().includes('확인')
                                      )
                                      .map((issue, i) => (
                                        <li key={i}>{issue}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {/* 수정 제안 적용 버튼 */}
                          {reviewSummary?.reviews?.some(r => r.correctedAnswer || r.correctedSolution) && (
                            <div className="mt-3">
                              <button
                                onClick={() => {
                                  const bestReview = reviewSummary.reviews
                                    .filter(r => r.correctedAnswer || r.correctedSolution)
                                    .sort((a, b) => b.accuracy - a.accuracy)[0]
                                  if (bestReview) {
                                    handleApplyCorrection(
                                      problem.id,
                                      bestReview.correctedAnswer,
                                      bestReview.correctedSolution
                                    )
                                  }
                                }}
                                className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                수정 제안 적용
                              </button>
                            </div>
                          )}
                        </div>

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
                  )
                })}
              </div>
            </div>

            {/* 오른쪽: 검수 패널 */}
            {showReview && (
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <ProblemReview
                    problems={generatedProblems}
                    subject={currentSubject}
                    grade={currentGrade}
                    autoReview={autoReview}
                    onReviewComplete={(summaries) => {
                      handleReviewComplete(summaries)
                      setIsBatchReviewing(false)
                    }}
                    onApplyCorrection={handleApplyCorrection}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
