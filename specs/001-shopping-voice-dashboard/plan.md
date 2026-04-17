# Implementation Plan: Life OS MVP — core user flows (Telegram + web dashboard)

**Branch**: `[001-shopping-voice-dashboard]` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-shopping-voice-dashboard/spec.md`

**Note**: This plan was produced by `/speckit.plan`. Phase 2 task breakdown lives in `/speckit.tasks` (not created here).

## Summary

Deliver a **single-owner** Life OS MVP: **Telegram** (voice/text) for shopping, ideas,
and birthday capture with **scheduled Telegram reminders**; **web dashboard** for
the four home sections (shopping, ideas, upcoming birthdays, habits summary) with
CRUD where specified; **auditable** mutations without logging raw voice or secrets.
Technical approach: **TypeScript** monorepo with **NestJS** backend (hexagonal-style
modules: domain / application / infrastructure), **PostgreSQL** + **Prisma**,
**grammY** Telegram bot, **pg-boss** for outbound reminders and retries, **React +
Vite** SPA with cookie-based session auth, **OpenAI-compatible** structured NLU
for intent routing (pluggable provider). See [research.md](./research.md) for
decisions and alternatives.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22 LTS  
**Primary Dependencies**: NestJS, Prisma ORM, grammY, pg-boss, Zod (validation), React 19, Vite 6, TanStack Query  
**Storage**: PostgreSQL 16+ (relational data + job queue via pg-boss)  
**Testing**: Vitest (unit), Supertest or Nest testing module (HTTP), Playwright (critical dashboard + auth flows); contract tests against OpenAPI examples  
**Target Platform**: Linux container or VM for API/worker; modern evergreen browsers for dashboard  
**Project Type**: web-service + SPA + background worker (same Nest process or separate worker entry)  
**Performance Goals**: p95 dashboard API reads under 300 ms at single-user load; Telegram webhook handling under 10 s end-to-end for NLU path (excluding provider outages)  
**Constraints**: No raw voice persistence after transcript; secrets in env only; single-tenant MVP; reminders must be idempotent per firing key  
**Scale/Scope**: One owner, thousands of entities per type, low QPS; design keeps multi-tenant evolution possible (owner_id on all rows)

## Constitution Check

*GATE: Passed before Phase 0 research. Re-checked after Phase 1 design.*

Aligned with `.specify/memory/constitution.md` (Life OS):

- **OOP**: Backend organized by domain modules (shopping, ideas, birthdays, habits,
  notifications, identity) with application services and infrastructure adapters
  (Prisma, Telegram, LLM provider, clock). No fat controllers.
- **Quality**: Automated tests for NLU routing, persistence, scheduler idempotency,
  and auth boundaries; manual exploratory checklist for voice UX.
- **Scalability**: Stateless API instances behind load balancer ready; job queue
  supports horizontal worker scale; DB indexes on foreign keys and due reminder
  queries documented in data model.
- **Privacy & channels**: Telegram binding + session auth documented; voice
  discarded after transcript; audit log schema redacts content; per-surface auth
  in contracts.

No violations requiring Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/001-shopping-voice-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── openapi.yaml
│   └── telegram-update.schema.json
└── tasks.md              # /speckit.tasks (not created by plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── domain/              # entities, value objects, domain events (by bounded context)
│   ├── application/         # use cases, ports (interfaces)
│   ├── infrastructure/      # prisma, telegram, llm, pg-boss, audit logger
│   └── presentation/        # HTTP controllers, DTOs, webhooks
├── prisma/
│   └── schema.prisma
├── test/
│   ├── unit/
│   ├── integration/
│   └── contract/
└── package.json

frontend/
├── src/
│   ├── pages/               # dashboard home, section routes
│   ├── components/
│   ├── lib/                 # API client, auth state
│   └── main.tsx
├── e2e/                     # Playwright
└── package.json

docker-compose.yml           # postgres (+ optional redis later), api, worker
```

**Structure Decision**: **Split `backend/` and `frontend/`** at repository root for
clear boundaries, OOP-friendly NestJS modules, and independent SPA deployment. Job
runner can share the NestJS application context in-process for MVP or use a
`worker` npm script entry.

## Complexity Tracking

> No constitution violations requiring justification for this MVP stack.

## Post-Phase 1 Constitution Check

*Re-evaluated after data model and contracts.*

- **OOP**: Bounded contexts map to domain packages; cross-context use cases
  orchestrate via application layer only.
- **Quality**: Contract examples in `contracts/openapi.yaml` align with acceptance
  scenarios; scheduler states testable from DB.
- **Scalability**: Indexes and `owner_id` scoping documented in `data-model.md`;
  queue job names versioned.
- **Privacy & channels**: OpenAPI documents authenticated routes only; Telegram
  webhook contract separates public update envelope from internal command handling;
  no PII in example payloads.
