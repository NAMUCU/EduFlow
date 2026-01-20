import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import { insertStudentSchema, insertProblemSchema, insertProblemSetSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Validation schemas
const createStudentSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  school: z.string().optional(),
  grade: z.string().optional(),
});

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
});

const generateProblemsSchema = z.object({
  subject: z.string().min(1, "과목을 선택해주세요"),
  unit: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  count: z.number().min(1).max(20).default(5),
});

const createProblemsSchema = z.object({
  problems: z.array(z.object({
    subject: z.string(),
    unit: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    question: z.string(),
    answer: z.string().optional(),
  })),
});

const updateProblemSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  subject: z.string().optional(),
  unit: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

const createProblemSetSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  problemIds: z.array(z.string()),
});

const createAssignmentsSchema = z.object({
  problemSetId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()),
});

// Role-based middleware
const requireTeacher = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const profile = await storage.getProfile(userId);
    if (!profile || profile.role !== "teacher") {
      return res.status(403).json({ message: "교사 권한이 필요합니다" });
    }
    
    req.profile = profile;
    next();
  } catch (error) {
    res.status(500).json({ message: "권한 확인 중 오류가 발생했습니다" });
  }
};

const requireStudent = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const profile = await storage.getProfile(userId);
    if (!profile || profile.role !== "student") {
      return res.status(403).json({ message: "학생 권한이 필요합니다" });
    }
    
    req.profile = profile;
    next();
  } catch (error) {
    res.status(500).json({ message: "권한 확인 중 오류가 발생했습니다" });
  }
};

