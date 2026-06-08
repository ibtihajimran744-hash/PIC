# 🎓 Edunova - Enterprise Educational ERP & Student Information System (SIS)

Edunova is a next-generation, high-performance, responsive Single Page Application (SPA) designed to manage multi-campus, multi-tier educational institutions. Written in **TypeScript** utilizing **React 19**, **Vite 6**, **Tailwind CSS**, and **Supabase**, Edunova integrates 15+ specialized dashboards providing seamless, real-time collaboration across students, teachers, administrators, and executive management.

---

## ⚡ Key Highlights
* **15+ Tailored Portals:** Fully granular access-control modules for all roles from Registrar and Accountants to Directors and Principals.
* **Real-time Synchronization:** Built-in live notifications, biometrically driven attendance processing, and chat broadcasts via Supabase.
* **AI-Assisted Operations:** Advanced admissions routing, automatic profile score evaluators, and dynamic image generation using the modern `@google/genai` SDK.
* **Detailed Installment Planning:** Interactive registrar operations supporting customized fee packages, boards registration, student card fees, and flexible installment schedulers.
* **Modern Material Design:** A custom Emerald, Slate, and Rose-accented layout designed with spacious padding, crisp typography, and touch-target precision.

---

## 📂 Project Architecture & Codebase Navigation

The project is structured strictly following standard modern modular patterns for React + Vite:

```bash
├── .env.example             # Documented template for external configuration keys
├── package.json             # Application dependencies, scripts, and runtime engines
├── vite.config.ts           # Bundler configurations and asset processing pipeline
├── src/
│   ├── main.tsx             # Application entry point & mounting
│   ├── App.tsx              # Root coordinator, global routing & authentication state
│   ├── index.css            # Global stylesheet injecting Tailwind layers & custom fonts
│   ├── components/          # Portal modules and major sub-systems
│   │   ├── LandingPage.tsx          # Public-facing inquiry and application dashboard
│   │   ├── AdmissionPortal.tsx      # Comprehensive registrar operations and profile record desk
│   │   ├── AdminPortal.tsx          # System configuration, cash registers, global ledgers and accounting
│   │   ├── AcademicsPortal.tsx      # Lecture planner, diaries, and scheme of study configurations
│   │   ├── CoordinatorPortal.tsx    # Stream-specific coordinator dashboards (Boys, Girls, and Uni campuses)
│   │   ├── ExaminerPortal.tsx       # Exam compilers, termly result publishers and charts
│   │   ├── AdmissionAssistant.tsx   # GenAI voice-and-text chatbot helper for potential candidates
│   │   ├── TeacherPortal.tsx        # Instructor-facing portals for attendance, grades, and files
│   │   ├── StudentPortal.tsx        # Interactive portal featuring student progress, syllabi, and XP trackers
│   │   └── ... (Principal, VP, Director, Receptionist, and custom components)
│   ├── services/            # Client libraries and external connectors
│   │   ├── supabase.ts              # Native client and typed CRUD helper functions
│   │   ├── chatbotService.ts        # Google Gemini AI models interactions layer
│   │   └── academicManagement.ts    # Schemes of study, lecture logs, and planning logic
│   └── lib/
│       └── utils.ts                 # Input sanitization, data validators & styling injectors
```

For in-depth explanations on portals and code logic, explore our sub-directories under the `docs/` folder:
* 📖 [Operations & Roll Portal Manual](docs/PORTAL_GUIDE.md) — Step-by-step workflow for all 15 operational roles.
* 🛠️ [Database & Architecture Guide](docs/ARCHITECTURE_AND_SCHEMAS.md) — DB schema types, state synchronizers, and security tables.
* 📐 [System Design & Workflows Guide](docs/SYSTEM_DESIGN.md) — High-level system design visual topology and diagrams.
* 🤖 [API Integrations (Gemini & Supabase)](docs/API_INTEGRATION.md) — Guide to using Gemini AI and real-time biometric channels.

---

## ⚙️ Quick Installation & Setup

### 1. Prerequisites
Ensure you have **Node.js 18.x or above** and `npm` installed.

### 2. Environment Variables Configuration
Clone the template configuration file in the project root:
```bash
cp .env.example .env
```
Populate `.env` with your persistent cloud keys:
```env
# Database Credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Advanced GenAI Models Key
GEMINI_API_KEY=AIzaSy...
```

*Note: Environment variables prefixed with `VITE_` are automatically exposed to the frontend on compilation. Never commit actual secret keys like `GEMINI_API_KEY` to public origin control repositories.*

### 3. Install Dependencies
Run the installation script to populate your local `node_modules` cache:
```bash
npm install
```

### 4. Running Local Development Server
To launch Vite's ultra-fast dev server with Hot Module Replacement and HMR trackers on the pre-configured container port:
```bash
npm run dev
```
The application will instantly become accessible at `http://localhost:3000`.

---

## 🏗️ Building and Deploying for Production

### Standard Static Build
To bundle all assets (TypeScript compilation, modules tree-shaking, CSS optimization and minification):
```bash
npm run build
```
This script outputs highly optimized, split JS chunks and assets inside the `/dist` directory, completely prepared to be served via any enterprise host (e.g., Cloud Run, Vercel, Netlify, or Nginx).

### Automated Testing & Linting
Verify static types and code constraints as required by CI/CD gates:
```bash
npm run lint
```

---

## 🔒 Security & Data Privacy Guidelines

1. **Role-Based Permissions:** Every API transaction and state query verifies user role authenticity (`AdminUser.role` or profile metadata claims) to prevent horizontal privilege escalation.
2. **Strict Sanitization:** Input values (especially search bars and custom inquiry forms) are processed via `validateAndSanitize()` to prevent script exploits.
3. **Database Security (RLS):** Enable Row-Level Security on Supabase with defined policies so that students can only read their personal grades/attendance, teachers can only edit assigned class entries, and controllers hold write permissions of authorized registers.

---

## 🤝 Contribution Guidelines
We follow standard Git-Flow methodologies for code additions:
1. Fork the codebase and create your feature-specific branch (`feature/analytics-charts`).
2. Adhere strictly to the defined Tailwind theme color structures.
3. Run `npm run lint` and verify build status before opening a Pull Request (PR).
4. Outline your changes and associated functional modifications clearly inside the PR submission logs.

---

*Intellectual Property and Corporate Enterprise Core. Designed with precision by Edunova Systems © 2026.*
