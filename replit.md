# EduFlow - AI 기반 학원 운영 자동화 플랫폼

## Overview

EduFlow is an AI-powered academy management platform designed for Korean educational services. Teachers can generate problems using AI, distribute assignments to students, and analyze student submissions. The platform serves two distinct user roles: teachers (강사) and students (학생).

**Core Features:**
- Teacher dashboard with student management, problem generation, assignment distribution, and submission tracking
- Student dashboard with assignment viewing and submission upload
- Role-based authentication and routing
- Korean language UI throughout the application

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a role-based layout system with separate layouts for teachers (`TeacherLayout`) and students (`StudentLayout`). Pages are organized under `client/src/pages/` with subdirectories for each role.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **File Uploads**: Multer for handling image uploads (stored in `uploads/` directory)

The server uses a modular structure with routes defined in `server/routes.ts` and database operations abstracted through a storage interface in `server/storage.ts`.

### Authentication
- **Provider**: Replit Auth via OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **User Profiles**: Separate profiles table with role designation (teacher/student)

Authentication is handled through `server/replit_integrations/auth/` with middleware for protected routes.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push`

**Core Tables:**
- `users` / `sessions` - Authentication (managed by Replit Auth)
- `profiles` - User roles and display information
- `students` - Students registered by teachers
- `problems` - Individual problem items with subject, difficulty, question/answer
- `problemSets` - Collections of problems
- `assignments` - Problem sets assigned to students
- `submissions` - Student submission records with image uploads

### Validation
- **Schema Validation**: Zod with drizzle-zod for type-safe validation
- **Form Handling**: React Hook Form with Zod resolvers

### Security Model
- **Role-based Access Control**: `requireTeacher` and `requireStudent` middleware on all protected routes
- **Ownership Verification**: All CRUD operations verify teacherId/userId matches authenticated user
- **Request Validation**: All endpoints use Zod schemas for input validation
- **File Access**: Authenticated routes with userId-based ownership verification
- **Student Linking**: Invite code-based system (8-character unique codes)
  - Teachers create students with auto-generated invite codes
  - Students use invite codes to link their accounts
  - Once linked, authorization uses userId (not name matching)
  - Codes are unique and collision-safe

**Key Security Endpoints:**
- `POST /api/student/link` - Link student account using invite code
- `GET /api/student/link-status` - Check if student is linked
- `POST /api/teacher/students/:id/regenerate-code` - Regenerate invite code for unlinked student

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for database operations

### Authentication
- Replit OpenID Connect provider
- Session secret via `SESSION_SECRET` environment variable

### UI Components
- shadcn/ui (Radix UI primitives with Tailwind styling)
- Pretendard font loaded via CDN for Korean typography

### Development Tools
- Vite dev server with HMR
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)

### File Storage
- Local filesystem storage for uploaded images (`uploads/` directory)
- 10MB file size limit, image types only (jpeg, jpg, png, gif, webp)