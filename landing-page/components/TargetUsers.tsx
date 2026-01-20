'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, User, Users, GraduationCap, ChevronRight } from 'lucide-react'

const targets = [
  {
    id: 'academy',
    icon: Building2,
    title: '학원 원장님',
    subtitle: '중소형 학원 운영',
    highlight: '65명 학생 관리, 밤 11시까지 채점... 이제 그만하세요',
    painPoints: [
      '매주 수십 종 교재 문제 선별에 수 시간',
      '학생별 취약점 파악 후 맞춤 문제 출제 불가',
      '채점과 오답 정리 반복 작업',
    ],
    solution: 'EduFlow가 문제 선별, 채점, 분석을 자동화합니다. 선생님은 수업과 상담에 집중하세요.',
    color: 'bg-violet-500',
  },
  {
    id: 'tutor',
    icon: User,
    title: '1인 과외 선생님',
    subtitle: '프리랜서 강사',
    highlight: '수업 준비 시간 > 실제 수업 시간? 역전시켜 드립니다',
    painPoints: [
      '하루 4-5타임 과외, 이동 시간까지',
      '매주 학부모 보고서 작성 부담',
      '체계적 커리큘럼 운영 어려움',
    ],
    solution: 'AI가 문제 생성과 보고서 작성을 도와드려요. 선생님의 노하우를 시스템화하세요.',
    color: 'bg-emerald-500',
  },
  {
    id: 'parent',
    icon: Users,
    title: '학부모님',
    subtitle: '자녀 학습 관리',
    highlight: '학원 다녀도 뭘 배우는지 모르셨다면',
    painPoints: [
      '맞벌이라 아이 학습 관리에 신경 못 씀',
      '학원 2년째 다녀도 성적은 그대로',
      '아이 취약점이 뭔지, 어디서부터 도와줘야 할지 모름',
    ],
    solution: '"80점"이 아니라 "오늘 아이에게 어떤 말을 해주면 좋을지" 알려드려요.',
    color: 'bg-blue-500',
  },
  {
    id: 'student',
    icon: GraduationCap,
    title: '학생',
    subtitle: '자기주도학습',
    highlight: '오답노트 3일 만에 포기? 자동으로 만들어 드립니다',
    painPoints: [
      '모르는 문제 즉시 해결 불가',
      '취약 단원 반복 학습 비효율',
      '오답노트 관리 포기',
    ],
    solution: '"왜 틀렸는지" 시각적으로 보여드리고, 다음에 뭘 공부해야 하는지 안내해요.',
    color: 'bg-orange-500',
  },
]

export default function TargetUsers() {
  const [activeTarget, setActiveTarget] = useState(targets[0])

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">누구를 위한 서비스인가요?</h2>
          <p className="section-subtitle">
            학원 선생님부터 학생까지, 모두를 위한 솔루션
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* 탭 선택 */}
          <div className="lg:col-span-2 space-y-3">
            {targets.map((target) => (
              <motion.button
                key={target.id}
                onClick={() => setActiveTarget(target)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                  activeTarget.id === target.id
                    ? 'bg-white shadow-lg border-2 border-primary-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${target.color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
                    <target.icon className={`w-6 h-6 ${target.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-secondary">{target.title}</h4>
                    <p className="text-sm text-gray-500">{target.subtitle}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    activeTarget.id === target.id ? 'text-primary-500 rotate-90' : 'text-gray-300'
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>

          {/* 상세 내용 */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTarget.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="card h-full"
              >
                <div className={`inline-flex items-center gap-2 ${activeTarget.color} bg-opacity-10 text-sm font-medium px-4 py-2 rounded-full mb-4`}>
                  <activeTarget.icon className={`w-4 h-4 ${activeTarget.color.replace('bg-', 'text-')}`} />
                  <span className={activeTarget.color.replace('bg-', 'text-')}>{activeTarget.title}</span>
                </div>

                <h3 className="text-2xl font-bold text-secondary mb-6">
                  {activeTarget.highlight}
                </h3>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    현재 겪고 계신 문제
                  </h4>
                  <ul className="space-y-2">
                    {activeTarget.painPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-600">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`${activeTarget.color} bg-opacity-5 rounded-2xl p-5`}>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    EduFlow의 솔루션
                  </h4>
                  <p className={`${activeTarget.color.replace('bg-', 'text-')} font-medium`}>
                    {activeTarget.solution}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
