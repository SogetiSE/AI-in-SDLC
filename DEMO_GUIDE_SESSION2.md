---
title: Demo Guide Session 2 - Dial the Ceremony to the Risk
description: Second enablement session for the Zava storefront using HVE Core's RPI workflow, built around the pain points reported in the participant survey
author: Sogeti Copilot Enablement
ms.date: 2026-09-23
ms.topic: tutorial
keywords:
  - github copilot
  - hve-core
  - rpi
  - agentic sdlc
  - demo
estimated_reading_time: 18
---

## Session Overview

| Item       | Value                                                                      |
| ---------- | -------------------------------------------------------------------------- |
| Session    | 60 min                                                                     |
| Audience   | Session 1 participants (23 survey respondents, mixed beginner to advanced) |
| Repo       | `zava-storefront`, branch `live-demo` continuing from Session 1            |
| Tech stack | TypeScript monorepo, Express, Prisma, React, Vite, Vitest                  |
| Framework  | HVE Core 3.3 (VS Code extension `ise-hve-essentials.hve-core`)             |

## Session Goal

Session 1 showed what Copilot agents can do. The survey says the audience now needs agents to be reliable and affordable: correct context, bounded scope, verifiable output, and a clear sense of what to delegate. This session shows one framework, HVE Core, running the same repository at two speeds. A small task runs with zero ceremony. A cross-cutting feature runs through Research, Plan, Implement and Review with versioned artifacts and human approval at each gate. The audience leaves with a rule for choosing between the two.

## What the Survey Told Us

Top pain points, with respondent counts out of 23:

| Concern                                                   | Count | Segment that answers it |
| --------------------------------------------------------- | ----- | ----------------------- |
| Copilot misunderstands the task                           | 7     | 2                       |
| Lacks repository or business context                      | 6     | 2, 6                    |
| Changes more code than expected                           | 6     | 3, 4                    |
| Cost or premium-request consumption blocks agentic use    | 6     | 1, 7                    |
| Response too generic; ignores architecture or conventions | 5     | 3, 6                    |
| Generated changes too large to review confidently         | 3     | 4, 5                    |
| Invents APIs, methods or configuration                    | 3     | 2                       |
| Unsure which tasks are suitable for delegation            | 2     | 1, 7                    |
| Permission prompts interrupt the workflow                 | 2     | 6                       |

Audience shape to keep in mind:

- Roughly seven advanced users already run custom agents, skills, hooks and MCP. Roughly seven are beginners or have not used Copilot yet.
- Stacks are .NET, Delphi, C/C++ firmware, Python, TypeScript and Bicep. VS Code dominates, but five use JetBrains, two use Neovim and four live in the Delphi IDE.
- Three respondents prefer Claude Code. One respondent has tried spec-driven development.
- Eight respondents cannot commit to being fully present. Keep every segment self-contained.

## Pre-seeded Demo Assets

Carried over from Session 1 on `live-demo`:

- Review and rating system with moderation (Demo 2) and validation (Demo 3)
- Custom agents in `.github/agents/` (`tdd`, `reviewer`, `SE: Security`)
- Hooks in `.github/hooks/quality.json` (Prettier, dangerous-command block, secret scanner, test gate)
- Path instructions in `.github/instructions/` for `apps/api/**` and `apps/web/**`
- GitHub issue #2 (wishlist) and `TODO(copilot)` stubs in `apps/api/prisma/schema.prisma`
- 38 passing tests (29 API, 9 web)

New for this session:

- HVE Core extension installed on the presenter machine
- `session2-prepared` branch containing pre-generated `.copilot-tracking/` artifacts as a fallback
- Survey slide with the table above

## Session Structure

