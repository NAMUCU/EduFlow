'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { Plus, Search, Filter, MoreVertical, Phone, Mail, GraduationCap } from 'lucide-react'

// 목업 데이터
const mockStudents = [
  { id: 1, name: '김민준', grade: '중2', school: '분당중학교', phone: '010-1234-5678', parent: '김영희', parentPhone: '010-8765-4321', score: 85, status: '정상', subjects: ['수학'] },
  { id: 2, name: '이서연', grade: '중3', school: '정자중학교', phone: '010-2345-6789', parent: '이철수', parentPhone: '010-9876-5432', score: 92, status: '우수', subjects: ['수학', '영어'] },
  { id: 3, name: '박지호', grade: '중2', school: '내정중학교', phone: '010-3456-7890', parent: '박미영', parentPhone: '010-8765-1234', score: 78, status: '주의', subjects: ['수학'] },
  { id: 4, name: '최수아', grade: '중1', school: '분당중학교', phone: '010-4567-8901', parent: '최정민', parentPhone: '010-7654-3210', score: 88, status: '정상', subjects: ['수학'] },
  { id: 5, name: '정현우', grade: '중3', school: '수내중학교', phone: '010-5678-9012', parent: '정은주', parentPhone: '010-6543-2109', score: 95, status: '우수', subjects: ['수학', '과학'] },
  { id: 6, name: '강지민', grade: '중2', school: '정자중학교', phone: '010-6789-0123', parent: '강민호', parentPhone: '010-5432-1098', score: 72, status: '주의', subjects: ['수학'] },
]

export default function StudentsPage() {
  const [students] = useState(mockStudents)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredStudents = students.filter(student =>
    student.name.includes(searchTerm) ||
    student.school.includes(searchTerm) ||
    student.grade.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case '우수': return 'bg-green-100 text-green-700'
      case '정상': return 'bg-blue-100 text-blue-700'
      case '주의': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <Header
        title="학생 관리"
        subtitle={`총 ${students.length}명의 학생을 관리하고 있습니다`}
      />

      <div className="p-8">
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="학생 이름, 학교, 학년 검색..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* 필터 */}
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              필터
            </button>
          </div>

          {/* 학생 추가 버튼 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            학생 등록
          </button>
        </div>

        {/* 학생 목록 테이블 */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">학생</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">학교/학년</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">연락처</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">학부모</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">최근 성적</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">상태</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.subjects.join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-900">{student.school}</p>
                        <p className="text-sm text-gray-500">{student.grade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {student.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">{student.parent}</p>
                      <p className="text-sm text-gray-500">{student.parentPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-900">{student.score}점</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 학생 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">새 학생 등록</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">학생 이름</label>
                    <input type="text" className="input" placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="label">학년</label>
                    <select className="input">
                      <option>중1</option>
                      <option>중2</option>
                      <option>중3</option>
                      <option>고1</option>
                      <option>고2</option>
                      <option>고3</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">학교</label>
                  <input type="text" className="input" placeholder="OO중학교" />
                </div>
                <div>
                  <label className="label">학생 연락처</label>
                  <input type="tel" className="input" placeholder="010-1234-5678" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">학부모 이름</label>
                    <input type="text" className="input" placeholder="홍부모" />
                  </div>
                  <div>
                    <label className="label">학부모 연락처</label>
                    <input type="tel" className="input" placeholder="010-8765-4321" />
                  </div>
                </div>
                <div>
                  <label className="label">수강 과목</label>
                  <div className="flex gap-2 flex-wrap">
                    {['수학', '영어', '국어', '과학'].map((subject) => (
                      <label key={subject} className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" className="w-4 h-4 rounded text-primary-500" />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    취소
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    등록하기
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
