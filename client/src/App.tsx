import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/landing";
import RoleSelect from "@/pages/role-select";
import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherStudents from "@/pages/teacher/students";
import TeacherProblems from "@/pages/teacher/problems";
import TeacherAssignments from "@/pages/teacher/assignments";
import TeacherSubmissions from "@/pages/teacher/submissions";
import StudentDashboard from "@/pages/student/dashboard";
import StudentAssignments from "@/pages/student/assignments";
import NotFound from "@/pages/not-found";

interface Profile {
  id: string;
  role: "teacher" | "student";
  name: string;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function AuthenticatedRoutes() {
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
  });

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <RoleSelect />;
  }

  if (profile.role === "teacher") {
    return (
      <Switch>
        <Route path="/teacher" component={TeacherDashboard} />
        <Route path="/teacher/students" component={TeacherStudents} />
        <Route path="/teacher/problems" component={TeacherProblems} />
        <Route path="/teacher/assignments" component={TeacherAssignments} />
        <Route path="/teacher/submissions" component={TeacherSubmissions} />
        <Route path="/">
          <Redirect to="/teacher" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/assignments" component={StudentAssignments} />
      <Route path="/student/assignments/:id" component={StudentAssignments} />
      <Route path="/">
        <Redirect to="/student" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