| #   | Segment                               | Duration | HVE Core surface                                                              | Survey concern                                    |
| --- | ------------------------------------- | -------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| 0   | Mirror: your pain points              | 4 min    | Slide only                                                                    | Sets the frame                                    |
| 1   | Speed 1: a Simple task through `/rpi` | 6 min    | `RPI Agent` difficulty classification, no artifacts                           | Cost; slower than manual; which tasks to delegate |
| 2   | Speed 2: research the wishlist        | 10 min   | `Task Researcher`, `Researcher Subagent`, research document                   | Misunderstands; lacks context; invents APIs       |
| 3   | Plan and validate                     | 8 min    | `Task Planner`, `Plan Validator`, plan and planning log                       | Ignores conventions; scope                        |
| 4   | Implement one phase, not the feature  | 10 min   | `Task Implementor`, `Phase Implementor`, changes log, Session 1 hooks         | Changes more than expected; too large to review   |
| 5   | Review and ship                       | 8 min    | `Task Reviewer`, `RPI Validator`, `Implementation Validator`, `/pull-request` | Reviewing code; subtle defects                    |
| 6   | Make it yours                         | 8 min    | `Prompt Builder`, `Memory`, Copilot CLI plugin                                | Conventions; nested instructions; non-VS Code     |
| 7   | Delegation ladder and Q&A             | 6 min    | Difficulty table as takeaway                                                  | Which tasks to delegate; cost                     |

Segments 0 to 3 carry the story from small task to validated plan. Segments 4 to 7 cover execution, review, and customization.

## HVE Core Cheat Sheet

Read this before rehearsing. Every name below is an actual agent, prompt or path in HVE Core 3.3.

### Agents and prompts

| Chat agent         | Slash prompt                   | Produces                                                                      | Handoff button it shows                                          |
| ------------------ | ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `RPI Agent`        | `/rpi task=...`                | Whatever the difficulty requires, from a direct edit to the full artifact set | `1️⃣` `2️⃣` `3️⃣` `▶️ All` `🔄 Suggest` `💾 Save`                   |
| `Task Researcher`  | `/task-research`               | `.copilot-tracking/research/{{date}}/{{topic}}-research.md`                   | `📋 Create Plan`, `🔬 Deeper Research`                           |
| `Task Planner`     | `/task-plan`                   | Plan, details and planning log                                                | `⚡ Implement`                                                   |
| `Task Implementor` | `/task-implement`              | Changes log, code                                                             | `✅ Review`                                                      |
| `Task Reviewer`    | `/task-review`                 | Review log with verdict                                                       | `🔬 Research More`, `📋 Revise Plan`, `⚡ Implement Immediately` |
| `Prompt Builder`   | `/prompt-build`                | Instruction, prompt, agent or skill files                                     | none                                                             |
| `Memory`           | `/checkpoint`                  | `.copilot-tracking/memory/{{date}}/{{topic}}-memory.md`                       | `🚀 Continue with RPI`                                           |
| `PR Review`        | none                           | Structured PR review                                                          | none                                                             |
| `agent` (built-in) | `/git-commit`, `/pull-request` | Conventional commit, `.copilot-tracking/pr/pr.md`                             | none                                                             |

### Artifact paths

All durable state lives under `.copilot-tracking/` at the repo root.

| Artifact               | Path                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| Research document      | `.copilot-tracking/research/{{YYYY-MM-DD}}/{{topic}}-research.md`           |
| Subagent research      | `.copilot-tracking/research/subagents/{{YYYY-MM-DD}}/{{topic}}-research.md` |
| Implementation plan    | `.copilot-tracking/plans/{{YYYY-MM-DD}}/{{task}}-plan.instructions.md`      |
| Implementation details | `.copilot-tracking/details/{{YYYY-MM-DD}}/{{task}}-details.md`              |
| Planning log           | `.copilot-tracking/plans/logs/{{YYYY-MM-DD}}/{{task}}-log.md`               |
| Changes log            | `.copilot-tracking/changes/{{YYYY-MM-DD}}/{{task}}-changes.md`              |
| Review log             | `.copilot-tracking/reviews/{{YYYY-MM-DD}}/{{plan-name}}-plan-review.md`     |
| PR description         | `.copilot-tracking/pr/pr.md`                                                |
| Memory                 | `.copilot-tracking/memory/{{YYYY-MM-DD}}/{{topic}}-memory.md`               |

