'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileBarChart,
  GraduationCap,
  CalendarCheck,
  MessageSquare,
  LogOut,
  ChevronRight,
  User,
} from 'lucide-react'

// 메뉴 항목 정의
const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/parent' },
  { icon: FileBarChart, label: '학습 리포트', href: '/parent/reports' },
  { icon: GraduationCap, label: '성적 확인', href: '/parent/grades' },
  { icon: CalendarCheck, label: '출결 현황', href: '/parent/attendance' },
  { icon: MessageSquare, label: '상담 요청', href: '/parent/consultation' },
]

export default function ParentSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gradient-to-b from-indigo-900 to-purple-900 text-white min-h-screen flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-white/10">
        <Link href="/parent" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            <span className="text-xl font-bold">E</span>
          </div>
          <div>
            <span className="text-xl font-bold">EduFlow</span>
            <span className="text-xs block text-indigo-200">학부모 포털</span>
          </div>
        </Link>
      </div>

      {/* 자녀 선택 */}
      <div className="p-4 border-b border-white/10">
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs text-indigo-200 mb-2">자녀 선택</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
              김
            </div>
            <div className="flex-1">
              <p className="font-medium">김민준</p>
              <p className="text-xs text-indigo-200">중학교 2학년</p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-300" />
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/parent' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive ? <ChevronRight className="w-4 h-4 ml-auto" /> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">김영희님</p>
            <p className="text-xs text-indigo-300">학부모</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  )
}
