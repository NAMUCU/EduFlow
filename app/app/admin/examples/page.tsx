'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
  Target,
  HelpCircle
} from 'lucide-react'

// 예시 문제 데이터 불러오기
import initialExampleData from '@/data/example-problems.json'

// 타입 정의
interface ExampleProblem {
  id: string
  question: string
  answer: string
  solution: string
  difficulty: '하' | '중' | '상'
  type: string
  createdAt: string
  updatedAt: string
}

type ExampleData = {
  [subject: string]: {
    [grade: string]: {
      [unit: string]: ExampleProblem[]
    }
  }
}

// 난이도별 색상
const difficultyColors = {
  '하': 'bg-green-100 text-green-700',
  '중': 'bg-yellow-100 text-yellow-700',
  '상': 'bg-red-100 text-red-700'
}

// 품질 체크 함수
function checkQuality(problem: ExampleProblem): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 100

  // 문제 길이 체크
  if (problem.question.length < 10) {
    issues.push('문제가 너무 짧습니다')
    score -= 20
  }

  // 정답 체크
  if (!problem.answer || problem.answer.trim() === '') {
    issues.push('정답이 없습니다')
    score -= 30
  }

  // 풀이 체크
  if (!problem.solution || problem.solution.length < 20) {
    issues.push('풀이가 부족합니다')
    score -= 25
  }

  // 난이도 체크
  if (!problem.difficulty) {
    issues.push('난이도가 지정되지 않았습니다')
    score -= 10
  }

  // 유형 체크
  if (!problem.type || problem.type.trim() === '') {
    issues.push('문제 유형이 없습니다')
    score -= 15
  }

  return { score: Math.max(0, score), issues }
}

// 초기 빈 문제 템플릿
const emptyProblem: Omit<ExampleProblem, 'id' | 'createdAt' | 'updatedAt'> = {
  question: '',
  answer: '',
  solution: '',
  difficulty: '중',
  type: ''
}

