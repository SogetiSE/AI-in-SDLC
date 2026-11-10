---
name: feature-design
description: Use whenever someone asks for a full design, a system design, a design with sequence or data-flow diagrams, or to escalate a small change to the full design, and whenever start-change routes work to the full track (Prisma schema changes, shared-contract changes, new jobs or services, more than two workspaces, new dependencies, auth changes, new multi-step flows). The full track — no code without a written spec of what the change does, how we'll know it works, what it must not break and what on-call would need to debug it at 3 am — from an issue to an approved system design and then a separate approved implementation plan (ordered test-first tasks), each scrutinised by the design-reviewer agent and approved by a person before the next step.
effort: high
---

# Feature design: issue → system design → implementation plan

Two documents and two approvals, in this order. The **system design** answers: where does this
sit, what does it touch, what could go wrong, what do we decide. The **implementation plan**
answers: which code, in which order, with which tests. Never write the plan before the design is
approved, and never write code before the plan is approved.

**No code without a written spec.** Every design opens with a spec (§2) answering four questions,
and every plan proves all four:

1. **What the change does**: observable behaviour, numbered S1, S2, …
2. **How we'll know it works**: for each S-statement and acceptance criterion, the evidence (a named
   test, a manual check with its expected result, or a production signal with its value).
3. **What it must not break**: neighbouring behaviour, contracts, data and guarantees, numbered N1,
   N2, …, each with the existing or new test that guards it.
4. **How we'll debug it at 3 am**: *if I were on call at 3 am and this broke, what observability
   would I need?* For each realistic failure mode, O1, O2, …: how we find out, the signal that
   localises it (log line with fields, metric, status code) and what on-call does first. Designed
   here, before the code, not added after the first incident.

If you cannot answer one of them, the design is not ready to review. Ask the user.

## Project conventions (this repo)

- Features live in `docs/features/<N>-<slug>/` (`design.md`, `plan.md`); keep a one-table index in
  `docs/features/README.md` (feature, track, status, link).
- Workspaces: `apps/api` (Express + Prisma + SQLite), `apps/web` (React + Vite), `packages/shared`.
- Issues via `gh`. Branch `feature/<N>-<slug>`. Checks: `npm test`, `npm run lint`, `npm run build`.
- ADRs: if a decision sets a rule other features must follow, add `docs/adr/NNNN-<slug>.md`.

## Stage 0 — the issue

1. **Given an issue**: read it with its comments (`gh issue view <N> --json title,body,comments`).
   Quote and condense it; the issue body is the problem statement.
2. **No issue yet**: draft one (**Problem**, **Who is affected**, **Acceptance criteria**,
   **Out of scope**) from what the user said and what you can verify in the code. Show it and ask
   once whether to create it.
3. Slug: kebab-case, 2–4 words. Feature id `<N>-<slug>`.
4. Look for prior art (older docs, ADRs, closed issues) and say what the design keeps.

## Stage 1 — system design

Write `docs/features/<N>-<slug>/design.md` from `templates/design.md`.

- **Frontmatter**: fill every key. `status` stays `proposed` until a person approves.
  `status: approved` is the person's approval; `review` is the reviewer's verdict.
- **Problem**: condensed from the issue; acceptance criteria verbatim.
- **Spec** (§2), written before any diagram, as in `change-design` (S, works, N, O tables). Find
  neighbours for §2.3 by reading code: callers, shared types and their consumers, stored data.
- **Where it fits**: a small Mermaid `flowchart LR` of the workspaces and stores involved, with
  changed nodes marked. Twelve nodes at most.
- **Main flow**: one Mermaid `sequenceDiagram` per user-visible flow, naming route, request and
  response types, status codes.
- **Control flow**: a `flowchart TD` of auth, validation, branches, errors, retries. Every branch
  ends in an observable outcome (status code, UI state).
- **Data model**: a Prisma-schema diff and an `erDiagram` for new or changed models/columns/indexes,
  or "n/a — reason". Name the migration.
- **Affected parts**: one row per workspace; list who imports any changed `@zava/shared` type.
- **Caveats**: go through `references/caveats.md` row by row; write an answer or `n/a — reason`.
  **Open the file the row points at**; do not answer from memory.
- **Concurrency and idempotency**: required whenever the feature writes state or adds a job. Name
  the mechanism, the code it relies on and the observable outcome.
- **Decisions**: numbered, each with decision, rationale and rejected alternative.

Then:

1. **Review.** Run `design-reviewer` with
   `STAGE=1. Review docs/features/<N>-<slug>/design.md for issue #<N>.` Copy its spec check and risk
   map into **Review outcome** verbatim. Fix findings you agree with; for one you keep write
   `Accepted: <finding> — <reason>`. Re-run until no blockers, then set `review.stage1`.
2. **Gate.** One short message in this order: the spec (one line per item), the risk map, affected
   parts, caveats that are not n/a, decisions, remaining findings. Ask: approve / change X / stop.
   Do not start Stage 2 until approved; then set `status: approved`.

## Stage 2 — implementation plan

Write `plan.md` from `templates/plan.md`, only after Stage 1 is approved.

- §0 restates the spec in one line per item.
- Tasks grouped by workspace in dependency order (`packages/shared` → `apps/api` → `apps/web` →
  docs). Each task gives **Test first** (file and test name, and why it fails today), the files,
  and the S/N/O items it serves. A task that serves no item is scope creep.
- A bookkeeping section always exists: docs edits (`docs/api-reference.md`, `docs/architecture.md`),
  ADRs (or "none"), the index row.
- **Verification proves the spec**: every row of design §2.2, §2.3 and §2.4 appears in plan §5 with
  the task that produces its evidence, plus exact commands and journeys to walk.

Then: run `design-reviewer` with `STAGE=2`, same loop; add the index row; gate. In plan mode the plan
you hand to `ExitPlanMode` is this `plan.md`. On approval set `status: approved` in `plan.md`.

## After approval

- Branch `feature/<N>-<slug>`. First commit: the feature folder and index row.
- Implement by the plan, test first, ticking tasks; edit docs in place.
- On merge: `status: implemented` in both documents. `implemented` is terminal; a follow-up is a new
  feature or a trivial fix.

## Tracks

This is the **full** track. `start-change` routes work here, to `change-design` (small) or to a
trivial branch. A small change escalated here arrives with a `design.md` whose §1 and §2 are already
filled: check them against the issue, then continue from *Where it fits*.
