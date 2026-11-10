---
feature: <issue>-<slug>
issue: <issue number>
title: <title as on the issue>
track: small
status: proposed            # proposed | approved (a person approved it) | implemented
date: YYYY-MM-DD
author: <person who owns the change>
produced_by: { model: <model id>, tool: <client and mode> }
review: { small: pending, by: design-reviewer, date: YYYY-MM-DD }
touches: []                 # workspaces, at most two: apps/api, apps/web, packages/shared
---

# <Title>

Issue: #<issue> · Track: small · Branch: `feature/<issue>-<slug>`

## 1. Problem

<!-- Condensed from the issue, not rewritten. Acceptance criteria verbatim. -->

**Acceptance criteria** (from the issue)

- [ ] **AC1** — ...

Prior art: <older design, doc or closed issue on the same ground, or "none">

## 2. Spec

<!-- Same headings and numbering as design.md §2, so a promotion copies it unchanged.
     Ask rather than writing a vague answer. -->

### 2.1 What the change does

- **S1** — When <actor> <does something>, <observable result>.

### 2.2 How we'll know it works

| Proves | Evidence | Kind |
|---|---|---|
| S1, AC1 | `<file> > <describe> > <it>`: <what it asserts> | unit / integration / e2e |

### 2.3 What it must not break

| # | Must keep working | Guarded by |
|---|---|---|
| N1 | <closest neighbour: an existing caller, screen, contract or guarantee> | existing `<test>` (opened, exercises it) / new `<test>` |

### 2.4 How we'll debug it at 3 am

<!-- If I were on call at 3 am and this broke, what would I need to solve it?
     An existing signal that already covers the path is a fine answer: name it. -->

| # | When this fails | How we find out | What localises it | What it tells us · first action |
|---|---|---|---|---|
| O1 | <failure mode, e.g. the DB write fails> | <alert, or the symptom a user reports> | <log line with its fields (ids, request id), status code, metric> | <which record, which step · what on-call does first> |

## 3. Where it changes

- `<workspace>` — `<path>`: <what changes, one line>

## 4. Caveats triage

- <Caveat>: <answer, with what you opened>
- n/a: <Caveat>, <Caveat>, … — <shared reason>

## 5. Tasks

- [ ] **T1** — <what> · serves S1, AC1
  - Test first: `<test>` — fails today because <reason>
  - Files: `<path>`
- [ ] **T2** — guard for N1 · serves N1
  - Test: `<test>` — passes today; pins <existing behaviour>
- [ ] **T3** — signal for O1 (only if it does not exist yet) · serves O1
  - Test first: `<test>` asserts <log line / metric> is emitted on <failure>

## 6. Verification

```
npm test -w <workspace>
npm run lint
npm run build
```

- Manual: <journey to walk and the expected result, or "none">

## 7. Decisions

- **D1** — <decision> · because <rationale> · rejected: <alternative>
- Override: <full-track trigger kept on the small track> — <the person's reason>

## Review outcome

<!-- Spec check and track check from design-reviewer, verbatim; then Accepted: lines. -->
