'use client'

import { useState } from 'react'
import {
  Database,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  GraduationCap,
  FileText,
  Tag,
  Target,
  Lightbulb
} from 'lucide-react'

// 초기 커리큘럼 데이터 (실제로는 API에서 불러옴)
import initialCurriculumData from '@/data/curriculum.json'

interface CurriculumUnit {
  concepts: string[]
  objectives: string[]
  terms: string[]
  problemTypes: string[]
}

type CurriculumData = {
  [subject: string]: {
    [grade: string]: {
      [unit: string]: CurriculumUnit
    }
  }
}

export default function ContentsPage() {
  const [curriculumData, setCurriculumData] = useState<CurriculumData>(initialCurriculumData as CurriculumData)
  const [selectedSubject, setSelectedSubject] = useState<string>('수학')
  const [selectedGrade, setSelectedGrade] = useState<string>('중1')
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [editingUnit, setEditingUnit] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CurriculumUnit | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddUnitModal, setShowAddUnitModal] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')

  const subjects = Object.keys(curriculumData)
  const grades = selectedSubject ? Object.keys(curriculumData[selectedSubject] || {}) : []
  const units = selectedSubject && selectedGrade
    ? Object.keys(curriculumData[selectedSubject]?.[selectedGrade] || {})
    : []

  const filteredUnits = units.filter(u =>
    u.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentUnit = selectedSubject && selectedGrade && selectedUnit
    ? curriculumData[selectedSubject]?.[selectedGrade]?.[selectedUnit]
    : null

  const handleSelectUnit = (unit: string) => {
    setSelectedUnit(unit)
    setEditingUnit(null)
    setEditForm(null)
  }

  const handleStartEdit = () => {
    if (currentUnit) {
      setEditingUnit(selectedUnit)
      setEditForm({ ...currentUnit })
    }
  }

  const handleCancelEdit = () => {
    setEditingUnit(null)
    setEditForm(null)
  }

  const handleSaveEdit = () => {
    if (editForm && selectedSubject && selectedGrade && editingUnit) {
      setCurriculumData(prev => ({
        ...prev,
        [selectedSubject]: {
          ...prev[selectedSubject],
          [selectedGrade]: {
            ...prev[selectedSubject][selectedGrade],
            [editingUnit]: editForm
          }
        }
      }))
      setEditingUnit(null)
      setEditForm(null)
      // 실제로는 여기서 API 호출하여 저장
      alert('저장되었습니다. (실제 서비스에서는 DB에 저장됩니다)')
    }
  }

  const handleAddItem = (field: keyof CurriculumUnit) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: [...editForm[field], '']
      })
    }
  }

  const handleUpdateItem = (field: keyof CurriculumUnit, index: number, value: string) => {
    if (editForm) {
      const newArray = [...editForm[field]]
      newArray[index] = value
      setEditForm({
        ...editForm,
        [field]: newArray
      })
    }
  }

  const handleRemoveItem = (field: keyof CurriculumUnit, index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: editForm[field].filter((_, i) => i !== index)
      })
    }
  }

  const handleAddUnit = () => {
    if (newUnitName.trim() && selectedSubject && selectedGrade) {
      setCurriculumData(prev => ({
        ...prev,
        [selectedSubject]: {
          ...prev[selectedSubject],
          [selectedGrade]: {
            ...prev[selectedSubject][selectedGrade],
            [newUnitName.trim()]: {
              concepts: [],
              objectives: [],
              terms: [],
              problemTypes: []
            }
          }
        }
      }))
      setNewUnitName('')
      setShowAddUnitModal(false)
      setSelectedUnit(newUnitName.trim())
    }
  }

  const handleDeleteUnit = (unit: string) => {
    if (confirm(`"${unit}" 단원을 삭제하시겠습니까?`)) {
      setCurriculumData(prev => {
        const newData = { ...prev }
        delete newData[selectedSubject][selectedGrade][unit]
        return newData
      })
      if (selectedUnit === unit) {
        setSelectedUnit(null)
      }
    }
  }

  // 통계 계산
  const totalUnits = subjects.reduce((sum, subj) => {
    const grades = Object.keys(curriculumData[subj] || {})
    return sum + grades.reduce((gSum, grade) => {
      return gSum + Object.keys(curriculumData[subj][grade] || {}).length
    }, 0)
  }, 0)

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-gray-500">커리큘럼 데이터를 관리합니다 (과목/학년/단원별 개념, 용어, 학습목표)</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          전체 저장
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 과목</p>
            <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 학년</p>
            <p className="text-2xl font-bold text-gray-900">
              {subjects.reduce((sum, s) => sum + Object.keys(curriculumData[s] || {}).length, 0)}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">총 단원</p>
            <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">데이터 상태</p>
            <p className="text-lg font-bold text-green-600">정상</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* 왼쪽: 과목/학년/단원 트리 */}
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
                    setSelectedGrade(Object.keys(curriculumData[subject])[0] || '')
                    setSelectedUnit(null)
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
              <button
                onClick={() => setShowAddUnitModal(true)}
                className="text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
              </button>
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
              {filteredUnits.map(unit => (
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteUnit(unit)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {filteredUnits.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">단원이 없습니다</p>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 단원 상세/편집 */}
        <div className="col-span-3">
          {selectedUnit && currentUnit ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">{selectedSubject} &gt; {selectedGrade}</p>
                  <h2 className="text-xl font-bold text-gray-900">{selectedUnit}</h2>
                </div>
                {editingUnit ? (
                  <div className="flex gap-2">
                    <button onClick={handleCancelEdit} className="btn-secondary">
                      취소
                    </button>
                    <button onClick={handleSaveEdit} className="btn-primary flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      저장
                    </button>
                  </div>
                ) : (
                  <button onClick={handleStartEdit} className="btn-secondary flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    수정
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* 핵심 개념 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      핵심 개념
                    </h3>
                    {editingUnit && (
                      <button
                        onClick={() => handleAddItem('concepts')}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 추가
                      </button>
                    )}
                  </div>
                  {editingUnit && editForm ? (
                    <div className="space-y-2">
                      {editForm.concepts.map((concept, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={concept}
                            onChange={(e) => handleUpdateItem('concepts', i, e.target.value)}
                          />
                          <button
                            onClick={() => handleRemoveItem('concepts', i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUnit.concepts.map((concept, i) => (
                        <span key={i} className="px-3 py-1.5 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 학습 목표 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      학습 목표
                    </h3>
                    {editingUnit && (
                      <button
                        onClick={() => handleAddItem('objectives')}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 추가
                      </button>
                    )}
                  </div>
                  {editingUnit && editForm ? (
                    <div className="space-y-2">
                      {editForm.objectives.map((obj, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={obj}
                            onChange={(e) => handleUpdateItem('objectives', i, e.target.value)}
                          />
                          <button
                            onClick={() => handleRemoveItem('objectives', i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {currentUnit.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-500 mt-1">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 주요 용어 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      주요 용어
                    </h3>
                    {editingUnit && (
                      <button
                        onClick={() => handleAddItem('terms')}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 추가
                      </button>
                    )}
                  </div>
                  {editingUnit && editForm ? (
                    <div className="space-y-2">
                      {editForm.terms.map((term, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={term}
                            onChange={(e) => handleUpdateItem('terms', i, e.target.value)}
                          />
                          <button
                            onClick={() => handleRemoveItem('terms', i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUnit.terms.map((term, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          {term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 문제 유형 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      권장 문제 유형
                    </h3>
                    {editingUnit && (
                      <button
                        onClick={() => handleAddItem('problemTypes')}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 추가
                      </button>
                    )}
                  </div>
                  {editingUnit && editForm ? (
                    <div className="space-y-2">
                      {editForm.problemTypes.map((type, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={type}
                            onChange={(e) => handleUpdateItem('problemTypes', i, e.target.value)}
                          />
                          <button
                            onClick={() => handleRemoveItem('problemTypes', i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUnit.problemTypes.map((type, i) => (
                        <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>왼쪽에서 단원을 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 단원 추가 모달 */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">새 단원 추가</h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedSubject} &gt; {selectedGrade}에 추가됩니다
            </p>
            <input
              type="text"
              className="input mb-4"
              placeholder="단원명을 입력하세요"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddUnitModal(false)
                  setNewUnitName('')
                }}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleAddUnit}
                className="btn-primary flex-1"
                disabled={!newUnitName.trim()}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
