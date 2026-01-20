import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TeacherLayout from "@/components/layouts/teacher-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Student } from "@shared/schema";

const grades = [
  "초등 1학년", "초등 2학년", "초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년",
  "중등 1학년", "중등 2학년", "중등 3학년",
  "고등 1학년", "고등 2학년", "고등 3학년",
];

export default function TeacherStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    school: "",
    grade: "",
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
  });

  const createStudent = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/teacher/students", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      toast({ title: "학생이 등록되었습니다" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "학생 등록에 실패했습니다", variant: "destructive" });
    },
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/teacher/students/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      toast({ title: "학생 정보가 수정되었습니다" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "학생 정보 수정에 실패했습니다", variant: "destructive" });
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/teacher/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      toast({ title: "학생이 삭제되었습니다" });
      setDeleteDialogOpen(false);
      setDeletingStudent(null);
    },
    onError: () => {
      toast({ title: "학생 삭제에 실패했습니다", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStudent(null);
    setFormData({ name: "", school: "", grade: "" });
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      school: student.school || "",
      grade: student.grade || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "이름을 입력해주세요", variant: "destructive" });
      return;
    }
    if (editingStudent) {
      updateStudent.mutate({ id: editingStudent.id, data: formData });
    } else {
      createStudent.mutate(formData);
    }
  };

  const filteredStudents = students?.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">학생 관리</h1>
            <p className="text-muted-foreground mt-1">등록된 학생을 관리합니다</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-student">
            <Plus className="w-4 h-4 mr-2" />
            학생 등록
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름, 학교, 학년으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStudents?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">등록된 학생이 없습니다</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery ? "검색 결과가 없습니다" : "새로운 학생을 등록해보세요"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  학생 등록
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents?.map((student) => (
              <Card key={student.id} className="hover-elevate" data-testid={`card-student-${student.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-lg">
                        {student.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate" data-testid="text-student-name">
                        {student.name}
                      </h3>
                      {student.school && (
                        <p className="text-sm text-muted-foreground truncate">
                          {student.school}
                        </p>
                      )}
                      {student.grade && (
                        <p className="text-sm text-muted-foreground">{student.grade}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(student)}
                        data-testid={`button-edit-${student.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingStudent(student);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-${student.id}`}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "학생 정보 수정" : "새 학생 등록"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "학생 정보를 수정합니다"
                : "새로운 학생의 정보를 입력해주세요"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">학교</Label>
                <Input
                  id="school"
                  placeholder="OO초등학교"
                  value={formData.school}
                  onChange={(e) =>
                    setFormData({ ...formData, school: e.target.value })
                  }
                  data-testid="input-school"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">학년</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: value })
                  }
                >
                  <SelectTrigger data-testid="select-grade">
                    <SelectValue placeholder="학년 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={createStudent.isPending || updateStudent.isPending}
                data-testid="button-submit"
              >
                {createStudent.isPending || updateStudent.isPending
                  ? "저장 중..."
                  : editingStudent
                  ? "수정"
                  : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 삭제</DialogTitle>
            <DialogDescription>
              정말로 {deletingStudent?.name} 학생을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingStudent(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingStudent && deleteStudent.mutate(deletingStudent.id)}
              disabled={deleteStudent.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteStudent.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherLayout>
  );
}
