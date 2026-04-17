# Data Model: Life OS MVP

All mutable tables include `owner_id` → `Owner` (UUID). Timestamps in UTC.

## Owner

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | citext | unique, login identifier |
| password_hash | text | Argon2id |
| telegram_chat_id | bigint | nullable until linked |
| telegram_link_token | text | nullable, one-time linking flow |
| timezone | text | IANA, e.g. `Europe/Warsaw` |
| created_at / updated_at | timestamptz | |

## ShoppingListItem

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK, indexed |
| title | text | display text |
| is_done | boolean | default false |
| source | enum | `telegram_voice`, `telegram_text`, `dashboard` |
| sort_order | int | default 0 |
| created_at / updated_at | timestamptz | |

**Rules**: `title` trimmed, max length 500. Normalization for duplicate detection:
case-fold + collapse whitespace (application layer).

## Idea

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK, indexed |
| body | text | max 10_000 |
| title | text | nullable, optional first-line |
| source | enum | `telegram`, `dashboard` |
| created_at / updated_at | timestamptz | |

## BirthdayReminder (person-centric reminder)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK, indexed |
| person_name | text | display |
| next_occurrence_on | date | calendar date of next celebration |
| original_year_known | boolean | if false, UI shows month/day only |
| lead_days | int | default 1 — remind N days before |
| notes | text | nullable |
| created_at / updated_at | timestamptz | |

**State**: `next_occurrence_on` recomputed after each fired annual reminder (roll
to next year). Conflicting updates: last write wins; optional `updated_from` enum
for audit.

## ScheduledNotification

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK |
| birthday_reminder_id | UUID | nullable FK |
| fire_at | timestamptz | when to send |
| channel | enum | `telegram` (MVP) |
| status | enum | `pending`, `sending`, `sent`, `failed`, `cancelled` |
| idempotency_key | text | unique per owner — prevents duplicate sends |
| last_error | text | nullable, truncated |
| sent_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | |

**Indexes**: `(status, fire_at)` for worker polling; `(owner_id, fire_at)` for
dashboard.

## TrainingSession (habits MVP)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK |
| occurred_on | date | local calendar date in owner timezone |
| label | text | default `training` |
| source | enum | `dashboard`, `telegram`, `shortcut` (future) |
| created_at | timestamptz | |

**Aggregate**: dashboard “this week” = count where `occurred_on` falls in ISO week
boundary computed in owner timezone.

## AuditLog

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| owner_id | UUID | FK |
| action | text | coarse e.g. `shopping.create` |
| entity_type / entity_id | text / UUID | nullable |
| channel | enum | `telegram`, `dashboard`, `system` |
| metadata | jsonb | no raw message body; max 2KB |
| created_at | timestamptz | |

## Relationships (summary)

```text
Owner 1--* ShoppingListItem
Owner 1--* Idea
Owner 1--* BirthdayReminder
Owner 1--* ScheduledNotification
Owner 1--* TrainingSession
Owner 1--* AuditLog
BirthdayReminder 1--* ScheduledNotification (optional linkage)
```

## Prisma / migration notes

- Use `@db.Timestamptz` for all instants.
- Enable `pgcrypto` or Prisma’s `uuid()` default for UUIDs.
- pg-boss uses its own schema (`pgboss`) — keep separate from app tables.
