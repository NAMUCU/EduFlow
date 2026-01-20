'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: 'EduFlow를 사용하기 위해 특별한 장비가 필요한가요?',
    answer: '아니요, EduFlow는 웹 기반 서비스로 인터넷이 연결된 PC, 태블릿, 스마트폰에서 모두 사용할 수 있습니다. 별도의 프로그램 설치 없이 브라우저에서 바로 시작하세요.',
  },
  {
    question: 'AI가 생성한 문제의 품질은 어떤가요?',
    answer: 'EduFlow는 최신 AI 기술(Gemini, GPT-4, Claude)을 활용하여 교육 전문가 수준의 문제를 생성합니다. 생성된 문제는 자동 검수 시스템을 거치며, 필요시 직접 수정도 가능합니다.',
  },
  {
    question: '무료 체험 기간 동안 모든 기능을 사용할 수 있나요?',
    answer: '네, 14일 무료 체험 기간 동안 Pro 플랜의 모든 기능을 제한 없이 사용해 보실 수 있습니다. 신용카드 등록 없이 바로 시작할 수 있어요.',
  },
  {
    question: '기존에 사용하던 학생 데이터를 옮길 수 있나요?',
    answer: '물론입니다. Excel 파일로 학생 정보를 일괄 업로드할 수 있고, 기존 LMS나 학원 관리 시스템의 데이터도 마이그레이션을 지원합니다. 필요시 전담 팀이 도와드립니다.',
  },
  {
    question: '학부모가 앱을 설치해야 하나요?',
    answer: '학부모용 웹 페이지와 모바일 앱을 모두 제공합니다. 앱 설치를 원하지 않는 학부모님은 카카오톡 알림이나 문자로 정보를 받아보실 수 있어요.',
  },
  {
    question: '도입 후 사용 교육을 받을 수 있나요?',
    answer: '모든 플랜에서 온라인 튜토리얼과 가이드 문서를 제공합니다. Pro 이상 플랜은 화상 미팅을 통한 온보딩 교육을, Enterprise 플랜은 현장 방문 교육도 지원합니다.',
  },
  {
    question: '계약 기간이 있나요? 중간에 해지할 수 있나요?',
    answer: '월간 구독은 언제든지 해지할 수 있으며, 해지 시 다음 결제일부터 청구되지 않습니다. 연간 구독은 20% 할인이 적용되며, 중간 해지 시 잔여 기간에 대해 환불해 드립니다.',
  },
  {
    question: '데이터 보안은 어떻게 되나요?',
    answer: '모든 데이터는 AES-256 암호화로 안전하게 보호됩니다. AWS 한국 리전에서 호스팅되며, 정기적인 백업과 ISMS 인증 기준을 준수합니다.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-lg text-gray-600">
            궁금한 점이 있으시면 언제든 문의해 주세요
          </p>
        </div>

        {/* FAQ 아코디언 */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary-300"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 문의 안내 */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
          <MessageCircle className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            더 궁금한 점이 있으신가요?
          </h3>
          <p className="text-gray-600 mb-6">
            전문 상담팀이 친절하게 답변해 드립니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              1:1 문의하기
            </Link>
            <a
              href="tel:02-1234-5678"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              02-1234-5678
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
