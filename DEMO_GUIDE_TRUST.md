---
title: Demo Guide - Trusting Agent Output Without Reading Every Line
description: Freestanding enablement session for experienced Copilot users, built on GitHub's Agentic Engineering System. Moves validation from human eyeballs into a system of evidence, gates, and independent assessment.
author: Sogeti Copilot Enablement
ms.date: 2026-09-30
ms.topic: tutorial
keywords:
  - github copilot
  - agentic engineering system
  - trust
  - verification
  - governance
estimated_reading_time: 20
---

## Session Overview

| Item         | Value                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Session      | 60 min (55 min content + 5 min buffer)                                                               |
| Audience     | Developers using Copilot daily. They know Plan/Agent/Ask, custom agents, hooks, and Copilot CLI      |
| Presenters   | One presenter. A second presenter can take Segments 4 and 5                                          |
| Repo         | `zava-storefront`, branch `trust-demo` (cut from the branch that has the reviews feature)            |
| Tech stack   | TypeScript monorepo, Express, Prisma, React, Vite, Vitest, Playwright                                |
| Format       | Mixed. Short agent turns run live. Browser-driven verification and long agent loops are pre-recorded |
| Source text  | GitHub, _The Agentic Engineering System_ (github.com/resources/insights/agentic-engineering-system)  |
| Dependencies | None on earlier sessions. Everything the demo needs is listed under Preparation                      |

## The Problem This Session Solves

The audience is past the adoption curve. They generate a lot of code with agents and they have discovered the trap: the agent writes 300 lines in two minutes and they spend forty minutes reading them. Speed moved from writing to validating, and validating did not get faster.

GitHub's Agentic Engineering System (AES) names the reason. Faster generation without a surrounding system "can increase confusion, rework, and risk." The assessor role becomes "more important, not less." The two anti-patterns it calls out are exactly what this audience oscillates between:

- Treating green checks as a complete substitute for review.
- Reviewing agent output more lightly than comparable human work.

Manual line-by-line review is the third option nobody names, and it is where the audience is stuck.

## Session Thesis

**Trust is not a feeling about the model. It is a property of the system around the model.**

You stop reading every line when four things are true:

1. The task was defined tightly enough that "done" is checkable (AES: Define, Shared knowledge).
2. The agent hands you evidence, not claims (AES: Performer anti-pattern, "confusing task completion with successful outcomes").
3. Deterministic gates catch the classes of failure you never want to rely on a human to spot (AES: Governance as an operating layer, "not a single gate").
4. An independent assessor with a different context tries to break the change before you see it (AES: Assessor mode, separation of intent and execution).

Then the human reviews the evidence and the risk class, and reads code only where the tier demands it.

## What the Audience Leaves With

- A **Trust Stack**: five layers, and which failure class each one catches.
- A **Trust Ladder**: three risk tiers that decide how much ceremony a task gets, encoded in the repo so the agent applies it itself.
- Three drop-in assets they can copy Monday morning: an evidence-contract agent, an adversarial reviewer agent, and a risk-tier instruction file (Appendix A).
- One health metric to track: escaped defects on agent-authored changes should stay flat or fall as agent volume rises.

## Session Structure

| #   | Segment                                    | Duration | AES concept                              | Live surface                                                      |
| --- | ------------------------------------------ | -------- | ---------------------------------------- | ----------------------------------------------------------------- |
| 0   | The validation trap                        | 5 min    | Assessor anti-patterns, health check     | Slides                                                            |
| 1   | Claims versus evidence                     | 8 min    | Performer anti-pattern, Shared knowledge | Agent mode, `verified-builder` agent, `playwright-cli` (recorded) |
| 2   | Define so that "done" is checkable         | 8 min    | Define activity, Director mode           | Plan agent, acceptance criteria as tests                          |
| 3   | Gates: deterministic where it matters      | 7 min    | Governance as an operating layer         | Hooks, branch protection, push protection                         |
| 4   | The independent assessor                   | 12 min   | Assessor mode, separation of duties      | `adversarial-reviewer` agent, Playwright browser proof (recorded) |
| 5   | The Trust Ladder: risk-tiered delegation   | 8 min    | Stock-Adoption matrix                    | `risk-tiers.instructions.md`, two contrasting prompts             |
| 6   | Detect: know whether the system is working | 4 min    | Detect activity, "noise, not insight"    | PR labels, metrics                                                |
| 7   | Close and Q&A                              | 3 min    |                                          |                                                                   |

