import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StudentLayout from "@/components/layouts/student-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Clock,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  X,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Problem } from "@shared/schema";

interface AssignmentDetail {
  id: string;
  status: string;
  createdAt: string;
  problemSet: {
    id: string;
    title: string;
    problemIds: string[];
  };
  problems: Problem[];
  submissions: Array<{
    id: string;
    imageUrl: string;
    submittedAt: string;
  }>;
}

export default function StudentAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: assignments, isLoading } = useQuery<AssignmentDetail[]>({
    queryKey: ["/api/student/assignments"],
  });

  const submitAssignment = useMutation({
    mutationFn: async ({ assignmentId, files }: { assignmentId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });
      
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      toast({ title: "풀이가 제출되었습니다" });
      setUploadDialogOpen(false);
      setSelectedAssignment(null);
      setSelectedFiles([]);
    },
    onError: () => {
      toast({ title: "제출에 실패했습니다", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedAssignment || selectedFiles.length === 0) return;
    submitAssignment.mutate({
      assignmentId: selectedAssignment.id,
      files: selectedFiles,
    });
  };

  const pendingAssignments = assignments?.filter((a) => a.status === "pending") || [];
  const completedAssignments = assignments?.filter((a) => a.status === "submitted") || [];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">과제 목록</h1>
          <p className="text-muted-foreground mt-1">받은 과제를 확인하고 풀이를 제출하세요</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
              <Clock className="w-4 h-4" />
              대기 중 ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2" data-testid="tab-completed">
              <CheckCircle className="w-4 h-4" />
              제출 완료 ({completedAssignments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">모든 과제를 완료했습니다!</h3>
                  <p className="text-muted-foreground text-sm">
                    제출 대기 중인 과제가 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingAssignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="hover-elevate"
                    data-testid={`card-assignment-${assignment.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {assignment.problemSet.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {assignment.problemSet.problemIds.length}개 문제 •{" "}
                              {new Date(assignment.createdAt).toLocaleDateString("ko-KR")} 배포
                            </p>
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              대기 중
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedAssignment(assignment)}
                            data-testid={`button-view-${assignment.id}`}
                          >
                            문제 보기
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setUploadDialogOpen(true);
                            }}
                            data-testid={`button-submit-${assignment.id}`}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            풀이 제출
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : completedAssignments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">제출한 과제가 없습니다</h3>
                  <p className="text-muted-foreground text-sm">
                    과제를 풀고 제출해보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedAssignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="hover-elevate"
                    data-testid={`card-assignment-${assignment.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {assignment.problemSet.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {assignment.problemSet.problemIds.length}개 문제 •{" "}
                              {assignment.submissions.length}개 이미지 제출
                            </p>
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              제출 완료
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedAssignment(assignment)}
                          data-testid={`button-view-${assignment.id}`}
                        >
                          상세 보기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={!!selectedAssignment && !uploadDialogOpen}
        onOpenChange={() => setSelectedAssignment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.problemSet.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.problemSet.problemIds.length}개의 문제
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="space-y-4">
                {selectedAssignment.problems?.map((problem, index) => (
                  <Card key={problem.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          문제 {index + 1}
                        </span>
                        <Badge variant="outline">{problem.subject}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{problem.question}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedAssignment.submissions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">제출한 풀이</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAssignment.submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="rounded-lg overflow-hidden border"
                      >
                        <img
                          src={sub.imageUrl}
                          alt="제출된 풀이"
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-2 text-xs text-muted-foreground">
                          {new Date(sub.submittedAt).toLocaleString("ko-KR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssignment.status === "pending" && (
                <Button
                  className="w-full"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  풀이 제출하기
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>풀이 제출</DialogTitle>
            <DialogDescription>
              풀이한 내용을 사진으로 찍어 업로드해주세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-1">이미지 업로드</p>
              <p className="text-sm text-muted-foreground">
                클릭하여 파일을 선택하세요
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-file"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">선택된 파일 ({selectedFiles.length}개)</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden border"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFiles([]);
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || submitAssignment.isPending}
              data-testid="button-confirm-submit"
            >
              {submitAssignment.isPending ? (
                "제출 중..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  제출하기
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
