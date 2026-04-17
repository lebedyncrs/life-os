# Feature Specification: Life OS MVP — core user flows (Telegram + web dashboard)

**Feature Branch**: `[001-shopping-voice-dashboard]`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "Identify the first step in this project. Probably setting up dashboard and shopping list from Telegram voice messages."

## Clarifications

### Session 2026-04-17

- Q: Where should MVP work start and what defines the concrete MVP surface?
  → A: Start from **core user flows**, not architecture-first design. MVP is the
  **five things done most often**: (1) voice (or text) to add shopping items such
  as “add eggs”; (2) Telegram message to record a birthday reminder such as
  “remind me Kuba’s birthday is next week”; (3) capture an idea (“save this
  idea”); (4) open the web dashboard and see **shopping list, ideas, upcoming
  birthdays, and habits** in one place; (5) receive **automatic Telegram
  reminders** without having to open the dashboard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add shopping items from Telegram (voice or text) (Priority: P1)

The owner sends a **voice or text** message in Telegram describing things to buy
(e.g., “add eggs to shopping list”). The system records those items on the
owner’s shopping list.

**Why this priority**: Highest-frequency capture while mobile; validates Telegram
agent loop and list persistence early.

**Independent Test**: Send a clear message naming one item; confirm the item
appears on the shopping list via the dashboard (US4) or an equivalent read-back
if offered in Telegram.

**Acceptance Scenarios**:

1. **Given** a bound Telegram session, **When** the owner sends text to add a
   single item, **Then** that item appears on the shopping list within two minutes.
2. **Given** a bound Telegram session, **When** the owner sends a voice message
   naming multiple items, **Then** each distinct item is added unless the owner
   explicitly asked to replace the whole list in the same message.

---

### User Story 2 - Save an idea from Telegram (Priority: P2)

The owner sends a message such as **“save this idea:”** followed by content (or a
voice note with the same intent). The system stores a new **idea** the owner can
find later on the dashboard.

**Why this priority**: Second high-frequency capture path; reuses agent parsing
and trust patterns from shopping.

**Independent Test**: Send one idea message; open ideas on the dashboard and see
the saved text (or faithful summary if summarization is applied, with rules
documented in planning).

**Acceptance Scenarios**:

1. **Given** a bound Telegram session, **When** the owner issues a save-idea
   intent with body text, **Then** a new idea appears in the ideas list with
   correct body and timestamp within two minutes.
2. **Given** ambiguous intent (not clearly shopping vs idea), **When** the owner
   uses an explicit save-idea phrase, **Then** the content is stored as an idea,
   not as shopping lines.

---

### User Story 3 - Birthday reminder from Telegram message (Priority: P3)

The owner sends a Telegram message to **record a person’s birthday or a reminder**
(e.g., “remind me Kuba’s birthday is next week”). The system stores the person,
date or relative timing, and schedules a **Telegram reminder** ahead of the event.

**Why this priority**: Delivers proactive value and exercises scheduling +
notification path tied to personal data.

**Independent Test**: Create one reminder; verify it appears under upcoming
birthdays on the dashboard and that a Telegram notification fires at the defined
time (or offset) in a test configuration.

**Acceptance Scenarios**:

1. **Given** a bound Telegram session, **When** the owner states a birthday with
   a resolvable date or clear relative phrase, **Then** an upcoming birthday entry
   exists with correct display name and calendar date.
2. **Given** a stored upcoming birthday inside the reminder window, **When** the
   scheduled time arrives, **Then** the owner receives a Telegram message with the
   reminder content without opening the dashboard.

---

### User Story 4 - Web dashboard home: shopping, ideas, birthdays, habits (Priority: P4)

The owner signs in to the **web dashboard** and sees **four areas**: current
**shopping list**, **ideas**, **upcoming birthdays**, and a **habits summary**
(e.g., training sessions logged this week). Empty domains show clear empty states.

**Why this priority**: Single place to trust, correct, and scan everything
captured in Telegram; aligns with “open dashboard and see it all.”

**Independent Test**: With seed data or prior stories, sign in once and see all
four sections populated or intentionally empty with guidance.

**Acceptance Scenarios**:

1. **Given** a signed-in owner, **When** they open the dashboard home, **Then**
   they see distinct sections for shopping, ideas, upcoming birthdays, and habits
   summary on one primary view (scrolling allowed).
2. **Given** existing shopping items, **When** the owner edits completion or
   deletes from the dashboard, **Then** changes persist after refresh and match
   Telegram-originated items for the same account.
3. **Given** no habit data yet, **When** the owner opens the habits summary, **Then**
   they see a zero or empty state plus how to log training (e.g., manual mark or
   future Shortcut) without errors.

---

### User Story 5 - Automatic Telegram reminders (Priority: P5)

Reminder events (at minimum **birthdays** from US3) are **pushed on Telegram** on
time; failures are visible or retried so the owner is not silently dropped.

**Why this priority**: Completes the “nudge me in Telegram” promise; depends on
stored events from US3.