### Difficulty levels

Taken from `rpi-agent.agent.md`. This table is the closing slide.

| Difficulty  | Signals                                                               | Execution model                                                   |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Simple      | Small, localized edits; low ambiguity; familiar patterns              | Direct edit in agent context, no artifacts                        |
| Medium      | A few related files; some investigation; clear path after inspection  | Direct edit in agent context unless findings raise the difficulty |
| Medium-hard | Cross-cutting; competing approaches; meaningful risk                  | Research and plan artifacts; subagents where they reduce risk     |
| Challenging | Broad scope; unclear architecture; many dependencies; multiple phases | Document-backed research and planning plus subagents by default   |

## Segment 0 - Mirror (4 min)

Show the survey table. Read three quotes aloud, anonymized unless the respondent agreed otherwise:

- "It tries to get access to directories on my PC that it's not supposed to read and I spend time denying access."
- "Too many permission prompts, more hooks and nested instructions."
- "Generated changes are too large to review confidently."

Talking points:

- Today is built from your answers. Every segment names the concern it addresses.
- HVE Core's principle is "AI carries the rules, humans keep the judgment." We will show what that means in practice.
- HVE Core is Microsoft's opinionated reference, not a product to install everywhere. Treat it as a source of patterns you can copy into your own `.github/`.

## Segment 1 - Speed 1: a Simple Task (6 min)

`ProductPage.tsx` already shows "Out of stock" and disables the button when stock is zero. `ProductCard.tsx` does not. The task is small, has an existing pattern to mirror, and touches at most three files.

### Prompt

Select the `RPI Agent` in the Chat view.

```text
/rpi task=Show an "Out of stock" label on ProductCard and disable its Add to Cart button when stock is 0. Mirror the pattern already used in apps/web/src/pages/ProductPage.tsx. Add a test.
```

### Expected flow

1. The agent states its difficulty assessment in the first response (Simple or Medium).
2. No files appear under `.copilot-tracking/`.
3. It reads `ProductPage.tsx`, edits `ProductCard.tsx`, passes `stock` through from `HomePage.tsx`, adds a case to `ProductCard.test.tsx`.
4. The Prettier hook fires on each edit. The Stop hook runs `npm test` before the agent finishes.
5. The `5: Discover` phase suggests follow-up items with numbered `1️⃣ 2️⃣ 3️⃣` buttons. Do not click them; point at them.

### Narration cues

- "First thing it did was decide how hard this is. Simple means no research file, no plan file, no subagents."
- "Same hooks from last session. Formatting after the edit, tests before it is allowed to stop."
- "Those numbered buttons are the same `handoffs:` mechanism we saw in Demo 3c. Each one sends `/rpi continue=1`, a fixed prompt."

### Talking points

- Ceremony is a cost. The framework spends it only when the task warrants it. That is the answer to "iterating takes longer than doing it manually."
- This is where six of you said cost blocks agentic work. A Simple task through RPI is one agent turn, not five.

## Segment 2 - Speed 2: Research the Wishlist (10 min)

The wishlist is cross-cutting: Prisma schema, shared types, API routes with auth, React hook and page. It is Medium-hard by the table. We drive the phases manually so the audience sees each artifact appear rather than trusting an autonomous run.

### Prompt

Select the `Task Researcher` agent.

```text
/task-research topic=Wishlist feature for the Zava storefront. Authenticated customers can add a product to their wishlist, remove it, and view their wishlist page. Product cards show whether the item is already wishlisted. Start from GitHub issue #2 and the TODO(copilot) comments in apps/api/prisma/schema.prisma. Follow the conventions in .github/copilot-instructions.md and the path instructions for apps/api and apps/web.
```

