# Manual QA — auth & Telegram (SC-006)

Use this checklist to confirm unauthenticated clients cannot access owner data (SC-006).

## Dashboard API (cookie session)

- [ ] `GET /me` without `lifeos_session` cookie returns **401**.
- [ ] `GET /shopping-items` without session returns **401**.
- [ ] `GET /ideas` without session returns **401**.
- [ ] `GET /birthdays` without session returns **401**.
- [ ] `GET /habits/summary` without session returns **401**.
- [ ] `GET /dashboard/home` without session returns **401**.
- [ ] After `POST /auth/login` with valid credentials, the above routes return **200** (or **201** on POST creates) when called with `Cookie: lifeos_session=…` (or browser credentials).

## Telegram webhook

- [ ] `POST /telegram/webhook/<wrong-secret>` returns **401** and does not process updates.
- [ ] `POST /telegram/webhook/<correct-secret>` with a valid Telegram update payload is accepted (HTTP **200** from grammY handler path).

## Production error shape (T058)

- [ ] With `NODE_ENV=production`, a thrown non-HTTP error returns JSON **without** stack traces in the response body.
