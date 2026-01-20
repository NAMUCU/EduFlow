import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TeacherLayout from "@/components/layouts/teacher-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, FileText, Users, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Student, ProblemSet } from "@shared/schema";

type Step = "select-set" | "select-students" | "confirm";

export default function TeacherAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<Step>("select-set");
  const [selectedSet, setSelectedSet] = useState<ProblemSet | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: problemSets, isLoading: setsLoading } = useQuery<ProblemSet[]>({
    queryKey: ["/api/teacher/problem-sets"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
  });

  const distributeAssignments = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/teacher/assignments", {
        problemSetId: selectedSet?.id,
        studentIds: Array.from(selectedStudents),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      toast({ title: "과제가 배포되었습니다" });
      setConfirmDialogOpen(false);
      setStep("select-set");
      setSelectedSet(null);
      setSelectedStudents(new Set());
    },
    onError: () => {
      toast({ title: "과제 배포에 실패했습니다", variant: "destructive" });
    },
  });

  const handleSelectSet = (set: ProblemSet) => {
    setSelectedSet(set);
    setStep("select-students");
  };

  const handleToggleStudent = (studentId: string) => {
    const updated = new Set(selectedStudents);
    if (updated.has(studentId)) {
      updated.delete(studentId);
    } else {
      updated.add(studentId);
    }
    setSelectedStudents(updated);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students?.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students?.map((s) => s.id)));
    }
  };

  const getStepNumber = (s: Step) => {
    switch (s) {
      case "select-set":
        return 1;
      case "select-students":
        return 2;
      case "confirm":
        return 3;
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">과제 배포</h1>
          <p className="text-muted-foreground mt-1">문제지를 학생에게 배포합니다</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {(["select-set", "select-students", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepNumber(step) >= getStepNumber(s)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {getStepNumber(s)}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  getStepNumber(step) >= getStepNumber(s)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {s === "select-set"
                  ? "문제지 선택"
                  : s === "select-students"
                  ? "학생 선택"
                  : "확인 및 배포"}
              </span>
              {i < 2 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>

        {step === "select-set" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">배포할 문제지를 선택하세요</h2>
            {setsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : problemSets?.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">문제지가 없습니다</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    먼저 문제 생성 페이지에서 문제지를 만들어주세요
                  </p>
                  <a href="/teacher/problems">
                    <Button>문제 생성하기</Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {problemSets?.map((set) => (
                  <Card
                    key={set.id}
                    className={`cursor-pointer hover-elevate ${
                      selectedSet?.id === set.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleSelectSet(set)}
                    data-testid={`card-set-${set.id}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {set.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {set.problemIds.length}개의 문제
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {set.createdAt &&
                          new Date(set.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "select-students" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">과제를 받을 학생을 선택하세요</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("select-set")}>
                  이전
                </Button>
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  data-testid="button-select-all"
                >
                  {selectedStudents.size === students?.length
                    ? "전체 해제"
                    : "전체 선택"}
                </Button>
              </div>
            </div>

            {selectedSet && (
              <Card className="mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{selectedSet.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedSet.problemIds.length}개의 문제
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {studentsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : students?.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">등록된 학생이 없습니다</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    먼저 학생을 등록해주세요
                  </p>
                  <a href="/teacher/students">
                    <Button>학생 등록하기</Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students?.map((student) => (
                    <Card
                      key={student.id}
                      className={`cursor-pointer hover-elevate ${
                        selectedStudents.has(student.id) ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleToggleStudent(student.id)}
                      data-testid={`card-student-${student.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => handleToggleStudent(student.id)}
                          />
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{student.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{student.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {student.school} {student.grade}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={selectedStudents.size === 0}
                    data-testid="button-next"
                  >
                    다음 ({selectedStudents.size}명 선택)
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과제 배포 확인</DialogTitle>
            <DialogDescription>
              아래 내용으로 과제를 배포합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{selectedSet?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSet?.problemIds.length}개의 문제
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{selectedStudents.size}명의 학생</p>
                <p className="text-sm text-muted-foreground">
                  {students
                    ?.filter((s) => selectedStudents.has(s.id))
                    .map((s) => s.name)
                    .slice(0, 3)
                    .join(", ")}
                  {selectedStudents.size > 3 && ` 외 ${selectedStudents.size - 3}명`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 text-sm">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-muted-foreground">
                문자 발송 기능은 현재 준비 중입니다. 과제 배포만 진행됩니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => distributeAssignments.mutate()}
              disabled={distributeAssignments.isPending}
              data-testid="button-distribute"
            >
              {distributeAssignments.isPending ? (
                "배포 중..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  과제 배포
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}