export default function ExamplesPage() {
  const [exampleData, setExampleData] = useState<ExampleData>(initialExampleData as ExampleData)
  const [selectedSubject, setSelectedSubject] = useState<string>('수학')
  const [selectedGrade, setSelectedGrade] = useState<string>('중1')
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null)

  // 편집/추가 관련 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editingProblem, setEditingProblem] = useState<ExampleProblem | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newProblem, setNewProblem] = useState(emptyProblem)

  const subjects = Object.keys(exampleData)
  const grades = selectedSubject ? Object.keys(exampleData[selectedSubject] || {}) : []
  const units = selectedSubject && selectedGrade
    ? Object.keys(exampleData[selectedSubject]?.[selectedGrade] || {})
    : []

  const filteredUnits = units.filter(u =>
    u.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentProblems: ExampleProblem[] = selectedSubject && selectedGrade && selectedUnit
    ? exampleData[selectedSubject]?.[selectedGrade]?.[selectedUnit] || []
    : []

  // 단원 선택 핸들러
  const handleSelectUnit = (unit: string) => {
    setSelectedUnit(unit)
    setExpandedProblem(null)
    setIsEditing(false)
    setIsAdding(false)
  }

  // 문제 추가 시작
  const handleStartAdd = () => {
    setIsAdding(true)
    setNewProblem(emptyProblem)
  }

  // 문제 추가 저장
  const handleSaveNewProblem = () => {
    if (!selectedSubject || !selectedGrade || !selectedUnit) return
    if (!newProblem.question.trim()) {
      alert('문제 내용을 입력해주세요.')
      return
    }

    const now = new Date().toISOString()
    const newId = `${selectedSubject.slice(0, 4)}-${selectedGrade}-${Date.now()}`

    const problemToAdd: ExampleProblem = {
      ...newProblem,
      id: newId,
      createdAt: now,
      updatedAt: now
    }

    setExampleData(prev => ({
      ...prev,
      [selectedSubject]: {
        ...prev[selectedSubject],
        [selectedGrade]: {
          ...prev[selectedSubject][selectedGrade],
          [selectedUnit]: [
            ...(prev[selectedSubject]?.[selectedGrade]?.[selectedUnit] || []),
            problemToAdd
          ]
        }
      }
    }))

    setIsAdding(false)
    setNewProblem(emptyProblem)
    alert('예시 문제가 추가되었습니다.')
  }

  // 문제 수정 시작
  const handleStartEdit = (problem: ExampleProblem) => {
    setIsEditing(true)
    setEditingProblem({ ...problem })
    setExpandedProblem(problem.id)
  }

  // 문제 수정 저장
  const handleSaveEdit = () => {
    if (!editingProblem || !selectedSubject || !selectedGrade || !selectedUnit) return

    const updatedProblem = {
      ...editingProblem,
      updatedAt: new Date().toISOString()
    }

    setExampleData(prev => ({
      ...prev,
      [selectedSubject]: {
        ...prev[selectedSubject],
        [selectedGrade]: {
          ...prev[selectedSubject][selectedGrade],
          [selectedUnit]: prev[selectedSubject][selectedGrade][selectedUnit].map(p =>
            p.id === editingProblem.id ? updatedProblem : p
          )
        }
      }
    }))

    setIsEditing(false)
    setEditingProblem(null)
    alert('예시 문제가 수정되었습니다.')
  }

  // 문제 삭제
  const handleDelete = (problemId: string) => {
    if (!selectedSubject || !selectedGrade || !selectedUnit) return
    if (!confirm('이 예시 문제를 삭제하시겠습니까?')) return

    setExampleData(prev => ({
      ...prev,
      [selectedSubject]: {
        ...prev[selectedSubject],
        [selectedGrade]: {
          ...prev[selectedSubject][selectedGrade],
          [selectedUnit]: prev[selectedSubject][selectedGrade][selectedUnit].filter(p =>
            p.id !== problemId
          )
        }
      }
    }))

    if (expandedProblem === problemId) {
      setExpandedProblem(null)
    }
  }

  // 문제 복제
  const handleDuplicate = (problem: ExampleProblem) => {
    if (!selectedSubject || !selectedGrade || !selectedUnit) return

    const now = new Date().toISOString()
    const duplicatedProblem: ExampleProblem = {
      ...problem,
      id: `${problem.id}-copy-${Date.now()}`,
      question: problem.question + ' (복사본)',
      createdAt: now,
      updatedAt: now
    }

    setExampleData(prev => ({
      ...prev,
      [selectedSubject]: {
        ...prev[selectedSubject],
        [selectedGrade]: {
          ...prev[selectedSubject][selectedGrade],
          [selectedUnit]: [
            ...prev[selectedSubject][selectedGrade][selectedUnit],
            duplicatedProblem
          ]
        }
      }
    }))

    alert('문제가 복제되었습니다.')
  }

  // 통계 계산
  const totalProblems = subjects.reduce((sum, subj) => {
    const grades = Object.keys(exampleData[subj] || {})
    return sum + grades.reduce((gSum, grade) => {
      const units = Object.keys(exampleData[subj][grade] || {})
      return gSum + units.reduce((uSum, unit) => {
        return uSum + (exampleData[subj][grade][unit]?.length || 0)
      }, 0)
    }, 0)
  }, 0)

  // 권장 개수 미달 단원 수
  const insufficientUnits = subjects.reduce((sum, subj) => {
    const grades = Object.keys(exampleData[subj] || {})
    return sum + grades.reduce((gSum, grade) => {
      const units = Object.keys(exampleData[subj][grade] || {})
      return gSum + units.filter(unit =>
        (exampleData[subj][grade][unit]?.length || 0) < 3
      ).length
    }, 0)
  }, 0)

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예시 문제 관리</h1>
          <p className="text-gray-500">AI 문제 생성을 위한 Few-shot 예시 문제를 관리합니다</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => alert('전체 저장 기능은 DB 연동 시 구현됩니다.')}
        >
          <Save className="w-4 h-4" />
          전체 저장
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 예시 문제</p>
            <p className="text-2xl font-bold text-gray-900">{totalProblems}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">등록된 과목</p>
            <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">현재 단원 문제</p>
            <p className="text-2xl font-bold text-gray-900">{currentProblems.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            insufficientUnits > 0 ? 'bg-orange-100' : 'bg-green-100'
          }`}>
            <AlertCircle className={`w-6 h-6 ${
              insufficientUnits > 0 ? 'text-orange-600' : 'text-green-600'
            }`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">보충 필요 단원</p>
            <p className={`text-2xl font-bold ${
              insufficientUnits > 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {insufficientUnits}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* 왼쪽: 과목/학년/단원 선택 */}
        <div className="col-span-1 space-y-4">
          {/* 과목 선택 */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-500" />
              과목
            </h3>
            <div className="space-y-1">
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject)
                    setSelectedGrade(Object.keys(exampleData[subject])[0] || '')
                    setSelectedUnit(null)
                    setIsEditing(false)
                    setIsAdding(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedSubject === subject
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* 학년 선택 */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary-500" />
              학년
            </h3>
            <div className="space-y-1">
              {grades.map(grade => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade)
                    setSelectedUnit(null)
                    setIsEditing(false)
                    setIsAdding(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    selectedGrade === grade
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* 단원 목록 */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-500" />
                단원
              </h3>
            </div>
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="단원 검색..."
                className="input pl-9 py-2 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-1 max-h-64 overflow-auto">
              {filteredUnits.map(unit => {
                const problemCount = exampleData[selectedSubject]?.[selectedGrade]?.[unit]?.length || 0
                const isInsufficient = problemCount < 3

                return (
                  <div
                    key={unit}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer group ${
                      selectedUnit === unit
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => handleSelectUnit(unit)}
                  >
                    <span className="text-sm truncate flex-1">{unit}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isInsufficient
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {problemCount}개
                      </span>
                    </div>
                  </div>
                )
              })}
              {filteredUnits.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">단원이 없습니다</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                각 단원별 최소 3개 이상 권장
              </p>
            </div>
          </div>
        </div>

        {/* 오른쪽: 예시 문제 목록/편집 */}
        <div className="col-span-3">
          {selectedUnit ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">{selectedSubject} &gt; {selectedGrade}</p>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {selectedUnit}
                    {currentProblems.length < 3 && (
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        보충 필요
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  onClick={handleStartAdd}
                  className="btn-primary flex items-center gap-2"
                  disabled={isAdding}
                >
                  <Plus className="w-4 h-4" />
                  문제 추가
                </button>
              </div>

              {/* 문제 추가 폼 */}
              {isAdding && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    새 예시 문제 추가
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">문제</label>
                      <textarea
                        className="input min-h-24"
                        placeholder="문제를 입력하세요"
                        value={newProblem.question}
                        onChange={(e) => setNewProblem({ ...newProblem, question: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">정답</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="정답을 입력하세요"
                          value={newProblem.answer}
                          onChange={(e) => setNewProblem({ ...newProblem, answer: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                          <select
                            className="input"
                            value={newProblem.difficulty}
                            onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value as '하' | '중' | '상' })}
                          >
                            <option value="하">하</option>
                            <option value="중">중</option>
                            <option value="상">상</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="문제 유형"
                            value={newProblem.type}
                            onChange={(e) => setNewProblem({ ...newProblem, type: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">풀이</label>
                      <textarea
                        className="input min-h-32"
                        placeholder="상세한 풀이 과정을 입력하세요"
                        value={newProblem.solution}
                        onChange={(e) => setNewProblem({ ...newProblem, solution: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsAdding(false)}
                        className="btn-secondary"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveNewProblem}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 문제 목록 */}
              <div className="space-y-4">
                {currentProblems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>등록된 예시 문제가 없습니다</p>
                    <p className="text-sm mt-1">위의 &apos;문제 추가&apos; 버튼을 클릭하여 추가하세요</p>
                  </div>
                ) : (
                  currentProblems.map((problem, index) => {
                    const quality = checkQuality(problem)
                    const isExpanded = expandedProblem === problem.id
                    const isCurrentEditing = isEditing && editingProblem?.id === problem.id

                    return (
                      <div
                        key={problem.id}
                        className={`border rounded-xl overflow-hidden ${
                          isExpanded ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200'
                        }`}
                      >
                        {/* 문제 헤더 */}
                        <div
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedProblem(isExpanded ? null : problem.id)}
                        >
                          <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium truncate">
                              {problem.question.split('\n')[0]}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[problem.difficulty]}`}>
                                {problem.difficulty}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {problem.type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                quality.score >= 80 ? 'bg-green-100 text-green-700' :
                                quality.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {quality.score >= 80 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {quality.score}점
                              </span>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* 문제 상세 */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-4 bg-white">
                            {isCurrentEditing && editingProblem ? (
                              // 편집 모드
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">문제</label>
                                  <textarea
                                    className="input min-h-24"
                                    value={editingProblem.question}
                                    onChange={(e) => setEditingProblem({ ...editingProblem, question: e.target.value })}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">정답</label>
                                    <input
                                      type="text"
                                      className="input"
                                      value={editingProblem.answer}
                                      onChange={(e) => setEditingProblem({ ...editingProblem, answer: e.target.value })}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                                      <select
                                        className="input"
                                        value={editingProblem.difficulty}
                                        onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value as '하' | '중' | '상' })}
                                      >
                                        <option value="하">하</option>
                                        <option value="중">중</option>
                                        <option value="상">상</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                                      <input
                                        type="text"
                                        className="input"
                                        value={editingProblem.type}
                                        onChange={(e) => setEditingProblem({ ...editingProblem, type: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">풀이</label>
                                  <textarea
                                    className="input min-h-32"
                                    value={editingProblem.solution}
                                    onChange={(e) => setEditingProblem({ ...editingProblem, solution: e.target.value })}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setIsEditing(false)
                                      setEditingProblem(null)
                                    }}
                                    className="btn-secondary"
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="btn-primary flex items-center gap-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    저장
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // 보기 모드
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">문제</h4>
                                  <p className="text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                                    {problem.question}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">정답</h4>
                                    <p className="text-gray-900 bg-green-50 p-3 rounded-lg font-medium">
                                      {problem.answer}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">품질 체크</h4>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${
                                              quality.score >= 80 ? 'bg-green-500' :
                                              quality.score >= 50 ? 'bg-yellow-500' :
                                              'bg-red-500'
                                            }`}
                                            style={{ width: `${quality.score}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium">{quality.score}점</span>
                                      </div>
                                      {quality.issues.length > 0 && (
                                        <ul className="text-xs text-gray-600 space-y-1">
                                          {quality.issues.map((issue, i) => (
                                            <li key={i} className="flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3 text-orange-500" />
                                              {issue}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">풀이</h4>
                                  <p className="text-gray-700 whitespace-pre-line bg-blue-50 p-3 rounded-lg">
                                    {problem.solution}
                                  </p>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDuplicate(problem)
                                    }}
                                    className="btn-secondary flex items-center gap-2 text-sm"
                                  >
                                    <Copy className="w-4 h-4" />
                                    복제
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleStartEdit(problem)
                                    }}
                                    className="btn-secondary flex items-center gap-2 text-sm"
                                  >
                                    <Edit className="w-4 h-4" />
                                    수정
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(problem.id)
                                    }}
                                    className="btn-secondary flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    삭제
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center text-gray-400 min-h-96">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">왼쪽에서 단원을 선택하세요</p>
                <p className="text-sm mt-1">선택한 단원의 예시 문제를 확인하고 관리할 수 있습니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
