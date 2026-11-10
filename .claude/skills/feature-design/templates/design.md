---
feature: <issue>-<slug>
issue: <issue number>
title: <title as on the issue>
track: full
status: proposed            # proposed | approved (a person approved it) | implemented
date: YYYY-MM-DD
author: <person who owns the change>
produced_by: { model: <model id>, tool: <client and mode> }
review: { stage1: pending, stage2: pending, by: design-reviewer, date: YYYY-MM-DD }
touches: []                 # apps/api, apps/web, packages/shared
adrs: []
---

# <Title>

Issue: #<issue> · Track: full · Branch: `feature/<issue>-<slug>`

## 1. Problem

**Acceptance criteria** (from the issue, verbatim)

- [ ] **AC1** — ...

Prior art: <or "none">

## 2. Spec

### 2.1 What the change does

- **S1** — When <actor> <does something>, <observable result>.

### 2.2 How we'll know it works

| Proves | Evidence | Kind |
|---|---|---|
| S1, AC1 | `<file> > <describe> > <it>`: <assertion> | unit / integration / e2e |

### 2.3 What it must not break

| # | Must keep working | Guarded by |
|---|---|---|
| N1 | <neighbour> | existing `<test>` (opened) / new `<test>` |

### 2.4 How we'll debug it at 3 am

| # | When this fails | How we find out | What localises it | What it tells us · first action |
|---|---|---|---|---|
| O1 | | | | |

## 3. Where it fits

```mermaid
flowchart LR
  web[apps/web] --> api[apps/api] --> db[(SQLite)]
```

## 4. Main flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as apps/web
  participant A as apps/api
  U->>W: <action>
  W->>A: <METHOD /route>
  A-->>W: <status + type>
```

## 5. Control flow

```mermaid
flowchart TD
  start([request]) --> auth{authorised?}
  auth -- no --> r401[401]
  auth -- yes --> val{valid?}
  val -- no --> r400[400]
  val -- yes --> ok[2xx]
```

## 6. Data model and states

<!-- Prisma schema diff, erDiagram, stateDiagram-v2, or "n/a — reason". Name the migration. -->

## 7. Affected parts

| Workspace | What changes | Importers of changed shared types |
|---|---|---|

## 8. Caveats

<!-- references/caveats.md, row by row: an answer or `n/a — reason`. -->

## 9. Concurrency and idempotency

| Race / retry | Mechanism | Code it relies on | Observable outcome |
|---|---|---|---|

## 10. Decisions

- **D1** — <decision> · because <rationale> · rejected: <alternative>

## Review outcome

<!-- Spec check and risk map from design-reviewer, verbatim; then Accepted: lines. -->