## Live Versus Recorded

Anything that waits on a browser or on a long agent loop is recorded in rehearsal and played back at 1.5x with live narration. Everything else runs live. The audience is told which is which; a recorded segment presented as live is the same anti-pattern as an unverified claim.

| Segment | Live                                                              | Recorded                                                                         | Recording length |
| ------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| 1       | Baseline prompt, reading the claim, running tests by hand         | `verified-builder` run including the browser verification and the Evidence block | 3 to 4 min       |
| 2       | Plan agent prompt, reading and confirming assumed criteria        | Test scaffolding turn                                                            | 1 to 2 min       |
| 3       | Hooks file walkthrough, gate taxonomy                             | Builder implementing against red tests, Stop hook and scope guard firing         | 3 to 5 min       |
| 4       | Reading the findings, the handoff click, the fix's Evidence block | Assessor run: findings, failing Vitest, then the Playwright browser proof        | 4 to 6 min       |
| 5       | Both prompts and both Evidence blocks                             | Nothing. These turns are short                                                   |                  |

Pause each recording at the moments listed in its segment. The recordings are the fallback as well as the plan, so no separate fallback videos are needed.

## The Trust Stack (opening slide, referenced throughout)

| Layer | Name                 | Catches                                                                 | Human cost                    |
| ----- | -------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| 1     | Tight definition     | Wrong feature, missing edge case, ambiguous "done"                      | Minutes up front, once        |
| 2     | Evidence contract    | "I ran the tests" that never ran, UI claims nobody opened a browser for | Read a block, not a diff      |
| 3     | Deterministic gates  | Secrets, dangerous commands, failing tests, scope creep                 | Zero after setup              |
| 4     | Independent assessor | Logic bugs, auth gaps, spec violations that pass green tests            | Read one finding and one test |
| 5     | Tiered human review  | Everything the tier says a human must see                               | Proportional to risk          |

Each segment adds one layer to the stack. Rebuild the table on screen as you go.

## Running Example

All segments work on one feature so the audience can follow a single change through the whole stack.

**Feature**: Customers can edit their own review within 24 hours of posting it.

Why this feature: it is small enough to build live, and it has a hidden moderation bypass. An approved review that gets edited must go back to `pending`, or a customer can post a clean review, get it approved, then edit it into spam. Agents frequently miss this because nothing in the code says so. A green test suite will not catch it unless someone defined it. That makes it a perfect vehicle for every layer.

Relevant files: `apps/api/src/routes/reviews.ts`, `apps/api/prisma/schema.prisma` (the `Review` model with `status` defaulting to `pending`), `apps/api/src/routes/routes.test.ts`, `apps/web/src/components/ReviewList.tsx` and `ReviewForm.tsx`.

The bypass is a visibility defect. The API test proves it to developers. The browser proves it to everyone: spam text sitting on the public product page after the review was edited. That is why Playwright appears in Segments 1 and 4.

## Segment 0 - The Validation Trap (5 min)

Slide 1: a timeline. Two minutes generating, forty minutes reading. Ask the room: "Whose week does this look like?"

Slide 2: the two AES assessor anti-patterns, verbatim. Then add the third: "Reading every line yourself." Say that all three are the same mistake, putting the whole trust burden on one place.

Slide 3: the AES health check. "As agent use grows, escaped defect rates should stay flat or fall." That is the number that tells you whether you may trust more. Nothing else does.

Slide 4: the Trust Stack table, empty. Say you will fill it in live.

**Talking points**

- AES is tool-agnostic. Everything today uses Copilot, but the layers apply to any agent.
- The word "trust" gets replaced today with "evidence plus bounded blast radius plus a system that catches what you miss."

## Segment 1 - Claims Versus Evidence (8 min)

**Goal**: show that the same agent, same model, same task produces unreviewable output or reviewable output depending on whether it is required to produce evidence.

**Step 1: the baseline**

Agent mode, default `agent`, Autopilot approvals.

> Let customers edit their own review within 24 hours of creating it. Add a PUT /api/reviews/:id endpoint and an Edit action on the customer's own review in the product page review list.

