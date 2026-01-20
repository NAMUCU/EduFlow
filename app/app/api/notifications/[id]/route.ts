import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Notification } from '@/types/notification';

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
 * GET /api/notifications/[id]
 * 특정 알림을 조회합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const data = await readNotificationsData();
    const notification = data.notifications.find((n) => n.id === id);

    if (!notification) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/[id]
 * 알림을 읽음 처리합니다.
 *
 * Request Body:
 * - isRead: boolean (읽음 상태)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 데이터 로드
    const data = await readNotificationsData();
    const notificationIndex = data.notifications.findIndex((n) => n.id === id);

    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // 읽음 상태 업데이트
    if (body.isRead !== undefined) {
      data.notifications[notificationIndex].isRead = body.isRead;
      if (body.isRead) {
        data.notifications[notificationIndex].readAt = now;
      } else {
        // 읽지 않음으로 변경 시 readAt 제거
        delete data.notifications[notificationIndex].readAt;
      }
    }

    // 파일에 저장
    await writeNotificationsData(data);

    return NextResponse.json({
      success: true,
      data: data.notifications[notificationIndex],
      message: '알림이 성공적으로 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('알림 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림을 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * 알림을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 데이터 로드
    const data = await readNotificationsData();
    const notificationIndex = data.notifications.findIndex((n) => n.id === id);

    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 삭제
    const deletedNotification = data.notifications.splice(notificationIndex, 1)[0];

    // 파일에 저장
    await writeNotificationsData(data);

    return NextResponse.json({
      success: true,
      data: deletedNotification,
      message: '알림이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
