'use client'

import { Search } from 'lucide-react'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  title: string
  subtitle?: string
  userId?: string
}

export default function Header({ title, subtitle, userId = 'user-001' }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* 제목 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </div>

        {/* 우측 액션 */}
        <div className="flex items-center gap-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 알림 */}
          <NotificationBell userId={userId} />
        </div>
      </div>
    </header>
  )
}
