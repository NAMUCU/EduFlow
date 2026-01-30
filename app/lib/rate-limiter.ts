/**
 * Rate Limiter 유틸리티
 * API 요청 속도 제한을 위한 인메모리 기반 Rate Limiter
 *
 * 프로덕션에서는 Redis 기반 구현 권장
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  /** 제한 단위 시간 (밀리초) */
  windowMs: number;
  /** 윈도우당 최대 요청 수 */
  maxRequests: number;
  /** 식별자 추출 함수 (기본: IP) */
  keyGenerator?: (request: NextRequest) => string;
  /** 제한 초과 시 응답 메시지 */
  message?: string;
}

// 인메모리 저장소
const rateLimitStore = new Map<string, RateLimitEntry>();

// 만료된 항목 정리 (5분마다)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * IP 주소 추출
 */
function getClientIp(request: NextRequest): string {
  // Vercel/Cloudflare 헤더 우선
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 기본값
  return 'unknown';
}

/**
 * 기본 Rate Limit 설정
 */
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  /** 검색 API - 분당 30회 */
  search: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  /** 생성 API - 분당 10회 */
  generate: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: '생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  /** 업로드 API - 시간당 20회 */
  upload: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: '업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  /** 일반 API - 분당 60회 */
  default: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
};

/**
 * Rate Limit 체크
 * @returns { limited: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // 새 엔트리 또는 윈도우 리셋
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // 기존 엔트리 업데이트
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    limited: entry.count > config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Rate Limit 미들웨어 생성
 */
export function createRateLimiter(configOrType: RateLimitConfig | keyof typeof DEFAULT_CONFIGS = 'default') {
  const config = typeof configOrType === 'string'
    ? DEFAULT_CONFIGS[configOrType]
    : configOrType;

  const keyGenerator = config.keyGenerator || getClientIp;

  return function rateLimiter(request: NextRequest): NextResponse | null {
    const key = keyGenerator(request);
    const result = checkRateLimit(key, config);

    // Rate Limit 헤더 추가를 위한 정보 저장
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (result.limited) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      headers.set('Retry-After', retryAfter.toString());

      return NextResponse.json(
        {
          error: config.message || '요청이 너무 많습니다.',
          code: 'RATE_LIMITED',
          retryAfter,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Rate Limit 통과 - null 반환 (계속 진행)
    return null;
  };
}

/**
 * Rate Limit을 적용하는 API 래퍼
 */
export function withRateLimit<T>(
  configOrType: RateLimitConfig | keyof typeof DEFAULT_CONFIGS,
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  const limiter = createRateLimiter(configOrType);

  return async (request: NextRequest): Promise<NextResponse> => {
    const limitResponse = limiter(request);
    if (limitResponse) {
      return limitResponse;
    }

    const response = await handler(request);

    // 응답에 Rate Limit 헤더 추가
    const key = (configOrType === 'string' ? DEFAULT_CONFIGS[configOrType as keyof typeof DEFAULT_CONFIGS] : configOrType as RateLimitConfig).keyGenerator?.(request) || getClientIp(request);
    const config = typeof configOrType === 'string' ? DEFAULT_CONFIGS[configOrType] : configOrType;
    const result = checkRateLimit(key, config);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining - 1).toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    return response;
  };
}

/**
 * 사용자 ID 기반 Rate Limit (인증 후 사용)
 */
export function createUserRateLimiter(
  configOrType: RateLimitConfig | keyof typeof DEFAULT_CONFIGS,
  getUserId: (request: NextRequest) => string | null
) {
  const config = typeof configOrType === 'string'
    ? DEFAULT_CONFIGS[configOrType]
    : configOrType;

  return function rateLimiter(request: NextRequest): NextResponse | null {
    const userId = getUserId(request);
    const key = userId || getClientIp(request);
    const result = checkRateLimit(`user:${key}`, config);

    if (result.limited) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: config.message || '요청이 너무 많습니다.',
          code: 'RATE_LIMITED',
          retryAfter,
        },
        { status: 429 }
      );
    }

    return null;
  };
}

/**
 * 학원 ID 기반 Rate Limit
 */
export function createAcademyRateLimiter(
  configOrType: RateLimitConfig | keyof typeof DEFAULT_CONFIGS,
  getAcademyId: (request: NextRequest) => string | null
) {
  const config = typeof configOrType === 'string'
    ? DEFAULT_CONFIGS[configOrType]
    : configOrType;

  return function rateLimiter(request: NextRequest): NextResponse | null {
    const academyId = getAcademyId(request);
    const key = academyId || getClientIp(request);
    const result = checkRateLimit(`academy:${key}`, config);

    if (result.limited) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: config.message || '요청이 너무 많습니다.',
          code: 'RATE_LIMITED',
          retryAfter,
        },
        { status: 429 }
      );
    }

    return null;
  };
}
