# 🛠️ Edunova Framework Architecture & Database Schemas

This guide outlines the software architecture, design patterns, and exact database schemas utilized within the Edunova Enterprise ERP ecosystem.

---

## ⚡ Framework Technical Layer

The platform is built on modern, secure, and reactive systems, selecting industry-standard libraries to provide exceptional performance and stability.

```
       ┌─────────────────────────────────────────────────────────┐
       │             Client Layer (React 19 / Vite 6)            │
       │  Custom CSS Variable Theme + Tailwind + Motion motion │
       └────────────────────────────┬────────────────────────────┘
                                    │     Secure API Calls & State
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             Service layer / SDK Integrations            │
       │    Supabase Client SDK      │     @google/genai SDK     │
       └────────────────────────────┬────────────────────────────┘
                                    │     Persisted Storage Systems
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                  Durable Cloud Database                 │
       │                 Supabase PostgreSQL                     │
       └─────────────────────────────────────────────────────────┘
```

### 1. Unified Modular Core
* **Strict Type Safety:** Handled native TypeScript interfaces defining all database records.
* **Component Extraction:** Heavy views (such as `AdminPortal`, `AcademicsPortal`) are modularized to prevent build compilation memory exhausts.
* **Lazy Initialization Pattern:** To prevent application crashes on startup due to missing third-party keys, SDK initializers are protected by check-and-load guard sequences.

---

## 🗄️ Supabase PostgreSQL Database Schemas

We map the relational structure directly to the following entity models.

### 1. `students` (Student Profiles)
Stores the master information for registered students, matching progress metrics with financial ledgers.
```typescript
interface Student {
  id: number;               // Master unique incrementing ID
  full_name: string;        // Legal Name
  roll_no: number;          // Unique Roll Number (Primary Business Identifier)
  class_section: string;    // e.g. "FSc Physics Section-A"
  program?: string;         // Pre-Medical, ICS Physics, Pre-Engineering, BS, etc.
  part?: string;            // Part 1, Part 2, or Semester 1-8
  father_name?: string;     // Candidate Father Name
  parent_phone?: string;    // Contact cell phone for Automated SMS/Parent Alerts
  total_package: number;    // Master total package cost (PKR)
  paid_amount: number;      // Summary of all verified fees recorded in Cash Register
  status?: string;          // "Active" | "Inactive" | "Suspended"
  total_xp?: number;        // Gamified point aggregator
  username?: string;        // Login ID e.g. "stu_1021"
  password?: string;        // Login code e.g. "PIC1021"
}
```

### 2. `teachers` (Faculty Accounts)
Stores profiles of academic instructors, coordinating assignments and timetable slots.
```typescript
interface Teacher {
  id: number;               // Primary Key
  full_name: string;        // Faculty Name
  designation: string;      // e.g. "Senior Lecturer"
  subject_dept: string;     // e.g. "Mathematics"
  phone: string;            // Contact Info
  email: string;            // Email
  assigned_classes?: string;// Serialized JSON array of class strings
  username?: string;        // Access login details
  password?: string;
}
```

### 3. `admin_users` (System Administrators and Management)
Access register mapping for operational and high-level strategic roles.
```typescript
interface AdminUser {
  id: number;
  full_name: string;
  username: string;
  password?: string;
  role: 'Director' | 'VP' | 'Principal' | 'Accountant' | 'Coordinator' | 'Receptionist' | 'Admission Officer';
  department?: string;      // Campus department stream
  buzz_active?: boolean;    // Live UI trigger status flags
}
```

### 4. `attendance` (Gate Check-In & Biometrics Log)
Records attendance entries compiled by gates or instructors, complete with time details.
```typescript
interface Attendance {
  id: number;
  student_roll: number;     // Foreign Link to students roll_no
  status: 'Present' | 'Absent' | 'Late';
  date: string;             // ISO Date String (YYYY-MM-DD)
  time_in?: string;         // Check-in timestamp (HH:MM:SS)
  marked_by?: number;       // Instructor ID reference or 0 (Biometric Gate)
}
```

### 5. `grades` (Term Assessments & MCQ Quiz Marks)
Student assessment metrics mapped directly on subjects and exams.
```typescript
interface Grade {
  id: number;
  student_roll: number;     // Roll No
  chapter_name: string;     // Topic / Chapter Name
  subject: string;          // subject name
  score: number;            // Obtained Marks
  total_marks: number;      // Maximum Marks
  exam_id?: string;         // Associate Exam Master
}
```

### 6. `timetable` (Lecture Calendars)
Timetable schedules matching classes, instructors, and days of the week.
```typescript
interface Timetable {
  id: string;               // UUID Primary Key
  class_section: string;    // e.g. "FSc-A"
  subject: string;          // Subject e.g. "Physics"
  teacher_id: number;       // Foreign ref to teacher id
  day_of_week: string;      // e.g. "Monday"
  start_time: string;       // e.g. "08:30"
  end_time: string;         // e.g. "09:15"
  room?: string;            // e.g. "Room 203"
  campus?: string;          // e.g. "Boys Campus"
}
```

### 7. `scheme_of_study` (Instruction Planner & Diary Logs)
Syllabus breakdown logs detailing week-by-week lesson layouts.
```typescript
interface SchemeOfStudy {
  id: string;               // UUID
  subject_id: string;       // Subject Identification Code
  topic: string;            // Topic Heading
  description?: string;     // Outline
  week_no: number;          // Week Order (e.g. 1 - 24)
  day: string;              // Day sequence index
  scheduled_date: string;   // Planned Date
  status: 'planned' | 'completed' | 'in_progress';
}
```

### 8. `expenses` & `income` (Financial Transactions Ledger)
Stores general operational ledgers recorded by accountants.
```typescript
interface FinancialRecord {
  id: number;
  category: string;         // e.g. "Salary", "Utility", "Admissions"
  amount: number;           // Amount (PKR)
  description: string;      // Custom Memo notes
  date: string;             // Billing Date (YYYY-MM-DD)
  slip_no?: string;         // Cash Voucher Reference
  recorded_by?: string;     // Admin User who logged the transaction
}
```

---

## 💅 Styling and Theme variables
The application uses Tailwind 4 variables injected directly via `@import "tailwindcss";` layer in `/src/index.css`.
* **Standard Font Combinations:** `Inter` (sans-serif) for general data grids and layout readability, with `JetBrains Mono` for attendance checkpoints and monetary counters.
* **Palette Identity:** We stick strictly to professional, flat colors tailored directly to educational platforms:
  * Slate Zinc Neutral Grays (`text-slate-800` / `bg-slate-50`)
  * Emerald Mint for financial logs (`text-emerald-500` / `bg-emerald-50`)
  * Rose Pink for alerts and high-importance notices (`text-rose-500` / `bg-rose-50`)

---
