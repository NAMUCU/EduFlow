import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  Notification,
  NotificationFilter,
  NotificationListResponse,
  CreateNotificationRequest,
  NotificationType,
} from '@/types/notification';

// 데이터 파일 경로
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'notifications.json');

/**
 * 알림 데이터 파일 읽기
 */
async function readNotificationsData(): Promise<{ notifications: Notification[] }> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('알림 데이터 파일 읽기 오류:', error);
    return { notifications: [] };
  }
}

/**
 * 알림 데이터 파일 쓰기
 */
async function writeNotificationsData(data: { notifications: Notification[] }): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('알림 데이터 파일 쓰기 오류:', error);
    throw new Error('데이터 저장에 실패했습니다.');
  }
}

/**
 * GET /api/notifications
 * 알림 목록을 조회합니다.
 *
 * Query Parameters:
 * - type: 알림 유형 필터 (assignment, grade, attendance, notice, system)
 * - is_read: 읽음 상태 필터 (true, false)
 * - priority: 우선순위 필터 (low, medium, high, urgent)
 * - user_id: 사용자 ID (필수)
 * - page: 페이지 번호 (기본값: 1)
 * - page_size: 페이지 크기 (기본값: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 필터 옵션 추출
    const filters: NotificationFilter = {
      type: (searchParams.get('type') as NotificationType) || undefined,
      isRead: searchParams.get('is_read') !== null
        ? searchParams.get('is_read') === 'true'
        : undefined,
      priority: searchParams.get('priority') as NotificationFilter['priority'] || undefined,
      startDate: searchParams.get('start_date') || undefined,
      endDate: searchParams.get('end_date') || undefined,
    };

    const userId = searchParams.get('user_id') || 'user-001'; // 기본 사용자
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    // 데이터 로드
    const data = await readNotificationsData();
    let { notifications } = data;

    // 사용자별 알림 필터링
    notifications = notifications.filter((n) => n.userId === userId);

    // 필터 적용
    if (filters.type) {
      notifications = notifications.filter((n) => n.type === filters.type);
    }

    if (filters.isRead !== undefined) {
      notifications = notifications.filter((n) => n.isRead === filters.isRead);
    }

    if (filters.priority) {
      notifications = notifications.filter((n) => n.priority === filters.priority);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      notifications = notifications.filter((n) => new Date(n.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      notifications = notifications.filter((n) => new Date(n.createdAt) <= endDate);
    }

    // 정렬: 생성일 기준 내림차순 (최신순)
    notifications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 안읽은 알림 개수 계산
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // 전체 개수
    const total = notifications.length;

    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedList = notifications.slice(startIndex, endIndex);

    const response: NotificationListResponse = {
      notifications: paginatedList,
      total,
      unreadCount,
      page,
      pageSize,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('알림 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 새 알림을 생성합니다.
 *
 * Request Body: CreateNotificationRequest
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateNotificationRequest = await request.json();

    // 필수 필드 검증
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: '알림 제목은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.message || !body.message.trim()) {
      return NextResponse.json(
        { success: false, error: '알림 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: '수신자 ID는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { success: false, error: '알림 유형은 필수입니다.' },
        { status: 400 }
      );
    }

    // 데이터 로드
    const data = await readNotificationsData();

    // 새 알림 ID 생성
    const newNotificationId = `notif-${Date.now()}`;
    const now = new Date().toISOString();

    // 새 알림 객체 생성
    const newNotification: Notification = {
      id: newNotificationId,
      type: body.type,
      title: body.title.trim(),
      message: body.message.trim(),
      userId: body.userId,
      senderId: body.senderId,
      senderName: body.senderName,
      isRead: false,
      priority: body.priority || 'medium',
      link: body.link,
      metadata: body.metadata,
      createdAt: now,
    };

    // 데이터에 추가
    data.notifications.push(newNotification);

    // 파일에 저장
    await writeNotificationsData(data);

    return NextResponse.json({
      success: true,
      data: newNotification,
      message: '알림이 성공적으로 생성되었습니다.',
    });
  } catch (error) {
    console.error('알림 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
