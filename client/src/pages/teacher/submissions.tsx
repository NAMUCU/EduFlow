import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TeacherLayout from "@/components/layouts/teacher-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileCheck, Search, Clock, CheckCircle, Image as ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssignmentWithDetails {
  id: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
  };
  problemSet: {
    id: string;
    title: string;
    problemIds: string[];
  };
  submissions: Array<{
    id: string;
    imageUrl: string;
    submittedAt: string;
  }>;
}

export default function TeacherSubmissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentWithDetails | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const { data: assignments, isLoading } = useQuery<AssignmentWithDetails[]>({
    queryKey: ["/api/teacher/assignments/all"],
  });

  const filteredAssignments = assignments?.filter(
    (a) =>
      a.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.problemSet.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const submittedCount = assignments?.filter((a) => a.status === "submitted").length || 0;
  const pendingCount = assignments?.filter((a) => a.status === "pending").length || 0;

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">제출 확인</h1>
          <p className="text-muted-foreground mt-1">학생들의 과제 제출 현황을 확인합니다</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">전체 과제</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submittedCount}</p>
                  <p className="text-sm text-muted-foreground">제출 완료</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">제출 대기</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {assignments?.reduce((acc, a) => acc + a.submissions.length, 0) || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">제출 이미지</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="학생 이름 또는 문제지로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredAssignments?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-1">배포된 과제가 없습니다</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery ? "검색 결과가 없습니다" : "먼저 과제를 배포해주세요"}
              </p>
              {!searchQuery && (
                <a href="/teacher/assignments">
                  <Button>과제 배포하기</Button>
                </a>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">제출 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생</TableHead>
                    <TableHead>문제지</TableHead>
                    <TableHead>배포일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>제출물</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments?.map((assignment) => (
                    <TableRow key={assignment.id} data-testid={`row-assignment-${assignment.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {assignment.student.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{assignment.student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {assignment.student.school} {assignment.student.grade}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{assignment.problemSet.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.problemSet.problemIds.length}개 문제
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(assignment.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            assignment.status === "submitted" ? "default" : "secondary"
                          }
                        >
                          {assignment.status === "submitted" ? "제출 완료" : "대기 중"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.submissions.length > 0 ? (
                          <span className="text-sm">
                            {assignment.submissions.length}개 이미지
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">없음</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(assignment)}
                          data-testid={`button-view-${assignment.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={!!selectedSubmission}
        onOpenChange={() => setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>과제 상세</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">학생</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {selectedSubmission.student.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedSubmission.student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSubmission.student.school}{" "}
                        {selectedSubmission.student.grade}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">문제지</p>
                  <p className="font-medium">{selectedSubmission.problemSet.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubmission.problemSet.problemIds.length}개 문제
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">제출된 풀이</h4>
                {selectedSubmission.submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>아직 제출된 풀이가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubmission.submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="relative rounded-lg overflow-hidden border cursor-pointer hover-elevate"
                        onClick={() => setViewingImage(sub.imageUrl)}
                      >
                        <img
                          src={sub.imageUrl}
                          alt="제출된 풀이"
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                          {new Date(sub.submittedAt).toLocaleString("ko-KR")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>제출 이미지</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <img
              src={viewingImage}
              alt="제출된 풀이"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}