Let it run. It will typically add the route, maybe add a test, and end with a summary such as "Added the endpoint and tests, all tests pass."

Stop and ask: "What in this message can you verify without opening a file?" Answer: nothing. Point at the summary and name it a **claim**.

Open the terminal and run `npm test -w apps/api`. Often the agent did run tests. Sometimes it did not, or ran only the new file. Either outcome works for the demo: the point is that you had to check.

**Step 2: the evidence contract**

Discard the changes (`git checkout -- . && git clean -fd apps/`). Switch to the `verified-builder` custom agent (Appendix A1). Same prompt.

The agent now ends with a fixed **Evidence** block:

```text
## Evidence
Tier: 2 (touches authorization)
Scope declared: apps/api/src/routes/reviews.ts, apps/api/src/routes/routes.test.ts,
  apps/web/src/components/ReviewList.tsx, apps/web/src/services/api.ts
Scope actual:   (same)
Commands run:
  npm test -w apps/api            exit 0   32 passed
  npm run build -w apps/api       exit 0
Tests added: 3 (owner can edit, non-owner 403, after 24h 403)
UI verified: logged in as customer@example.com, edited own review on /products/<id>,
  new text visible after reload (playwright-cli snapshot attached)
Not verified: behaviour of edited review that was already approved
Assumptions: 24h window measured from createdAt
```

The recording shows the browser part: the agent opens the app with `playwright-cli`, logs in, edits the review, reloads, and takes a snapshot. Pause on the snapshot. Say that the agent read the same accessibility tree you are looking at, and that the line "UI verified" is backed by it.

**Talking points**

- The Evidence block is the deliverable. The code is the attachment.
- "Not verified" is the most valuable line. AES says weak shared knowledge "often turns into fast, confident mistakes." An agent forced to list what it did not check stops being confident about things it never tested.
- "UI verified" is probabilistic evidence. The agent drove a browser and read a snapshot. It is far stronger than "the component renders," and weaker than a Playwright test in CI. Say both halves.
- Scope declared versus actual is a blast-radius statement. If they differ, you read the diff. If they match, you read the evidence.
- The audience already knows custom agents. The new idea is using one to change the shape of the output rather than the behaviour of the build.

Add Layer 2 to the stack.

## Segment 2 - Define So That "Done" Is Checkable (8 min)

**Goal**: shift the human review from the implementation to the specification, where it is thirty lines instead of three hundred.

Notice that the Evidence block in Segment 1 listed "edited review that was already approved" as not verified. The agent flagged a gap. Now show how the gap should have been closed before code existed.

**Step 1: Plan agent with a definition contract**

Plan agent, prompt:

> Plan the review-edit feature. Before any design, write acceptance criteria as Given/When/Then statements. Include at least one criterion for each of: ownership, time window, moderation state after edit, and input validation. Mark any criterion you had to assume rather than derive from the codebase or the prompt.

The plan comes back with criteria such as:

- Given an approved review, when the owner edits it, then its status returns to `pending` and it disappears from the public product page until re-moderated. **(assumed)**

Point at the word "assumed". That is the AES Director mode: intent comes from the human, and the agent must not "be mistaken for the source of intent." The human decides whether the assumption is right. Here it is. Confirm it in one sentence.

**Step 2: criteria become tests before code**

> Turn the acceptance criteria into failing tests in routes.test.ts. Do not implement the endpoint yet.

Show the test file diff. This is what the human reviews. Ask the room: "How long does it take to read six test names and their assertions? How long to read the implementation?"

**Talking points**

- AES: "poorly defined work can move into execution almost immediately." Definition is now the bottleneck that matters, because delivery is nearly free.
- Reviewing tests is reviewing intent. Reviewing implementation is reviewing mechanism. Humans are better at the first and slower at the second.
- The instruction file is the durable version of this. Point at `.github/copilot-instructions.md` and say that anything the agent had to assume twice belongs in there. That is AES shared knowledge as a stock that accumulates.

Add Layer 1 to the stack. Say out loud that it goes below Layer 2 because it comes first in time.

## Segment 3 - Gates: Deterministic Where It Matters (7 min)

**Goal**: this audience knows hooks. The new content is a taxonomy: which failure classes should never depend on a model or a human.

Let `verified-builder` implement the endpoint against the failing tests. While it runs, open `.github/hooks/quality.json` and put this table on screen:

