import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  FileText,
  Send,
  FileCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/teacher", label: "대시보드", icon: LayoutDashboard },
  { href: "/teacher/students", label: "학생 관리", icon: Users },
  { href: "/teacher/problems", label: "문제 생성", icon: FileText },
  { href: "/teacher/assignments", label: "과제 배포", icon: Send },
  { href: "/teacher/submissions", label: "제출 확인", icon: FileCheck },
];

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "T";
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || "강사";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/teacher" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl hidden sm:inline">EduFlow</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-2"
                        data-testid={`nav-${item.label}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" data-testid="button-user-menu">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center gap-2 cursor-pointer" data-testid="button-logout">
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
