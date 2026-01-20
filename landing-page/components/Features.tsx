'use client'

import { motion } from 'framer-motion'
import { Brain, Send, BarChart3, Sparkles, Camera, FileText } from 'lucide-react'

const features = [
  {
    step: '01',
    title: 'AI 문제 생성',
    description: '단원, 난이도, 학교만 선택하면 Gemini가 맞춤 문제를 생성하고, 멀티 LLM이 검수합니다.',
    icon: Brain,
    details: [
      { icon: Sparkles, text: 'Gemini 3.0 Pro 기반 생성' },
      { icon: FileText, text: 'GPT/Claude 멀티 검수' },
    ],
    color: 'bg-violet-500',
  },
  {
    step: '02',
    title: '간편한 배포',
    description: '문자 한 번으로 학생에게 전송. 학생은 손글씨 풀이 사진만 업로드하면 됩니다.',
    icon: Send,
    details: [
      { icon: Send, text: '문자/카톡으로 자동 발송' },
      { icon: Camera, text: 'OCR로 손글씨 자동 인식' },
    ],
    color: 'bg-emerald-500',
  },
  {
    step: '03',
    title: '스마트 분석',
    description: '자동 채점은 기본. 취약점 분석과 "다음에 뭘 해야 하는지" 실천 가이드까지.',
    icon: BarChart3,
    details: [
      { icon: BarChart3, text: '학생별 취약점 자동 도출' },
      { icon: FileText, text: '학부모용 "대화 거리" 보고서' },
    ],
    color: 'bg-blue-500',
  },
]

export default function Features() {
  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">선생님의 시간을 되찾아 드립니다</h2>
          <p className="section-subtitle">
            문제 출제부터 분석까지, 3단계로 끝나는 학습 관리
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* 연결선 (데스크톱) */}
              {index < features.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-8 h-0.5 bg-gray-200 z-0" />
              )}

              <div className="card h-full relative">
                {/* 스텝 번호 */}
                <div className={`absolute -top-4 -left-4 w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {feature.step}
                </div>

                {/* 아이콘 */}
                <div className="flex justify-center mb-6 pt-4">
                  <div className={`w-20 h-20 ${feature.color} bg-opacity-10 rounded-3xl flex items-center justify-center`}>
                    <feature.icon className={`w-10 h-10 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>

                {/* 콘텐츠 */}
                <h3 className="text-xl font-bold text-secondary text-center mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  {feature.description}
                </p>

                {/* 세부 기능 */}
                <div className="space-y-3">
                  {feature.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <detail.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{detail.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