| Failure class                | Wrong place to catch it | Right gate                                     | In this repo                         |
| ---------------------------- | ----------------------- | ---------------------------------------------- | ------------------------------------ |
| Secret in source             | Human review            | Pre-edit hook, then push protection            | `hook-secret-scan.mjs`, GHAS         |
| Destructive shell command    | Human approval fatigue  | Pre-tool hook                                  | `hook-pre-tool-use.mjs`              |
| Agent stops with red tests   | Reading the summary     | Stop hook                                      | `hook-stop.mjs`                      |
| Edits outside declared scope | Diff reading            | Scope guard hook                               | `hook-scope-guard.mjs` (Appendix A4) |
| Merge without review         | Culture                 | Branch protection, required checks, CODEOWNERS | GitHub settings                      |

Live: when the agent's Stop hook fires because a test is still red, narrate it. "The agent wanted to finish. The gate said no. Nobody read anything."

If the agent tries to touch a file outside the declared scope, the scope guard denies it and the agent either narrows or re-declares. Both are visible.

**Talking points**

- AES: governance is "a continuously evaluated operating layer," not a single gate. Hooks are the local layer, branch protection is the repository layer, push protection is the platform layer. They overlap deliberately.
- Instructions guide, hooks enforce. Put a rule in an instruction file when you want the agent to usually do it. Put it in a hook when "usually" is not acceptable.
- Gates are cheap to run and expensive to design. Design one per failure class you have actually seen escape. AES: "Govern one workflow at a time, then accumulate what you learn."

Add Layer 3.

## Segment 4 - The Independent Assessor (12 min)

**Goal**: the centrepiece. Show that a second agent with a different charter and a different context finds what the builder missed, and proves it with a failing test rather than an opinion.

**Why a separate agent, not "please review your work"**

Same context, same blind spots. The builder's conversation is full of its own reasoning. An assessor that receives only the specification and the diff cannot inherit the builder's assumptions. This is separation of duties applied to agents.

**Step 1: run the assessor**

Commit the builder's work on the `trust-demo` branch so the assessor has a clean diff. Switch to `adversarial-reviewer` (Appendix A2). Its charter is: assume the change is wrong, find the way it is wrong, and prove it.

> Review the last commit against the acceptance criteria in the plan. Try to break it.

Expected findings, in the order they usually appear:

1. 🔴 Approved review edited by owner stays `approved` (if the builder missed the status reset despite the test, or if the test only checked the response body and not the public listing).
2. 🟡 24-hour window compared against `updatedAt` rather than `createdAt`, so each edit extends the window.
3. 🟡 Rating change on edit skews the aggregate with no re-moderation.

For each 🔴 finding the agent writes a failing test and runs it. Show the red test. That is the difference between "I think there is a bug" and "here is the bug."

Then the recording continues into the browser. The assessor logs in as the customer, posts a review with harmless text, switches to the admin account, approves it, switches back, edits the text to something obviously wrong, and reloads the public product page. Pause the recording on the snapshot showing the edited text still visible with no moderation. Say: "Green API tests. Green build. This is on the storefront." That frame is the whole session in one image.

If the builder got everything right (it happens in maybe one rehearsal in four), the assessor reports "no blocking findings" and lists what it tried. Use the fallback branch `trust-demo/seeded-bug` (Preparation) so the audience still sees a real catch. Tell them you seeded it. Honesty here is part of the lesson.

**Step 2: hand back**

Click the **🔧 Fix findings** handoff to `verified-builder`. It fixes the failing test, re-runs the suite, produces a new Evidence block. Human reads: one finding, one test, one Evidence block.

**Step 3: from proof to gate**

Live. Ask `verified-builder`:

> Turn the browser proof from the review into a Playwright test in apps/web/e2e. Use the seeded customer and admin accounts.

Show the generated spec file, not the run. The run is 30 to 60 seconds and belongs in CI, so point at the `e2e.yml` workflow in `.github/workflows/` and say it is now a required check on the branch. The browser proof was a one-off assessor artefact. The test is the durable gate. Same criterion, moved from Layer 4 to Layer 3.

Mention Copilot code review on the PR in one sentence as a third, context-free assessor. Do not demo it.

**Talking points**

