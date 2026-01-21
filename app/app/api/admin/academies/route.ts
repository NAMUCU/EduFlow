/**
 * 슈퍼 어드민용 학원 관리 API
 *
 * GET /api/admin/academies - 학원 목록 조회 (검색, 필터, 페이지네이션)
 * POST /api/admin/academies - 학원 추가
 * PATCH /api/admin/academies - 학원 정보 수정
 * DELETE /api/admin/academies - 학원 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, createAdminSupabaseClient } from '@/lib/supabase';
import { Academy, AcademyPlan, AcademyInsert, AcademyUpdate } from '@/types/database';

// ============================================
// 타입 정의
// ============================================

/** 학원 목록 조회 응답 */
interface AcademyListResponse {
  success: boolean;
  data?: {
    academies: Academy[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

/** 학원 단일 응답 */
interface AcademyResponse {
  success: boolean;
  data?: Academy;
  error?: string;
}

/** 삭제 응답 */
interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/** 학원 생성 입력 */
interface CreateAcademyInput {
  name: string;
  owner_id: string;
  address?: string;
  phone?: string;
  plan?: AcademyPlan;
  logo_image?: string;
  business_number?: string;
}

/** 학원 수정 입력 */
interface UpdateAcademyInput {
  id: string;
  name?: string;
  owner_id?: string;
  address?: string;
  phone?: string;
  plan?: AcademyPlan;
  logo_image?: string;
  business_number?: string;
}

// ============================================
// Mock 데이터
// ============================================

let mockAcademies: Academy[] = [
  {
    id: 'ACM001',
    name: '에듀플로우 수학 학원',
    owner_id: 'USR001',
    address: '서울시 강남구 역삼동 123-45',
    phone: '02-1234-5678',
    plan: 'pro',
    logo_image: null,
    business_number: '123-45-67890',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-06-01T10:30:00Z',
  },
  {
    id: 'ACM002',
    name: '스마트 영어 학원',
    owner_id: 'USR002',
    address: '서울시 서초구 서초동 456-78',
    phone: '02-2345-6789',
    plan: 'basic',
    logo_image: null,
    business_number: '234-56-78901',
    created_at: '2024-02-20T14:00:00Z',
    updated_at: '2024-05-15T16:45:00Z',
  },
  {
    id: 'ACM003',
    name: '하이탑 과학 학원',
    owner_id: 'USR003',
    address: '서울시 송파구 잠실동 789-01',
    phone: '02-3456-7890',
    plan: 'enterprise',
    logo_image: null,
    business_number: '345-67-89012',
    created_at: '2024-03-10T11:00:00Z',
    updated_at: '2024-07-20T09:15:00Z',
  },
  {
    id: 'ACM004',
    name: '드림 국어 학원',
    owner_id: 'USR004',
    address: '서울시 마포구 상암동 234-56',
    phone: '02-4567-8901',
    plan: 'free',
    logo_image: null,
    business_number: '456-78-90123',
    created_at: '2024-04-05T08:30:00Z',
    updated_at: '2024-04-05T08:30:00Z',
  },
  {
    id: 'ACM005',
    name: '탑클래스 종합 학원',
    owner_id: 'USR005',
    address: '서울시 강동구 천호동 567-89',
    phone: '02-5678-9012',
    plan: 'pro',
    logo_image: null,
    business_number: '567-89-01234',
    created_at: '2024-05-12T13:20:00Z',
    updated_at: '2024-08-01T11:00:00Z',
  },
  {
    id: 'ACM006',
    name: '명문 입시 학원',
    owner_id: 'USR006',
    address: '서울시 노원구 상계동 890-12',
    phone: '02-6789-0123',
    plan: 'enterprise',
    logo_image: null,
    business_number: '678-90-12345',
    created_at: '2024-06-18T15:45:00Z',
    updated_at: '2024-09-10T14:30:00Z',
  },
  {
    id: 'ACM007',
    name: '브릿지 영어 학원',
    owner_id: 'USR007',
    address: '경기도 성남시 분당구 정자동 111-22',
    phone: '031-1234-5678',
    plan: 'basic',
    logo_image: null,
    business_number: '789-01-23456',
    created_at: '2024-07-22T10:00:00Z',
    updated_at: '2024-07-22T10:00:00Z',
  },
  {
    id: 'ACM008',
    name: '퍼스트 수학 학원',
    owner_id: 'USR008',
    address: '경기도 용인시 수지구 죽전동 333-44',
    phone: '031-2345-6789',
    plan: 'pro',
    logo_image: null,
    business_number: '890-12-34567',
    created_at: '2024-08-30T09:15:00Z',
    updated_at: '2024-10-05T16:20:00Z',
  },
];

// ============================================
// GET: 학원 목록 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 추출
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') as AcademyPlan | '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Supabase가 설정되어 있으면 실제 DB 조회
    if (isSupabaseConfigured()) {
      const supabase = createAdminSupabaseClient();

      let query = supabase.from('academies').select('*', { count: 'exact' });

      // 검색 필터
      if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,business_number.ilike.%${search}%`);
      }

      // 요금제 필터
      if (plan) {
        query = query.eq('plan', plan);
      }

      // 정렬
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 페이지네이션
      const start = (page - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        return NextResponse.json(
          { success: false, error: `학원 목록 조회 실패: ${error.message}` },
          { status: 500 }
        );
      }

      const response: AcademyListResponse = {
        success: true,
        data: {
          academies: data || [],
          total: count || 0,
          page,
          pageSize,
        },
      };

      return NextResponse.json(response);
    }

    // Mock 데이터 사용
    let filteredAcademies = [...mockAcademies];

    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAcademies = filteredAcademies.filter((academy) => {
        const matchName = academy.name.toLowerCase().includes(searchLower);
        const matchAddress = academy.address?.toLowerCase().includes(searchLower) || false;
        const matchBusinessNumber = academy.business_number?.toLowerCase().includes(searchLower) || false;
        return matchName || matchAddress || matchBusinessNumber;
      });
    }

    // 요금제 필터
    if (plan) {
      filteredAcademies = filteredAcademies.filter((academy) => academy.plan === plan);
    }

    // 정렬
    filteredAcademies.sort((a, b) => {
      const aValue = a[sortBy as keyof Academy];
      const bValue = b[sortBy as keyof Academy];

      if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    // 전체 개수
    const total = filteredAcademies.length;

    // 페이지네이션
    const startIndex = (page - 1) * pageSize;
    const paginatedAcademies = filteredAcademies.slice(startIndex, startIndex + pageSize);

    const response: AcademyListResponse = {
      success: true,
      data: {
        academies: paginatedAcademies,
        total,
        page,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학원 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 학원 추가
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateAcademyInput = await request.json();

    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: '학원 이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    if (!body.owner_id) {
      return NextResponse.json(
        { success: false, error: '학원장 ID는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // Supabase가 설정되어 있으면 실제 DB 삽입
    if (isSupabaseConfigured()) {
      const supabase = createAdminSupabaseClient();

      const insertData: AcademyInsert = {
        name: body.name,
        owner_id: body.owner_id,
        address: body.address || null,
        phone: body.phone || null,
        plan: body.plan || 'free',
        logo_image: body.logo_image || null,
        business_number: body.business_number || null,
      };

      // eslint-disable-next-line
      const { data, error } = await (supabase as any)
        .from('academies')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: `학원 추가 실패: ${error.message}` },
          { status: 500 }
        );
      }

      const response: AcademyResponse = {
        success: true,
        data,
      };

      return NextResponse.json(response, { status: 201 });
    }

    // Mock 데이터 사용
    const maxNum = mockAcademies.reduce((max, a) => {
      const num = parseInt(a.id.replace('ACM', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `ACM${String(maxNum + 1).padStart(3, '0')}`;

    const now = new Date().toISOString();
    const newAcademy: Academy = {
      id: newId,
      name: body.name,
      owner_id: body.owner_id,
      address: body.address || null,
      phone: body.phone || null,
      plan: body.plan || 'free',
      logo_image: body.logo_image || null,
      business_number: body.business_number || null,
      created_at: now,
      updated_at: now,
    };

    mockAcademies.push(newAcademy);

    const response: AcademyResponse = {
      success: true,
      data: newAcademy,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('학원 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH: 학원 정보 수정
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const body: UpdateAcademyInput = await request.json();

    // 필수 필드 검증
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: '학원 ID는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // Supabase가 설정되어 있으면 실제 DB 수정
    if (isSupabaseConfigured()) {
      const supabase = createAdminSupabaseClient();

      const updateData: AcademyUpdate = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.owner_id !== undefined) updateData.owner_id = body.owner_id;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.plan !== undefined) updateData.plan = body.plan;
      if (body.logo_image !== undefined) updateData.logo_image = body.logo_image;
      if (body.business_number !== undefined) updateData.business_number = body.business_number;

      // eslint-disable-next-line
      const { data, error } = await (supabase as any)
        .from('academies')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: `학원 수정 실패: ${error.message}` },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { success: false, error: '해당 학원을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const response: AcademyResponse = {
        success: true,
        data,
      };

      return NextResponse.json(response);
    }

    // Mock 데이터 사용
    const academyIndex = mockAcademies.findIndex((a) => a.id === body.id);

    if (academyIndex === -1) {
      return NextResponse.json(
        { success: false, error: '해당 학원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updatedAcademy: Academy = {
      ...mockAcademies[academyIndex],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.owner_id !== undefined && { owner_id: body.owner_id }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.plan !== undefined && { plan: body.plan }),
      ...(body.logo_image !== undefined && { logo_image: body.logo_image }),
      ...(body.business_number !== undefined && { business_number: body.business_number }),
      updated_at: new Date().toISOString(),
    };

    mockAcademies[academyIndex] = updatedAcademy;

    const response: AcademyResponse = {
      success: true,
      data: updatedAcademy,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학원 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: 학원 삭제
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 필수 필드 검증
    if (!id) {
      return NextResponse.json(
        { success: false, error: '학원 ID는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // Supabase가 설정되어 있으면 실제 DB 삭제
    if (isSupabaseConfigured()) {
      const supabase = createAdminSupabaseClient();

      // 먼저 학원 존재 여부 확인
      const { data: existingAcademy, error: fetchError } = await supabase
        .from('academies')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existingAcademy) {
        return NextResponse.json(
          { success: false, error: '해당 학원을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const { error } = await supabase.from('academies').delete().eq('id', id);

      if (error) {
        return NextResponse.json(
          { success: false, error: `학원 삭제 실패: ${error.message}` },
          { status: 500 }
        );
      }

      const response: DeleteResponse = {
        success: true,
        message: '학원이 성공적으로 삭제되었습니다.',
      };

      return NextResponse.json(response);
    }

    // Mock 데이터 사용
    const academyIndex = mockAcademies.findIndex((a) => a.id === id);

    if (academyIndex === -1) {
      return NextResponse.json(
        { success: false, error: '해당 학원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    mockAcademies.splice(academyIndex, 1);

    const response: DeleteResponse = {
      success: true,
      message: '학원이 성공적으로 삭제되었습니다.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('학원 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '학원 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
