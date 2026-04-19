# Quickstart: Life OS MVP (local)

Prerequisites: Docker with Compose plugin, Node.js 22+, `pnpm` or `npm` (examples
use `pnpm`).

## 1. Clone and branch

```bash
git checkout -b 001-shopping-voice-dashboard
```

Spec Kit scripts expect a **feature-shaped** branch name.

## 2. Environment

Create `backend/.env` (values illustrative). See `backend/.env.example` for the full list.

```env
DATABASE_URL=postgresql://lifeos:lifeos@localhost:5432/lifeos
SESSION_SECRET=change-me-32chars-minimum----------
TELEGRAM_BOT_TOKEN=123:ABC-from-BotFather
TELEGRAM_WEBHOOK_SECRET=random-long-secret-for-url
TELEGRAM_WEBHOOK_URL=https://your-subdomain.ngrok-free.app
PORT=3000
NLU_PROVIDER_BASE_URL=https://api.openai.com/v1
NLU_PROVIDER_API_KEY=sk-...
WEB_ORIGIN=http://localhost:5173
OWNER_BOOTSTRAP_EMAIL=you@example.com
OWNER_BOOTSTRAP_PASSWORD=change-me
```

Never commit real secrets.

- **`WEB_ORIGIN`**: Primary dashboard URL (often `http://localhost:5173`). In **development** only, the API also allows any `http://localhost:<port>` / `127.0.0.1:<port>` origin so Vite can fall back to 5174, 5175, etc., without changing `.env`.
- **`TELEGRAM_WEBHOOK_SECRET`**: Must match the final path segment in your Telegram webhook URL (`…/telegram/webhook/<this>`).
- **`TELEGRAM_WEBHOOK_URL`**: Optional convenience field — **HTTPS origin only** (no path), e.g. your ngrok forwarding URL. The app registers the webhook with Telegram separately (see §7); this variable documents the base you used.
- **`PORT`**: API listen port. If you see `EADDRINUSE`, another process is already bound here — stop the old server or pick a different `PORT`.

Create **`frontend/.env`** when the API is not at `http://localhost:3000`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

(`frontend/src/lib/api-client.ts` defaults to `http://localhost:3000` if unset.)

## 3. Start Postgres

```bash
docker compose up -d postgres
```

Compose file lives at the **repository root** (`docker-compose.yml`).

## 4. Install, migrate, seed owner

```bash
cd backend && pnpm install && pnpm prisma migrate dev && pnpm run seed:owner
```

If **pnpm** warns that Prisma / Nest **build scripts were ignored**, run
`pnpm approve-builds` (or your org policy) so `@prisma/client` can run its
`postinstall` when needed.

`seed:owner` is the same script as `bootstrap:owner`. With **`OWNER_BOOTSTRAP_EMAIL`** and **`OWNER_BOOTSTRAP_PASSWORD`** set in `backend/.env`, you can run `pnpm run seed:owner` with no arguments. Otherwise:

```bash
pnpm run seed:owner -- you@example.com 'YourSecurePassword' [optionalTelegramLinkToken]
```

## 5. Run API

```bash
pnpm run start:dev
```

NestJS serves the HTTP API, Telegram webhook, and pg-boss reminder worker in **one** process. Only **one** instance should listen on `PORT` at a time.

## 6. Run dashboard

```bash
cd ../frontend && pnpm install && pnpm dev
```

Open the URL Vite prints (often `WEB_ORIGIN`), sign in with bootstrap credentials, confirm four dashboard sections render.

## 7. Telegram webhook (dev)

1. Start **ngrok** (or similar) to the **exact same port as `PORT`** in `backend/.env` (often **3000**; if you use **3001**, run `ngrok http 3001`):

   ```bash
   ngrok http 3000   # or: ngrok http 3001
   ```

   If you switch ports (e.g. 3000 → 3001) or restart ngrok, the **public hostname changes** on the free tier — Telegram does **not** follow automatically; you must **`setWebhook` again** (step 3) with the new `https://…ngrok…` host.

2. Set **`TELEGRAM_WEBHOOK_URL`** in `backend/.env` to the **https** forwarding host only, e.g. `https://abcd-1-2-3-4.ngrok-free.app` (no path).

3. Tell Telegram the full webhook URL (path + secret). Replace `<BOT_TOKEN>` and use your real `TELEGRAM_WEBHOOK_SECRET`:

   ```text
   https://<your-ngrok-host>/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>
   ```

   Example `curl` (URL-encoded `url=` value):

   ```bash
   curl -sS "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https%3A%2F%2F<your-ngrok-host>%2Ftelegram%2Fwebhook%2F<SECRET>"
   ```

4. Free tunnel hostnames **change on every ngrok restart** (and whenever you start a **new** tunnel). The URL in `getWebhookInfo` must always match your **current** ngrok forwarding URL — run `setWebhook` again after each change. Stale URLs produce `502` / `404` / ngrok “endpoint offline” (ERR_NGROK_3200) when nothing is listening behind the old host.

5. In Telegram, send **`/start <telegram_link_token>`** (token from bootstrap or DB) to bind the chat, unless you use optional dev auto-link via env (see `backend/.env.example`).

### Voice notes “do nothing”

- **No bot reply at all** usually means Telegram is **not hitting your webhook** (wrong `setWebhook` URL, ngrok stopped, or `PORT` mismatch). Check:
  `curl -sS "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
  and fix `url` / `last_error_message` until Telegram can reach your tunnel.
- **`NLU_PROVIDER_API_KEY`** is required for **Whisper** transcription and for NLU after transcribe. If it is empty, the bot should reply that it could not understand the voice note — if you see **no** reply, fix the webhook path above first.
- **Quotes in `.env`**: avoid wrapping secrets in `"..."`; if present, they are stripped for `NLU_PROVIDER_API_KEY` only after env load — prefer unquoted keys.
- **Linked chat**: unbound chats only get the `/start` prompt; bind the chat, then retry voice.
- **Audio vs voice**: short **audio** files (≤10 min) are also transcribed; very long clips are ignored.

## 8. Verify reminders

Insert a `ScheduledNotification` with `fire_at` a few minutes ahead (SQL or seed
script), observe job pickup and Telegram delivery in logs (no message body in
audit).
