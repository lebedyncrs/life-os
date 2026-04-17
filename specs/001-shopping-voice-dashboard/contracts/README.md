# API & integration contracts

| Artifact | Purpose |
|----------|---------|
| [openapi.yaml](./openapi.yaml) | Authenticated **dashboard HTTP API** consumed by the SPA |
| [telegram-update.schema.json](./telegram-update.schema.json) | Subset of **Telegram `Update`** objects the bot webhook accepts (documentation + optional JSON Schema validation in tests) |

Telegram Bot API surface itself is owned by Telegram; internal **intent DTOs**
are defined in backend code and tested via unit tests (not duplicated here).
