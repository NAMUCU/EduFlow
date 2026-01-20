'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { FileText, Send, Download, Eye, TrendingUp, TrendingDown, Minus, MessageSquare, Calendar, ChevronRight } from 'lucide-react'

// 목업 데이터
const mockReports = [
  {
    id: 1,
    student: { name: '김민준', grade: '중2', school: '분당중학교' },
    period: '2025년 1월 2주차',
    score: 85,
    prevScore: 78,
    trend: 'up',
    weakPoints: ['이차방정식의 판별식', '근과 계수의 관계'],
    strongPoints: ['인수분해', '이차방정식 기본 풀이'],
    actionPlan: '판별식 개념을 다시 복습하고, 관련 문제 10문제를 추가로 풀어보세요.',
    parentMessage: '민준이가 이번 주에 이차방정식 단원에서 7점이나 올랐어요! 특히 인수분해를 활용한 풀이를 잘 해내고 있습니다. 다만 판별식 부분은 아직 헷갈려하니, 주말에 같이 복습해주시면 좋겠어요.',
    sentAt: null,
    createdAt: '2025-01-19',
  },
  {
    id: 2,
    student: { name: '이서연', grade: '중3', school: '정자중학교' },
    period: '2025년 1월 2주차',
    score: 92,
    prevScore: 90,
    trend: 'up',
    weakPoints: ['피타고라스 정리 응용'],
    strongPoints: ['삼각형 닮음', '직각삼각형 성질'],
    actionPlan: '현재 수준이 우수합니다. 심화 문제로 도전해보세요.',
    parentMessage: '서연이가 꾸준히 좋은 성적을 유지하고 있어요! 삼각형 단원은 거의 완벽하게 이해하고 있습니다. 다음 주부터는 조금 더 어려운 심화 문제에 도전해볼 예정이에요.',
    sentAt: '2025-01-18',
    createdAt: '2025-01-17',
  },
  {
    id: 3,
    student: { name: '박지호', grade: '중2', school: '내정중학교' },
    period: '2025년 1월 2주차',
    score: 78,
    prevScore: 82,
    trend: 'down',
    weakPoints: ['연립방정식', '일차함수 그래프'],
    strongPoints: ['일차방정식'],
    actionPlan: '연립방정식 대입법부터 차근차근 다시 시작해봅시다.',
    parentMessage: '지호가 이번 주에 조금 힘들어했어요. 연립방정식 단원이 어렵게 느껴지는 것 같습니다. 하지만 기초는 탄탄하니 걱정 마세요. 이번 주말에 대입법 복습을 집중적으로 할 예정입니다.',
    sentAt: null,
    createdAt: '2025-01-19',
  },
]

export default function ReportsPage() {
  const [reports] = useState(mockReports)
  const [selectedReport, setSelectedReport] = useState<typeof mockReports[0] | null>(null)
  const [filterPeriod, setFilterPeriod] = useState('2025년 1월 2주차')

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendText = (score: number, prevScore: number) => {
    const diff = score - prevScore
    if (diff > 0) return `+${diff}점 상승`
    if (diff < 0) return `${diff}점 하락`
    return '변동 없음'
  }

  return (
    <div>
      <Header
        title="학습 보고서"
        subtitle="학생별 학습 현황을 분석하고 학부모님께 보고서를 발송합니다"
      />

      <div className="p-8">
        {/* 상단 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이번 주 보고서</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}건</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">발송 완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.sentAt).length}건
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">성적 향상</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.trend === 'up').length}명
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 점수</p>
              <p className="text-2xl font-bold text-gray-900">85점</p>
            </div>
          </div>
        </div>

        {/* 기간 선택 */}
        <div className="flex items-center gap-4 mb-6">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            className="input w-auto"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option>2025년 1월 2주차</option>
            <option>2025년 1월 1주차</option>
            <option>2024년 12월 4주차</option>
          </select>
          <button className="btn-primary ml-auto">
            전체 보고서 일괄 발송
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 보고서 목록 */}
          <div className="col-span-1 space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`card cursor-pointer transition-all ${
                  selectedReport?.id === report.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                      {report.student.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{report.student.name}</p>
                      <p className="text-xs text-gray-500">{report.student.grade} · {report.student.school}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{report.score}점</span>
                    {getTrendIcon(report.trend)}
                  </div>
                  {report.sentAt ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">발송됨</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">대기중</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 보고서 상세 */}
          <div className="col-span-2">
            {selectedReport ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedReport.student.name} 학습 보고서</h3>
                    <p className="text-sm text-gray-500">{selectedReport.period}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    {!selectedReport.sentAt && (
                      <button className="btn-primary flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        학부모 발송
                      </button>
                    )}
                  </div>
                </div>

                {/* 점수 요약 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-1">이번 점수</p>
                    <p className="text-3xl font-bold text-primary-600">{selectedReport.score}점</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-1">지난 점수</p>
                    <p className="text-3xl font-bold text-gray-400">{selectedReport.prevScore}점</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-sm text-gray-500 mb-1">변화</p>
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(selectedReport.trend)}
                      <p className={`text-xl font-bold ${
                        selectedReport.trend === 'up' ? 'text-green-600' :
                        selectedReport.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {getTrendText(selectedReport.score, selectedReport.prevScore)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 강점/약점 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-bold text-green-800 mb-2">💪 잘하는 부분</h4>
                    <ul className="space-y-1">
                      {selectedReport.strongPoints.map((point, i) => (
                        <li key={i} className="text-sm text-green-700">• {point}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <h4 className="font-bold text-red-800 mb-2">📚 보완할 부분</h4>
                    <ul className="space-y-1">
                      {selectedReport.weakPoints.map((point, i) => (
                        <li key={i} className="text-sm text-red-700">• {point}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 실천 가이드 */}
                <div className="p-4 bg-primary-50 rounded-xl mb-6">
                  <h4 className="font-bold text-primary-800 mb-2">🎯 다음 주 실천 가이드</h4>
                  <p className="text-primary-700">{selectedReport.actionPlan}</p>
                </div>

                {/* 학부모 메시지 */}
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h4 className="font-bold text-yellow-800 mb-2">💬 학부모님께 드리는 말씀</h4>
                  <p className="text-yellow-900 leading-relaxed">{selectedReport.parentMessage}</p>
                  <p className="text-xs text-yellow-600 mt-3">
                    * AI가 생성한 초안입니다. 발송 전 내용을 확인하고 수정할 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="card h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>왼쪽에서 학생을 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
