# Demo Guide — AI in SDLC with GitHub Copilot Agents

**Session**: 55 min  
**Audience**: Hands-on developers  
**Presenters**: Presenter A + Presenter B  
**Repo**: `zava-storefront`  
**Tech stack**: TypeScript monorepo, Express, Prisma, React, Vite, Vitest

## Session Goal

Demonstrate GitHub Copilot agents across the full SDLC using a realistic e-commerce codebase with enough existing functionality that the live demos extend real code instead of scaffolding from zero.

## Pre-seeded Demo Assets

- Working product listing + products API
- Basic cart flow
- JWT authentication
- 25 passing tests across API and web
- Admin layout stub
- Email service stub
- Custom agents in `.github/agents/`
- Workspace hooks in `.github/hooks/quality.json` (Prettier, dangerous-command block, secret scanner, test gate)

## Session Structure

| #   | Demo                                                                                                       | Presenter | Duration | SDLC Phase                               | Agent Type                           |
| --- | ---------------------------------------------------------------------------------------------------------- | --------- | -------- | ---------------------------------------- | ------------------------------------ |
| —   | Opening: agent types overview, agent loop concept, permission levels                                       | A         | 5 min    | Concepts                                 | —                                    |
| 1   | Plan Agent: design a review & rating system                                                                | A         | 7 min    | Requirements → Design                    | Local — Plan                         |
| 2   | Agent Loop: hand off plan to Agent, build the feature live                                                 | A         | 10 min   | Implementation                           | Local — Agent                        |
| 3   | Custom Agents + Hooks + Subagents: TDD workflow with Red/Green/Refactor subagents, automated quality gates | B         | 10 min   | Implementation + Quality                 | Custom agents, Hooks, Subagents      |
| 4   | Ask Agent: codebase Q&A + Security Review                                                                  | B         | 5 min    | Knowledge / Onboarding + Security Review | Local — Ask, Custom — `SE: Security` |
| 5   | Copilot CLI: background implementation of admin panel + parallel email notifications                       | B         | 8 min    | Parallel Development                     | Copilot CLI (Background)             |
| 6   | Cloud Agent: assign GitHub Issue to Copilot, hand off Plan → Cloud, TODO comment assignment                | A         | 8 min    | Code Review + Collaboration              | Cloud                                |
| —   | Closing: SDLC recap, call to action                                                                        | Both      | 2 min    | Wrap-up                                  | —                                    |

Presenter A owns the flow arc: plan → implement → collaborate.  
Presenter B owns the advanced toolkit: custom agents, quality gates, background work, and Q&A.

## Deployment Workflow

The app is containerized and deployed from the `live-demo` branch. The `main` branch stays clean so the audience can clone it and run locally.

- **Branch**: `live-demo` — auto-deploys on push via GitHub Actions
- **Pipeline**: push → GitHub Actions builds API + Web Docker images → pushes to ghcr.io → deploys to hosting platform
- **Deploy time**: ~2 minutes — use this as a natural Q&A or recap moment during presenter handoffs
- **Images**: `ghcr.io/<owner>/zava-storefront/api` and `ghcr.io/<owner>/zava-storefront/web`

### Presenter Handoff Protocol

Both presenters work against the same deployed app. When handing off, the outgoing presenter must push their changes so the incoming presenter has them both locally and on the deployed instance.

1. **Commit & push** to `live-demo`
2. **Wait for deploy** (~2 min) — fill with audience Q&A or a recap of what was just built
3. **Incoming presenter pulls** `live-demo` and verifies the deployed app reflects the changes
4. **Continue** with the next demo

## Demo 1 — Plan Agent (Presenter A, 7 min)

**Prompt**

> We need to add a product review & rating system to the Zava storefront. Customers can rate 1-5 stars, write text reviews, see aggregate ratings on product cards. Reviews need moderation before publishing.

**Flow**

1. Select the Plan agent in the Chat view.
2. Let the agent explore the codebase and identify the relevant files: Prisma schema, product routes, shared types, product UI, and product detail page.
3. Answer clarifying questions if the agent asks about moderation rules, anonymous reviews, or aggregate display.
4. Review the generated plan and highlight schema changes, API endpoints, UI components, moderation workflow, and verification steps.

**Talking points**

- Plan before you build.
- The agent researches the actual codebase before producing a plan.
- Spec driven development (is it dead)
- Show instruction files and talk about splitting them
- A useful plan becomes an asset you can hand off to implementation or the cloud.

## Demo 2 — Agent Loop (Presenter A, 10 min)

**Flow**

