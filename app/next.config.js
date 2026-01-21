/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel Best Practice: bundle-barrel-imports
  // lucide-react, recharts 등 barrel file을 사용하는 라이브러리 최적화
  // 빌드 시 자동으로 직접 import로 변환하여 번들 크기 감소
  experimental: {
    optimizePackageImports: [
      'lucide-react',      // 아이콘 라이브러리
      'recharts',          // 차트 라이브러리
      'date-fns',          // 날짜 유틸리티
      '@radix-ui/react-icons',
    ],
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // 환경변수 설정
  env: {
    NEXT_PUBLIC_APP_NAME: 'EduFlow',
  },
}

module.exports = nextConfig
