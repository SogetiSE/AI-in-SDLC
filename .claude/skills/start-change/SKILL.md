---
name: start-change
description: Use this first, before planning, designing or writing any change to production code (a fix, a behaviour change, a new feature, a refactor), including in plan mode and when asked to "plan this", "design this", "take this issue", "where does this fit" or "how big is this". It routes the work to the right amount of design — trivial (no document), small (one spec-and-tasks document, change-design) or full (system design then implementation plan, feature-design) — by reading the issue and the code for the deciding signals (workspaces touched, size, Prisma schema changes, shared contracts and their consumers, auth), proposing a track in one line and letting the person override.
---

# Start a change: pick the track

Every change to production code goes through one of three tracks. This skill picks one, says why
and hands off. It writes nothing itself.

| Track | What you get | Skill |
|---|---|---|
| **trivial** | no document; a `trivial/<slug>` branch and an issue reference | none |
| **small** | `docs/features/<N>-<slug>/change.md`: spec, tasks, verification; one review, one approval | `change-design` |
| **full** | `design.md` then `plan.md`, two reviews, two approvals | `feature-design` |

All three keep the same rule: know what the change does, how we'll know it works, what it must not
break, and **how we'd debug it at 3 am** (if you were on call and this broke, what logs, metrics or
traces would you need?). The tracks differ in how much is written down to prove it.

## Project conventions (this repo)

- Workspaces: `apps/api` (Express + Prisma + SQLite), `apps/web` (React + Vite), `packages/shared`
  (types and utilities used by both). Docs: `docs/architecture.md`, `docs/api-reference.md`.
- Issues: GitHub, via `gh issue view <N> --json title,body,comments`.
- Branches: `feature/<N>-<slug>` for small and full, `trivial/<slug>` for trivial.
- Checks: `npm test`, `npm run lint`, `npm run build`.

## Procedure

1. **Issue.** Read the issue with its comments, or draft one (Problem, Who is affected, Acceptance
   criteria, Out of scope) and ask once whether to create it with `gh issue create`. Trivial work
   still needs an issue reference.
2. **Signals, from the code.** Do not route from the chat alone. Find the code the change lands in
   and check, briefly:
   - which workspaces it touches;
   - roughly how many lines change;
   - each full-track trigger below: grep the callers of the types, routes and Zod/TS contracts you
     would change, look at `apps/api/prisma/`, the shared types web and api both import, and the
     auth middleware on the entry point.
3. **Propose.** One line: the track and the signal that decided it, then ask for an override.
   - `Track: small — apps/api only, ~150 lines, no schema or shared-type change. OK, or trivial/full?`
   - `Track: full — adds a column to Order (Prisma schema) and a field in @zava/shared consumed by web. OK?`
4. **Hand off.**
   - trivial → branch `trivial/<slug>`, fix test first, no document. The PR description carries one
     line: `3 am: <the signal that shows this failing, or the one you added>`.
   - small → follow the `change-design` skill.
   - full → follow the `feature-design` skill from Stage 1 (the issue is already read).

In plan mode, routing happens inside plan mode; the document the chosen track produces is the plan.

## Routing rules (defaults)

**Full** if any of these is true:

- a Prisma schema change or migration;
- a type in `packages/shared`, an API route's request/response shape, or an event that both `api`
  and `web` (or an external client) consume changes in a way a consumer must react to: a removed or
  renamed field, a new required field, a changed meaning (an optional field only one side uses is
  not a trigger);
- a new background job, queue, scheduler or long-lived loop;
- more than two workspaces change;
- a new external dependency (service, SaaS, model, store, a significant npm package);
- an authentication, authorisation or data-retention change;
- a new user-visible flow of more than one step.

**Trivial** if all of these are true: ≤ 100 changed lines in ≤ 2 workspaces, an issue is
referenced, and it adds no new behaviour: it corrects or tidies behaviour that already exists (a
typo, a wrong default, an off-by-one, a log line).

**Small**: everything else, typically a behaviour change contained in one or two workspaces behind
an existing contract (a validation rule, a filter on an existing list, a field shown that is
already returned, a tweak to an existing handler).

If the person overrides to a smaller track despite a trigger, accept it, and let the chosen skill
record the override so it is not raised again.

**Unsure between two tracks, pick the larger.** A small change can be promoted to full later
(`change-design` describes how); a trivial change that turns out to change behaviour is restarted
as small.