1. Hand off from Plan to Agent with **Start Implementation**.
2. Show the loop in real time: read plan → edit shared types → add API route → run build/tests → self-correct type errors → add a React component.
3. Pause on inline diffs and checkpoints.
4. Show the tools panel so the audience can see the tool usage pattern.

**Talking points**

- The agent loop is iterative: plan → act → observe → adapt.
- Copilot uses repo context, tool feedback, and errors to self-correct.
- This is not generate-and-paste; it is execution with feedback.
- Model choice is part of directing the agent — spend your best reasoning model on the plan you'll reuse, your fastest model on the build loop. Pick deliberately per phase.

**Narration cues** _(keep talking while the loop runs — name what you see)_

- As each tool fires, say it out loud: "now it's reading the schema… now editing shared types… now running the build."
- Call out the first type/test error and the self-correction: "it caught its own mistake and is fixing it — no human in the loop."
- On each diff/checkpoint, say what changed and why before accepting it.
- Tie it back to the plan: "this step maps to the API-endpoint section of the plan from Demo 1."
- If the loop runs long, narrate the tools panel: read → edit → run → observe, repeating.

### Handoff A → B

Presenter A commits the review system and pushes to `live-demo`. While the deploy runs (~2 min), recap what the agent built and take audience questions. Presenter B pulls `live-demo` and verifies the deployed app shows the new review features before starting Demo 3.

## Demo 3 — Custom Agents + Hooks + Subagents (Presenter B, 10 min)

### 3a. TDD workflow with subagents

Show `.github/agents/tdd.agent.md` and explain the Red → Green → Refactor orchestration.

**Prompt**

> @tdd Add input validation for review text — min 10 chars, max 2000, no HTML tags.

**Expected flow**

1. Red subagent writes a failing test.
2. Green subagent implements the minimum validation.
3. Refactor subagent cleans up.
4. Tool calls appear as nested, collapsible subagent activity in chat.

### 3b. Hooks and quality gates

Show `.github/hooks/quality.json` and explain the four hooks:

- `PostToolUse`: runs Prettier after file edits
- `PostToolUse`: Make sure we not check in secrets 
- `PreToolUse`: blocks dangerous terminal commands (rm -)
- `Stop`: prevents the agent from finishing before tests pass

**Live action**

1. Trigger a normal edit so the formatting hook runs.
2. Try a clearly dangerous terminal command to show the block.
3. Ask the agent to hard-code the JWT secret in `apps/api/src/middleware/auth.ts` so logins work — the secret scanner denies the edit and the agent pivots to `process.env.JWT_SECRET`.
> Add this x40wvWZGyIlpjYbVbDSfSHB8nCCTKyul jwt signing key to the settings hardcoded
4. Let the session hit the Stop hook and continue until tests pass.

**Talking point**

Instructions guide. Hooks enforce. Non deterministic LLM, The secret scanner bridges into Demo 4 — it is a fast, best-effort guardrail, while GitHub Advanced Security push protection is the auditable backstop no one can quietly skip.

### 3c. Explicit handoffs vs. free-text delegation

After the TDD cycle from 3a completes, point out the buttons that appear at the bottom of the response: **🔁 Next criterion · 🔍 Review · 🔒 Security check**. Handoffs are one-at-a-time — clicking one transitions into that agent and starts a new turn, so we chain them into a sequence rather than clicking several at once.

**Live action**

1. Click **🔍 Review** — routes to the `reviewer` agent with a fixed prompt, no typing. It produces its full review: numbered findings by file with 🔴/🟡/🟢 severity and a verdict.
2. When the review finishes, a **🔒 Security check** button appears below it — this handoff is declared in `reviewer.agent.md`, chaining the workflow onward.
3. Click **🔒 Security check** — note it pre-fills the prompt and waits for confirmation (`send: false`) instead of auto-dispatching, so the audience can read the review first.
4. Open `tdd.agent.md` and `reviewer.agent.md` and show the `handoffs:` YAML next to the prose workflow steps.

**Talking point**

Two ways to move between agents. The Red → Green → Refactor steps are _free-text handoffs_ — the model reads the workflow and decides when to delegate; adaptive, invisible, non-deterministic. The buttons are the `handoffs:` _attribute_ — the harness renders them, the prompt sent is fixed, and the user stays in control of the branch point. Because each handoff is a single transition, chaining them (tdd → review → security) is how you build a guided, multi-step workflow.

Rule of thumb: **free-text when the model should judge the flow; the attribute when a human should pick the next step or you need the routing to be repeatable and auditable.** They compose — the same agent uses both.

## Demo 4 — Ask Agent (Presenter B, 5 min)

**Prompt 1** _(Ask agent)_ (Skill )

