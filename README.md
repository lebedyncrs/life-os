# Life OS

Single-owner MVP for **Telegram capture** (shopping, ideas, birthdays) plus a **web dashboard** (session auth, four home sections) and **scheduled Telegram reminders** (pg-boss).

## Quick start

Follow **[specs/001-shopping-voice-dashboard/quickstart.md](specs/001-shopping-voice-dashboard/quickstart.md)** for Postgres, migrations, env vars, and local run.

At a glance:

1. `docker compose up -d` from the repo root  
2. `cd backend && npm install && npx prisma migrate deploy && npm run start:dev`  
3. `cd frontend && npm install && npm run dev` (set `VITE_API_BASE_URL` if the API is not at `http://localhost:3000`)

## Architecture

High-level shape matches **[specs/001-shopping-voice-dashboard/plan.md](specs/001-shopping-voice-dashboard/plan.md)**:

- **Backend** (`backend/`): NestJS, Prisma, grammY (Telegram), pg-boss (reminder jobs), Zod env validation, cookie sessions. Code is grouped as **application** (use cases, ports), **infrastructure** (Prisma, NLU, jobs), and **presentation** (HTTP, Telegram webhook).
- **Frontend** (`frontend/`): React 19 + Vite, React Router, TanStack Query; calls the API with `credentials: 'include'` for the session cookie.
- **Spec & contracts**: Feature docs under `specs/001-shopping-voice-dashboard/` (including `contracts/openapi.yaml`).

## Manual QA

See **[specs/001-shopping-voice-dashboard/checklists/manual-qa.md](specs/001-shopping-voice-dashboard/checklists/manual-qa.md)** for auth and Telegram negative checks (SC-006).
