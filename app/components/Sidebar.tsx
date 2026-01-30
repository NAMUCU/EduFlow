'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ScanLine,
  Printer,
  BookMarked,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  MessageSquare,
  Search,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/dashboard/problems', label: '문제 생성', icon: Sparkles },
  { href: '/dashboard/problems/saved', label: '저장된 문제', icon: BookMarked },
  { href: '/dashboard/search', label: '기출/교과서 검색', icon: Search },
  { href: '/dashboard/scan', label: '문제 스캔', icon: ScanLine },
  { href: '/dashboard/print', label: '문제지 출력', icon: Printer },
  { href: '/dashboard/classes', label: '반 관리', icon: GraduationCap },
  { href: '/dashboard/attendance', label: '출결 관리', icon: ClipboardCheck },
  { href: '/dashboard/students', label: '학생 관리', icon: Users },
  { href: '/dashboard/consultations', label: '상담 관리', icon: MessageSquare },
  { href: '/dashboard/notices', label: '공지사항', icon: Megaphone },
  { href: '/dashboard/academy', label: '학원 정보', icon: Building2 },
  { href: '/dashboard/reports', label: '학습 보고서', icon: BarChart3 },
  { href: '/dashboard/assignments', label: '과제 관리', icon: FileText },
]

const bottomMenuItems = [
  { href: '/dashboard/settings', label: '설정', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-secondary text-white flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">EduFlow</span>
        </Link>
      </div>

      {/* 메인 메뉴 */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          // 정확한 경로 매칭: 하위 경로가 있는 메뉴는 정확히 일치할 때만 활성화
          // 예: /dashboard/problems와 /dashboard/problems/saved가 둘 다 메뉴에 있으면
          // /dashboard/problems/saved 방문 시 /dashboard/problems는 비활성화
          const hasChildInMenu = menuItems.some(
            (other) => other.href !== item.href && other.href.startsWith(item.href + '/')
          )
          const isActive = hasChildInMenu
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 하단 메뉴 */}
      <div className="p-4 border-t border-white/10 space-y-1">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>

      {/* 사용자 정보 */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold">
            박
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">박정훈 원장님</p>
            <p className="text-xs text-gray-400 truncate">정훈수학학원</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
