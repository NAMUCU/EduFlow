'use client'

import { motion } from 'framer-motion'
import { Zap, MapPinned, Users, ClipboardList, Eye, X, Check } from 'lucide-react'

const solutions = [
  {
    icon: Zap,
    keyword: 'Zero-Entry',
    before: '새 플랫폼 강요',
    after: '기존 도구 안에서 작동',
    description: '엑셀, 카톡, 노션 등 이미 쓰고 계신 도구 안에서 AI가 조용히 작동합니다. 새로운 시스템을 배울 필요 없어요.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: MapPinned,
    keyword: 'Hyper-Local',
    before: '무한 문제 양산',
    after: '우리 동네 기출 반영',
    description: '지역과 학교별 기출 경향을 완벽하게 반영합니다. "나올 법한" 문제만 골라서 생성해요.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Users,
    keyword: 'Assistant',
    before: 'AI가 선생님 대체',
    after: '선생님을 더 돋보이게 보조',
    description: 'AI는 반복 작업만 처리하고, 전문성과 판단은 선생님의 몫으로 남깁니다. 선생님의 권위를 높여드려요.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: ClipboardList,
    keyword: 'Action Plan',
    before: '숫자 중심 리포트',
    after: '실천 가이드 제공',
    description: '"80점"이 아니라 "다음에 뭘 해야 하는지" 알려드려요. 학부모님과 대화할 거리가 생깁니다.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Eye,
    keyword: 'Visual Feedback',
    before: '텍스트 풀이만',
    after: '직관적 설명',
    description: '"왜 틀렸는지"를 시각적으로 보여드려요. 학생이 스스로 이해하고 납득할 수 있도록.',
    color: 'from-pink-500 to-rose-600',
  },
]

export default function Solutions() {
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
          <h2 className="section-title">EduFlow는 다릅니다</h2>
          <p className="section-subtitle">
            기존 에듀테크의 한계를 넘어, 현장에서 진짜 쓸 수 있는 솔루션을 만들었습니다.
          </p>
        </motion.div>

        <div className="space-y-6">
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8"
            >
              {/* 아이콘 */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.color} flex items-center justify-center flex-shrink-0`}>
                <solution.icon className="w-8 h-8 text-white" />
              </div>

              {/* 콘텐츠 */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`text-lg font-bold bg-gradient-to-r ${solution.color} bg-clip-text text-transparent`}>
                    {solution.keyword}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center gap-1 text-gray-400 line-through">
                      <X className="w-3 h-3" />
                      {solution.before}
                    </span>
                    <span className="text-gray-300">→</span>
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <Check className="w-3 h-3" />
                      {solution.after}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {solution.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
