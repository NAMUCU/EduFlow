import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RoleSelect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student" | null>(null);

  const createProfile = useMutation({
    mutationFn: async (role: "teacher" | "student") => {
      const res = await apiRequest("POST", "/api/profile", { role });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (data.role === "teacher") {
        setLocation("/teacher");
      } else {
        setLocation("/student");
      }
    },
    onError: () => {
      toast({
        title: "오류",
        description: "프로필 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleSelectRole = (role: "teacher" | "student") => {
    setSelectedRole(role);
    createProfile.mutate(role);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="font-bold text-2xl">EduFlow</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">역할을 선택해주세요</h1>
        <p className="text-muted-foreground">
          어떤 역할로 EduFlow를 사용하시겠습니까?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full">
        <Card 
          className={`cursor-pointer transition-all hover-elevate ${
            selectedRole === "teacher" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleSelectRole("teacher")}
          data-testid="card-teacher-role"
        >
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">강사</CardTitle>
            <CardDescription>
              문제를 생성하고 학생에게 과제를 배포합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 학생 관리</li>
              <li>• AI 문제 생성</li>
              <li>• 과제 배포 및 제출 확인</li>
            </ul>
            <Button 
              className="mt-4 w-full" 
              disabled={createProfile.isPending}
            >
              {createProfile.isPending && selectedRole === "teacher" 
                ? "처리 중..." 
                : "강사로 시작하기"}
            </Button>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover-elevate ${
            selectedRole === "student" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleSelectRole("student")}
          data-testid="card-student-role"
        >
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">학생</CardTitle>
            <CardDescription>
              배포된 과제를 풀고 풀이를 제출합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 과제 확인</li>
              <li>• 문제 풀이</li>
              <li>• 풀이 이미지 제출</li>
            </ul>
            <Button 
              className="mt-4 w-full" 
              disabled={createProfile.isPending}
            >
              {createProfile.isPending && selectedRole === "student" 
                ? "처리 중..." 
                : "학생으로 시작하기"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
