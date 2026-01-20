'use client'

import { Github, Mail, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="section-container py-0">
        <div className="grid md:grid-cols-4 gap-8">
          {/* 브랜드 */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              <span className="gradient-text bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
                EduFlow
              </span>
            </h3>
            <p className="text-gray-400 mb-4 max-w-md">
              AI가 선생님을 대체하지 않습니다. 더 돋보이게 만듭니다.
              <br />
              중소형 학원을 위한 맞춤형 문제 생성 & 학습 관리 플랫폼
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@eduflow.kr"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 링크 */}
          <div>
            <h4 className="font-bold mb-4">서비스</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  기능 소개
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  요금제
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  자주 묻는 질문
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">회사</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  소개
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  문의하기
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 EduFlow. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#privacy" className="hover:text-white transition-colors">
              개인정보처리방침
            </a>
            <a href="#terms" className="hover:text-white transition-colors">
              이용약관
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
