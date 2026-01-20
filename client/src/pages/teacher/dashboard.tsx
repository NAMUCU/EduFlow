import { useQuery } from "@tanstack/react-query";
import TeacherLayout from "@/components/layouts/teacher-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Send, Clock } from "lucide-react";

interface DashboardStats {
  studentCount: number;
  problemSetCount: number;
  pendingSubmissions: number;
  weeklySubmissions: number;
}

export default function TeacherDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const statCards = [
    {
      title: "등록 학생 수",
      value: stats?.studentCount || 0,
      icon: Users,
      description: "총 등록된 학생",
    },
    {
      title: "문제지",
      value: stats?.problemSetCount || 0,
      icon: FileText,
      description: "생성된 문제지",
    },
    {
      title: "제출 대기",
      value: stats?.pendingSubmissions || 0,
      icon: Clock,
      description: "미제출 과제",
    },
    {
      title: "이번 주 제출",
      value: stats?.weeklySubmissions || 0,
      icon: Send,
      description: "최근 7일 제출",
    },
  ];

  return (
    <TeacherLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">대시보드</h1>
          <p className="text-muted-foreground mt-1">학원 운영 현황을 한눈에 확인하세요</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <div className="text-3xl font-bold" data-testid={`text-stat-${stat.title}`}>
                    {stat.value}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>아직 활동 내역이 없습니다</p>
                  <p className="text-sm mt-1">학생을 등록하고 과제를 배포해보세요</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">빠른 시작</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a 
                  href="/teacher/students" 
                  className="flex items-center gap-3 p-3 rounded-lg hover-elevate border border-border"
                  data-testid="link-quick-students"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">학생 등록하기</p>
                    <p className="text-sm text-muted-foreground">새로운 학생을 추가합니다</p>
                  </div>
                </a>
                <a 
                  href="/teacher/problems" 
                  className="flex items-center gap-3 p-3 rounded-lg hover-elevate border border-border"
                  data-testid="link-quick-problems"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">문제 생성하기</p>
                    <p className="text-sm text-muted-foreground">AI로 새 문제를 만듭니다</p>
                  </div>
                </a>
                <a 
                  href="/teacher/assignments" 
                  className="flex items-center gap-3 p-3 rounded-lg hover-elevate border border-border"
                  data-testid="link-quick-assignments"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">과제 배포하기</p>
                    <p className="text-sm text-muted-foreground">학생에게 과제를 전달합니다</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  );
}
