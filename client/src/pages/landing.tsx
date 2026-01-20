import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, BarChart3, Sparkles, Send, FileCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">EduFlow</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="/api/login" data-testid="link-login">
                <Button variant="ghost">로그인</Button>
              </a>
              <a href="/api/login" data-testid="link-start">
                <Button>시작하기</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI 기반 학원 운영 자동화 플랫폼
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              스마트하게 가르치고
              <br />
              <span className="text-primary">효율적으로 관리하세요</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI로 문제를 생성하고, 학생에게 과제를 배포하며,
              풀이 결과를 분석하는 올인원 학원 운영 솔루션
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/api/login" data-testid="link-teacher-start">
                <Button size="lg" className="px-8">
                  강사로 시작하기
                </Button>
              </a>
              <a href="/api/login" data-testid="link-student-login">
                <Button size="lg" variant="outline" className="px-8">
                  학생 로그인
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              무료로 시작하세요 • 신용카드 불필요
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              학원 운영의 모든 것을 한 곳에서
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              문제 생성부터 과제 배포, 제출 확인까지
              모든 과정을 간편하게 관리하세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI 문제 생성</h3>
                <p className="text-muted-foreground">
                  과목, 단원, 난이도를 선택하면 AI가 자동으로
                  맞춤형 문제를 생성합니다
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">학생 관리</h3>
                <p className="text-muted-foreground">
                  학생 정보를 체계적으로 관리하고
                  개인별 학습 현황을 한눈에 파악하세요
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">과제 배포</h3>
                <p className="text-muted-foreground">
                  생성된 문제지를 원하는 학생에게
                  간편하게 배포하세요
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">제출 확인</h3>
                <p className="text-muted-foreground">
                  학생들의 풀이 제출 현황을 실시간으로
                  확인하고 관리하세요
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">학습 분석</h3>
                <p className="text-muted-foreground">
                  대시보드에서 학생들의 학습 데이터와
                  통계를 확인하세요
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">문제 관리</h3>
                <p className="text-muted-foreground">
                  생성된 문제를 편집하고 문제지로
                  묶어서 체계적으로 관리하세요
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            EduFlow와 함께 효율적인 학원 운영을 경험해보세요
          </p>
          <a href="/api/login" data-testid="link-cta-start">
            <Button size="lg" className="px-12">
              무료로 시작하기
            </Button>
          </a>
        </div>
      </section>

      <footer className="py-8 px-4 md:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">EduFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 EduFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
