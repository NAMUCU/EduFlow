import { useQuery } from "@tanstack/react-query";
import StudentLayout from "@/components/layouts/student-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface StudentStats {
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
}

interface AssignmentSummary {
  id: string;
  status: string;
  createdAt: string;
  problemSet: {
    id: string;
    title: string;
    problemIds: string[];
  };
}

export default function StudentDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<AssignmentSummary[]>({
    queryKey: ["/api/student/assignments"],
  });

  const pendingAssignments = assignments?.filter((a) => a.status === "pending") || [];

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">대시보드</h1>
          <p className="text-muted-foreground mt-1">과제 현황을 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 과제
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-total-assignments">
                  {stats?.totalAssignments || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">받은 과제</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                제출 대기
              </CardTitle>
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-yellow-600" data-testid="text-pending-assignments">
                  {stats?.pendingAssignments || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">제출해야 할 과제</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                제출 완료
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <div className="text-3xl font-bold text-green-600" data-testid="text-completed-assignments">
                  {stats?.completedAssignments || 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">완료한 과제</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">제출 대기 중인 과제</h2>
            <Link href="/student/assignments">
              <Button variant="ghost" size="sm" className="gap-1">
                전체 보기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {assignmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-lg font-medium mb-1">모든 과제를 완료했습니다!</h3>
                <p className="text-muted-foreground text-sm">
                  제출 대기 중인 과제가 없습니다
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.slice(0, 5).map((assignment) => (
                <Link key={assignment.id} href={`/student/assignments/${assignment.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-assignment-${assignment.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{assignment.problemSet.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {assignment.problemSet.problemIds.length}개 문제 •{" "}
                              {new Date(assignment.createdAt).toLocaleDateString("ko-KR")} 배포
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            대기 중
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
