'use client'

import { motion } from 'framer-motion'
import { Settings, Sparkles, Edit3, MessageSquare, Camera, BarChart3, FileText, ArrowRight } from 'lucide-react'

const workflowSteps = [
  {
    icon: Settings,
    label: '조건 입력',
    actor: '강사',
    description: '단원, 난이도, 학교 선택',
  },
  {
    icon: Sparkles,
    label: '문제 생성',
    actor: 'AI',
    description: 'Gemini로 맞춤 문제 생성',
  },
  {
    icon: Edit3,
    label: '편집/승인',
    actor: '강사',
    description: '선생님 스타일로 수정',
  },
  {
    icon: MessageSquare,
    label: '문자 발송',
    actor: '시스템',
    description: '학생에게 자동 전송',
  },
  {
    icon: Camera,
    label: '풀이 제출',
    actor: '학생',
    description: '손글씨 사진 업로드',
  },
  {
    icon: BarChart3,
    label: 'OCR & 분석',
    actor: 'AI',
    description: '자동 채점 및 취약점 분석',
  },
  {
    icon: FileText,
    label: '보고서 전달',
    actor: '시스템',
    description: '학부모/강사에게 전달',
  },
]

const actorColors: Record<string, string> = {
  '강사': 'bg-violet-100 text-violet-700',
  'AI': 'bg-emerald-100 text-emerald-700',
  '시스템': 'bg-blue-100 text-blue-700',
  '학생': 'bg-orange-100 text-orange-700',
}

export default function Workflow() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-secondary via-secondary-light to-primary-900 text-white overflow-hidden">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">이렇게 작동합니다</h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            문제 출제부터 보고서 전달까지, 한 번에 연결되는 워크플로우
          </p>
        </motion.div>

        {/* 데스크톱 플로우 */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* 연결선 */}
            <div className="absolute top-16 left-0 right-0 h-0.5 bg-white/20" />

            <div className="grid grid-cols-7 gap-4">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* 아이콘 원 */}
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                      <step.icon className="w-7 h-7 text-secondary" />
                    </div>
                  </div>

                  {/* 화살표 (마지막 제외) */}
                  {index < workflowSteps.length - 1 && (
                    <div className="absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)]">
                      <ArrowRight className="w-5 h-5 text-white/40 absolute right-0 -top-2.5" />
                    </div>
                  )}

                  {/* 텍스트 */}
                  <div className="text-center">
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-2 ${actorColors[step.actor]}`}>
                      {step.actor}
                    </span>
                    <h4 className="font-bold text-white mb-1">{step.label}</h4>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 모바일 플로우 */}
        <div className="lg:hidden space-y-4">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <step.icon className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${actorColors[step.actor]}`}>
                    {step.actor}
                  </span>
                  <h4 className="font-bold text-white">{step.label}</h4>
                </div>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
              {index < workflowSteps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-white/30 rotate-90 lg:rotate-0" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