### Expected flow

1. `Task Researcher` delegates to `Researcher Subagent`, in parallel where possible: one run for repository conventions, one for the codebase.
2. Subagent outputs land in `.copilot-tracking/research/subagents/{{date}}/`.
3. The consolidated document appears at `.copilot-tracking/research/{{date}}/wishlist-research.md`.
4. When it finishes, the `📋 Create Plan` button appears.

### What to look for in the research document

Open it and scroll with the audience. Point out:

- Discovered instruction files listed by path (`copilot-instructions.md`, `api.instructions.md`, `web.instructions.md`).
- The price-in-cents rule and `formatPrice()` from `@zava/shared`, picked up from the repo instructions rather than guessed.
- The three Prisma schema files (`schema.prisma`, `schema.test.prisma`, `schema.docker.prisma`). If the research notes that all three must change together, celebrate it. If it misses that, note it and say "hold that thought for segment 6."
- One recommended approach with alternatives listed and rejected, for example a dedicated `Wishlist` model with a `@@unique([userId, productId])` constraint versus a flag on `CartItem`.
- Concrete file references with line numbers.

### Narration cues

- "Nothing has been edited yet. This is the phase most of us skip when we type straight into the chat box."
- "Two subagents are running in parallel. One is reading our instructions, one is reading our code. Neither has permission to change anything."
- "Look at the alternatives section. The agent considered a second design and wrote down why it rejected it. That is where 'invents APIs' gets caught."

### Talking points

- Seven of you said the agent misunderstands the task and six said it lacks context. Research is the fix: the agent has to write down what it found before it is allowed to plan.
- The research file is markdown in the repo. Anyone can review it, comment on it, or correct it before a line of code is written.
- The `Task Researcher` can only write inside `.copilot-tracking/research/`. That is a permission boundary, not a suggestion.

## Segment 3 - Plan and Validate (8 min)

### Action

Click `📋 Create Plan`. This sends `/task-plan` to the `Task Planner` agent.

### Expected flow

1. Three files appear: the plan at `.copilot-tracking/plans/{{date}}/wishlist-plan.instructions.md`, the details at `.copilot-tracking/details/{{date}}/wishlist-details.md`, and the planning log at `.copilot-tracking/plans/logs/{{date}}/wishlist-log.md`.
2. `Task Planner` runs `Plan Validator`, which fills the Discrepancy Log section of the planning log.
3. The `⚡ Implement` button appears.

### Live review of the plan

Open the plan file. Walk through:

- The User Requests section, which restates each requirement with its source. Check it against what you typed in segment 2.
- Phases. Expect something like Phase 1 for schema and shared types, Phase 2 for API routes and tests, Phase 3 for the web hook, card toggle and page. Point at the `<!-- parallelizable: true/false -->` markers.
- The Dependencies section listing instruction files the implementor must read.
- The Discrepancy Log in the planning log. Read one entry aloud.

Then change the scope live. Type into the same `Task Planner` session:

```text
Drop the wishlist page from this plan. Keep the toggle on ProductCard and the API. The page goes in a later iteration.
```

Show the planner updating the plan and recording the deviation in the planning log.

### Narration cues

- "The plan file ends in `.instructions.md`. That is deliberate. When implementation starts, the plan is loaded as an instruction, so the implementor cannot quietly wander off it."
- "The validator compared the plan to the research and logged where they disagree. That is a second opinion before any code exists."
- "I just changed scope in one sentence. The log now says the page was removed and why."

### Talking points

- Five of you said the agent ignores architecture or conventions. The plan lists the instruction files by name and the implementor is told to read them.
- Six of you said it changes more than expected. Scope is now a reviewed document, not an intention in your head.
- The human approves the plan. Nothing in this framework starts implementation without that click.

### Checkpoint

Commit `.copilot-tracking/` and push to `live-demo`. No deployment this session. While the push completes, recap the three artifacts and take one question before starting segment 4.