// Mock AI problem generation
function generateMockProblems(subject: string, unit: string, difficulty: string, count: number) {
  const mockProblems: { question: string; answer: string }[] = [];
  
  const templates: Record<string, { questions: string[]; answers: string[] }> = {
    수학: {
      questions: [
        "다음 방정식을 풀어보세요: 2x + 5 = 15",
        "삼각형의 세 변의 길이가 3, 4, 5일 때, 이 삼각형의 넓이를 구하세요.",
        "1부터 100까지의 자연수 중 3의 배수의 합을 구하세요.",
        "연속하는 세 자연수의 합이 45일 때, 가장 큰 수를 구하세요.",
        "원의 반지름이 7cm일 때, 원의 둘레를 구하세요. (π = 3.14)",
      ],
      answers: ["x = 5", "6", "1683", "16", "43.96cm"],
    },
    영어: {
      questions: [
        "다음 문장을 영어로 번역하세요: '나는 매일 아침 학교에 갑니다.'",
        "다음 빈칸에 알맞은 전치사를 넣으세요: She is good ___ playing piano.",
        "다음 단어의 과거형을 쓰세요: go",
        "'beautiful'의 반의어를 쓰세요.",
        "다음 문장의 틀린 부분을 고치세요: He go to school every day.",
      ],
      answers: ["I go to school every morning.", "at", "went", "ugly", "He goes to school every day."],
    },
    국어: {
      questions: [
        "다음 중 올바른 띄어쓰기를 고르세요: ① 못 가다 ② 못가다",
        "'맑다'의 반대말을 쓰세요.",
        "다음 문장에서 주어를 찾으세요: '예쁜 꽃이 피었다.'",
        "'사랑'의 동음이의어를 한 가지 쓰세요.",
        "다음 속담의 의미를 설명하세요: '낮 말은 새가 듣고 밤 말은 쥐가 듣는다.'",
      ],
      answers: ["① 못 가다", "흐리다", "꽃이", "사랑(使浪) - 물결을 일으킴", "아무리 비밀로 한 말도 남에게 전해지기 쉬우니 말을 조심하라는 뜻"],
    },
    과학: {
      questions: [
        "물의 끓는점은 몇 도입니까?",
        "광합성에 필요한 세 가지 요소를 쓰세요.",
        "태양계에서 가장 큰 행성의 이름은 무엇입니까?",
        "공기 중 가장 많은 비율을 차지하는 기체는 무엇입니까?",
        "식물 세포에만 있고 동물 세포에는 없는 구조 두 가지를 쓰세요.",
      ],
      answers: ["100°C (1기압 기준)", "햇빛, 물, 이산화탄소", "목성", "질소 (약 78%)", "세포벽, 엽록체"],
    },
    사회: {
      questions: [
        "대한민국의 수도는 어디입니까?",
        "3·1 운동이 일어난 해는 언제입니까?",
        "우리나라의 국화(國花)는 무엇입니까?",
        "대한민국 헌법에 명시된 국민의 4대 의무를 모두 쓰세요.",
        "세계에서 가장 넓은 면적을 가진 나라는 어디입니까?",
      ],
      answers: ["서울", "1919년", "무궁화", "국방, 납세, 교육, 근로의 의무", "러시아"],
    },
  };

  const subjectData = templates[subject] || templates["수학"];
  
  for (let i = 0; i < count; i++) {
    const idx = i % subjectData.questions.length;
    let question = subjectData.questions[idx];
    let answer = subjectData.answers[idx];
    
    if (unit) {
      question = `[${unit}] ${question}`;
    }
    
    mockProblems.push({ question, answer });
  }
  
  return mockProblems;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Serve uploaded files with authentication
  app.get("/uploads/:filename", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check ownership: file must belong to a submission the user has access to
      const imageUrl = `/uploads/${filename}`;
      const submission = await storage.getSubmissionByImageUrl(imageUrl);
      
      if (!submission) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(403).json({ message: "접근 권한이 없습니다" });
      }
      
      // Teachers can access files for their students
      if (profile.role === "teacher") {
        const student = await storage.getStudent(assignment.studentId);
        if (!student || student.teacherId !== userId) {
          return res.status(403).json({ message: "접근 권한이 없습니다" });
        }
      }
      // Students can only access their own submissions using userId
      else if (profile.role === "student") {
        const student = await storage.getStudent(assignment.studentId);
        if (!student || student.userId !== userId) {
          return res.status(403).json({ message: "접근 권한이 없습니다" });
        }
      }
      
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Profile routes
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roleSchema = z.object({
        role: z.enum(["teacher", "student"]),
      });
      
      const parsed = roleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "유효하지 않은 역할입니다" });
      }
      
      const { role } = parsed.data;
      
      const existingProfile = await storage.getProfile(userId);
      if (existingProfile) {
        return res.json(existingProfile);
      }
      
      const name = req.user.claims.first_name && req.user.claims.last_name
        ? `${req.user.claims.first_name} ${req.user.claims.last_name}`
        : req.user.claims.email?.split("@")[0] || "User";
      
      const profile = await storage.createProfile({
        id: userId,
        email: req.user.claims.email,
        name,
        role,
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  // Teacher routes - all require teacher role
  app.get("/api/teacher/stats", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getTeacherStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Students CRUD - with ownership checks
  app.get("/api/teacher/students", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const students = await storage.getStudentsByTeacher(userId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/teacher/students", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const parsed = createStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const student = await storage.createStudent({
        ...parsed.data,
        teacherId: userId,
      });
      
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.patch("/api/teacher/students/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingStudent = await storage.getStudent(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "학생을 찾을 수 없습니다" });
      }
      if (existingStudent.teacherId !== userId) {
        return res.status(403).json({ message: "수정 권한이 없습니다" });
      }
      
      const parsed = updateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const student = await storage.updateStudent(id, parsed.data);
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Regenerate invite code for a student
  app.post("/api/teacher/students/:id/regenerate-code", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingStudent = await storage.getStudent(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "학생을 찾을 수 없습니다" });
      }
      if (existingStudent.teacherId !== userId) {
        return res.status(403).json({ message: "권한이 없습니다" });
      }
      
      // Can only regenerate if not already linked
      if (existingStudent.userId) {
        return res.status(400).json({ message: "이미 연결된 학생의 초대 코드는 재생성할 수 없습니다" });
      }
      
      const updated = await storage.regenerateInviteCode(id);
      res.json(updated);
    } catch (error) {
      console.error("Error regenerating invite code:", error);
      res.status(500).json({ message: "Failed to regenerate invite code" });
    }
  });

  app.delete("/api/teacher/students/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingStudent = await storage.getStudent(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "학생을 찾을 수 없습니다" });
      }
      if (existingStudent.teacherId !== userId) {
        return res.status(403).json({ message: "삭제 권한이 없습니다" });
      }
      
      await storage.deleteStudent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Problems - with ownership checks
  app.get("/api/teacher/problems", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const problems = await storage.getProblemsByTeacher(userId);
      res.json(problems);
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  app.post("/api/teacher/problems/generate", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const parsed = generateProblemsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const { subject, unit, difficulty, count } = parsed.data;
      const problems = generateMockProblems(subject, unit || "", difficulty, count);
      res.json(problems);
    } catch (error) {
      console.error("Error generating problems:", error);
      res.status(500).json({ message: "Failed to generate problems" });
    }
  });

  app.post("/api/teacher/problems", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const parsed = createProblemsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const problemsWithTeacher = parsed.data.problems.map((p) => ({
        ...p,
        teacherId: userId,
      }));
      
      const created = await storage.createProblems(problemsWithTeacher);
      res.json(created);
    } catch (error) {
      console.error("Error creating problems:", error);
      res.status(500).json({ message: "Failed to create problems" });
    }
  });

  app.patch("/api/teacher/problems/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingProblem = await storage.getProblem(id);
      if (!existingProblem) {
        return res.status(404).json({ message: "문제를 찾을 수 없습니다" });
      }
      if (existingProblem.teacherId !== userId) {
        return res.status(403).json({ message: "수정 권한이 없습니다" });
      }
      
      const parsed = updateProblemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const problem = await storage.updateProblem(id, parsed.data);
      res.json(problem);
    } catch (error) {
      console.error("Error updating problem:", error);
      res.status(500).json({ message: "Failed to update problem" });
    }
  });

  app.delete("/api/teacher/problems/:id", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      // Verify ownership
      const existingProblem = await storage.getProblem(id);
      if (!existingProblem) {
        return res.status(404).json({ message: "문제를 찾을 수 없습니다" });
      }
      if (existingProblem.teacherId !== userId) {
        return res.status(403).json({ message: "삭제 권한이 없습니다" });
      }
      
      await storage.deleteProblem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting problem:", error);
      res.status(500).json({ message: "Failed to delete problem" });
    }
  });

  // Problem Sets - with ownership checks
  app.get("/api/teacher/problem-sets", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sets = await storage.getProblemSetsByTeacher(userId);
      res.json(sets);
    } catch (error) {
      console.error("Error fetching problem sets:", error);
      res.status(500).json({ message: "Failed to fetch problem sets" });
    }
  });

  app.post("/api/teacher/problem-sets", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const parsed = createProblemSetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const set = await storage.createProblemSet({
        teacherId: userId,
        title: parsed.data.title,
        problemIds: parsed.data.problemIds,
      });
      
      res.json(set);
    } catch (error) {
      console.error("Error creating problem set:", error);
      res.status(500).json({ message: "Failed to create problem set" });
    }
  });

  // Assignments - with ownership checks
  app.get("/api/teacher/assignments/all", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getAssignmentsByTeacher(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/teacher/assignments", isAuthenticated, requireTeacher, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const parsed = createAssignmentsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "유효하지 않은 입력입니다",
          errors: parsed.error.errors 
        });
      }
      
      const { problemSetId, studentIds } = parsed.data;
      
      // Verify problem set ownership
      const problemSet = await storage.getProblemSet(problemSetId);
      if (!problemSet || problemSet.teacherId !== userId) {
        return res.status(403).json({ message: "문제지에 대한 권한이 없습니다" });
      }
      
      // Verify all students belong to this teacher
      for (const studentId of studentIds) {
        const student = await storage.getStudent(studentId);
        if (!student || student.teacherId !== userId) {
          return res.status(403).json({ message: "학생에 대한 권한이 없습니다" });
        }
      }
      
      const assignmentsData = studentIds.map((studentId: string) => ({
        problemSetId,
        studentId,
        status: "pending" as const,
      }));
      
      const created = await storage.createAssignments(assignmentsData);
      res.json(created);
    } catch (error) {
      console.error("Error creating assignments:", error);
      res.status(500).json({ message: "Failed to create assignments" });
    }
  });

  // Student routes - all require student role
  
  // Get current student link status
  app.get("/api/student/link-status", isAuthenticated, requireStudent, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const student = await storage.getStudentByUserId(userId);
      
      if (student) {
        res.json({ linked: true, student });
      } else {
        res.json({ linked: false });
      }
    } catch (error) {
      console.error("Error checking link status:", error);
      res.status(500).json({ message: "Failed to check link status" });
    }
  });
  
  // Link student account using invite code (secure)
  app.post("/api/student/link", isAuthenticated, requireStudent, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const linkSchema = z.object({
        inviteCode: z.string().length(8, "초대 코드는 8자리입니다"),
      });
      
      const parsed = linkSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "유효하지 않은 초대 코드입니다" });
      }
      
      // Check if already linked
      const existingLink = await storage.getStudentByUserId(userId);
      if (existingLink) {
        return res.status(400).json({ message: "이미 연결된 계정이 있습니다" });
      }
      
      // Find student by invite code
      const student = await storage.getStudentByInviteCode(parsed.data.inviteCode.toUpperCase());
      if (!student) {
        return res.status(404).json({ message: "유효하지 않은 초대 코드입니다" });
      }
      if (student.userId) {
        return res.status(400).json({ message: "이미 사용된 초대 코드입니다" });
      }
      
      // Link the student
      const linkedStudent = await storage.linkStudentToUser(student.id, userId);
      res.json({ success: true, student: linkedStudent });
    } catch (error) {
      console.error("Error linking student:", error);
      res.status(500).json({ message: "Failed to link student" });
    }
  });
  
  app.get("/api/student/stats", isAuthenticated, requireStudent, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getStudentStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching student stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/student/assignments", isAuthenticated, requireStudent, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get student record linked to this user
      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.json([]);
      }
      
      // Get assignments for this student
      const studentAssignments = await storage.getAssignmentsByStudent(student.id);
      
      const enrichedAssignments = [];
      
      for (const assignment of studentAssignments) {
        const problemSet = await storage.getProblemSet(assignment.problemSetId);
        if (problemSet) {
          const problems = await storage.getProblemsByIds(problemSet.problemIds);
          const studentData = await storage.getStudent(assignment.studentId);
          const submissionsList = await storage.getSubmissionsByAssignment(assignment.id);
          enrichedAssignments.push({
            ...assignment,
            student: studentData,
            problemSet,
            problems,
            submissions: submissionsList,
          });
        }
      }
      
      res.json(enrichedAssignments);
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/student/assignments/:id/submit", isAuthenticated, requireStudent, upload.array("images", 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "이미지를 업로드해주세요" });
      }
      
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        // Clean up uploaded files
        for (const file of files) {
          fs.unlinkSync(path.join(uploadDir, file.filename));
        }
        return res.status(404).json({ message: "과제를 찾을 수 없습니다" });
      }
      
      // Verify the assignment belongs to the student using userId
      const student = await storage.getStudent(assignment.studentId);
      
      if (!student || student.userId !== userId) {
        // Clean up uploaded files
        for (const file of files) {
          fs.unlinkSync(path.join(uploadDir, file.filename));
        }
        return res.status(403).json({ message: "제출 권한이 없습니다" });
      }
      
      // Create submissions
      for (const file of files) {
        await storage.createSubmission({
          assignmentId: id,
          imageUrl: `/uploads/${file.filename}`,
        });
      }
      
      // Update assignment status
      await storage.updateAssignmentStatus(id, "submitted");
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      res.status(500).json({ message: "Failed to submit assignment" });
    }
  });

  return httpServer;
}
