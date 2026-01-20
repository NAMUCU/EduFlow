'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X } from 'lucide-react';

const navLinks = [
  { name: '기능', href: '#features' },
  { name: '요금제', href: '#pricing' },
  { name: '고객후기', href: '#testimonials' },
  { name: 'FAQ', href: '#faq' },
];

export default function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isScrolled
                ? 'bg-gradient-to-br from-primary-500 to-blue-600'
                : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <BookOpen className={`w-6 h-6 ${isScrolled ? 'text-white' : 'text-white'}`} />
            </div>
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              EduFlow
            </span>
          </Link>

          {/* 데스크탑 네비게이션 */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`font-medium transition-colors duration-300 hover:opacity-80 ${
                  isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* 데스크탑 버튼 */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className={`font-medium transition-colors duration-300 ${
                isScrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white/90 hover:text-white'
              }`}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                isScrolled
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white text-primary-600 hover:bg-white/90'
              }`}
            >
              무료 체험
            </Link>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-xl transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-gray-700 hover:text-primary-600 font-medium py-2 transition-colors"
            >
              {link.name}
            </a>
          ))}
          <hr className="border-gray-200" />
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/login"
              className="text-center text-gray-700 hover:text-primary-600 font-medium py-2 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="text-center bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              무료 체험
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
