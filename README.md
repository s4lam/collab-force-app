# Collab Force

> **Project Context:** This is an MVP / coursework-style project built as a care/service appointment scheduling and patient management web application. It is **not** a production healthcare platform and should not be used to store real patient health data.

---

## Table of Contents
- [Overview](#overview)
- [Why This Project Exists](#why-this-project-exists)
- [MVP Scope & Key Features](#mvp-scope--key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Implementation Details](#architecture--implementation-details)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Quick Start](#quick-start)
- [Known Limitations & Future Improvements](#known-limitations--future-improvements)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview
Collab Force is a secure, role-based prototype web application tailored for care organizations. It provides a centralized internal interface for administrating patients, scheduling appointments, and strictly overseeing internal administrative actions via an immutable audit trail. Workflows natively restrict content exposure globally around predefined structural roles (`ADMIN` vs `STAFF`). 

## Why This Project Exists
This application serves as a comprehensive vertical slice prototype demonstrating advanced Next.js App Router integrations. It explicitly tests complex architectural layers—such as Next.js Edge-compatible middleware separation strategies, native driver database pooling utilizing Prisma 7 `adapter-pg`, and rigorous server-side time boundary logic—all within a highly polished, responsive interface.

## MVP Scope & Key Features
Based on the current repository implementation, the following features constitute the primary functional slice:
- **Authentication & RBAC:** Secured application portal conditionally restricting routes globally.
- **Patient Management (CRUD):** Creating, modifying, viewing, and resolving patient records. Employs a **soft-delete** mechanism architecture. Soft-deleted patients are explicitly scrubbed from normal interface views and new appointment selection dropdowns, but their historical/legacy appointments correctly remain visible within schedules.
- **Appointment Lifecycle (CRUD):** Advanced booking workflows bridging practitioners/staff and patients natively. Validates against aggressive **overlapping appointment conflict checks** server-side prior to processing commit commits to prevent double-booking.
- **Audit Logging:** Administrative capture indexing user footprint details explicitly across CRUD manipulations globally. Locked to `ADMIN` visibility only.

## Tech Stack
- **Framework:** Next.js 16.2.4 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla PostCSS implementations) + `lucide-react` dynamically.
- **Database:** PostgreSQL (Containerized via Docker)
- **ORM / Database Driver:** Prisma 7 + Native `pg` Connection Pool (integrated via `@prisma/adapter-pg`)
- **Authentication:** NextAuth.js (Auth.js v5 beta) leveraging the Split-Config Edge pattern.
- **Time/Date Utility:** `date-fns` 

## Architecture & Implementation Details

### Authentication & Authorization Overview
This framework applies the Auth.js v5 split-configuration constraint architecture to decouple dependencies securely:
- **`src/lib/auth.config.ts`**: Safely abstracts session interfaces and raw JWT strategy primitives entirely into Next.js Edge API compatibilities natively running over `src/middleware.ts`.
- **`src/lib/auth.ts`**: Aggregates the standard configuration by injecting Node-dependent operations intrinsically (ex: hashing utilities via `bcryptjs`).
- Role-based Access Control (RBAC) behaves iteratively. Structural pages (like `/audit`) restrict logic globally on the React view block seamlessly passing backend boundary validations ensuring `STAFF` access requests explicitly bounce 403 Forbidden.

### Data Model 
1. **User**: Operational staff utilizing the platform conditionally verified as either `ADMIN` or `STAFF`.
2. **Patient**: The focal entity supporting direct physical attributes inherently carrying Boolean `isDeleted` tags.
3. **Appointment**: A linked contextual schema matching `staffId` and `patientId` records, mapped temporally between durations (5 to 480 minutes).
4. **AuditLog**: Independent mutation storage logging arbitrary user execution payload artifacts natively tracking operational footprints.

### API & Database Driver Mapping
- Adheres explicitly natively to the advanced **Prisma 7 connection interface** (`@prisma/adapter-pg`) isolating global context factories intelligently wrapping standard `Pool` structures over un-cached TCP thresholds preventing Serverless timeouts cleanly.
- Implements explicitly configured boundaries handled within `prisma.config.ts` configurations dynamically.

## Project Structure
```text
collab-force-app/
├── prisma/
│   ├── schema.prisma      # Schema parameters and relationships
│   └── seed.ts            # Environment data scaffolding logic
├── src/
│   ├── app/
│   │   ├── (app)/         # Authenticated core dashboard templates
│   │   ├── api/           # Node/Edge API validation boundary routes
│   │   ├── login/         # Public-facing credential templates
│   │   ├── globals.css    # Centralized CSS / custom tailwind abstractions
│   │   └── layout.tsx     # Root Next.js structural baseline
│   ├── components/        # Reusable structures (Wrappers, generic layout toggles)
│   ├── lib/               # System primitives (prisma pool, abstracted audit engines)
│   └── middleware.ts      # Core Edge verification guard mapping requests
├── docker-compose.yml     # PostgreSQL isolation pod
├── prisma.config.ts       # Database native configuration 
└── package.json           # Registry dependencies and execution vectors
```

## Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- Docker Desktop or Docker Engine CLI
- Git

### Environment Variables
Duplicate `.env.example` to `.env` globally or provision a local `.env` containing explicit tracking strings:

| Variable        | Description                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | Valid PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/collab_force?schema=public`) |
| `AUTH_SECRET`   | 32-character high-entropy cryptographic NextAuth hash string                                                         |
| `AUTH_URL`      | Core boundary host pointing natively in dev testing as `http://localhost:3000`                                       |

### Quick Start
Execute these sequential terminal commands starting at the repository root:

```bash
# 1. Install precise application dependencies mapped over the project
npm install

# 2. Invoke the Prisma 7 binary configuration engines globally
npx prisma generate

# 3. Bring up the distinct Postgres instance (Runs in detached daemon locally)
docker compose up -d

# 4. Synchronize the local Postgres instance utilizing native schema constraints
npx prisma db push

# 5. Populate and seed the target database actively with testing primitives
npx tsx prisma/seed.ts

# 6. Launch the Turbopack interactive dev server application host
npm run dev
```

### Accessing the System
Once executed, the primary native interface structurally runs at: `http://localhost:3000`

> **Development Demo Credentials**
> Explicitly provisioned for closed-testing iterations natively generated via seed injections:
> - **Admin**: `admin@collabforce.com` / `password123`
> - **Staff**: `staff@collabforce.com` / `password123`

## Deployment Notes & Docker Workflow
At the time of writing, the `docker-compose.yml` target configuration exists **only** to provision and execute the targeted `postgres` database layer contextually. It does not bind the broader web application cluster. 

Running tests linking live Postgres Linux hosting environments bridging cloud infrastructures typically require manual execution or reverse-proxies (ex: executing temporary Cloudflare Tunnels mapping port 3000 explicitly locally). 

## Known Limitations & Future Improvements
Based on the current implementation state, there are explicit contextual caveats:
1. **Next.js Deprecation Diagnostics:** The Next.js 16 environment locally registers terminal warnings reflecting: `The "middleware" file convention is deprecated. Please use "proxy" instead.` 
2. **Docker Compose Tag Warnings:** Certain syntax tags across `docker-compose.yml` generate diagnostic alerts natively flagging obsolescence over newer Docker versions.
3. **Turbopack Lockfile Warning:** Execution generates minor structural warnings inferring standard root workspace parameters across `package-lock.json` inferences.
4. **Typing Completeness:** Standard execution boundaries structurally inside `src/lib/audit.ts` abstract audit tracking payload data strictly using `any/unknown` object references functionally. Hardening schema boundaries cleanly via TypeScript mappings remains incomplete.

## Security Notes
**CAUTION:** This iteration integrates hardcoded validation seeding mechanisms explicitly generating known credentials utilizing `bcryptjs` algorithms locally via the dev-seed interface. 
- Real operational deployments explicitly mandate isolation from `prisma/seed.ts` files globally restricting execution.
- Securing arbitrary medical constraints mandates external explicit PHI/HIPAA compliance methodologies, hardware execution boundaries, and explicit data encryption-at-rest frameworks conceptually beyond the structural capabilities mapped natively natively this particular prototype framework.

## Troubleshooting
- **Database Boot Failures:** Verify Docker is actively running the underlying engine globally and Postgres targets connect natively to mapped port `5432` without collision overlaps blocking the socket.
- **Seed Script Configuration Aborts:** The CLI tool implicitly utilizes `npx tsx prisma/seed.ts`. To ensure native Prisma 7 components acquire credential structures securely outside the Next.js runtime, an explicit `dotenv/config` invocation dynamically exists securely at the top initializing variables before passing execution safely into Node processes smoothly. 
- **DOM Hydration Crashes (`React Hydration Error`):** Extensions modifying HTML natively inside browsers (ex: "Dark Reader") typically collide aggressively alongside Next.js Server-Side logic. Root layout `<html suppressHydrationWarning>` mitigates most overlaps dynamically natively across generic components, but aggressively injecting extensions visually typically mandates explicit toggles securely tracking UI verification testing boundaries correctly natively.
