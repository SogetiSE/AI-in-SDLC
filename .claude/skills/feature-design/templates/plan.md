---
feature: <issue>-<slug>
issue: <issue number>
status: proposed            # proposed | approved | implemented
review: { stage2: pending, by: design-reviewer, date: YYYY-MM-DD }
---

# Plan: <Title>

Design: [design.md](design.md) · Branch: `feature/<issue>-<slug>`

## 0. Spec in one line each

- **S1** — ...
- **N1** — ...
- **O1** — ...

## 1. Tasks

### packages/shared

- [ ] **T1** — <what> · serves S1
  - Test first: `<test>` — fails today because <reason>
  - Files: `<path>`

### apps/api

- [ ] **T2** — ...

### apps/web

- [ ] **T3** — ...

## 2. Bookkeeping

- [ ] Docs: `docs/api-reference.md` / `docs/architecture.md` updated, or "none"
- [ ] ADR: `docs/adr/NNNN-<slug>.md`, or "none"
- [ ] Index row in `docs/features/README.md`

## 3. Verification

| Spec row | Evidence | Produced by |
|---|---|---|
| S1 | `<test>` | T1 |
| N1 | `<test>` | T2 |
| O1 | `<log line / metric asserted by test>` | T3 |

```
npm test
npm run lint
npm run build
```

- Manual: <journey and expected result, or "none">

## Review outcome

<!-- design-reviewer STAGE=2 output, verbatim; Accepted: lines. -->