**Independent Test**: Trigger a test reminder with a near-future time; confirm
Telegram delivery and audit trail entry without exposing secrets.

**Acceptance Scenarios**:

1. **Given** a due reminder, **When** delivery runs, **Then** the owner receives
   exactly one Telegram notification for that firing unless a retry policy
   explicitly sends a bounded duplicate after failure.
2. **Given** Telegram temporarily unavailable, **When** delivery fails, **Then**
   the system retries within a documented window or surfaces deferred status on
   the dashboard without losing the reminder definition.

### Edge Cases

- **Unintelligible voice / no intent**: no spurious shopping ideas or birthdays;
  concise retry prompt in Telegram.
- **Duplicate shopping items** and **duplicate ideas**: normalization rules
  prevent clutter unless owner asked for duplicates.
- **Conflicting dates** for the same person: last explicit owner instruction wins;
  audit shows change history coarse-grained.
- **Timezone**: reminders use the owner’s configured timezone; ambiguous
  local-time phrases ask one clarifying follow-up in Telegram when safe.
- **Privacy**: unbound Telegram senders cannot read or mutate any domain data.
- **Long messages**: truncation with continuation prompt where needed.

## Requirements *(mandatory)*

Design and scope MUST remain consistent with `.specify/memory/constitution.md`:
object-oriented structure, quality-over-speed expectations, day-one scalability,
**Life OS product surfaces** (Telegram bot, web dashboard, Shortcut/API ingress),
and **privacy, data minimization, and agent safety** for personal and sensitive
data.

### Functional Requirements

- **FR-001**: Single **primary owner** per deployment for this MVP; all data is
  scoped to that account.
- **FR-002**: **Telegram binding** MUST be verified before any capture or reminder
  mutation from Telegram.
- **FR-003**: System MUST support **shopping capture** from Telegram voice or text
  into a persistent shopping list (add; optional explicit replace-all if owner
  requests).
- **FR-004**: System MUST support **idea capture** from Telegram with explicit
  save-idea intent and persistent storage.
- **FR-005**: System MUST support **birthday / reminder capture** from Telegram
  text (voice optional) with stored person reference, resolved calendar date or
  rule, and link to scheduled notification.
- **FR-006**: System MUST **schedule and deliver** owner-visible reminders on
  Telegram for events in scope (minimum: birthday reminders from FR-005).
- **FR-007**: Web dashboard MUST require **authentication** and show **shopping,
  ideas, upcoming birthdays, and habits summary** on the primary home experience.
- **FR-008**: Dashboard MUST allow **list, add, complete/uncomplete, delete**
  shopping items and **view, add, delete** ideas; birthday entries MUST be
  viewable with next occurrence; habits summary MUST accept **at least manual**
  training marks for the week (Shortcut-driven ingestion may follow in a later
  feature).
- **FR-009**: System MUST **audit** mutations and reminder firings (channel,
  coarse action, entity ids, timestamps) without logging raw voice, secrets, or
  unnecessary message bodies.
- **FR-010**: **Out of scope for this MVP spec**: bank-import or screen-time
  automation for “bad habits,” multi-user sharing, health vitals ingestion, and
  non-Telegram notification channels—those remain future features unless promoted by
  a new specification.

### Key Entities *(include if feature involves data)*

- **Owner account**: Authentication, Telegram link, timezone preference.
- **Shopping list item**: Text, completion, source, timestamps.
- **Idea**: Body text, optional title, created time, source.
- **Birthday / reminder event**: Person display name, next occurrence rule, lead
  time for notification, delivery status coarse flag.
- **Scheduled notification**: Links to reminder, fire time, retry/failure state.
- **Habit training log (MVP minimal)**: Week bucket, count or sessions list
  sufficient for dashboard summary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First-time owner completes **dashboard sign-in** and sees the four
  sections (with allowed empty states) within **five minutes** given credentials
  supplied out of band.
- **SC-002**: **Nine of ten** scripted Telegram shopping messages (voice or text)
  add the correct item within **two minutes** per agreed phrase set.
- **SC-003**: **Nine of ten** scripted save-idea messages produce a matching idea
  record within **two minutes**.
- **SC-004**: For a configured test birthday reminder, **100%** of scheduled
  firings in a **ten-trial** test harness deliver exactly one successful Telegram
  notification or one documented failure surfaced to the owner within the retry
  policy.
- **SC-005**: **100%** of dashboard shopping edits survive **page refresh** for
  US4 scenarios.
- **SC-006**: **Zero** cross-account or unbound Telegram data access in negative
  tests.

## Assumptions

- **Single owner**; family sharing is out of scope.
- **One natural language** for v1 capture is sufficient (owner’s primary language).
- **Habits** in MVP means a **lightweight weekly training log** plus dashboard
  summary; rich “bad habit” signals from finance or screen time stay out of scope
  until a later spec.
- **Network always on** for Telegram and web; offline queues deferred.
- **Shortcut-based health or habit automation** is optional follow-on, not
  required to mark this MVP complete.
