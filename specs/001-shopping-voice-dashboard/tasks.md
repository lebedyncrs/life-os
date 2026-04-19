---
description: "Task list for Life OS MVP — core user flows (Telegram + web dashboard)"
---

# Tasks: Life OS MVP — core user flows (Telegram + web dashboard)

**Input**: Design documents from `/Users/admin/Projects/life-os/specs/001-shopping-voice-dashboard/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: Omitted — not explicitly requested in `spec.md`; add in a follow-up if you adopt TDD.

**Organization**: Phases follow user story priorities P1–P5 from `spec.md`; file paths match `plan.md` (`backend/`, `frontend/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallel-safe (different files, no ordering dependency within the same checkpoint)
- **[USn]**: User story phase label (Setup and Foundational have no story label)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository layout, dependencies, and local runtime skeleton.

- [x] T001 Create `backend/` and `frontend/` directory trees per `specs/001-shopping-voice-dashboard/plan.md` (empty `backend/src/`, `frontend/src/` placeholders)
- [x] T002 [P] Add `docker-compose.yml` at repo root with PostgreSQL 16+ service and volume, matching ports in `specs/001-shopping-voice-dashboard/quickstart.md`
- [x] T003 [P] Add `backend/package.json` with NestJS, Prisma CLI, grammY, pg-boss, @nestjs/config, zod, argon2 (or bcrypt), express-session typings
- [x] T004 [P] Add `frontend/package.json` with React 19, Vite 6, `@tanstack/react-query`, and TypeScript 5.x
- [x] T005 [P] Add `backend/.env.example` documenting variables from `specs/001-shopping-voice-dashboard/quickstart.md` (no real secrets)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, session auth, Telegram webhook shell, audit + jobs — **no user story work before this completes.**

**Constitution**: OOP boundaries, secrets/auth for web + Telegram, scalability hooks per `.specify/memory/constitution.md` and `plan.md`.

**⚠️ CRITICAL**: User stories US1–US5 cannot start until this phase is done.

- [x] T006 Author `backend/prisma/schema.prisma` for Owner, ShoppingListItem, Idea, BirthdayReminder, ScheduledNotification, TrainingSession, AuditLog per `specs/001-shopping-voice-dashboard/data-model.md`
- [x] T007 Run Prisma migrate to create `backend/prisma/migrations/*/migration.sql` and verify against `data-model.md` indexes
- [x] T008 Scaffold `backend/src/main.ts` and `backend/src/app.module.ts` with global `ValidationPipe` and health check route `GET /health` in `backend/src/presentation/http/health.controller.ts`
- [x] T009 Add `backend/src/infrastructure/prisma/prisma.module.ts` and `backend/src/infrastructure/prisma/prisma.service.ts` with lifecycle hooks for Nest
- [x] T010 Add Zod-validated env loader `backend/src/infrastructure/config/env.schema.ts` and `ConfigModule` wiring `DATABASE_URL`, `SESSION_SECRET`, `TELEGRAM_BOT_TOKEN`, `NLU_PROVIDER_*`, `WEB_ORIGIN`
- [x] T011 Register pg-boss startup in `backend/src/infrastructure/jobs/pg-boss.module.ts` (or provider) so `boss.start()` runs after DB connect and creates `pgboss` schema
- [x] T012 Add `backend/src/application/ports/audit-logger.port.ts` and `backend/src/infrastructure/audit/prisma-audit-logger.service.ts` implementing coarse action logging (no raw voice bodies)
- [x] T013 Implement `POST /auth/login`, `POST /auth/logout`, `GET /me` in `backend/src/presentation/http/auth/auth.controller.ts` + DTOs per `specs/001-shopping-voice-dashboard/contracts/openapi.yaml`
- [x] T014 Configure HTTP-only session cookie + store (e.g. `express-session` with `connect-pg-simple` in `backend/src/main.ts`) compatible with `WEB_ORIGIN` CORS
- [x] T015 Add `POST /telegram/webhook/:secret` in `backend/src/presentation/telegram/telegram.controller.ts` rejecting wrong secret token before body parse
- [x] T016 Add `backend/src/infrastructure/telegram/grammy-bot.factory.ts` exporting configured `Bot` from grammY using `TELEGRAM_BOT_TOKEN`
- [x] T017 Add `backend/src/scripts/bootstrap-owner.ts` (npm script) to create initial Owner with hashed password and optional `telegram_link_token` per `quickstart.md`
- [x] T018 Enable CORS in `backend/src/main.ts` for `WEB_ORIGIN` with credentials
- [x] T019 Implement Telegram **account binding** verification in `backend/src/application/identity/verify-telegram-chat.use-case.ts` and wire `/start` + token handling in `backend/src/presentation/telegram/telegram.update-router.ts` so unbound chats cannot mutate data (FR-002)

