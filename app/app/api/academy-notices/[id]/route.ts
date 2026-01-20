import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AcademyNotice, UpdateNoticeRequest } from '@/types/academy-notice';

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
 * GET /api/academy-notices/[id]
 * 특정 공지사항을 조회합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const data = await readNoticesData();
    const noticeIndex = data.notices.findIndex((n) => n.id === id);

    if (noticeIndex === -1) {
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 조회수 증가
    data.notices[noticeIndex].viewCount += 1;

    // 파일에 저장
    await writeNoticesData(data);

    return NextResponse.json({
      success: true,
      data: data.notices[noticeIndex],
    });
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/academy-notices/[id]
 * 공지사항을 수정합니다.
 *
 * Request Body: UpdateNoticeRequest
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateNoticeRequest = await request.json();

    // 데이터 로드
    const data = await readNoticesData();
    const noticeIndex = data.notices.findIndex((n) => n.id === id);

    if (noticeIndex === -1) {
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const notice = data.notices[noticeIndex];

    // 필드 업데이트
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { success: false, error: '공지사항 제목은 필수입니다.' },
          { status: 400 }
        );
      }
      notice.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (!body.content.trim()) {
        return NextResponse.json(
          { success: false, error: '공지사항 내용은 필수입니다.' },
          { status: 400 }
        );
      }
      notice.content = body.content.trim();
    }

    if (body.category !== undefined) {
      notice.category = body.category;
    }

    if (body.target !== undefined) {
      notice.target = body.target;
    }

    if (body.status !== undefined) {
      // 상태가 published로 변경되면 게시일 기록
      if (body.status === 'published' && notice.status !== 'published') {
        notice.publishedAt = now;
      }
      notice.status = body.status;
    }

    if (body.isPinned !== undefined) {
      notice.isPinned = body.isPinned;
    }

    if (body.attachments !== undefined) {
      notice.attachments = body.attachments;
    }

    // 수정일 업데이트
    notice.updatedAt = now;

    // 데이터 저장
    data.notices[noticeIndex] = notice;

    // 파일에 저장
    await writeNoticesData(data);

    return NextResponse.json({
      success: true,
      data: notice,
      message: '공지사항이 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('공지사항 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/academy-notices/[id]
 * 공지사항을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const data = await readNoticesData();
    const noticeIndex = data.notices.findIndex((n) => n.id === id);

    if (noticeIndex === -1) {
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제
    const deletedNotice = data.notices.splice(noticeIndex, 1)[0];

    // 파일에 저장
    await writeNoticesData(data);

    return NextResponse.json({
      success: true,
      data: deletedNotice,
      message: '공지사항이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('공지사항 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
