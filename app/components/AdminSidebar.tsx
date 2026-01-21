'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileStack,
  CreditCard,
  HeadphonesIcon,
  Megaphone,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react'

// 슈퍼 어드민용 메뉴 항목
const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/admin' },
  { icon: Building2, label: '학원 관리', href: '/admin/academies' },
  { icon: Users, label: '강사 관리', href: '/admin/teachers' },
  { icon: FileStack, label: '콘텐츠 관리', href: '/admin/contents' },
  { icon: CreditCard, label: '결제 관리', href: '/admin/payments' },
  { icon: HeadphonesIcon, label: '고객지원', href: '/admin/support' },
  { icon: Megaphone, label: '공지 관리', href: '/admin/notices' },
  { icon: Settings, label: '시스템 설정', href: '/admin/settings' },
  { icon: Sparkles, label: 'Few-shot 관리', href: '/admin/fewshot' },
]

const bottomMenuItems = [
  { icon: Settings, label: '계정 설정', href: '/admin/account' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-violet-700 via-indigo-700 to-indigo-800 text-white flex flex-col z-[100] md:translate-x-0 transition-transform">
      {/* 로고 */}
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">EduFlow</span>
            <span className="text-xs block text-violet-200">슈퍼 어드민</span>
          </div>
        </Link>
      </div>

      {/* 메인 메뉴 */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-violet-700 shadow-lg'
                      : 'text-violet-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-700' : ''}`} />
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-100 hover:bg-white/10 hover:text-white transition-all"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-violet-100 hover:bg-white/10 hover:text-white transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>

      {/* 사용자 정보 */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">관리자</p>
            <p className="text-xs text-violet-200 truncate">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