> How does the cart system work? Walk me through the data flow from add-to-cart click to API persistence. 

**Prompt 2** _(`SE: Security` custom agent)_

> What are the security considerations for the review system we just built?

**Talking points**

- Ask mode behaves like an always-available senior developer who reads the code.
- Good answers follow imports, routes, shared types, and data flow.
- Switch to the `SE: Security` custom agent for Prompt 2 — it applies OWASP Top 10 and Zero Trust framing to the actual implementation rather than giving generic advice.
- Security analysis is more useful when it references the real implementation.

## Demo 5 — Copilot CLI (Presenter B, 8 min)

### What we are demonstrating

The key feature is **running two Copilot CLI agents in parallel**, each in its own **git worktree**, so they edit the same repo concurrently without conflicting. The audience takeaway: independent tasks can be farmed out to separate agents while the developer keeps working.

### Terminal setup

You need **two terminal windows** (split panes in VS Code) plus an optional third for your own work. All are visible to the audience.

| Terminal                    | Purpose                                                     |
| --------------------------- | ----------------------------------------------------------- |
| **Terminal 1**              | Worktree A — admin panel agent                              |
| **Terminal 2**              | Worktree B — email notification agent                       |
| **Terminal 3** _(optional)_ | Main repo — your normal dev work (shows you're not blocked) |

### Step-by-step

1. **Create two git worktrees** so each agent has its own working copy. Run from the main repo:

   ```bash
   git worktree add ../zava-admin-panel -b demo/admin-panel
   git worktree add ../zava-email-notify -b demo/email-notify
   ```
fp
2. **Open two terminal panes** side by side (split-terminal button or ⌘\\).

3. **In Terminal 1**, cd into the first worktree and launch Copilot CLI in programmatic mode with `--yolo` (auto-approve all tools for the demo):

   ```bash
   cd ../zava-admin-panel
   copilot -p "Add a review moderation admin panel — list pending reviews, approve/reject buttons, filter by product." --yolo
   ```

4. **In Terminal 2**, immediately do the same for the second task:

   ```bash
   cd ../zava-email-notify
   copilot -p "Add email notification when a review is approved." --yolo
   ```

5. **While both agents work** (this is the longest unattended wait in the session — ~4–8 min), keep the audience engaged with a planned Terminal-3 task rather than dead air. Switch to Terminal 3 (main repo) and:
   - Run `npm test` and walk through the existing suite while it runs.
   - Make a small visible edit (fix a typo, tweak a label) and let the formatting hook fire — callback to Demo 3.
   - Periodically flip back to Terminals 1 & 2 and narrate each agent's progress ("admin agent is scaffolding the page, email agent is wiring the transport").
   - Use the worktree/parallelism talking points below to fill — they are written to cover this gap.

6. **When each session completes**, review the changes. Each worktree is on its own branch, so you can diff against main:

   ```bash
   # From the main repo
   git diff main..demo/admin-panel
   git diff main..demo/email-notify
   ```

7. **Merge both branches** into your working branch:

   ```bash
   git merge demo/admin-panel
   git merge demo/email-notify
   ```

8. **Clean up** the worktrees (or leave them for the audience to inspect):

   ```bash
   git worktree remove ../zava-admin-panel
   git worktree remove ../zava-email-notify
   ```

### Command reference

| Flag / option                  | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `copilot`                      | Start an interactive session (type prompts inside the TUI) |
| `copilot -p "prompt"`          | Programmatic mode — run one prompt then exit               |
| `--yolo` / `--allow-all-tools` | Auto-approve all tool usage (file edits, shell commands)   |
| `--allow-tool='shell(npm)'`    | Auto-approve only specific tools                           |
| `--resume`                     | Resume a previous session                                  |
| `--continue`                   | Resume the most recent session                             |

### What each session builds

| Session                    | Prompt                                                                                                   | Expected output                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Admin Panel**        | _Add a review moderation admin panel — list pending reviews, approve/reject buttons, filter by product._ | New `AdminReviewsPage.tsx` under `apps/web/src/pages/`, a link in the `AdminLayout` sidebar, and API routes for listing/approving/rejecting reviews with proper auth middleware.                         |
| **B — Email Notification** | _Add email notification when a review is approved._                                                      | An email service module (e.g., `apps/api/src/services/email.ts`), called from the review-approve route, with a stub transport suitable for dev (console log) and an interface ready for a real provider. |

### Talking points

- **Parallel agents work while you keep coding.** Two tasks launched, zero blocking.
- **Parallel sessions need isolation.** Git worktrees give each agent its own working copy — no merge conflicts during execution.
- **Worktrees vs. branches.** A branch is just a pointer; a worktree is a second checked-out working directory sharing one `.git`. That's what lets two agents edit files simultaneously without stepping on each other.
- **When to parallelize vs. sequence.** Independent tasks (admin panel vs. email) are ideal for parallel agents; tasks that touch the same files or depend on each other should run sequentially to avoid merge pain.
- **Cost and token awareness.** Each background agent is a full session burning tokens independently — parallelism trades spend for wall-clock time. Worth it for independent work, wasteful for trivial edits.
- **Review before merging.** Each branch is a self-contained diff you can inspect, cherry-pick, or discard.
- **`--yolo` is a demo convenience** — in real use you'd scope permissions with `--allow-tool` to stay safe.
- **CLI mirrors the VS Code agent experience** — same tool loop (read → edit → run → observe), just driven from the terminal for automation and scripting scenarios.

### Handoff B → A

Presenter B commits and pushes to `live-demo`. While the deploy runs (~2 min), recap the custom agents and CLI workflow. Presenter A pulls `live-demo` and verifies the deployed app before starting Demo 6.

## Demo 6 — Cloud Agent (Presenter A, 8 min)

### 6a. Assign GitHub Issue #1 to Copilot

Use the prewritten issue template for product search. Show Copilot picking up the issue, creating a branch, implementing the work, and opening a PR.

### 6b. Plan → Cloud handoff for wishlist

Start with a new local Plan session for the wishlist feature, then continue in Cloud so the audience sees the local-to-cloud handoff.

### 6c. TODO assignment

Use the inline comment sentinel in the review flow and show how a `TODO(copilot)` comment can be handed off directly from the editor.

**Talking points**

- Cloud agents are a team multiplier.
- Plan locally, execute in the cloud, and review via PR.
- Repo customizations apply to both local and cloud execution.

## Preparation Checklist

### Repository & Local Setup

- Create the GitHub repo and add both presenters as collaborators.
- Run `npm install`.
- Run `npm run db:push` and `npm run db:seed`.
- Start the API with `npm run dev:api`.
- Start the web app with `npm run dev:web`.
- Verify Chat modes are available: Ask, Plan, and Agent.
- Verify hooks are enabled in VS Code.
- Use the seeded GitHub issues: #1 for product search and #2 for wishlist.

### Deployment Setup (Azure)

- Run `infra/deploy.ps1 -GitHubRepo "owner/repo" -SubscriptionId "<your-subscription-id>"` to provision Azure Container Apps, PostgreSQL, and OIDC federation.
- Add the three GitHub secrets output by the script: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
- Create the `live-demo` branch from `main` and push to trigger the first build + deploy.
- Make ghcr.io packages public: GitHub → Packages → each package → Settings → Change visibility.
- Seed the production database: `az containerapp exec -n zava-api -g Zava --command '/bin/sh'` then `RUN_SEED=true npx tsx prisma/seed.ts`.
- Verify the deployed app URL (from deploy script output) is accessible from both presenters' machines.
- Test the full push → deploy → verify cycle at least once from each presenter's machine.
- Share the deployed app URL with both presenters.

### Rehearsal

- Dry-run each demo at least three times.
- Practice the handoff protocol (push → deploy → pull → verify) between presenters.
- Record fallback videos for each live demo.
- Keep browser tabs open to: the deployed app, the repo, GitHub Actions, issues, and PR view.

## Verification

- All 6 demos can be executed sequentially from a clean checkout.
- Plan agent produces a meaningful plan for the review feature.
- Agent loop creates at least one API route and one React component.
- TDD subagent cycle is visibly orchestrated in chat.
- Hooks fire visibly: formatting after edit, secret scanner blocks hard-coded secrets, Stop hook blocks until tests pass.
- Ask agent explains cart flow with correct file references.
- Copilot CLI runs in background with worktree isolation.
- Cloud agent picks up assigned issues and opens a PR.

## Decisions

- Mention third-party agents in the opening only; keep live demos focused on Copilot-native experiences.
- Use Autopilot permission in Demos 2 and 5 for smoother flow.
- Use Default Approvals in Demo 3 so the audience can see approval UX.
- Keep the pre-seeded monorepo; it is the point of the demo.

## Audience Handout

- The `main` branch contains the clean starting point — audience members clone this to run locally.
- Local setup: `npm install` → `npm run db:push` → `npm run db:seed` → `npm run dev`.
- The deployed version URL can be shared for reference, but the audience should use `main` to experiment.
- The `live-demo` branch contains all changes made during the session.

## Further Considerations

- If time allows, add a short MCP bonus demo.
- Consider making the repo public after the session.
- A small opening/closing slide deck helps anchor the narrative.