## Segment 4 - Implement One Phase (10 min)

### Action

Instead of clicking `⚡ Implement`, which runs every phase, type the prompt with the phase stop control so the audience sees one phase at a time:

```text
/task-implement phaseStop=true
```

The `Task Implementor` locates the most recent plan in `.copilot-tracking/plans/` automatically.

### Expected flow

1. `Task Implementor` reads the plan and details, then runs `Phase Implementor` as a subagent for Phase 1 only.
2. `Phase Implementor` is given the plan path, details line ranges, research path, matching instruction files, and validation commands (`npm test`).
3. Phase 1 edits land: `Wishlist` model in `schema.prisma`, the mirrored model in `schema.test.prisma` and `schema.docker.prisma`, a `Wishlist` type in `packages/shared/src/types/`.
4. The Prettier hook fires on each edit. The Stop hook runs tests.
5. The changes log appears at `.copilot-tracking/changes/{{date}}/wishlist-changes.md` with an added, modified and removed breakdown.
6. The agent pauses and summarizes Phase 1. Continue to Phase 2 if time allows; otherwise stop here and say the remaining phases are on the `session2-prepared` branch.

### Narration cues

- "One phase. Three files. That is a diff I can read in the time it takes to say this sentence."
- "The subagent got the plan, the details for this phase, and the instruction files matched by `applyTo`. It did not get the whole conversation."
- "Changes log is updating as it goes. If my laptop died now, the next person picks up from that file."

### If Phase 1 misses a schema file

This is the bug we hit while preparing this session: `schema.prisma` gained a `Review` model in Session 1 and `schema.test.prisma` did not, so every API test failed on a fresh clone. If the implementor updates only one schema, do not fix it by hand. Let the Stop hook catch it when tests fail, let the agent self-correct, and tell the audience you will make this impossible to repeat in segment 6.

### Talking points

- Three of you said generated changes are too large to review. Phases are the unit of review. Each one is a small diff plus a log entry.
- Hooks and instructions compose. Session 1 hooks still enforce format, secrets and tests. HVE Core adds the plan as an instruction on top.

## Segment 5 - Review and Ship (8 min)

### Action

Click `✅ Review`. This sends `/task-review` to the `Task Reviewer` agent.

### Expected flow

1. `Task Reviewer` runs `RPI Validator` once per completed plan phase, in parallel, checking the changes log against the plan, planning log and research.
2. It runs `Implementation Validator` for code quality against the instruction files matched by `applyTo`.
3. The review log appears at `.copilot-tracking/reviews/{{date}}/wishlist-plan-review.md` with a fulfillment table, validation command output, and an overall status of Complete, Iterate or Escalate.
4. Three buttons appear: `🔬 Research More`, `📋 Revise Plan`, `⚡ Implement Immediately`.

Open the review log. Read the verdict and one finding aloud. If the status is Iterate, click `⚡ Implement Immediately` and let it address the finding; the fixed prompt is `/task-implement Address the findings found in the review document`.

### Ship it

Switch to the built-in `agent` and run the two prompts in order:

```text
/git-commit
```

```text
/pull-request createPullRequest=true
```

The first follows `commit-message.instructions.md` and produces a conventional commit such as `feat(api): add wishlist model and shared types`. The second uses the `pr-reference` skill to diff against `origin/main`, runs parallel subagent review, writes `.copilot-tracking/pr/pr.md`, and opens the PR through the GitHub MCP tools.

If time allows, open the PR in the browser and run the `PR Review` agent against it.

### Narration cues

- "Two validators ran at the same time. One asks 'did we do what the plan said', the other asks 'is what we did any good'. Different questions, different subagents."
- "The verdict is a word: Complete, Iterate or Escalate. Escalate means a human decision is needed. The agent does not guess."
- "The PR description was generated from the diff, not from memory of the conversation."

### Talking points

