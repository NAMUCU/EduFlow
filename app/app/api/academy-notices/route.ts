import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  AcademyNotice,
  NoticeFilter,
  NoticeListResponse,
  CreateNoticeRequest,
  NoticeCategory,
  NoticeTarget,
  NoticeStatus,
} from '@/types/academy-notice';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'academy-notices.json');

/**
 * 공지사항 데이터 파일 읽기
 */
async function readNoticesData(): Promise<{ notices: AcademyNotice[] }> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('공지사항 데이터 파일 읽기 오류:', error);
    return { notices: [] };
  }
}

/**
 * 공지사항 데이터 파일 쓰기
 */
async function writeNoticesData(data: { notices: AcademyNotice[] }): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('공지사항 데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * GET /api/academy-notices
 * 공지사항 목록을 조회합니다.
 *
 * Query Parameters:
 * - category: 카테고리 필터 (general, schedule, event, exam, holiday, fee, urgent)
 * - target: 대상 필터 (all, students, parents, teachers)
 * - status: 상태 필터 (draft, published, archived)
 * - is_pinned: 고정 여부 필터 (true, false)
 * - search: 검색어 (제목, 내용)
 * - academy_id: 학원 ID (필수)
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 옵션 추출
    const filters: NoticeFilter = {
      category: (searchParams.get('category') as NoticeCategory) || undefined,
      target: (searchParams.get('target') as NoticeTarget) || undefined,
      status: (searchParams.get('status') as NoticeStatus) || undefined,
      isPinned: searchParams.get('is_pinned') !== null
        ? searchParams.get('is_pinned') === 'true'
        : undefined,
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('start_date') || undefined,
      endDate: searchParams.get('end_date') || undefined,
    };

    const academyId = searchParams.get('academy_id') || 'academy-001'; // 기본 학원
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    // 데이터 로드
    const data = await readNoticesData();
    let { notices } = data;

    // 학원별 공지사항 필터링
    notices = notices.filter((n) => n.academyId === academyId);

    // 상태 필터 (기본값: 게시됨만 표시)
    if (filters.status) {
      notices = notices.filter((n) => n.status === filters.status);
    } else {
      // 기본적으로 게시된 공지만 표시
      notices = notices.filter((n) => n.status === 'published');
    }

    // 카테고리 필터
    if (filters.category) {
      notices = notices.filter((n) => n.category === filters.category);
    }

    // 대상 필터
    if (filters.target) {
      notices = notices.filter((n) => n.target === filters.target || n.target === 'all');
    }

    // 고정 여부 필터
    if (filters.isPinned !== undefined) {
      notices = notices.filter((n) => n.isPinned === filters.isPinned);
    }

    // 검색어 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      notices = notices.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.content.toLowerCase().includes(searchLower)
      );
    }

    // 날짜 필터
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      notices = notices.filter((n) => new Date(n.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      notices = notices.filter((n) => new Date(n.createdAt) <= endDate);
    }

    // 정렬: 고정 공지 우선, 그 다음 생성일 기준 내림차순 (최신순)
    notices.sort((a, b) => {
      // 고정 공지 우선
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 같은 고정 상태라면 생성일 기준 정렬
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 고정된 공지 개수 계산
    const pinnedCount = notices.filter((n) => n.isPinned).length;

    // 전체 개수
    const total = notices.length;

    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = notices.slice(startIndex, endIndex);

    const response: NoticeListResponse = {
      notices: paginatedList,
      total,
      pinnedCount,
      page,
      pageSize,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('공지사항 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy-notices
 * 새 공지사항을 생성합니다.
 *
 * Request Body: CreateNoticeRequest
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNoticeRequest = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: '공지사항 제목은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { success: false, error: '공지사항 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { success: false, error: '카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.target) {
      return NextResponse.json(
        { success: false, error: '대상은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.authorId || !body.authorName) {
      return NextResponse.json(
        { success: false, error: '작성자 정보는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.academyId) {
      return NextResponse.json(
        { success: false, error: '학원 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readNoticesData();

    // 새 공지사항 ID 생성
    const newNoticeId = `notice-${Date.now()}`;
    const now = new Date().toISOString();

    // 상태 결정
    const status = body.status || 'published';
    const publishedAt = status === 'published' ? now : undefined;

    // 새 공지사항 객체 생성
    const newNotice: AcademyNotice = {
      id: newNoticeId,
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category,
      target: body.target,
      status: status,
      isPinned: body.isPinned || false,
      authorId: body.authorId,
      authorName: body.authorName,
      academyId: body.academyId,
      attachments: body.attachments,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: publishedAt,
    };

    // 데이터에 추가
    data.notices.push(newNotice);

    // 파일에 저장
    await writeNoticesData(data);

    return NextResponse.json({
      success: true,
      data: newNotice,
      message: '공지사항이 성공적으로 생성되었습니다.',
    });
  } catch (error) {
    console.error('공지사항 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
