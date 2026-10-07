# 05 — Setup, Deployment & Testing Guide

## 1. Prerequisites & Environment Setup

### System Requirements
- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **Package Manager**: `npm` v9+ or `pnpm` / `yarn`
- **Operating System**: Windows, macOS, or Linux

### Environment Configuration
The backend server uses a local `.env` configuration located at `server/.env`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="adrine-clinic-super-secret-jwt-key-2025"
JWT_EXPIRES_IN="7d"
```

---

## 2. Step-by-Step Quick Start

### 1. Install Dependencies
Run the unified installation script from the root workspace directory:
```bash
npm run install:all
```
*This installs root dependencies along with `client/` and `server/` packages concurrently.*

### 2. Initialize Database & Seed Demo Data
Push the Prisma schema and seed realistic clinic data:
```bash
npm run seed
```

### 3. Launch Development Servers
Start both the Express backend (Port 5000) and the Vite React frontend (Port 5173) in watch mode:
```bash
npm run dev
```

### Application URLs:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 3. Demo User Accounts & Credentials

| Role | Staff Member | Demo Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **Receptionist** | Emma Watson | `receptionist@adrineclinic.com` | `password123` | Patient onboarding, booking, conflict check, reschedule, cancel. |
| **Doctor (Cardiology)** | Dr. Sarah Jenkins | `dr.sarah@adrineclinic.com` | `password123` | Cardiology queue, ECG notes, hypertension reviews, vitals. |
| **Doctor (Family Medicine)** | Dr. Marcus Vance | `dr.marcus@adrineclinic.com` | `password123` | General practice queue, diabetes consultations, routine checks. |
| **Doctor (Pediatrics)** | Dr. Elena Rostova | `dr.elena@adrineclinic.com` | `password123` | Pediatric station, child wellness checks, vaccination notes. |

*Tip: The web application includes a 1-Click Demo Switcher in the top navigation bar to seamlessly transition between roles.*

---

## 4. Automated Integration Test Suite

The project includes an end-to-end integration test runner (`server/src/test_api.ts`) that executes 7 comprehensive integration tests covering all critical clinical requirements:

```bash
# In the server directory (or with server running):
npx tsx src/test_api.ts
```

### Test Suite Execution Plan:
```
🧪 Running Comprehensive Clinic OS API Integration Tests...

1️⃣ Testing Receptionist Authentication...
   ✅ Receptionist Authenticated: Emma Watson (Role: RECEPTIONIST)

2️⃣ Testing Operational Dashboard Metrics...
   ✅ Dashboard loaded for today (2026-10-07):
      - Today Appointments: 8
      - Completed Today: 3
      - Upcoming in 7 Days: 14
      - Total Patients: 25

3️⃣ Testing Patients Directory Filters & Pagination...
   ✅ Total registered patients: 25
   ✅ Active patients count: 22
   ✅ Archived patients count: 3
   ✅ Search for 'Arthur' returned: 1 patient(s) (Arthur Pendleton)

4️⃣ Testing Doctors & Slot Availability Engine...
   ✅ Total active doctors: 3
   ✅ Doctor Dr. Sarah Jenkins schedule generated: 16 slots
      - Booked slots: 3
      - Available slots: 13

5️⃣ Testing Conflict Detection Engine...
   ✅ Conflict detected successfully! HTTP 409: "Conflict detected: Dr. Sarah Jenkins already has an active appointment (09:30 - 10:00) with patient Arthur Pendleton."

6️⃣ Testing Doctor Authentication & Role-Scoped Privacy Guard...
   ✅ Doctor Authenticated: Dr. Sarah Jenkins (Specialization: Cardiology)
   ✅ Doctor's isolated patient list: 5 patients (Scoped strictly to Dr. Sarah)

7️⃣ Testing Doctor Clinical Note (SOAP) & Vitals Recording...
   ✅ Clinical note recorded: ID cn-test-101
      Diagnosis: "Essential Hypertension (ICD-10 I10) - Routine Review"

🎉 ALL 7 INTEGRATION TESTS PASSED WITH 100% SUCCESS!
```

---

## 5. Production Build & Deployment

### 1. Build Client & Server
```bash
npm run build
```
- Compiles TypeScript in `server/` to `dist/` and runs `prisma generate`.
- Bundles the React application with Vite into `client/dist/`.

### 2. Containerization (Dockerfile Blueprint)
```dockerfile
# Stage 1: Build Frontend & Backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm run install:all
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/client/dist ./public
EXPOSE 5000
CMD ["node", "dist/index.js"]
```