- Three assessors now looked at this code: hooks and the Playwright test (deterministic), the adversarial agent (probabilistic, adversarial charter), Copilot code review (probabilistic, platform context). The human is the fourth and reads only what the first three surfaced.
- AES: agent-as-assessor is "suited to higher agentic maturity." This is that. It works because the assessor has a narrow charter, its own context, and must produce a reproducible artefact.
- Browser evidence is where agents most often over-claim. An agent that says "the UI updates correctly" without having opened a browser is the Performer anti-pattern in its purest form. The `playwright-cli` skill makes the honest version cheap.
- The adversarial reviewer is not a linter. It reads the specification. Findings that are not traceable to a criterion or a security property are noise, and the agent file tells it to drop them. AES: "More detection without better interpretation creates noise, not insight."
- Cost note: two agents cost roughly double the tokens of one. The human time saved is the return. Track both.

Add Layer 4.

## Segment 5 - The Trust Ladder: Risk-Tiered Delegation (8 min)

**Goal**: replace "how much should I trust the agent" with "which tier is this task, and what does the tier require."

Put the ladder on screen:

| Tier | Task class                                                                    | Required ceremony                                                              | Human reads                  |
| ---- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------- |
| 0    | Formatting, docs, test-only changes, renames within a module                  | Gates only. Autopilot approvals.                                               | Evidence block               |
| 1    | Bounded feature behind existing auth, no schema change                        | Acceptance criteria as tests, evidence block, adversarial reviewer             | Criteria, findings, evidence |
| 2    | Auth, payments, schema migration, secrets, anything customer-visible at scale | Tier 1 plus security agent, human line review of flagged files, staged rollout | Flagged files line by line   |

The tier is decided by what the change touches, not by how confident anyone feels.

**Live: the agent classifies itself**

Show `.github/instructions/risk-tiers.instructions.md` (Appendix A3). It tells every agent to state its tier at the start of the Evidence block and to refuse Autopilot-style shortcuts above Tier 0.

Two prompts to `verified-builder`, back to back:

> Fix the typo "Recieved" in the admin reviews page heading.

Evidence block says Tier 0, one file, no tests added, done in seconds.

> Allow admins to permanently delete a review.

Evidence block says Tier 2 (destructive, admin authority), declares scope, adds tests, and ends with "Recommend human review of the authorization check in reviews.ts before merge."

**Talking points**

- This is the AES Stock-Adoption matrix applied per task. The article's four quadrants are about the organisation. The ladder is the same question asked of a single change: are the foundations (tests, instructions, gates) strong enough for the autonomy you are about to grant?
- Moving a task class down a tier is the goal, and it is earned. When Tier 1 changes in an area have had zero escaped defects for a quarter, consider Tier 0 for that class. AES: "expand to the next safe class of work."
- The ladder is also the answer to "why is review burden rising." AES says that is usually a shared-knowledge problem: "shrink scope, improve context, review smaller batches." Tier 2 tasks that feel like Tier 1 are a sign the instructions are missing something.

Add Layer 5. The stack is complete.

## Segment 6 - Detect: Know Whether the System Is Working (4 min)

Slide with four numbers to start tracking. All exist in GitHub already or take one label to add.

| Signal                                   | Where                                     | Healthy direction                                           |
| ---------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Escaped defects, agent PRs vs human PRs  | Issue label `origin:agent` on bug reports | Flat or falling as agent volume rises                       |
| Rework rate (commits after first review) | PR history                                | Falling                                                     |
| Gate trips per week, by gate             | Hook logs, GHAS alerts                    | Falling for known classes, new classes appear and then fall |
| Assessor findings per PR, by severity    | Adversarial reviewer output, parsed       | 🔴 falling, 🟡 stable                                       |

**Talking points**

- AES lists "high token use, repeated retries, or tool-call churn" as knowledge-gap signals. When the builder loops, the fix is usually in the instruction file, not the prompt.
- Detect is what earns the right to move a task class down the ladder. Without it, every tiering decision is a guess.

## Segment 7 - Close (3 min)

Return to the two AES assessor anti-patterns and the third one. Then the stack, filled in. One sentence per layer.

**Monday morning list**

1. Copy the three files in Appendix A into your repo. Adjust the tier table to your domain.
2. Pick one workflow, not the whole team. Run it through the stack for two weeks.
3. Add the `origin:agent` label and start counting escaped defects.
4. When a defect escapes, ask which layer should have caught it, and strengthen that layer. Do not add a fourth reviewer.

