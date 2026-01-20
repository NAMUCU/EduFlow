'use client';

import Link from 'next/link';
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Youtube,
  MessageCircle
} from 'lucide-react';

const footerLinks = {
  product: {
    title: '제품',
    links: [
      { name: '주요 기능', href: '#features' },
      { name: '요금제', href: '#pricing' },
      { name: '고객 후기', href: '#testimonials' },
      { name: '업데이트 노트', href: '/updates' },
    ],
  },
  support: {
    title: '고객 지원',
    links: [
      { name: '도움말 센터', href: '/help' },
      { name: '자주 묻는 질문', href: '#faq' },
      { name: '문의하기', href: '/contact' },
      { name: 'API 문서', href: '/docs/api' },
    ],
  },
  company: {
    title: '회사',
    links: [
      { name: '회사 소개', href: '/about' },
      { name: '채용', href: '/careers' },
      { name: '블로그', href: '/blog' },
      { name: '파트너', href: '/partners' },
    ],
  },
  legal: {
    title: '약관',
    links: [
      { name: '이용약관', href: '/terms' },
      { name: '개인정보처리방침', href: '/privacy' },
      { name: '쿠키 정책', href: '/cookies' },
    ],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* CTA 섹션 */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              지금 바로 EduFlow를 시작하세요
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              14일 무료 체험으로 EduFlow의 모든 기능을 경험해 보세요.
              <br className="hidden sm:block" />
              신용카드 없이 바로 시작할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                데모 보기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 푸터 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* 로고 및 회사 정보 */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EduFlow</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              AI 기반 학원 관리 솔루션으로
              <br />
              교육의 미래를 함께 만들어갑니다.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>서울시 강남구 테헤란로 123</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>02-1234-5678</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>contact@eduflow.kr</span>
              </div>
            </div>
          </div>

          {/* 링크 섹션들 */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 하단 */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            {currentYear} EduFlow. All rights reserved.
          </p>

          {/* 소셜 미디어 */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <a
              href="https://pf.kakao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
