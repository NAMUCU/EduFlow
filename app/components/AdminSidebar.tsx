'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  HeadphonesIcon,
  Bell,
  Settings,
  LogOut,
  Database,
  ChevronRight,
  FileText,
  UserCog,
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/admin' },
  { icon: Building2, label: '학원 관리', href: '/admin/academies' },
  { icon: UserCog, label: '강사 관리', href: '/admin/teachers' },
  { icon: CreditCard, label: '결제/정산', href: '/admin/payments' },
  { icon: HeadphonesIcon, label: '고객 지원', href: '/admin/support' },
  { icon: Bell, label: '공지사항', href: '/admin/notices' },
  { icon: Database, label: '콘텐츠 관리', href: '/admin/contents' },
  { icon: FileText, label: '예시 문제', href: '/admin/examples' },
  { icon: Settings, label: '설정', href: '/admin/settings' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold">E</span>
          </div>
          <div>
            <span className="text-xl font-bold">EduFlow</span>
            <span className="text-xs block text-gray-400">Admin Console</span>
          </div>
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-4">
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
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 하단 */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">관리자</p>
            <p className="text-xs text-gray-500">admin@eduflow.kr</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  )
}
