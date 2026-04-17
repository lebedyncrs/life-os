# Quickstart: Life OS MVP (local)

Prerequisites: Docker with Compose plugin, Node.js 22+, `pnpm` or `npm` (examples
use `pnpm`).

## 1. Clone and branch

```bash
git checkout -b 001-shopping-voice-dashboard
```

Spec Kit scripts expect a **feature-shaped** branch name.

## 2. Environment

Create `backend/.env` (values illustrative):

```env
DATABASE_URL=postgresql://lifeos:lifeos@localhost:5432/lifeos
SESSION_SECRET=change-me-32chars-minimum----------
TELEGRAM_BOT_TOKEN=123:ABC-from-BotFather
NLU_PROVIDER_BASE_URL=https://api.openai.com/v1
NLU_PROVIDER_API_KEY=sk-...
WEB_ORIGIN=http://localhost:5173
OWNER_BOOTSTRAP_EMAIL=you@example.com
OWNER_BOOTSTRAP_PASSWORD=change-me
```

Never commit real secrets.

## 3. Start Postgres

```bash
docker compose up -d postgres
```

(Compose file to be added at repo root during implementation.)

## 4. Migrations and seed

```bash
cd backend && pnpm install && pnpm prisma migrate dev && pnpm run seed:owner
```

## 5. Run API + worker

```bash
pnpm run start:dev        # NestJS API
pnpm run worker:dev       # or combined script if single process
```

## 6. Run dashboard

```bash
cd ../frontend && pnpm install && pnpm dev
```

Open `WEB_ORIGIN`, sign in with bootstrap credentials, confirm four dashboard
sections render.

## 7. Telegram webhook (dev)

Expose HTTPS (e.g. **ngrok**), set `TELEGRAM_WEBHOOK_URL`, register webhook with
Telegram, send **/start** and complete **link token** flow once implemented.

## 8. Verify reminders

Insert a `ScheduledNotification` with `fire_at` a few minutes ahead (SQL or seed
script), observe job pickup and Telegram delivery in logs (no message body in
audit).