Q&A with the remaining time.

## Preparation Checklist

### Repository

- Create branch `trust-demo` from the branch that contains the reviews feature (`apps/api/src/routes/reviews.ts` must exist and its tests must pass). At the time of writing that is `demo-mattias`, not `main`.
- Add the Appendix A files: `.github/agents/verified-builder.agent.md`, `.github/agents/adversarial-reviewer.agent.md`, `.github/instructions/risk-tiers.instructions.md`, `scripts/hook-scope-guard.mjs`, and register the scope guard in `.github/hooks/quality.json` under `PreToolUse`.
- Introduce the typo "Recieved" in a heading in `apps/web/src/pages/AdminReviewsPage.tsx` for the Tier 0 prompt.
- Commit. This is the demo start state.
- Create `trust-demo/seeded-bug` from `trust-demo`: implement the edit endpoint without the status reset, with tests that check only the response body. Commit. This is the Segment 4 fallback.
- Enable Copilot code review on the repo. Enable push protection.
- Add `data-testid` attributes to `ReviewList.tsx` (`review-item`, `review-text`, `review-status`) and `ReviewForm.tsx` (`review-text-input`, `review-submit`). There is no edit control today; the builder creates it in Segment 1, and the instruction file tells it to add a `review-edit` test id. Agents drive the UI by accessibility snapshot, but stable test ids keep the recorded flow and the generated Playwright spec from breaking on copy changes.
- Add `@playwright/test` to `apps/web`, a `playwright.config.ts` with `webServer` starting both dev servers, and an empty `apps/web/e2e/` directory. Add a separate `.github/workflows/e2e.yml` that runs `npx playwright test` in `apps/web` on pull requests, so Segment 4 Step 3 can point at a real required check. The existing `docker-publish.yml` only builds images.

### Playwright

- Install the CLI the skill expects: `npm install -g @playwright/cli` (or confirm `npx playwright-cli open` works), then `npx playwright install chromium`.
- The skill lives at `.agents/skills/playwright-cli/SKILL.md` and is picked up by Copilot agents automatically. Verify by asking `agent` to "open http://localhost:5173 with playwright-cli and snapshot the home page" once.
- `verified-builder` and `adversarial-reviewer` (Appendix A) are instructed to use `playwright-cli` for any criterion about what a user sees and to attach the snapshot.
- Seeded accounts used in recordings: `customer@example.com` and `admin@zava.com` from `apps/api/prisma/seed.ts`. Put both email/password pairs in a `.env.demo` the agents can read, never in a prompt on screen.
- Both dev servers running (`npm run dev`) before every recording and before Segment 4 Step 3.

### Local

- `npm install`, `npm run db:push`, `npm run db:seed`, `npm test`. All green.
- Hooks enabled in VS Code. Verify by triggering the secret scanner once.
- Chat agents visible: `agent`, `Plan`, `verified-builder`, `adversarial-reviewer`.
- Terminal open beside chat with `npm test -w apps/api` ready in history.

### Slides

- Trust Stack table, empty and filled versions.
- Trust Ladder table.
- Gate taxonomy table.
- Detect signals table.
- Two AES quotes: the health check and the two assessor anti-patterns.

### Recording

- Record the four segments in the Live Versus Recorded table from a clean `trust-demo` checkout, in order, so file state carries over. Re-record from the start if an early one changes.
- For Segment 4, record on `trust-demo/seeded-bug` unless the builder produced the bug unaided in the Segment 3 recording.
- Screen area: chat panel, terminal, and the Chromium window side by side. The browser must be visible when the agent snapshots it, otherwise the audience sees text and takes it on faith, which defeats the segment.
- Trim dead time, keep every tool call visible, export at 1.5x. Note the pause timestamps in the presenter notes.

### Rehearsal

- Run Segments 1 through 5 end to end three times. Note in each run whether the builder produced the moderation bypass. If it did in fewer than one of three runs, keep the seeded-bug branch as the default path for Segment 4 and say so.
- Time Segment 4. It is the one that runs long.
- Rehearse the live-to-recording switches. The switch is the moment audiences lose the thread.

## Verification

