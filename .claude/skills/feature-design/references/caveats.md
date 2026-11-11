# Caveats

Go through every row. Open the thing in "Look at" before you answer; an answer from memory is
not an answer. Write a line for each row that applies and collect the rest on one
`n/a: … — <reason>` line. A row that shows a neighbour at risk adds an N-row to the spec. A row
that hits a full-track trigger (see `start-change`) means escalate.

## Core (always)

| Caveat | Ask | Look at |
|---|---|---|
| Neighbours | Who calls what I change? What else reads this data? | grep callers; `apps/web` fetch sites |
| Shared types | Does a `@zava/shared` change break `api` or `web` compile or behaviour? | `packages/shared/src`, both importers |
| Validation | Is input validated on the server, not only in the UI? | route handlers in `apps/api` |
| Error mapping | Does each failure end in a defined status code and UI state, with no stack trace leaked? | error middleware, web error handling |
| Auth | Who may call this? Is ownership checked, not only login? | auth middleware, route guards |
| Observability (3 am) | Is each failure logged with the ids that localise it? Is any error swallowed? | logger usage on the path |
| Config and secrets | New env vars documented, with safe defaults; no secret in code or logs | `.env.example`, config loader |
| Tests | Does each S/N/O item have a test that fails without the change? | existing tests near the change |

## Data (when the Prisma schema or stored data changes)

| Caveat | Ask | Look at |
|---|---|---|
| Migration safety | Is the change backward compatible with data already in the table (defaults, nullability)? | `apps/api/prisma/schema.prisma`, migrations |
| Seed data | Does `db:seed` still work and still represent real shapes? | `apps/api/prisma/seed.*` |
| Queries | N+1, unbounded reads, missing index, missing pagination? | Prisma calls on the path |
| Transactions | Do multi-step writes need a transaction? What does a half-failure leave? | write handlers |

## API (when a route or its contract changes)

| Caveat | Ask | Look at |
|---|---|---|
| Contract docs | Is `docs/api-reference.md` updated? | `docs/api-reference.md` |
| Compatibility | Does an existing client break (removed field, new required field, status change)? | `apps/web` API client |
| Idempotency | What happens on a retry or double submit? | handler, client submit logic |
| Limits | Payload size, rate, timeouts on outbound calls? | middleware, fetch calls |

## Web frontend (when `apps/web` changes)

| Caveat | Ask | Look at |
|---|---|---|
| States | Loading, empty, error and success all handled? | the component and its tests |
| Accessibility | Keyboard, labels, focus, contrast? | the component |
| User-supplied content | Rendered as text, never as HTML or an unvalidated URL? | where the value is rendered |
| Stale data | Does a mutation refresh or invalidate what is shown? | data-fetching code |

## AI (when a model or prompt is involved)

| Caveat | Ask | Look at |
|---|---|---|
| Untrusted input | Can user text act as an instruction to the model? | prompt construction |
| Failure and cost | Timeout, fallback, token and spend limits? | the call site |
| Evaluation | Is there a test or sample set that shows it works? | tests, eval scripts |