- Reviewing code was one of the top things you want Copilot to help with. Review here has inputs: plan, research, changes log. The agent is checking work against a specification, not vibes.
- The review log is the audit trail. Six months from now you can read why a finding was accepted or deferred.

## Segment 6 - Make It Yours (8 min)

Three short actions that turn today's session into things the audience can apply on Monday.

### 6a. Turn a real bug into an instruction

Select the `Prompt Builder` agent.

```text
/prompt-build Create .github/instructions/prisma-schema.instructions.md with applyTo apps/api/prisma/**. Any model or field change in schema.prisma must be mirrored in schema.test.prisma and schema.docker.prisma in the same change, and npm test must be run afterward. Keep it short and follow the existing style of api.instructions.md.
```

Open the generated file. Show the frontmatter and the rule. Point out that `Prompt Builder` follows `prompt-builder.instructions.md`, so the output meets HVE Core's own authoring standard.

Narration: "This morning a fresh clone failed 29 tests because of exactly this drift. Now the rule travels with the repo. Every agent, every session, every developer."

### 6b. Save the session

Select the `Memory` agent.

```text
/checkpoint
```

Show the memory file under `.copilot-tracking/memory/{{date}}/`. Point out the `🚀 Continue with RPI` button. Narration: "If you close VS Code now, the next session starts from this file, not from zero."

### 6c. Take it outside VS Code

Open a terminal. Register the plugin marketplace and install:

```bash
copilot plugin marketplace add microsoft/hve-core
copilot plugin install hve-core@hve-core
```

Start an interactive `copilot` session and show that `/rpi` and `/task-research` are available. Narration for the JetBrains, Neovim and Delphi attendees: "Everything you saw today is markdown in `.github/` and `.copilot-tracking/`. The agents run from the CLI with the same files. The IDE was the window, not the engine."

### Talking points

- Andersson asked for more hooks and nested instructions. HVE Core ships around 80 instruction files and a builder that writes them to a standard. Copy the ones you need; do not install the world.
- Two of you said permission prompts interrupt the flow. Instructions and hooks that carry the rules mean fewer things the agent has to ask about. Scoped `--allow-tool` in the CLI does the rest.
- Nothing here is Copilot-specific. `.copilot-tracking/` artifacts and instruction files are plain markdown. The Claude Code users in the room can steal every pattern.

## Segment 7 - Delegation Ladder and Q&A (6 min)

Show the difficulty table from the cheat sheet as the closing slide, with one Zava example per row:

| Difficulty  | Zava example                                  | What you do                                             |
| ----------- | --------------------------------------------- | ------------------------------------------------------- |
| Simple      | Out of stock label on `ProductCard`           | `/rpi`, review the diff, done                           |
| Medium      | Add a review-count filter to the products API | `/rpi`, expect a short in-context plan, review the diff |
| Medium-hard | Wishlist across schema, API and web           | `Task Researcher` to `Task Reviewer`, approve the plan  |
| Challenging | Replace JWT auth with an identity provider    | Same chain, expect iteration, budget for research runs  |

Two rules to leave with:

- Match the ceremony to the risk. Artifacts are for when a mistake is expensive to find late.
- Approve the plan, not the diff. If you only review code, you review too late.

Then Q&A.

## Fallbacks

### Live latency

Research plus planning for the wishlist takes six to ten minutes of agent time. Rehearse it to know your real number. Before the session, run segments 2 and 3 on a clean checkout and commit the resulting `.copilot-tracking/` folder to `session2-prepared`. Run live, but if the research phase passes five minutes, switch to the prepared branch and narrate the artifacts instead.

### Handoff buttons do not render

Verify chips render on the presenter machine and Copilot version. If they do not, type the slash prompts by hand: `/task-plan`, `/task-implement phaseStop=true`, `/task-review`. The workflow is identical; only the button is missing.

### Subagent tools disabled

`RPI Agent` and the Task agents require `runSubagent` or `task` to be enabled. They print a warning if not. Check chat tool settings during rehearsal.

