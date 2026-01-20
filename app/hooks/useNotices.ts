import useSWR, { mutate } from 'swr'
import {
  AcademyNotice,
  NoticeListResponse,
} from '@/types/academy-notice'

// SWR fetcher 함수
const fetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || '데이터 조회 실패')
  }
  return data.data as NoticeListResponse
}

// 단일 공지사항 fetcher
const noticeFetcher = async (url: string) => {
  const response = await fetch(url)
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || '공지사항 조회 실패')
  }
  return data.data as AcademyNotice
}

// 공지사항 목록 SWR 키 생성
export function getNoticesKey(categoryFilter: string, targetFilter: string) {
  let url = '/api/academy-notices?'
  if (categoryFilter !== 'all') url += `category=${categoryFilter}&`
  if (targetFilter !== 'all') url += `target=${targetFilter}&`
  return url
}

// 공지사항 목록 조회 훅 (SWR 캐싱 및 자동 중복 제거)
export function useNotices(categoryFilter: string, targetFilter: string) {
  const key = getNoticesKey(categoryFilter, targetFilter)

  const { data, error, isLoading, mutate: revalidate } = useSWR<NoticeListResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // 5초 내 중복 요청 방지
    }
  )

  return {
    notices: data?.notices ?? [],
    pinnedCount: data?.pinnedCount ?? 0,
    total: data?.total ?? 0,
    isLoading,
    error,
    revalidate,
  }
}

// 단일 공지사항 조회 훅
export function useNotice(noticeId: string | null) {
  const { data, error, isLoading } = useSWR<AcademyNotice>(
    noticeId ? `/api/academy-notices/${noticeId}` : null,
    noticeFetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    notice: data,
    isLoading,
    error,
  }
}

// 공지사항 삭제
export async function deleteNotice(noticeId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/academy-notices/${noticeId}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    return data.success
  } catch {
    return false
  }
}

// 고정 토글
export async function toggleNoticePin(notice: AcademyNotice): Promise<boolean> {
  try {
    const response = await fetch(`/api/academy-notices/${notice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !notice.isPinned }),
    })
    const data = await response.json()
    return data.success
  } catch {
    return false
  }
}

// 공지사항 생성
export async function createNotice(formData: {
  title: string
  content: string
  category: string
  target: string
  isPinned: boolean
  authorId: string
  authorName: string
  academyId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/academy-notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await response.json()
    return { success: data.success, error: data.error }
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' }
  }
}

// 공지사항 수정
export async function updateNotice(
  noticeId: string,
  formData: {
    title: string
    content: string
    category: string
    target: string
    isPinned: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/academy-notices/${noticeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await response.json()
    return { success: data.success, error: data.error }
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' }
  }
}

// 캐시 무효화 유틸리티
export function invalidateNoticesCache(categoryFilter: string, targetFilter: string) {
  const key = getNoticesKey(categoryFilter, targetFilter)
  mutate(key)
}
