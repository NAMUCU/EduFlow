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
 * POST /api/notifications/read-all
 * 모든 알림을 읽음 처리합니다.
 *
 * Request Body:
 * - userId: string (사용자 ID, 필수)
 * - type?: NotificationType (특정 유형만 읽음 처리, 선택)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 필수 필드 검증
    const userId = body.userId || 'user-001'; // 기본값

    // 데이터 로드
    const data = await readNotificationsData();
    const now = new Date().toISOString();

    let updatedCount = 0;

    // 사용자의 읽지 않은 알림을 모두 읽음 처리
    data.notifications = data.notifications.map((notification) => {
      // 해당 사용자의 알림이 아니면 건너뛰기
      if (notification.userId !== userId) {
        return notification;
      }

      // 이미 읽은 알림은 건너뛰기
      if (notification.isRead) {
        return notification;
      }

      // 특정 유형 필터가 있으면 체크
      if (body.type && notification.type !== body.type) {
        return notification;
      }

      // 읽음 처리
      updatedCount++;
      return {
        ...notification,
        isRead: true,
        readAt: now,
      };
    });

    // 파일에 저장
    await writeNotificationsData(data);

    return NextResponse.json({
      success: true,
      data: {
        updatedCount,
      },
      message: `${updatedCount}개의 알림을 읽음 처리했습니다.`,
    });
  } catch (error) {
    console.error('모두 읽음 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '알림을 읽음 처리하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
