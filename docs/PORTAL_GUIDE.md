# 📖 Edunova Portal Operations & Role Manual

This manual provides a detailed reference for the workflow, features, and security scopes of each of the roles and operational portals built within the Edunova ERP and Student Information System.

---

## 🏛️ Portal Matrix Overview

Here is a quick breakdown of how roles navigate the application:

| Role Title | Associated Access Level | Primary Objectives | Key Modules |
| :--- | :--- | :--- | :--- |
| **Director** | High-Executive | Strategic oversight & financial audit | Global Analytics, Expense Logs, Buzz Notifications |
| **Vice Principal (VP)** | Operations Executive | Tactical surveillance, student discipline | Attendance Logs, Biometric Real-time Stream, Broadcast Lists |
| **Principal** | Academic Executive | Educational quality & teacher metrics | Leave approvals, Syllabus progress tracker, Performance trends |
| **Accountant** | Accounting Specialist | Cash register, fee collection & invoices | Ledger Books, Cash Register, Salaries Payslip Builder |
| **Coordinators** *(Boys/Girls/Uni)* | Campus Operations | Campus-level section mapping and rules | Student details, Section listings, Attendance verification |
| **Examiner** | Assessment Controller | Compiling marks and publishing results | Grade sheets, Termly rankings, Marks registers |
| **Academics** | Academic Planner | Curriculum compliance and lesson diaries | Schemes of Study, Lecture diary builder, MCQ quiz compiler |
| **Teacher** | Classroom Instructor | Classroom delivery and student engagement | Attendance Marker, Homework grading, XP awards builder |
| **Student** | Active Participant | Self-paced learning and status track | Dynamic dashboard, Syllabus paths, Biometric logs, Gamified XP |
| **Receptionist** | Front-desk Reception | Public entry-point & log registration | Visitor Diary, New inquiry lead submission forms |

---

## 🔍 Portal Deep-Dive & Workflows

### 1. 💼 Registrar and Admission Portal
The registrar office is responsible for recording new candidates into active rosters.
* **Onboarding Student Records:** Collects demographic data, previous educational qualifications (Matric/SSC and Intermediate/HSSC), dates of birth, religion, and father CNIC details. Includes automated upload of candidate photos to cloud buckets.
* **Smart Financial Packaging:** Allocates customized total fee packages (PKR), determines the number of installments (1–12), auto-generates payment dates, and configures non-package accessories (Board Registration, RFID Card, Uniforms, Summer Camp).
* **Suggested Section Evaluation:** Automatically evaluates intermediate candidates and suggest class sections based on subjects and current enrollment densities.

### 2. 💰 Accountant and General Ledger
The financial heart of the campus.
* **Real-time Cash Register:** The Accountant can load a physical cash session, record payments, provide digital receipt copies, and automatically synchronize student outstanding balance metrics.
* **Dynamic Income & Expense Tracker:** Manages non-fee inputs and school operating expenses. Generates visual summaries of gross cash flow profiles.

### 3. 🛡️ Vice Principal (VP) & Biometric Hub
A command center for daily discipline and campus activities.
* **Real-time Biometric Stream:** Displays micro-second check-in logs from hardware biometric gates (biometric log emulator hooks).
* **Instant Parent Alerts:** Automated notification engine that pushes attendance and late-arrival alarms to student portals and parent notification pipelines on check-in events.
* **Administrative Buzz:** Features a live buzz trigger that triggers UI shakes (`buzz_active` event) for associated terminals to grab immediate attention.

### 4. 📝 Examiner & Marks Compiler
Handles educational data processing.
* **Marks Registries:** Rather than entering data block-by-block, examiners upload parsed student results, customize maximum margins, and generate graded distributions.
* **Interactive Class Performance Trends:** Renders dynamic Recharts bar and line graphs showing progress across academic sections on a per-chapter basis.

### 5. 🧑‍🏫 Teacher Portal & Interaction Hub
Instructors can manage their day-to-day work from a centralized panel.
* **Biometric Synchronization Check:** Generates a roster for the teacher. If a student checked in at the gate but is not in class, a warning shows.
* **Curriculum Compliance Checklist:** Links direct homework files, notes downloads, and assignments directly into the master student timelines.
* **Leave Requests:** Submits formal leave requests to the Principal/VP dashboards for approval.

### 6. 🎓 Student Hub & Gamified XP Tracker
Engaging students through a sleek, dynamic hub.
* **Interactive Dynamic Course Path (Syllabus Roadmap):** Renders progress rings, completed chapter counts, lists teacher names, and breaks down the syllabus (e.g., Physics covers Kinetic energy to modern atomic theory).
* **XP Level Gamification:** Awarded XP (+10 on check-in, +50 on homework, +100 on perfect exams) and maintains a campus-wide real-time leaderboard ranking.
* **Secure Fee Receipts:** Includes parents/students checking real-time due balances, paying through payment slips, and downloading receipt ledgers.

---

*End of Portal Operations and Role Reference Manual.*