**Checkpoint**: Database, auth session, Telegram webhook ingress, audit + pg-boss ready.

---

## Phase 3: User Story 1 — Add shopping items from Telegram (Priority: P1)

**Goal**: Voice or text in Telegram adds shopping rows for the bound owner.

**Independent Test**: Send text/voice with one item; item appears in DB with `source` telegram_* within two minutes (see SC-002).

### Implementation for User Story 1

- [x] T020 [US1] Add NLU intent types and `ParsedCommand` union in `backend/src/application/nlu/nlu.types.ts` (include `ADD_SHOPPING`, `UNKNOWN`)
- [x] T021 [US1] Define `NluPort` in `backend/src/application/ports/nlu.port.ts` with `parseTelegramText` and `parseTelegramVoiceTranscript` methods
- [x] T022 [US1] Implement `backend/src/infrastructure/nlu/openai-nlu.adapter.ts` calling provider with JSON-schema constrained output per `research.md` (no audio retention after transcript)
- [x] T023 [US1] Add `ShoppingRepository` port in `backend/src/application/shopping/shopping.repository.ts` and Prisma implementation `backend/src/infrastructure/shopping/prisma-shopping.repository.ts`
- [x] T024 [US1] Implement `CaptureShoppingFromTelegramUseCase` in `backend/src/application/shopping/capture-shopping-from-telegram.use-case.ts` (multi-item add, optional replace-all phrase)
- [x] T025 [US1] Implement `VoiceIngestService` in `backend/src/presentation/telegram/voice-ingest.service.ts` to download Telegram `file_id`, transcribe via NLU port, delete temp buffers
- [x] T026 [US1] Wire `telegram.update-router.ts` to route `message.text` and `message.voice` to the shopping use case when intent is shopping (edge: unintelligible → no DB writes, reply with retry text)
- [x] T027 [US1] Emit audit entries from `CaptureShoppingFromTelegramUseCase` via `AuditLogger` for `shopping.create` actions in `backend/src/application/shopping/capture-shopping-from-telegram.use-case.ts`

**Checkpoint**: US1 satisfied without dashboard (verify via DB or temporary debug endpoint removed before release).

---

## Phase 4: User Story 2 — Save an idea from Telegram (Priority: P2)

**Goal**: Explicit save-idea messages persist Idea rows.

**Independent Test**: Send save-idea phrase; row in `Idea` with correct `body` within two minutes (SC-003).

### Implementation for User Story 2

- [x] T028 [US2] Extend NLU types and OpenAI adapter for `SAVE_IDEA` intent in `backend/src/infrastructure/nlu/openai-nlu.adapter.ts` and `backend/src/application/nlu/nlu.types.ts`
- [x] T029 [US2] Add `IdeaRepository` port in `backend/src/application/ideas/idea.repository.ts` + `backend/src/infrastructure/ideas/prisma-idea.repository.ts`
- [x] T030 [US2] Implement `SaveIdeaFromTelegramUseCase` in `backend/src/application/ideas/save-idea-from-telegram.use-case.ts`
- [x] T031 [US2] Route save-idea branch in `backend/src/presentation/telegram/telegram.update-router.ts` with ambiguity rule: explicit phrase wins over shopping
- [x] T032 [US2] Add audit logging for `idea.create` in `backend/src/application/ideas/save-idea-from-telegram.use-case.ts`

**Checkpoint**: US2 independently testable via Telegram + DB inspection.

---

