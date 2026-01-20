'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-blue-400" />

      {/* 장식용 도형들 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-300/15 rounded-full blur-2xl animate-pulse-slow" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 배지 */}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-white/90 text-sm font-medium">AI 기반 학원 관리 솔루션</span>
        </div>

        {/* 메인 타이틀 */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
          학원 운영의 모든 것,
          <br />
          <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            EduFlow
          </span>
          로 한번에
        </h1>

        {/* 서브 타이틀 */}
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-slide-up-delayed">
          AI 문제 생성부터 자동 채점, 학습 리포트, 출결 관리까지
          <br className="hidden sm:block" />
          학원 운영에 필요한 모든 기능을 하나의 플랫폼에서
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-more-delayed">
          <Link
            href="/signup"
            className="group flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            무료로 시작하기
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#features"
            className="flex items-center gap-2 text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
          >
            기능 살펴보기
          </Link>
        </div>

        {/* 신뢰 지표 */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-in-delayed">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-white/70 text-sm">등록된 학원</p>
          </div>
          <div className="w-px h-12 bg-white/20 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">50,000+</p>
            <p className="text-white/70 text-sm">생성된 문제</p>
          </div>
          <div className="w-px h-12 bg-white/20 hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-white">98%</p>
            <p className="text-white/70 text-sm">고객 만족도</p>
          </div>
        </div>
      </div>

      {/* 스크롤 다운 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/70 rounded-full animate-scroll-indicator" />
        </div>
      </div>
    </section>
  );
}
