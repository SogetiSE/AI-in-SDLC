---
applyTo: 'apps/api/**'
---

# Zava API — Copilot Instructions

These rules apply to the Express REST API (`apps/api`) and extend the repo-wide
[`copilot-instructions.md`](../copilot-instructions.md).

## API conventions

- RESTful routes under `/api/`.
- Return JSON with consistent shape: `{ data }` on success, `{ error, message }` on failure.
- Use proper HTTP status codes (200, 201, 400, 401, 404, 500).
- Validate request bodies with Zod schemas.
- Protect routes with the `authenticate` middleware where auth is required.

## Testing

- API tests use **supertest** against the Express app (not a running server).

## Architecture notes

- Auth uses JWT with a `JWT_SECRET` env variable (default in dev: `zava-dev-secret`).
- The Prisma SQLite database is stored at `apps/api/prisma/dev.db`.
