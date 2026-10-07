# AuraHealth Clinic OS — Complete Documentation Suite

Welcome to the comprehensive technical and operational documentation for **AuraHealth Clinic OS** (Adrine Clinic Management System).

---

## 📚 Documentation Index

| Document | Focus Area | Key Contents |
| :--- | :--- | :--- |
| [**01. System Architecture & Technical Overview**](./01_SYSTEM_ARCHITECTURE.md) | High-Level Architecture | Full-stack architecture, technology stack, directory structure, JWT & RBAC security, 100x scale analysis. |
| [**02. User Interface & Design System**](./02_USER_INTERFACE_AND_DESIGN.md) | UI / UX & Frontend | Design tokens, color palette, component hierarchy, page breakdowns, interactive modals, responsive UX. |
| [**03. Functionality & Business Logic**](./03_FUNCTIONALITY_AND_BUSINESS_LOGIC.md) | Business Logic & APIs | Role permissions, Smart Conflict Engine, Doctor Availability Matrix, SOAP Clinical Notes, API specification. |
| [**04. Database Architecture & Data Models**](./04_DATABASE_AND_DATA_MODELS.md) | Database & Data Layer | Entity-Relationship Diagram (ERD), Prisma schema, relations, cascading rules, JSON vitals structure, seed data. |
| [**05. Setup, Deployment & Testing Guide**](./05_SETUP_DEPLOYMENT_AND_TESTING.md) | Operations & QA | Prerequisites, environment config, 1-click execution, automated test suite, production build, CI/CD roadmap. |

---

## 🏥 Executive Project Summary

**AuraHealth Clinic OS** is a production-grade outpatient clinic management system engineered to streamline daily outpatient workflows, eliminate double-booking errors, safeguard patient medical history, and empower clinicians with structured SOAP consultation tools.

### Core Highlights:
- **Intelligent Scheduling & Conflict Engine**: Real-time validation preventing overlapping bookings for the same doctor with mathematical slot overlap evaluation.
- **Strict Role-Based Access Control (RBAC)**: Distinct permissions for Receptionists (scheduling, patient onboarding) and Doctors (scoped medical history, SOAP consultation logging, isolated patient directories).
- **1-Click Live Role Switcher**: Instant transition between Emma Watson (Receptionist), Dr. Sarah Jenkins (Cardiology), Dr. Marcus Vance (Family Medicine), and Dr. Elena Rostova (Pediatrics).
- **Structured SOAP Clinical Consultation**: Recording Subjective symptoms, Objective vital signs (JSON), Assessment (ICD-10), and Plan (prescriptions and follow-up schedules).
- **Polished B2B Aesthetics**: Custom TailwindCSS palette with deep slate neutral surfaces, medical teal accents, micro-interactions, responsive sidebars, and interactive Recharts data visualizations.
