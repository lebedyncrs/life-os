# Phase 0 Research: Life OS MVP

## 1. Application stack (backend)

**Decision**: Node.js 22 LTS + **NestJS** + **TypeScript** + **Prisma** + **PostgreSQL**.

**Rationale**: NestJS enforces modular boundaries and dependency injection aligned
with the constitution’s OOP expectations. Prisma gives typed queries and migration
workflow for a single relational store that also backs **pg-boss** job storage.

**Alternatives considered**: FastAPI (Python) — excellent for ML-heavy pipelines
but splits language with a typical React SPA; Go + chi — fast but more manual
domain wiring for the same MVP timeline.

## 2. Telegram integration

**Decision**: **grammY** framework, long-polling or webhook behind HTTPS, secret
path token for webhook URL.

**Rationale**: Mature middleware ecosystem, good TypeScript types, supports voice
file download by `file_id`.

**Alternatives considered**: Telegraf (similar); raw Bot API (too low-level for
MVP error handling).

## 3. NLU / intent routing (voice + text)

**Decision**: Provider **HTTP API** (OpenAI-compatible chat + JSON schema or tool
calls) returning a **closed set of intents** (`ADD_SHOPPING`, `SAVE_IDEA`,
`SET_BIRTHDAY_REMINDER`, `UNKNOWN`) with structured payloads. **No long-term
storage of raw audio**; transcript kept only if audit policy explicitly allows
minimal text snippet (default: discard after successful parse).

**Rationale**: Spec requires robust multi-intent capture; constrained JSON output
reduces hallucinated DB writes and eases testing.

**Alternatives considered**: Local **Ollama** / Llama — better offline privacy,
higher ops burden and weaker multilingual STT unless paired with separate STT;
rule-only parsing — fails on natural phrasing in user stories.

## 4. Speech-to-text

**Decision**: Use provider **audio input** on the same NLU call when possible;
otherwise **Telegram voice OGG** → provider speech endpoint, then text intent
classification.

**Rationale**: Single vendor simplifies secret rotation and latency monitoring.

**Alternatives considered**: `faster-whisper` self-hosted — constitution-friendly
local processing; deferred to a later hardening task.

## 5. Reminders & worker

**Decision**: **pg-boss** in Postgres for scheduled and retried **Telegram send**
jobs; job payload includes `notificationId` and idempotency key.

**Rationale**: One operational datastore for MVP; built-in completion and retry
semantics; avoids introducing Redis before needed.

**Alternatives considered**: BullMQ + Redis; system `cron` + polling — weaker
retry story.

## 6. Web dashboard & auth

**Decision**: **React + Vite** SPA; **HTTP-only session cookie** after credential
login (email + password or single bootstrap password set via env on first run —
productize magic link later).

**Rationale**: Cookie sessions reduce token leakage vs localStorage; SPA matches
interactive dashboard requirements.

**Alternatives considered**: Next.js SSR — stronger SEO (not required for private
dashboard); HTMX + server templates — fewer moving parts but weaker component
ecosystem for four-pane home.

## 7. Testing strategy

**Decision**: **Vitest** for domain + application services; Nest testing module for
controllers; **Playwright** for sign-in + dashboard visibility; contract tests
validate OpenAPI response shapes for critical GETs.

**Rationale**: Matches constitution testability for integration seams (web +
persistence); Playwright covers SC-001 style flows.

## 8. Deployment (dev / MVP prod)

**Decision**: **Docker Compose**: `postgres`, `backend` (API + in-process pg-boss
worker or second container same image with `worker` command), `frontend` static
served via nginx or Vite preview behind TLS terminator (Caddy/Traefik).

**Rationale**: Reproducible quickstart for solo operator; maps to single VM.

**Alternatives considered**: Kubernetes — deferred until scale demands it.