- `verified-builder` always ends with an Evidence block that includes Tier, Scope declared/actual, Commands run with exit codes, Tests added, UI verified, Not verified.
- Plan agent marks at least one acceptance criterion as assumed.
- Stop hook blocks completion with a red test at least once during Segment 3.
- Scope guard denies an edit outside declared scope when provoked (rehearse with "also update the README").
- `adversarial-reviewer` produces at least one failing test on `trust-demo/seeded-bug`.
- The two Segment 5 prompts classify as Tier 0 and Tier 2 respectively.
- `verified-builder` uses `playwright-cli` unprompted for a UI-facing criterion and includes a "UI verified" line with a snapshot reference.
- The Segment 4 recording contains a browser frame showing an edited approved review still visible on the public product page.
- The generated Playwright spec in `apps/web/e2e/` passes against the fixed code and fails against `trust-demo/seeded-bug`. Check both before the session.

## Facilitator Notes

- **If the baseline agent in Segment 1 does everything right**, the lesson still holds. Say: "It was right. How did you know? You ran the tests yourself. That is the forty minutes." Then move to the evidence contract.
- **If the assessor finds nothing on the real branch**, switch to the seeded branch and say so. The audience is senior. They respect a seeded example and distrust a lucky one.
- **If someone says "this is just more process"**, agree that it is process, then count human minutes. Baseline: read 300 lines. Stack: read a criteria list, one Evidence block, one finding. The process is what removes the reading.
- **If someone asks about non-Copilot agents**, the layers are the point, the tooling is incidental. AES is explicitly tool-agnostic.
- **If someone objects that a recording proves nothing**, agree. Then point out that the Evidence blocks, the failing test, and the Playwright spec are all in the `trust-demo` branch they can clone. Recordings show the flow. The artefacts are the proof. That distinction is the session.
- **If asked whether agents should review agents at all**, quote the AES grid: agent-as-assessor is for higher maturity, and the human remains the final assessor for Tier 2. The adversarial agent narrows what the human reads. It does not replace them.

## Appendix A - Drop-in Assets

### A1. `.github/agents/verified-builder.agent.md`

```markdown
---
description: >
  Implements bounded changes and ends every response with a structured Evidence block.
  Use when you want output you can review by reading evidence rather than diffs.
handoffs:
  - label: '🔍 Adversarial review'
    agent: adversarial-reviewer
    prompt: 'Review the last commit against the acceptance criteria. Try to break it.'
    send: false
---

# Verified Builder

You implement changes in the Zava Storefront. You never claim; you show.

## Before editing

1. Read `.github/instructions/risk-tiers.instructions.md` and classify the task. State the tier and why.
2. Declare the files you intend to change. Stay inside them. If you must go outside, re-declare and say why.
3. If acceptance criteria exist in the conversation or a plan file, list which test covers each one. If a criterion has no test, write the test first.

## While editing

- Run the relevant tests after every change to a source file. Run the full workspace suite before finishing.
- Never describe a command's result without having run it in this session.
- For any criterion about what a user sees, use the `playwright-cli` skill: open the app, perform the flow with the accounts in `.env.demo`, reload, and take a snapshot. Quote the relevant snapshot lines under "UI verified". If you could not run a browser, write "UI verified: no" and say why.

## Evidence block (mandatory, last thing in the response)

## Evidence

Tier: <0|1|2> (<reason>)
Scope declared: <files>
Scope actual: <files, or "same">
Commands run:
<command> exit <code> <one-line result>
Tests added: <count> (<names>)
UI verified: <flow performed and snapshot lines, or "no: <reason>">
Not verified: <everything you did not test or could not test, or "nothing known">
Assumptions: <anything you decided without a source in the code, prompt, or instructions>

Above Tier 0, end with one sentence recommending what a human should read.
```

### A2. `.github/agents/adversarial-reviewer.agent.md`

