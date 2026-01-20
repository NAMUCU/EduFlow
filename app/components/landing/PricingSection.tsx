'use client';

import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Basic',
    description: '소규모 학원에 적합',
    price: '49,000',
    period: '월',
    features: [
      '학생 50명까지',
      'AI 문제 생성 월 100회',
      '자동 채점 기능',
      '기본 학습 리포트',
      '출결 관리',
      '이메일 지원',
    ],
    cta: '무료 체험 시작',
    highlighted: false,
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    name: 'Pro',
    description: '성장하는 학원을 위한 선택',
    price: '99,000',
    period: '월',
    features: [
      '학생 200명까지',
      'AI 문제 생성 무제한',
      '자동 채점 + 피드백',
      '상세 학습 분석 리포트',
      '출결 관리 + 학부모 알림',
      '문자 발송 월 500건',
      '우선 기술 지원',
    ],
    cta: '가장 인기있는 플랜',
    highlighted: true,
    gradient: 'from-primary-500 to-blue-500',
  },
  {
    name: 'Enterprise',
    description: '대형 학원 및 프랜차이즈',
    price: '협의',
    period: '',
    features: [
      '무제한 학생',
      '모든 Pro 기능 포함',
      '멀티 브랜치 관리',
      '커스텀 리포트',
      'API 연동 지원',
      '전담 매니저 배정',
      'SLA 보장',
    ],
    cta: '문의하기',
    highlighted: false,
    gradient: 'from-purple-500 to-indigo-500',
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            요금제
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            학원 규모에 맞는 요금제를 선택하세요
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            모든 플랜은 14일 무료 체험을 제공합니다. 언제든지 업그레이드하거나 취소할 수 있어요.
          </p>
        </div>

        {/* 요금제 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-primary-500 to-blue-600 text-white shadow-2xl scale-105 z-10'
                  : 'bg-white border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl'
              }`}
            >
              {/* 인기 배지 */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                    <Star className="w-4 h-4 fill-current" />
                    BEST
                  </div>
                </div>
              )}

              {/* 플랜 이름 */}
              <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
                {plan.description}
              </p>

              {/* 가격 */}
              <div className="mb-8">
                <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price === '협의' ? plan.price : `${plan.price}원`}
                </span>
                {plan.period && (
                  <span className={`text-lg ${plan.highlighted ? 'text-white/70' : 'text-gray-500'}`}>
                    /{plan.period}
                  </span>
                )}
              </div>

              {/* 기능 목록 */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.highlighted ? 'bg-white/20' : 'bg-primary-100'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.highlighted ? 'text-white' : 'text-primary-600'}`} />
                    </div>
                    <span className={`text-sm ${plan.highlighted ? 'text-white/90' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA 버튼 */}
              <Link
                href={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                className={`block w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-white text-primary-600 hover:bg-gray-100'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* 추가 안내 */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            모든 가격은 부가세 별도입니다. 연간 결제 시 20% 할인이 적용됩니다.
          </p>
        </div>
      </div>
    </section>
  );
}
