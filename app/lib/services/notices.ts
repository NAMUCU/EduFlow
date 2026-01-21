/**
 * 공지사항 관리 서비스 - Supabase notices 테이블 CRUD
 */
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

export interface Notice {
  id: string
  academy_id: string
  title: string
  content: string
  author_id: string
  is_pinned: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface NoticeWithAuthor extends Notice {
  author?: { id: string; name: string }
}

const mockNotices: NoticeWithAuthor[] = [
  { id: 'notice-001', academy_id: 'academy-001', title: '3월 휴원 안내', content: '3월 1일은 삼일절로 휴원합니다.', author_id: 'user-001', is_pinned: true, is_published: true, published_at: '2024-02-25T09:00:00Z', created_at: '2024-02-25T09:00:00Z', updated_at: '2024-02-25T09:00:00Z', author: { id: 'user-001', name: '박원장' } },
  { id: 'notice-002', academy_id: 'academy-001', title: '신규 강좌 개설 안내', content: '4월부터 코딩 강좌가 개설됩니다. 많은 관심 부탁드립니다.', author_id: 'user-001', is_pinned: false, is_published: true, published_at: '2024-02-20T10:00:00Z', created_at: '2024-02-20T10:00:00Z', updated_at: '2024-02-20T10:00:00Z', author: { id: 'user-001', name: '박원장' } },
  { id: 'notice-003', academy_id: 'academy-001', title: '여름방학 특강 준비중', content: '상세 내용은 추후 공지 예정', author_id: 'user-001', is_pinned: false, is_published: false, published_at: null, created_at: '2024-02-28T11:00:00Z', updated_at: '2024-02-28T11:00:00Z', author: { id: 'user-001', name: '박원장' } },
]

export async function getNotices(filter: { academyId: string; isPublished?: boolean; isPinned?: boolean; search?: string; limit?: number; offset?: number }) {
  if (!isSupabaseConfigured()) {
    let f = [...mockNotices]
    if (filter.isPublished !== undefined) f = f.filter(x => x.is_published === filter.isPublished)
    if (filter.isPinned !== undefined) f = f.filter(x => x.is_pinned === filter.isPinned)
    if (filter.search) { const s = filter.search.toLowerCase(); f = f.filter(x => x.title.toLowerCase().includes(s) || x.content.toLowerCase().includes(s)) }
    f.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
    return { data: f.slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20)), total: f.length }
  }
  const supabase = createServerSupabaseClient()
  let q = supabase.from('notices').select('*, author:profiles(id, name)', { count: 'exact' }).eq('academy_id', filter.academyId)
  if (filter.isPublished !== undefined) q = q.eq('is_published', filter.isPublished)
  if (filter.isPinned !== undefined) q = q.eq('is_pinned', filter.isPinned)
  if (filter.search) q = q.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`)
  const { data, count, error } = await q.range(filter.offset || 0, (filter.offset || 0) + (filter.limit || 20) - 1).order('is_pinned', { ascending: false }).order('published_at', { ascending: false, nullsFirst: false })
  if (error) return { data: [], total: 0, error: error.message }
  return { data: data as NoticeWithAuthor[], total: count || 0 }
}

export async function getNotice(id: string) {
  if (!isSupabaseConfigured()) return { data: mockNotices.find(n => n.id === id) || null }
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('notices').select('*, author:profiles(id, name)').eq('id', id).single()
  return error ? { data: null, error: error.message } : { data: data as NoticeWithAuthor }
}

export async function createNotice(notice: Omit<Notice, 'id' | 'created_at' | 'updated_at'>) {
  if (!isSupabaseConfigured()) return { data: { id: `notice-${Date.now()}`, ...notice, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Notice }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('notices') as any).insert(notice).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function updateNotice(id: string, updates: Partial<Notice>) {
  if (!isSupabaseConfigured()) { const n = mockNotices.find(x => x.id === id); return n ? { data: { ...n, ...updates } as Notice } : { data: null, error: '없음' } }
  const supabase = createServerSupabaseClient()
  const { data, error } = await (supabase.from('notices') as any).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  return error ? { data: null, error: error.message } : { data }
}

export async function deleteNotice(id: string) {
  if (!isSupabaseConfigured()) return { success: true }
  const supabase = createServerSupabaseClient()
  const { error } = await (supabase.from('notices') as any).delete().eq('id', id)
  return error ? { success: false, error: error.message } : { success: true }
}

export async function publishNotice(id: string) {
  return updateNotice(id, { is_published: true, published_at: new Date().toISOString() })
}

export async function unpublishNotice(id: string) {
  return updateNotice(id, { is_published: false })
}

export async function pinNotice(id: string) {
  return updateNotice(id, { is_pinned: true })
}

export async function unpinNotice(id: string) {
  return updateNotice(id, { is_pinned: false })
}