```markdown
---
description: >
  Independent assessor. Receives only the specification and the diff, assumes the change is
  wrong, and proves findings with failing tests. Use after a builder commits.
handoffs:
  - label: '🔧 Fix findings'
    agent: verified-builder
    prompt: 'Fix the blocking findings from the adversarial review. Make the failing tests pass without weakening them.'
    send: false
  - label: '🔒 Security check'
    agent: se-security-reviewer
    prompt: 'Security-review the code in the last commit.'
    send: false
---

# Adversarial Reviewer

You are not the author. Do not read the author's reasoning. Read the acceptance criteria, the
project instructions, and the diff of the last commit (`git diff HEAD~1`). Assume the change is
wrong and find out how.

## Method

1. For each acceptance criterion, ask: what input, state, or sequence would make this fail while
   the existing tests still pass? Check ownership, time boundaries, state transitions, and
   anything that changes visibility to other users.
2. For each 🔴 finding, write a failing test in the existing test file, run it, and include the
   failing output. A finding without a failing test is downgraded to 🟡.
   If the finding concerns what a user sees, also reproduce it in the browser with the
   `playwright-cli` skill and include the snapshot lines that show the wrong state.
3. Drop any finding you cannot trace to a criterion, a project instruction, or a security
   property. Style is not your job.

## Output

Numbered findings by file with 🔴 BLOCKER / 🟡 WARNING, each with the criterion it violates and
the test that proves it. Then a "What I tried and could not break" list. Then a verdict:
APPROVE, REQUEST CHANGES, or NEEDS HUMAN (use NEEDS HUMAN for Tier 2 authorization logic).
```

### A3. `.github/instructions/risk-tiers.instructions.md`

```markdown
---
applyTo: '**'
---

# Risk tiers

Classify every task before editing. The tier is set by what the change touches, not by confidence.

| Tier | Touches                                                                                  | Required                                                                        |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 0    | Formatting, comments, docs, test-only changes, renames inside one module                 | Evidence block. Existing tests green.                                           |
| 1    | Feature logic behind existing auth, no schema change, no new dependency                  | Tier 0 plus tests for each acceptance criterion, plus adversarial review.       |
| 2    | Auth or authorization, payments, Prisma schema, secrets or env, deletes, admin authority | Tier 1 plus security review, and a recommendation of which files a human reads. |

Interactive elements you add to `apps/web` get a `data-testid` in kebab-case (`review-edit`, `review-submit`).

State the tier and the reason as the first line of the Evidence block. If a task spans tiers,
use the highest. Never downgrade a tier to finish faster.
```

### A4. `scripts/hook-scope-guard.mjs`

Reads `.copilot-scope` (one glob per line, written by the builder when it declares scope) and denies edit tools targeting paths outside it. Register under `PreToolUse` in `.github/hooks/quality.json`. The builder agent must be told to write the file; add to `verified-builder`: "Write your declared scope to `.copilot-scope`, one path per line, before your first edit."

```javascript
import { readFileSync, existsSync } from 'node:fs';
import { minimatch } from 'minimatch';

const input = JSON.parse(readFileSync(0, 'utf8'));
const tool = input.tool_name ?? '';
const target = input.tool_input?.filePath ?? input.tool_input?.path ?? '';

const editTools = ['editFile', 'createFile', 'replaceString', 'insertEdit'];
if (!editTools.includes(tool) || !target || !existsSync('.copilot-scope')) process.exit(0);

const scope = readFileSync('.copilot-scope', 'utf8')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);
const rel = target.replace(process.cwd() + '/', '');
const allowed = scope.some((g) => minimatch(rel, g));

if (!allowed) {
  console.log(
    JSON.stringify({
      permissionDecision: 'deny',
      permissionDecisionReason: `${rel} is outside declared scope (${scope.join(', ')}). Re-declare scope in .copilot-scope and explain why, or stay inside it.`,
    }),
  );
}
```

Check the hook input field names against the current Copilot hooks schema before the session. They have changed between releases.

## Appendix B - AES Vocabulary Used in This Session

| AES term              | How it appears today                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| Governance stock      | Hooks, branch protection, push protection, the tier table                        |
| Shared knowledge      | Instruction files, acceptance criteria, the "Assumptions" line                   |
| Customer value        | Escaped defect rate, not lines generated                                         |
| Define                | Segment 2                                                                        |
| Deliver               | Segments 1 and 3                                                                 |
| Evidence              | Evidence block, Vitest output, `playwright-cli` snapshots, Playwright spec in CI |
| Detect                | Segments 4 and 6                                                                 |
| Director mode         | Human confirms assumed criteria                                                  |
| Performer mode        | `verified-builder`                                                               |
| Assessor mode         | Hooks, `adversarial-reviewer`, Copilot code review, tiered human review          |
| Stock-Adoption matrix | The Trust Ladder, applied per task                                               |
