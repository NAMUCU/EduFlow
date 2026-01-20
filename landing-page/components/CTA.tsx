'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary rounded-3xl p-8 md:p-16 text-center"
        >
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              선생님의 노하우를 시스템화하세요
            </h2>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              지금 시작하면, 다음 학기가 달라집니다.
              <br className="hidden md:block" />
              수업 준비 시간은 줄이고, 학생과의 시간은 늘려보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-white text-primary-700 hover:bg-gray-100 font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 text-lg">
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-full border-2 border-white/30 transition-all duration-300 flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5" />
                문의하기
              </button>
            </div>

            {/* 신뢰 지표 */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <p className="text-white/60 text-sm mb-4">이미 많은 학원에서 사용 중입니다</p>
              <div className="flex justify-center items-center gap-8 flex-wrap">
                {['정훈수학학원', '민지영어학원', '승우국어논술'].map((name, i) => (
                  <span key={i} className="text-white/40 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