## Phase 5: User Story 3 — Birthday reminder from Telegram (Priority: P3)

**Goal**: Capture person + date/relative phrase and persist `BirthdayReminder` + linked `ScheduledNotification` rows.

**Independent Test**: Create reminder; `BirthdayReminder.next_occurrence_on` correct; `ScheduledNotification.fire_at` within lead window (US3 acceptance).

### Implementation for User Story 3

- [x] T033 [US3] Extend NLU for `SET_BIRTHDAY_REMINDER` in `backend/src/infrastructure/nlu/openai-nlu.adapter.ts`
- [x] T034 [US3] Add `BirthdayRepository` and `NotificationSchedulerPort` in `backend/src/application/birthdays/` (ports) with Prisma + pg-boss adapters in `backend/src/infrastructure/birthdays/`
- [x] T035 [US3] Implement `RecordBirthdayFromTelegramUseCase` in `backend/src/application/birthdays/record-birthday-from-telegram.use-case.ts` resolving dates with owner timezone from `Owner.timezone`
- [x] T036 [US3] On successful record, insert `ScheduledNotification` rows with `idempotency_key` and `fire_at` in `record-birthday-from-telegram.use-case.ts`
- [x] T037 [US3] Enqueue pg-boss job definitions in `backend/src/infrastructure/jobs/reminder-queue.service.ts` (payload references `ScheduledNotification.id`)
- [x] T038 [US3] Wire router in `backend/src/presentation/telegram/telegram.update-router.ts` for birthday intent; audit `birthday.upsert`

**Checkpoint**: US3 data exists; delivery still finalized in US5.

---

## Phase 6: User Story 4 — Web dashboard home (Priority: P4)

**Goal**: Authenticated SPA with four sections; CRUD per FR-008 and `contracts/openapi.yaml`.

**Independent Test**: Sign in, see sections (empty OK), mutate shopping + ideas + training log; refresh preserves state (SC-005, SC-001).

### Backend (HTTP) for User Story 4

- [x] T039 [US4] Implement `GET/POST/PATCH/DELETE /shopping-items` in `backend/src/presentation/http/shopping/shopping-items.controller.ts` matching `contracts/openapi.yaml`
- [x] T040 [US4] Implement `GET/POST/DELETE /ideas` in `backend/src/presentation/http/ideas/ideas.controller.ts`
- [x] T041 [US4] Implement `GET /birthdays` in `backend/src/presentation/http/birthdays/birthdays.controller.ts`
- [x] T042 [US4] Implement `GET /habits/summary` and `POST /habits/training-sessions` in `backend/src/presentation/http/habits/habits.controller.ts`
- [x] T043 [US4] Implement optional `GET /dashboard/home` aggregator in `backend/src/presentation/http/dashboard/dashboard.controller.ts` returning DTO per OpenAPI `DashboardHome`
- [x] T044 [US4] Add application services in `backend/src/application/*` for dashboard operations reusing repositories (no duplicate domain rules)

### Frontend for User Story 4

- [x] T045 [P] [US4] Add typed API client with credentials in `frontend/src/lib/api-client.ts` pointing at backend base URL from `import.meta.env`
- [x] T046 [US4] Add login form + session handling in `frontend/src/pages/LoginPage.tsx` calling `POST /auth/login` and `GET /me`
- [x] T047 [US4] Add `frontend/src/pages/DashboardHomePage.tsx` composing four sections (shopping list, ideas list, upcoming birthdays, weekly habits summary) with empty states from spec
- [x] T048 [US4] Add `frontend/src/components/ShoppingListPanel.tsx` with list/add/toggle/delete wired to shopping endpoints
- [x] T049 [US4] Add `frontend/src/components/IdeasPanel.tsx` with list/add/delete
- [x] T050 [US4] Add `frontend/src/components/BirthdaysPanel.tsx` read-only list from `GET /birthdays`
- [x] T051 [US4] Add `frontend/src/components/HabitsPanel.tsx` showing summary and button to log training day via `POST /habits/training-sessions`
- [x] T052 [US4] Wire React Router (or equivalent) in `frontend/src/main.tsx` for `/login` and `/` dashboard route guarded by session

