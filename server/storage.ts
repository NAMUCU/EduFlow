import {
  profiles, students, problems, problemSets, assignments, submissions,
  type Profile, type InsertProfile,
  type Student, type InsertStudent,
  type Problem, type InsertProblem,
  type ProblemSet, type InsertProblemSet,
  type Assignment, type InsertAssignment,
  type Submission, type InsertSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  
  // Students
  getStudentsByTeacher(teacherId: string): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUserId(userId: string): Promise<Student | undefined>;
  getStudentByInviteCode(inviteCode: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<void>;
  linkStudentToUser(studentId: string, userId: string): Promise<Student | undefined>;
  regenerateInviteCode(studentId: string): Promise<Student | undefined>;
  
  // Problems
  getProblemsByTeacher(teacherId: string): Promise<Problem[]>;
  getProblem(id: string): Promise<Problem | undefined>;
  getProblemsByIds(ids: string[]): Promise<Problem[]>;
  createProblems(problems: InsertProblem[]): Promise<Problem[]>;
  updateProblem(id: string, data: Partial<InsertProblem>): Promise<Problem | undefined>;
  deleteProblem(id: string): Promise<void>;
  
  // Problem Sets
  getProblemSetsByTeacher(teacherId: string): Promise<ProblemSet[]>;
  getProblemSet(id: string): Promise<ProblemSet | undefined>;
  createProblemSet(set: InsertProblemSet): Promise<ProblemSet>;
  
  // Assignments
  getAssignmentsByTeacher(teacherId: string): Promise<(Assignment & { student: Student; problemSet: ProblemSet; submissions: Submission[] })[]>;
  getAssignmentsByStudent(studentId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignments(assignments: InsertAssignment[]): Promise<Assignment[]>;
  updateAssignmentStatus(id: string, status: "pending" | "submitted"): Promise<Assignment | undefined>;
  
  // Submissions
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionByImageUrl(imageUrl: string): Promise<Submission | null>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  
  // Stats
  getTeacherStats(teacherId: string): Promise<{
    studentCount: number;
    problemSetCount: number;
    pendingSubmissions: number;
    weeklySubmissions: number;
  }>;
  getStudentStats(userId: string): Promise<{
    totalAssignments: number;
    pendingAssignments: number;
    completedAssignments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [created] = await db.insert(profiles).values(profile).returning();
    return created;
  }

  // Students
  async getStudentsByTeacher(teacherId: string): Promise<Student[]> {
    return db.select().from(students).where(eq(students.teacherId, teacherId)).orderBy(desc(students.createdAt));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async generateUniqueInviteCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = this.generateInviteCode();
      const existing = await this.getStudentByInviteCode(code);
      if (!existing) {
        return code;
      }
      attempts++;
    }
    
    throw new Error("Failed to generate unique invite code after max attempts");
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const inviteCode = await this.generateUniqueInviteCode();
    const [created] = await db.insert(students).values({ ...student, inviteCode }).returning();
    return created;
  }

  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db.update(students).set(data).where(eq(students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async regenerateInviteCode(studentId: string): Promise<Student | undefined> {
    const newCode = await this.generateUniqueInviteCode();
    const [updated] = await db.update(students).set({ inviteCode: newCode }).where(eq(students.id, studentId)).returning();
    return updated;
  }

  async getStudentByUserId(userId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student;
  }

  async getAllUnlinkedStudents(): Promise<Student[]> {
    const allStudents = await db.select().from(students);
    return allStudents.filter(s => !s.userId);
  }

  async getStudentByInviteCode(inviteCode: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.inviteCode, inviteCode));
    return student;
  }

  async linkStudentToUser(studentId: string, userId: string): Promise<Student | undefined> {
    const [updated] = await db.update(students).set({ userId }).where(eq(students.id, studentId)).returning();
    return updated;
  }

  // Problems
  async getProblemsByTeacher(teacherId: string): Promise<Problem[]> {
    return db.select().from(problems).where(eq(problems.teacherId, teacherId)).orderBy(desc(problems.createdAt));
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id));
    return problem;
  }

  async getProblemsByIds(ids: string[]): Promise<Problem[]> {
    if (ids.length === 0) return [];
    const allProblems = await db.select().from(problems);
    return allProblems.filter(p => ids.includes(p.id));
  }

  async createProblems(problemsData: InsertProblem[]): Promise<Problem[]> {
    if (problemsData.length === 0) return [];
    return db.insert(problems).values(problemsData).returning();
  }

  async updateProblem(id: string, data: Partial<InsertProblem>): Promise<Problem | undefined> {
    const [updated] = await db.update(problems).set(data).where(eq(problems.id, id)).returning();
    return updated;
  }

  async deleteProblem(id: string): Promise<void> {
    await db.delete(problems).where(eq(problems.id, id));
  }

  // Problem Sets
  async getProblemSetsByTeacher(teacherId: string): Promise<ProblemSet[]> {
    return db.select().from(problemSets).where(eq(problemSets.teacherId, teacherId)).orderBy(desc(problemSets.createdAt));
  }

  async getProblemSet(id: string): Promise<ProblemSet | undefined> {
    const [set] = await db.select().from(problemSets).where(eq(problemSets.id, id));
    return set;
  }

  async createProblemSet(set: InsertProblemSet): Promise<ProblemSet> {
    const [created] = await db.insert(problemSets).values(set).returning();
    return created;
  }

  // Assignments
  async getAssignmentsByTeacher(teacherId: string): Promise<(Assignment & { student: Student; problemSet: ProblemSet; submissions: Submission[] })[]> {
    const teacherStudents = await this.getStudentsByTeacher(teacherId);
    const studentIds = teacherStudents.map(s => s.id);
    
    if (studentIds.length === 0) return [];
    
    const allAssignments = await db.select().from(assignments).orderBy(desc(assignments.createdAt));
    const teacherAssignments = allAssignments.filter(a => studentIds.includes(a.studentId));
    
    const result: (Assignment & { student: Student; problemSet: ProblemSet; submissions: Submission[] })[] = [];
    
    for (const assignment of teacherAssignments) {
      const student = teacherStudents.find(s => s.id === assignment.studentId);
      const problemSet = await this.getProblemSet(assignment.problemSetId);
      const subs = await this.getSubmissionsByAssignment(assignment.id);
      
      if (student && problemSet) {
        result.push({
          ...assignment,
          student,
          problemSet,
          submissions: subs,
        });
      }
    }
    
    return result;
  }

  async getAssignmentsByStudent(studentId: string): Promise<Assignment[]> {
    return db.select().from(assignments).where(eq(assignments.studentId, studentId)).orderBy(desc(assignments.createdAt));
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async createAssignments(assignmentsData: InsertAssignment[]): Promise<Assignment[]> {
    if (assignmentsData.length === 0) return [];
    return db.insert(assignments).values(assignmentsData).returning();
  }

  async updateAssignmentStatus(id: string, status: "pending" | "submitted"): Promise<Assignment | undefined> {
    const [updated] = await db.update(assignments).set({ status }).where(eq(assignments.id, id)).returning();
    return updated;
  }

  // Submissions
  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId)).orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionByImageUrl(imageUrl: string): Promise<Submission | null> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.imageUrl, imageUrl)).limit(1);
    return submission || null;
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [created] = await db.insert(submissions).values(submission).returning();
    return created;
  }

  // Stats
  async getTeacherStats(teacherId: string): Promise<{
    studentCount: number;
    problemSetCount: number;
    pendingSubmissions: number;
    weeklySubmissions: number;
  }> {
    const teacherStudents = await this.getStudentsByTeacher(teacherId);
    const teacherSets = await this.getProblemSetsByTeacher(teacherId);
    const teacherAssignments = await this.getAssignmentsByTeacher(teacherId);
    
    const pendingSubmissions = teacherAssignments.filter(a => a.status === "pending").length;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let weeklySubmissions = 0;
    for (const assignment of teacherAssignments) {
      for (const sub of assignment.submissions) {
        if (sub.submittedAt && new Date(sub.submittedAt) >= oneWeekAgo) {
          weeklySubmissions++;
        }
      }
    }
    
    return {
      studentCount: teacherStudents.length,
      problemSetCount: teacherSets.length,
      pendingSubmissions,
      weeklySubmissions,
    };
  }

  async getStudentStats(userId: string): Promise<{
    totalAssignments: number;
    pendingAssignments: number;
    completedAssignments: number;
  }> {
    // Use userId-based lookup for secure student identification
    const linkedStudent = await this.getStudentByUserId(userId);
    
    if (!linkedStudent) {
      return { totalAssignments: 0, pendingAssignments: 0, completedAssignments: 0 };
    }
    
    const studentAssignments = await this.getAssignmentsByStudent(linkedStudent.id);
    
    return {
      totalAssignments: studentAssignments.length,
      pendingAssignments: studentAssignments.filter(a => a.status === "pending").length,
      completedAssignments: studentAssignments.filter(a => a.status === "submitted").length,
    };
  }
}

export const storage = new DatabaseStorage();