### Agent produces a wrong classification

If `/rpi` classifies the Simple task as Medium-hard and starts writing research files, let it. Say "it decided this was riskier than I thought; that is the framework being cautious, and I can override with a follow-up prompt." Then tell it to proceed without artifacts.

## Preparation Checklist

### Environment

- Install the HVE Core extension and reload VS Code.
- Confirm `RPI Agent`, `Task Researcher`, `Task Planner`, `Task Implementor`, `Task Reviewer`, `Prompt Builder` and `Memory` appear in the agent picker.
- Confirm `runSubagent` is enabled in chat tools.
- Pull `live-demo`, run `npm install`, `npx prisma generate` in `apps/api`, then `npm test`. Expect 38 passing.
- Verify hooks in `.github/hooks/quality.json` still fire on a trivial edit.
- Install Copilot CLI and run the two `copilot plugin` commands once so the marketplace is cached.
- Add `.copilot-tracking/pr/subagents/` to `.gitignore` if not already present; keep the rest of `.copilot-tracking/` committed for the demo.

### Rehearsal

- Rehearse segment 1 three times. Note the difficulty the agent picks each time.
- Rehearse segments 2 and 3 end to end and record the wall-clock time.
- Create `session2-prepared` from `live-demo` with the research, plan, details and log artifacts committed.
- Build the survey slide and the closing difficulty slide.
- Rehearse segment 4 with `phaseStop=true` and confirm Phase 1 touches all three Prisma schema files.
- Rehearse segment 5 through to a real draft PR on a throwaway branch, then close it.
- Rehearse the `/prompt-build` prompt and keep the generated file as a fallback.
- Confirm GitHub MCP tools are authenticated for `/pull-request createPullRequest=true`.

### On the day

- Keep browser tabs open to the repo, issue #2, the PR list, and the HVE Core docs at `https://microsoft.github.io/hve-core/`.
- Record fallback videos for segments 2, 4 and 5.

## Verification

- Segment 1 completes with no files under `.copilot-tracking/` and tests green.
- Segment 2 produces a research document that lists the three instruction files and the three Prisma schemas.
- Segment 3 produces plan, details and planning log with a populated Discrepancy Log; the live scope change is recorded.
- Segment 4 stops after Phase 1 with a changes log and a diff of no more than four files.
- Segment 5 produces a review log with a verdict and a draft PR with a generated description.
- Segment 6 produces a new instruction file, a memory file, and a CLI session with `/rpi` available.
- The `session2-prepared` branch contains every artifact above and can be shown if any live step fails.

## Decisions

Confirm or change these before the session; the guide assumes them.

- No push-to-deploy this session; the story does not need a running app.
- Wishlist is the Medium-hard feature. The Simple task is the out-of-stock label on `ProductCard`.
- The wishlist page is dropped from scope live in segment 3 to demonstrate plan revision. The API and card toggle remain.
- English throughout.
- Survey quotes are anonymized on the slide. Name a respondent only with prior consent.
- The Azure Boards to cloud agent demo from Session 1 is held as a 6-minute bonus if segments run short; it is not on the main agenda.
- HVE Core is presented as a source of patterns to copy into `.github/`, following Microsoft's own guidance, not as a platform to adopt wholesale.

## Audience Handout

- `main` remains the clean starting point. `live-demo` contains Session 1 and Session 2 changes, including `.copilot-tracking/`.
- Local setup: `npm install`, `npm run db:push`, `npm run db:seed`, `npm run dev`.
- Install HVE Core from the VS Code Marketplace (`ise-hve-essentials.hve-core`) or as a Copilot CLI plugin with the two commands from segment 6c.
- Start with `/rpi` on something Simple. Move to `/task-research` when a mistake would be expensive.
- Read `.github/instructions/prisma-schema.instructions.md` as an example of turning a real incident into a rule the agent carries for you.
