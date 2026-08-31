# Demo — Azure Boards → GitHub Copilot Cloud Agent

> **Status:** Standalone / not yet integrated into `DEMO_GUIDE.md`. Slots in after Demo 5.
> **Presenter:** A · **Duration:** ~6 min
> **SDLC phase:** Planning/Tracking → Implementation · **Agent type:** Cloud (Copilot coding agent) · **Trigger surface:** Azure DevOps Boards
> **Independence note:** This demo stands alone. It does not depend on the review system, admin panel, or any code built in Demos 1–5 — the work item describes a small, self-contained feature the cloud agent implements from scratch.

## What we're demonstrating

The hand-off point moves _out of the IDE and into the work-tracking tool_. A product owner or dev, working in Azure Boards, delegates a user story straight to the GitHub Copilot cloud agent — **"Create a pull request with Copilot"** — without opening an editor. The agent reads the work item, implements the change on a branch, and opens a **draft PR linked back to the work item**. Takeaway: the agent meets the team where the work already lives.

## Prerequisites (set up before the session)

- The **Azure Boards GitHub App** is installed on the org and the `zava-storefront` repo is authorized.
- The repo has the **Copilot cloud/coding agent enabled**.
- The presenter's GitHub account has Copilot on a paid plan.
- The user story below already exists in the ADO board (created ahead of time).

## Flow

1. Open the Azure Boards backlog and select the pre-created user story (contents below).
2. Read the story out loud so the audience sees the context the agent will consume — emphasize that the agent reads the **Description text and the last ~50 comments**, so the story body is the "prompt."
3. Click the **Copilot** icon on the work item → **Create a pull request with Copilot**.
4. In the dialog:
   - **GitHub repository** → select `zava-storefront`.
   - (Optional) leave the base branch, or point it at `live-demo`.
   - (Optional) add an extra instruction in the box — e.g. "Follow the existing component conventions in `apps/web`."
   - Click **Create**.
5. Switch to GitHub. Show the **draft PR** the agent opened, the branch it created, and the back-link to the ADO work item. Walk the diff.
6. Tie it back: this is the same cloud agent from the Cloud Agent demo (issue-driven), but triggered from the project-management layer instead of a GitHub Issue.

## Talking points

- **The delegation surface matters.** Same cloud agent, different entry point — a PM in Azure Boards can kick off implementation without touching GitHub or an IDE.
- **The work item _is_ the prompt.** Quality of the PR tracks quality of the story. A vague story yields a vague PR — good acceptance criteria pay off directly.
- **Context captured is public.** The story text/comments get copied into the PR and are visible to anyone with repo access — don't put secrets in work items.
- **Draft PR, human in the loop.** The agent opens a _draft_ — review, request changes, or take it over locally. Same review gate as any other cloud-agent PR.
- **Traceability for free.** The PR links back to the work item, closing the loop from plan → tracked story → code → review.

## Narration cues _(while the agent runs — it's a cloud round-trip, expect a short wait)_

- "Notice we never opened VS Code — this whole hand-off is from the board."
- "The agent is now cloning, branching, and reading the story as its brief."
- Flip to GitHub when the draft PR appears: "There's the PR, linked straight back to the story — and it's a draft, so nothing merges without us."

## Content to add manually to the ADO user story

The docs say the agent "will capture content from text fields (such as the description and reproduction steps), along with the last 50 comments." They give only those examples and don't explicitly list which other fields are or aren't read — so the safe move is to put all the meaningful context in the **Description** field (and optionally repeat criteria as a comment) rather than relying on a separate Acceptance Criteria field being picked up. Keep the feature self-contained.

### Title

```
Add a global site footer to the Zava storefront
```

### Description _(paste into the Description rich-text field)_

```
As a shopper, I want a consistent footer on every page of the Zava storefront
so that I can reach key links and see brand/legal info from anywhere on the site.

Context
- This is a self-contained UI addition. It does not depend on cart, reviews, admin, or auth.
- Frontend lives in apps/web (React + Vite). Follow the existing component and styling
  conventions already used in apps/web/src (check how the header/layout components are built
  and reuse the same patterns and styling approach).

Scope
- Add a reusable Footer component and render it on all pages via the shared layout.
- Footer contents:
  - Left: "© 2026 Zava" brand line.
  - Center: navigation links — Home (/), Products (/products), About (/about).
    The /about route may not exist yet; link to it anyway (or a "#" placeholder if routing
    would break the build).
  - Right: three social placeholder links (Twitter/X, Instagram, GitHub) as text or icons.
- Footer must be responsive: links stack vertically on narrow (mobile) viewports and sit in a
  single row on desktop.

Acceptance criteria
- [ ] A Footer component exists and is rendered on every page through the shared layout,
      not copy-pasted per page.
- [ ] Brand line, three nav links, and three social links are present.
- [ ] Layout is responsive (stacked on mobile, single row on desktop).
- [ ] Styling matches the existing storefront look (reuses current styling approach, no new
      CSS framework introduced).
- [ ] `npm run build` succeeds and no existing tests break.
- [ ] No hard-coded secrets or external tracking scripts.

Out of scope
- Building the /about page itself.
- Backend/API changes.
```

### Optional comment to add on the work item _(the agent also reads comments)_

```
Implementation hint: put the component at apps/web/src/components/Footer.tsx and wire it into
the shared layout so it appears on all routes. Match the styling of the existing header.
```

## Reference

- [Integrating GitHub Copilot Cloud Agent with Azure Boards](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/integrate-cloud-agent-with-azure-boards)
