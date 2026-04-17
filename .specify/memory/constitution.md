<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: I–V unchanged in intent; VI added (Privacy, Data Minimization & Agent Safety)
- Added sections: Product Mission & Scope (after title)
- Removed sections: (none)
- Templates requiring updates: .specify/templates/plan-template.md ✅ |
  .specify/templates/spec-template.md ✅ | .specify/templates/tasks-template.md ✅ |
  .specify/templates/commands/*.md ⚠ (no command templates directory present)
- Follow-up TODOs: none
-->

# Life OS Constitution

## Product Mission & Scope

Life OS is a **personal cloud application** that streamlines day-to-day life: **friend
birthday reminders**, **shared or personal shopping lists**, and **idea capture**. The
owner interacts through:

- A **Telegram bot** (voice and text): an agent interprets messages to perform actions
  (e.g., add shopping items, log ideas) and **proactive reminders** (birthdays and
  other alerts) are delivered on Telegram.
- A **web dashboard** to view and manage shopping lists, ideas, and upcoming birthdays.
- **Authenticated HTTP APIs** for **iPhone Shortcuts** (health metrics, training marks
  based on location, and other automated signals).

The product includes **habit and behavior tracking**: positive habits (e.g., training
volume per week) and **negative habit signals** derived from allowed inputs such as
screen-time summaries or **user-approved financial transaction patterns** (e.g.,
specific merchants). Ingestion of bank- or device-derived data MUST stay explicit,
minimal, and under the user’s control (see Principle VI).

Features outside this mission MAY be deferred unless they clearly support these
surfaces and data types.

## Core Principles

### I. Object-Oriented Design (NON-NEGOTIABLE)

The codebase MUST model behavior and state with cohesive objects: clear types,
encapsulation, and explicit responsibilities. Domain rules live in the domain
layer; infrastructure (I/O, frameworks, persistence) MUST sit behind interfaces
or adapters so core logic stays testable. Favor composition and polymorphism over
large procedural scripts or “god” modules. Apply SOLID deliberately: each change
MUST preserve understandable object graphs and dependency direction (inward toward
domain abstractions).

**Rationale**: OOP keeps complexity localized, supports reuse, and scales teams and
features without turning the system into an unmaintainable sequence of special
cases.

### II. Quality Over Speed

Delivery prioritizes correctness, clarity, and sustainable structure over calendar
velocity. Reviews MUST verify behavior, edge cases, and alignment with this
constitution. Known defects or unsafe shortcuts MUST NOT ship to satisfy a
deadline; if trade-offs are unavoidable, they MUST be documented with scope,
risk, and a remediation path. Refactoring to uphold principles is part of normal
work, not optional cleanup.

**Rationale**: Short-term speed that erodes design becomes exponentially expensive
and undermines scalability.

### III. Scalability From Day One

Architecture, data models, APIs, and deployment assumptions MUST be chosen so the
system can grow in users, data volume, and feature surface without a full rewrite.
Treat horizontal scaling, concurrency boundaries, storage growth, and failure
domains as first-class design inputs from the first commit. Performance and
capacity expectations MUST be stated in plans where relevant; “fix it later”
without an explicit, time-boxed decision record is not an acceptable default.

**Rationale**: Retrofitting scale and resilience is costlier and riskier than
baking in clear boundaries early.

### IV. Testability & Automated Verification

Behavior changes MUST be provable: unit or integration tests cover new or altered
logic unless explicitly exempted in writing for non-functional edits. Critical
user journeys and integration seams (web, Telegram, Shortcut APIs, schedulers)
MUST have automated coverage appropriate to risk. Tests MUST fail before
implementation when using a test-first workflow for a given change set.

**Rationale**: Quality-first delivery requires repeatable evidence, especially
under growth and refactoring.

### V. Simplicity Within Disciplined Structure

Prefer the simplest design that still honors OOP boundaries and scalability
constraints. YAGNI applies to product features and speculative generality—not to
skipping clear module boundaries, interfaces, or operational basics. Every layer
of abstraction MUST earn its place with a concrete problem it solves.

**Rationale**: Simplicity and structure together avoid both over-engineering and
chaotic growth.

### VI. Privacy, Data Minimization & Agent Safety (NON-NEGOTIABLE)

Life OS processes **highly sensitive personal data** (health, habits, social
graph, financial-adjacent signals, voice). The system MUST:

- Collect and retain the **minimum** data required for each feature; document
  categories of stored data and retention in plans where relevant.
- Protect data **in transit and at rest**; authenticate and authorize **every**
  ingress path (web session, Telegram identity binding, Shortcut/API tokens).
- Treat voice, chat, and Shortcut payloads as **untrusted input** until validated;
  agent actions that mutate persistent state MUST be **auditable** (who/what/when)
  and MUST use **confirmation or safe defaults** for destructive or high-impact
  operations when feasible.
- Never log secrets, raw tokens, or unnecessary payload content; redact PII in logs
  by default.
- Model **Telegram, web, and APIs** against a **single domain core** so behavior is
  consistent across channels.

**Rationale**: A personal life hub fails if privacy or agent misuse erodes trust;
clear boundaries keep integrations maintainable and safe.

## Architecture & Technical Standards

- Codebase layout MUST reflect separation of concerns (e.g., domain, application,
  infrastructure) consistent with the implementation plan for each feature.
- Cross-cutting concerns (logging, configuration, persistence, messaging) MUST use
  shared patterns so new features do not invent one-off wiring.
- Public contracts (APIs, events, schemas) MUST be versioned or extended in a
  backward-compatible way unless a breaking change is explicitly approved and
  migrated.
- **Integration surfaces** (Telegram bot, web UI, reminder/scheduling subsystem,
  Shortcut-facing HTTP endpoints, optional speech-to-text or LLM adapters) MUST be
  isolated behind application services that speak to the same domain model.
- **Notifications** (e.g., birthday reminders) MUST have defined delivery paths,
  retry behavior, and user-visible failure semantics documented in specifications
  when behavior is user-facing.

## Workflow & Quality Gates

- Implementation plans MUST complete the **Constitution Check** before Phase 0
  research and MUST be revalidated after Phase 1 design.
- Specifications and tasks MUST remain traceable to user value while respecting
  OOP structure, quality bar, scalability expectations, and privacy/agent rules
  stated here.
- Reviews MUST confirm compliance with Core Principles or record justified
  exceptions in plan complexity tracking.
- Merged feature work MUST be checked against the latest constitution version;
  materially new data types or channels require explicit spec coverage.

## Governance

This constitution supersedes ad-hoc practices for Life OS. Amendments require an
updated version line, **Last Amended** date, and a short note in the Sync Impact
Report (HTML comment) describing what changed. Version numbers follow semantic
versioning: MAJOR for incompatible governance or principle removals;
MINOR for new principles or materially expanded guidance; PATCH for clarifications
and non-semantic edits.

**Version**: 1.1.0 | **Ratified**: 2026-04-17 | **Last Amended**: 2026-04-17
