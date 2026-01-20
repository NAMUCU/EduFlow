import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TeacherLayout from "@/components/layouts/teacher-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Plus, FileText, Pencil, Trash2, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Problem, ProblemSet } from "@shared/schema";

const subjects = ["수학", "영어", "국어", "과학", "사회"];
const difficulties = [
  { value: "easy", label: "쉬움" },
  { value: "medium", label: "보통" },
  { value: "hard", label: "어려움" },
];

export default function TeacherProblems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [generateForm, setGenerateForm] = useState({
    subject: "",
    unit: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    count: 5,
  });
  
  const [generatedProblems, setGeneratedProblems] = useState<Array<{
    question: string;
    answer: string;
  }>>([]);
  
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [problemSetTitle, setProblemSetTitle] = useState("");
  const [createSetDialogOpen, setCreateSetDialogOpen] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());

  const { data: problems, isLoading: problemsLoading } = useQuery<Problem[]>({
    queryKey: ["/api/teacher/problems"],
  });

  const { data: problemSets, isLoading: setsLoading } = useQuery<ProblemSet[]>({
    queryKey: ["/api/teacher/problem-sets"],
  });

  const generateProblems = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/teacher/problems/generate", generateForm);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedProblems(data);
      toast({ title: "문제가 생성되었습니다" });
    },
    onError: () => {
      toast({ title: "문제 생성에 실패했습니다", variant: "destructive" });
    },
  });

  const saveProblems = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/teacher/problems", {
        problems: generatedProblems.map((p) => ({
          ...p,
          subject: generateForm.subject,
          unit: generateForm.unit,
          difficulty: generateForm.difficulty,
        })),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/problems"] });
      setGeneratedProblems([]);
      toast({ title: "문제가 저장되었습니다" });
    },
    onError: () => {
      toast({ title: "문제 저장에 실패했습니다", variant: "destructive" });
    },
  });

  const updateProblem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Problem> }) => {
      const res = await apiRequest("PATCH", `/api/teacher/problems/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/problems"] });
      setEditingProblem(null);
      toast({ title: "문제가 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "문제 수정에 실패했습니다", variant: "destructive" });
    },
  });

  const deleteProblem = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/teacher/problems/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/problems"] });
      toast({ title: "문제가 삭제되었습니다" });
    },
    onError: () => {
      toast({ title: "문제 삭제에 실패했습니다", variant: "destructive" });
    },
  });

  const createProblemSet = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/teacher/problem-sets", {
        title: problemSetTitle,
        problemIds: Array.from(selectedProblems),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/problem-sets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      setCreateSetDialogOpen(false);
      setProblemSetTitle("");
      setSelectedProblems(new Set());
      toast({ title: "문제지가 생성되었습니다" });
    },
    onError: () => {
      toast({ title: "문제지 생성에 실패했습니다", variant: "destructive" });
    },
  });

  const getDifficultyLabel = (value: string) => {
    return difficulties.find((d) => d.value === value)?.label || value;
  };

  const getDifficultyVariant = (value: string) => {
    switch (value) {
      case "easy":
        return "secondary";
      case "medium":
        return "default";
      case "hard":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">문제 생성</h1>
          <p className="text-muted-foreground mt-1">AI로 문제를 생성하고 관리합니다</p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList>
            <TabsTrigger value="generate" data-testid="tab-generate">
              <Sparkles className="w-4 h-4 mr-2" />
              문제 생성
            </TabsTrigger>
            <TabsTrigger value="problems" data-testid="tab-problems">
              <FileText className="w-4 h-4 mr-2" />
              저장된 문제
            </TabsTrigger>
            <TabsTrigger value="sets" data-testid="tab-sets">
              <Plus className="w-4 h-4 mr-2" />
              문제지
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI 문제 생성
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>과목 *</Label>
                      <Select
                        value={generateForm.subject}
                        onValueChange={(v) =>
                          setGenerateForm({ ...generateForm, subject: v })
                        }
                      >
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="과목 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>난이도 *</Label>
                      <Select
                        value={generateForm.difficulty}
                        onValueChange={(v) =>
                          setGenerateForm({
                            ...generateForm,
                            difficulty: v as "easy" | "medium" | "hard",
                          })
                        }
                      >
                        <SelectTrigger data-testid="select-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>단원</Label>
                    <Input
                      placeholder="예: 분수의 덧셈"
                      value={generateForm.unit}
                      onChange={(e) =>
                        setGenerateForm({ ...generateForm, unit: e.target.value })
                      }
                      data-testid="input-unit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>문제 수</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={generateForm.count}
                      onChange={(e) =>
                        setGenerateForm({
                          ...generateForm,
                          count: parseInt(e.target.value) || 1,
                        })
                      }
                      data-testid="input-count"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => generateProblems.mutate()}
                    disabled={!generateForm.subject || generateProblems.isPending}
                    data-testid="button-generate"
                  >
                    {generateProblems.isPending ? (
                      "생성 중..."
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        문제 생성
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle>생성된 문제</CardTitle>
                  {generatedProblems.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => saveProblems.mutate()}
                      disabled={saveProblems.isPending}
                      data-testid="button-save-problems"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      전체 저장
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {generatedProblems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>생성된 문제가 없습니다</p>
                      <p className="text-sm mt-1">
                        왼쪽에서 조건을 설정하고 문제를 생성하세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {generatedProblems.map((problem, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border border-border space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              문제 {index + 1}
                            </span>
                          </div>
                          <Textarea
                            value={problem.question}
                            onChange={(e) => {
                              const updated = [...generatedProblems];
                              updated[index].question = e.target.value;
                              setGeneratedProblems(updated);
                            }}
                            className="resize-none"
                            rows={3}
                          />
                          <div className="space-y-1">
                            <Label className="text-xs">정답</Label>
                            <Input
                              value={problem.answer}
                              onChange={(e) => {
                                const updated = [...generatedProblems];
                                updated[index].answer = e.target.value;
                                setGeneratedProblems(updated);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="problems" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">
                {problems?.length || 0}개의 문제가 저장되어 있습니다
              </p>
              {selectedProblems.size > 0 && (
                <Button onClick={() => setCreateSetDialogOpen(true)} data-testid="button-create-set">
                  <Plus className="w-4 h-4 mr-2" />
                  문제지 만들기 ({selectedProblems.size}개 선택)
                </Button>
              )}
            </div>

            {problemsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : problems?.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">저장된 문제가 없습니다</h3>
                  <p className="text-muted-foreground text-sm">
                    문제 생성 탭에서 새 문제를 만들어보세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {problems?.map((problem) => (
                  <Card
                    key={problem.id}
                    className={`hover-elevate cursor-pointer ${
                      selectedProblems.has(problem.id) ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      const updated = new Set(selectedProblems);
                      if (updated.has(problem.id)) {
                        updated.delete(problem.id);
                      } else {
                        updated.add(problem.id);
                      }
                      setSelectedProblems(updated);
                    }}
                    data-testid={`card-problem-${problem.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            selectedProblems.has(problem.id)
                              ? "bg-primary border-primary"
                              : "border-border"
                          }`}
                        >
                          {selectedProblems.has(problem.id) && (
                            <CheckCircle className="w-4 h-4 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline">{problem.subject}</Badge>
                            <Badge variant={getDifficultyVariant(problem.difficulty)}>
                              {getDifficultyLabel(problem.difficulty)}
                            </Badge>
                            {problem.unit && (
                              <span className="text-sm text-muted-foreground">
                                {problem.unit}
                              </span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-2">{problem.question}</p>
                          {problem.answer && (
                            <p className="text-sm text-muted-foreground mt-1">
                              정답: {problem.answer}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProblem(problem)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProblem.mutate(problem.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sets" className="mt-6">
            {setsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : problemSets?.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-1">생성된 문제지가 없습니다</h3>
                  <p className="text-muted-foreground text-sm">
                    저장된 문제 탭에서 문제를 선택하여 문제지를 만드세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {problemSets?.map((set) => (
                  <Card key={set.id} className="hover-elevate" data-testid={`card-set-${set.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{set.title}</CardTitle>
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={createSetDialogOpen} onOpenChange={setCreateSetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문제지 만들기</DialogTitle>
            <DialogDescription>
              선택한 {selectedProblems.size}개의 문제로 문제지를 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>문제지 제목 *</Label>
              <Input
                placeholder="예: 수학 1단원 연습문제"
                value={problemSetTitle}
                onChange={(e) => setProblemSetTitle(e.target.value)}
                data-testid="input-set-title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSetDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => createProblemSet.mutate()}
              disabled={!problemSetTitle.trim() || createProblemSet.isPending}
              data-testid="button-confirm-create-set"
            >
              {createProblemSet.isPending ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProblem} onOpenChange={() => setEditingProblem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문제 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>문제</Label>
              <Textarea
                value={editingProblem?.question || ""}
                onChange={(e) =>
                  editingProblem &&
                  setEditingProblem({ ...editingProblem, question: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>정답</Label>
              <Input
                value={editingProblem?.answer || ""}
                onChange={(e) =>
                  editingProblem &&
                  setEditingProblem({ ...editingProblem, answer: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProblem(null)}>
              취소
            </Button>
            <Button
              onClick={() =>
                editingProblem &&
                updateProblem.mutate({
                  id: editingProblem.id,
                  data: {
                    question: editingProblem.question,
                    answer: editingProblem.answer,
                  },
                })
              }
              disabled={updateProblem.isPending}
            >
              {updateProblem.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}
