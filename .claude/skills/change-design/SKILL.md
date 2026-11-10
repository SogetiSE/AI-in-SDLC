---
name: change-design
description: Use whenever someone asks for a quick spec, a small or lightweight design, a short plan, "spec and tasks", or says a change does not need the full design ritual, and whenever start-change routes work to the small track. For a contained behaviour change (one or two workspaces, behind existing contracts, no Prisma schema change) write one short change.md holding the spec (what the change does, how we'll know it works, what it must not break, what on-call would need to debug it at 3 am), where it changes, test-first tasks and verification; a light design-reviewer pass; one approval by a person before code. Escalates to feature-design when a schema change, contract change or boundary crossing turns up.
---

# Change design: the small track

One document, one review, one approval. It keeps what makes a design worth doing (a spec someone
else can check, tasks that each serve it, verification that proves it) and drops the ritual that
only pays off for larger work.

**The spec is not optional.** If you cannot say what the change does, how we'll know it works, what
it must not break and what on-call would need to debug it at 3 am, ask the user. Do not write a
vague answer.

## Before you start

The issue is read (by `start-change`, or as `feature-design` Stage 0 describes). Feature id is
`<N>-<slug>`; the folder is `docs/features/<N>-<slug>/`.

## Write `docs/features/<N>-<slug>/change.md`

Start from `templates/change.md`. Rules per section:

- **Frontmatter**: fill every key. `track: small`. `status` stays `proposed` until a person approves.
- **§1 Problem**: condensed from the issue; acceptance criteria verbatim, numbered AC1, AC2, …
- **§2 Spec**:
  - *2.1 Does* (S1, S2, …): behaviour from the outside, "When <actor> <does>, <observable result>".
    Every acceptance criterion is covered by an S-statement.
  - *2.2 We'll know it works*: one row per S-statement and acceptance criterion; prefer a named
    Vitest/Supertest/RTL test (`file > describe > it`).
  - *2.3 Must not break* (N1, N2, …): read the code to find neighbours: callers of what you change,
    the screens and flows next to it, `docs/api-reference.md`, `docs/architecture.md`. Each gets a
    guard: an existing test you opened and confirmed exercises it, or a new one. "Nothing" is not
    an answer.
  - *2.4 Debug at 3 am* (O1, O2, …): for each realistic failure mode, how we find out, the signal
    that localises it (log line with ids, status code, metric) and the first action. If existing
    logging already covers it, name it and confirm it fires on this path. A missing signal becomes
    a task.
- **§3 Where it changes**: one line per workspace and file.
- **§4 Caveats triage**: the rows of `../feature-design/references/caveats.md`. Open the thing in
  "Look at" before answering. List rows that apply; collect the rest on one `n/a: … — <reason>`
  line. A caveat that hits a full-track trigger means **escalate**.
- **§5 Tasks**: ordered; each names its test, the files, and the S/N/O items it serves. A test for
  an S-item must fail today (say why). A new guard for an N-item may pass today; say what it pins.
  A task that serves no S/N/O item is scope creep: cut it, or add the item to §2.
- **§6 Verification**: exact commands (`npm test -w apps/api`, `npm run lint`, `npm run build`) and
  any manual check to walk.
- **§7 Decisions**: only if there was a real choice: decision · why · rejected alternative.

## Review, gate, build

1. **Review.** Run the `design-reviewer` agent with
   `STAGE=small. Review docs/features/<N>-<slug>/change.md for issue #<N>.` Copy its spec check and
   track check into **Review outcome**. Fix what you agree with; for one you keep, write
   `Accepted: <finding> — <reason>`.
2. **Gate.** One short message: the spec (one line per S, works-row and N), where it changes, the
   caveats that apply, the number of tasks, any remaining finding. Ask: approve / change X / stop /
   escalate to full. In plan mode, change.md is the plan you hand to `ExitPlanMode`. On approval set
   `status: approved`.
3. **Build.** Branch `feature/<N>-<slug>`, implement test first, ticking tasks. On merge set
   `status: implemented`. If a full-track trigger or a new S/N/O item turns up while building, stop:
   amend change.md and re-gate, or escalate. Do not build past the spec.

## Escalate to full

Stop and escalate when writing, review or building shows any full-track trigger (see
`start-change`): a Prisma schema change, a contract others consume, a boundary crossing, a third
workspace, a new external dependency, an auth change, or a §2.3 that keeps growing.

1. Tell the user in one line, with evidence (`path:line`). Ask to promote.
2. On agreement, in the same folder: create `design.md` from `../feature-design/templates/design.md`,
   copy §1 and §2 over unchanged, set `track: full`, add under §1
   `Promoted from the small track on <date>: <trigger> — <evidence>`, delete change.md.
3. Continue with `feature-design` Stage 1.

If the person keeps the small track despite a trigger, record `Override: <trigger> — <reason>` in §7
and do not raise it again. Do not downgrade a full design to small unless the user asks.
