'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  PenTool,
  BarChart3,
  BookX,
  LogOut,
  Settings,
  GraduationCap,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// 학생용 메뉴 항목
const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/student' },
  { icon: PenTool, label: '문제 풀기', href: '/student/solve' },
  { icon: BarChart3, label: '내 성적', href: '/student/grades' },
  { icon: BookX, label: '오답노트', href: '/student/wrong-answers' },
]

const bottomMenuItems = [
  { icon: Settings, label: '설정', href: '/student/settings' },
]

export default function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white flex flex-col z-[100] md:translate-x-0 transition-transform">
      {/* 로고 */}
      <div className="p-6 border-b border-white/10">
        <Link href="/student" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">EduFlow</span>
            <span className="text-xs block text-blue-200">학생용</span>
          </div>
        </Link>
      </div>

      {/* 메인 메뉴 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/student' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive ? <ChevronRight className="w-4 h-4 ml-auto" /> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 메뉴 */}
      <div className="p-4 border-t border-white/10 space-y-1">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>

      {/* 사용자 정보 */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">김민준</p>
            <p className="text-xs text-blue-200 truncate">중등 3학년</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
