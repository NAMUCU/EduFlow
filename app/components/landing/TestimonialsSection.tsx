'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: '김성호',
    role: '수학 전문 학원 원장',
    location: '서울 강남구',
    image: '/testimonials/user1.jpg',
    content: '문제 출제에 쏟던 시간이 80% 이상 줄었어요. AI가 생성한 문제 퀄리티가 놀라울 정도로 좋습니다. 덕분에 학생 지도에 더 집중할 수 있게 되었어요.',
    rating: 5,
  },
  {
    name: '이민정',
    role: '영어 학원 원장',
    location: '경기 분당',
    image: '/testimonials/user2.jpg',
    content: '학부모님들께 학습 리포트를 자동으로 발송할 수 있어서 상담이 훨씬 수월해졌어요. 출결 알림 기능도 학부모님들이 정말 좋아하세요.',
    rating: 5,
  },
  {
    name: '박준영',
    role: '종합 학원 운영',
    location: '부산 해운대',
    image: '/testimonials/user3.jpg',
    content: '3개 지점을 운영하는데, EduFlow 덕분에 모든 지점의 현황을 한눈에 파악할 수 있게 되었습니다. Enterprise 플랜의 멀티 브랜치 기능이 최고예요.',
    rating: 5,
  },
  {
    name: '정유나',
    role: '국어 논술 학원 강사',
    location: '인천 송도',
    image: '/testimonials/user4.jpg',
    content: '주관식 채점까지 AI가 해준다는 게 처음엔 믿기지 않았는데, 사용해보니 정말 정확하더라고요. 피드백 생성 기능도 너무 유용해요.',
    rating: 5,
  },
  {
    name: '최동현',
    role: '과학 학원 원장',
    location: '대전 유성구',
    image: '/testimonials/user5.jpg',
    content: '학생별 취약점 분석 리포트가 정말 상세해요. 이 데이터를 기반으로 맞춤형 수업을 진행하니 학생들 성적이 눈에 띄게 올랐습니다.',
    rating: 5,
  },
  {
    name: '한소영',
    role: '초등 전문 학원 운영',
    location: '광주 광산구',
    image: '/testimonials/user6.jpg',
    content: '학부모 앱이 있어서 소통이 정말 편해졌어요. 숙제 안내, 공지사항 전달이 한 번에 되니까 업무 효율이 확 올랐습니다.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            고객 후기
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            500개 이상의 학원이 선택한 이유
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            EduFlow를 사용 중인 원장님들의 실제 후기입니다
          </p>
        </div>

        {/* 후기 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              {/* 인용 아이콘 */}
              <Quote className="w-10 h-10 text-primary-200 mb-4" />

              {/* 별점 */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* 후기 내용 */}
              <p className="text-gray-600 leading-relaxed mb-6">
                &quot;{testimonial.content}&quot;
              </p>

              {/* 프로필 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <p className="text-xs text-gray-400">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 통계 */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary-600">4.9</p>
              <div className="flex justify-center gap-1 mt-2 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-500">평균 평점</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">98%</p>
              <p className="text-sm text-gray-500 mt-2">고객 만족도</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">500+</p>
              <p className="text-sm text-gray-500 mt-2">등록 학원</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary-600">15,000+</p>
              <p className="text-sm text-gray-500 mt-2">활성 사용자</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
