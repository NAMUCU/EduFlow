import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// User profiles with role (teacher/student)
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(),
  email: text("email"),
  name: text("name").notNull(),
  role: text("role", { enum: ["teacher", "student"] }).notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  students: many(students),
  problems: many(problems),
  problemSets: many(problemSets),
}));

// Students (registered by teachers)
export const students = pgTable("students", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => profiles.id),
  userId: varchar("user_id").references(() => profiles.id),
  inviteCode: varchar("invite_code", { length: 8 }).notNull().unique(),
  name: text("name").notNull(),
  school: text("school"),
  grade: text("grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentsRelations = relations(students, ({ one, many }) => ({
  teacher: one(profiles, {
    fields: [students.teacherId],
    references: [profiles.id],
  }),
  assignments: many(assignments),
}));

// Problems
export const problems = pgTable("problems", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => profiles.id),
  subject: text("subject").notNull(),
  unit: text("unit"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const problemsRelations = relations(problems, ({ one }) => ({
  teacher: one(profiles, {
    fields: [problems.teacherId],
    references: [profiles.id],
  }),
}));

// Problem Sets
export const problemSets = pgTable("problem_sets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => profiles.id),
  title: text("title").notNull(),
  problemIds: text("problem_ids").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const problemSetsRelations = relations(problemSets, ({ one, many }) => ({
  teacher: one(profiles, {
    fields: [problemSets.teacherId],
    references: [profiles.id],
  }),
  assignments: many(assignments),
}));

// Assignments
export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  problemSetId: uuid("problem_set_id").notNull().references(() => problemSets.id),
  studentId: uuid("student_id").notNull().references(() => students.id),
  status: text("status", { enum: ["pending", "submitted"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  problemSet: one(problemSets, {
    fields: [assignments.problemSetId],
    references: [problemSets.id],
  }),
  student: one(students, {
    fields: [assignments.studentId],
    references: [students.id],
  }),
  submissions: many(submissions),
}));

// Submissions
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: uuid("assignment_id").notNull().references(() => assignments.id),
  imageUrl: text("image_url").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
}));

// Insert schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, inviteCode: true, createdAt: true });
export const insertProblemSchema = createInsertSchema(problems).omit({ id: true, createdAt: true });
export const insertProblemSetSchema = createInsertSchema(problemSets).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true });

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type ProblemSet = typeof problemSets.$inferSelect;
export type InsertProblemSet = z.infer<typeof insertProblemSetSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