**Checkpoint**: US4 independently demonstrable in browser against running API.

---

## Phase 7: User Story 5 — Automatic Telegram reminders (Priority: P5)

**Goal**: pg-boss worker sends Telegram messages for due `ScheduledNotification`; retries / surfaced failures per spec US5.

**Independent Test**: Ten-trial harness or manual: fire job → one Telegram message or explicit failure path without duplicate sends (SC-004).

### Implementation for User Story 5

- [x] T053 [US5] Implement pg-boss worker handler in `backend/src/infrastructure/jobs/send-telegram-reminder.handler.ts` loading `ScheduledNotification`, sending via grammY, updating `status` / `sent_at` / `last_error`
- [x] T054 [US5] Enforce `idempotency_key` uniqueness and “exactly one success” semantics in `send-telegram-reminder.handler.ts` (transaction or conditional update)
- [x] T055 [US5] Add bounded retry policy + dead-letter-style `failed` status documented in `backend/src/infrastructure/jobs/reminder-retry.policy.ts` aligning with spec US5 acceptance
- [x] T056 [US5] Expose minimal “notification deferred/failed” read on `GET /dashboard/home` or `GET /birthdays` response metadata in `backend/src/presentation/http/dashboard/dashboard.controller.ts` (optional field) for owner visibility

**Checkpoint**: End-to-end reminder path live with US3-created rows.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, docs, and spec compliance.

- [x] T057 [P] Add `README.md` at repo root linking to `specs/001-shopping-voice-dashboard/quickstart.md` and high-level architecture summary from `plan.md`
- [x] T058 Sanitize all error responses in `backend/src/presentation/http/filters/http-exception.filter.ts` to avoid leaking stack traces or secrets in production mode
- [x] T059 Verify Telegram webhook route and dashboard auth reject unauthenticated access (negative tests manual checklist referencing SC-006)
- [x] T060 Review logging statements across `backend/src/` to ensure no raw voice, tokens, or message bodies in logs (constitution Principle VI)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **US1 → US2 → US3 → US4 → US5** → **Polish (Phase 8)**
- **US4** may begin backend controllers in parallel with late **US3** only after repositories for birthdays/shopping/ideas exist; safest order is strict sequential above.
- **US5** depends on **US3** (`ScheduledNotification` producers) and **Foundational** (pg-boss + grammY).

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 | Foundational |
| US2 | Foundational, US1 router patterns optional but recommended after US1 |
| US3 | Foundational |
| US4 | Foundational + repositories (complete US1–US3 backend data paths recommended) |
| US5 | US3 + Foundational |

### Parallel Opportunities

- **T002–T005** in Phase 1 all `[P]`
- **T045** can proceed in parallel with backend US4 controllers once OpenAPI is stable (different repo half)
- **T057** documentation in parallel with late implementation

### Within Each User Story

- Ports/adapters before use cases; use cases before presentation wiring
- NLU adapter extensions after base types (US2/US3 follow US1 NLU shell from T020–T022)

---

## Parallel Example: User Story 4

```bash
# After OpenAPI contracts implemented on backend, frontend can split:
Task: "Add typed API client in frontend/src/lib/api-client.ts"
Task: "Add ShoppingListPanel in frontend/src/components/ShoppingListPanel.tsx"
Task: "Add IdeasPanel in frontend/src/components/IdeasPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1–2  
2. Complete Phase 3 (US1)  
3. STOP: validate Telegram → DB shopping path (SC-002 phrase set)  
4. Then add US2–US5 incrementally in priority order

### Full MVP (spec P1–P5)

1. Phases 1–2  
2. US1 → US2 → US3 → US4 → US5  
3. Phase 8 polish  
4. Run `quickstart.md` end-to-end before demo

---

## Notes

- **Suggested MVP scope for first merge**: Full **T001–T060** implemented in-repo; trim scope only if product priorities change.  
- **Total tasks**: **60** (US1: 8, US2: 5, US3: 6, US4: 14, US5: 4, Setup: 5, Foundational: 14, Polish: 4)  
- Revisit tasks after any **spec** or **contract** change; regenerate with `/speckit.tasks` if scope shifts.
