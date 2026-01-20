'use client';

import {
  Sparkles,
  FileCheck,
  BarChart3,
  UserCheck,
  MessageSquare,
  Shield,
  Zap,
  Clock
} from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI 문제 생성',
    description: '교재 사진만 찍으면 AI가 자동으로 유사 문제를 생성합니다. 난이도와 유형을 자유롭게 조절할 수 있어요.',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: FileCheck,
    title: '자동 채점 시스템',
    description: '학생이 제출한 답안을 AI가 자동으로 채점합니다. 객관식은 물론 주관식도 정확하게 채점해요.',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    icon: BarChart3,
    title: '학습 리포트',
    description: '학생별 학습 현황을 한눈에 파악하세요. 취약 단원 분석과 성적 추이 그래프를 제공합니다.',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: UserCheck,
    title: '출결 관리',
    description: 'QR코드 또는 앱으로 간편하게 출결을 체크하세요. 학부모에게 자동으로 알림이 전송됩니다.',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    icon: MessageSquare,
    title: '학부모 소통',
    description: '학습 현황, 공지사항을 학부모에게 쉽게 전달하세요. 문자 및 앱 알림을 지원합니다.',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
  },
  {
    icon: Shield,
    title: '안전한 데이터 관리',
    description: '모든 데이터는 암호화되어 안전하게 보관됩니다. ISMS 인증 클라우드를 사용합니다.',
    color: 'from-slate-500 to-gray-500',
    bgColor: 'bg-slate-50',
    iconColor: 'text-slate-600',
  },
];

const highlights = [
  { icon: Zap, text: '설정 5분만에 시작' },
  { icon: Clock, text: '업무 시간 70% 절감' },
  { icon: Shield, text: '무료 체험 14일' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            주요 기능
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            학원 운영에 필요한 모든 기능
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            복잡한 학원 업무를 EduFlow가 간단하게 만들어 드립니다
          </p>
        </div>

        {/* 하이라이트 */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {highlights.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm"
            >
              <item.icon className="w-5 h-5 text-primary-500" />
              <span className="text-gray-700 font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
            >
              {/* 아이콘 */}
              <div className={`inline-flex p-4 rounded-xl ${feature.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>

              {/* 제목 */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>

              {/* 설명 */}
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* 호버 시 그라데이션 라인 */}
              <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${feature.color} rounded-full mt-6 transition-all duration-500`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
