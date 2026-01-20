'use client'

import { motion } from 'framer-motion'
import { Clock, FileQuestion, MapPin } from 'lucide-react'

const painPoints = [
  {
    icon: Clock,
    title: '매주 수십 종 교재 문제 선별에 수 시간...',
    description: '학생마다 수준이 다르고, 시험 범위도 제각각. 맞춤 문제를 고르다 보면 어느새 밤 11시.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: FileQuestion,
    title: '숫자만 나열된 학습 보고서, 뭐라고 설명하죠?',
    description: '"80점입니다"로는 부족해요. 학부모님은 "그래서 우리 아이 어떻게 해야 해요?"를 알고 싶어 하세요.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  {
    icon: MapPin,
    title: '우리 동네 기출은 반영 안 되고 엉뚱한 문제만...',
    description: '분당의 내신과 해남의 내신은 달라요. 지역/학교별 맥락 없는 AI는 현장에서 쓸모없죠.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
]

export default function PainPoints() {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title">이런 고민, 익숙하시죠?</h2>
          <p className="section-subtitle">
            학원 현장에서 매일 마주하는 문제들, 저희도 잘 알고 있습니다.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card group"
            >
              <div className={`w-14 h-14 ${point.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <point.icon className={`w-7 h-7 ${point.color}`} />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">
                {point.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
