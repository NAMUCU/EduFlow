'use client'

import { useState } from 'react'
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react'

// 목업 데이터
const attendanceSummary = {
  totalClasses: 20,
  attended: 19,
  absent: 1,
  late: 0,
  attendanceRate: 95,
}

const monthlyAttendance = {
  year: 2025,
  month: 1,
  days: [
    { date: 1, day: '수', status: null }, // null = 수업 없음
    { date: 2, day: '목', status: null },
    { date: 3, day: '금', status: 'present' },
    { date: 4, day: '토', status: null },
    { date: 5, day: '일', status: null },
    { date: 6, day: '월', status: 'present' },
    { date: 7, day: '화', status: 'present' },
    { date: 8, day: '수', status: null },
    { date: 9, day: '목', status: null },
    { date: 10, day: '금', status: 'present' },
    { date: 11, day: '토', status: null },
    { date: 12, day: '일', status: null },
    { date: 13, day: '월', status: 'present' },
    { date: 14, day: '화', status: 'absent' },
    { date: 15, day: '수', status: null },
    { date: 16, day: '목', status: null },
    { date: 17, day: '금', status: 'present' },
    { date: 18, day: '토', status: null },
    { date: 19, day: '일', status: null },
    { date: 20, day: '월', status: 'present' },
    { date: 21, day: '화', status: null }, // 미래
    { date: 22, day: '수', status: null },
    { date: 23, day: '목', status: null },
    { date: 24, day: '금', status: null },
    { date: 25, day: '토', status: null },
    { date: 26, day: '일', status: null },
    { date: 27, day: '월', status: null },
    { date: 28, day: '화', status: null },
    { date: 29, day: '수', status: null },
    { date: 30, day: '목', status: null },
    { date: 31, day: '금', status: null },
  ],
}

const attendanceHistory = [
  { date: '2025-01-20', day: '월요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
  { date: '2025-01-17', day: '금요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
  { date: '2025-01-14', day: '화요일', time: '16:00 ~ 18:00', status: 'absent', note: '병결 (감기)' },
  { date: '2025-01-13', day: '월요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
  { date: '2025-01-10', day: '금요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
  { date: '2025-01-07', day: '화요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
  { date: '2025-01-06', day: '월요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
  { date: '2025-01-03', day: '금요일', time: '16:00 ~ 18:00', status: 'present', note: '' },
]

const classSchedule = [
  { day: '월요일', time: '16:00 ~ 18:00', subject: '수학 정규반' },
  { day: '화요일', time: '16:00 ~ 18:00', subject: '수학 심화반' },
  { day: '금요일', time: '16:00 ~ 18:00', subject: '수학 정규반' },
]

export default function ParentAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState({ year: 2025, month: 1 })

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-500'
      case 'absent':
        return 'bg-red-500'
      case 'late':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return '출석'
      case 'absent':
        return '결석'
      case 'late':
        return '지각'
      default:
        return '-'
    }
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">출결 현황</h1>
            <p className="text-gray-500 mt-1">김민준 학생의 출석 기록을 확인하세요</p>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* 출결 요약 */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <p className="text-indigo-200 text-sm mb-2">이번 달 출석률</p>
            <div className="flex items-end gap-4">
              <span className="text-5xl font-bold">{attendanceSummary.attendanceRate}</span>
              <span className="text-2xl mb-1">%</span>
            </div>
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${attendanceSummary.attendanceRate}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-gray-500">출석</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{attendanceSummary.attended}일</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-gray-500">결석</p>
            </div>
            <p className="text-3xl font-bold text-red-500">{attendanceSummary.absent}일</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <p className="text-sm text-gray-500">총 수업일</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{attendanceSummary.totalClasses}일</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* 출결 캘린더 */}
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">출결 캘린더</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(prev => ({ ...prev, month: prev.month - 1 }))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-700 min-w-[120px] text-center">
                  {currentMonth.year}년 {currentMonth.month}월
                </span>
                <button
                  onClick={() => setCurrentMonth(prev => ({ ...prev, month: prev.month + 1 }))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div
                  key={day}
                  className={`text-center py-2 text-sm font-medium ${
                    day === '일' ? 'text-red-500' : day === '토' ? 'text-blue-500' : 'text-gray-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-2">
              {/* 첫 주 빈칸 (1월 1일이 수요일) */}
              {[...Array(3)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {monthlyAttendance.days.map((day) => (
                <div
                  key={day.date}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center ${
                    day.status ? 'cursor-pointer hover:ring-2 hover:ring-indigo-300' : ''
                  } ${day.date === 20 ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <span className={`text-sm ${
                    day.day === '일' ? 'text-red-500' :
                    day.day === '토' ? 'text-blue-500' : 'text-gray-700'
                  }`}>
                    {day.date}
                  </span>
                  {day.status && (
                    <div className={`w-3 h-3 rounded-full mt-1 ${getStatusColor(day.status)}`} />
                  )}
                </div>
              ))}
            </div>

            {/* 범례 */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">출석</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">결석</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">지각</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <span className="text-sm text-gray-600">수업 없음</span>
              </div>
            </div>
          </div>

          {/* 수업 시간표 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              수업 시간표
            </h3>
            <div className="space-y-3">
              {classSchedule.map((schedule, index) => (
                <div key={index} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-indigo-700">{schedule.day}</span>
                    <span className="text-sm text-indigo-600">{schedule.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{schedule.subject}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">담당 선생님</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  박
                </div>
                <div>
                  <p className="font-medium text-gray-900">박정훈 선생님</p>
                  <p className="text-sm text-gray-500">정훈수학학원</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 출결 기록 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">상세 출결 기록</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">날짜</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">요일</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">시간</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">상태</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">비고</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{record.date}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600">{record.day}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {record.time}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'present'
                          ? 'bg-green-100 text-green-700'
                          : record.status === 'absent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getStatusIcon(record.status)}
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {record.note ? (
                        <span className="text-gray-600 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          {record.note}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
