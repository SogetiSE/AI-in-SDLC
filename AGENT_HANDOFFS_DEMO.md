# Demo 3 Enhancement — Agent Handoffs

Self-contained notes for adding an **agent handoffs** demo to Demo 3 (Custom Agents +
Hooks + Subagents). Copy this file into your fork and apply the changes below.

## Why

Demo 3a already shows the TDD orchestrator (`tdd.agent.md`) delegating to Red/Green/Refactor
subagents using **free-text handoffs** — prose in the workflow that tells the model when to
delegate. This enhancement adds a contrasting mechanism: the **`handoffs:` attribute**, which
renders explicit, user-clickable buttons for moving between agents. Together they teach *when
to let the model decide* vs. *when to give the user an explicit, repeatable branch point*.

## Two ways to hand off

| | Free-text handoff | `handoffs:` attribute |
|---|---|---|
| Interpreted by | The model | The harness |
| Determinism | Model decides whether/when | Fixed prompt + target |
| User-visible | No (internal reasoning) | Yes (clickable buttons) |
| Appears | During the model's flow | After a response completes |
| Best for | Adaptive delegation ("loop until criteria met") | Discrete user choices, repeatable/auditable routing |

**Rule of thumb:** free-text when the model should judge the flow; the attribute when a human
should pick the next step or you need the routing to be repeatable and auditable. They compose —
the same agent can use both.

## How the `handoffs:` attribute behaves

Declared in the agent file's frontmatter as a list. Each entry supports:

| Field | Role |
|-------|------|
| `label` | Button display text / emoji |
| `agent` | Target agent to switch to |
| `prompt` | Text sent to that agent (fixed, not paraphrased) |
| `send` | `true` = auto-submit; `false` (default) = pre-fill and wait for user confirmation |
| `model` | *(optional)* language model for the handoff |

Runtime behavior (per the VS Code Copilot docs):

- Buttons appear **after a chat response completes**.
- Handoffs are **one at a time** — clicking one transitions into that target agent and starts a
  new turn. The originating response's buttons do not carry over.
- To offer more than one follow-up step, **chain** handoffs: agent A hands off to B, and B's own
  file declares a handoff to C. This is the intended way to build guided, multi-step workflows.

> ⚠️ The docs don't *explicitly* state the old buttons disappear after a transition — it's
> inferred from the transition-based design. Confirm in VS Code before relying on it live, and
> verify your Copilot version actually renders `handoffs:` chips (it's a relatively new field).
> Fallback if chips don't render: show the YAML side-by-side with the prose and make the point
> verbally.

## Changes to apply

### 1. `.github/agents/tdd.agent.md` — add `handoffs:` to the frontmatter

Add the block below alongside the existing `agents:` list. These buttons surface *after* the
Red → Green → Refactor cycle completes.

```yaml
handoffs:
  - label: "🔁 Next criterion"
    agent: tdd
    prompt: "Continue with the next acceptance criterion."
    send: true
  - label: "🔍 Review"
    agent: reviewer
    prompt: "Review the code just produced by the TDD cycle."
    send: true
  - label: "🔒 Security check"
    agent: se-security-reviewer
    prompt: "Security-review the code we just added."
    send: false
```

The contrast is the point: the body's prose ("Hand off to the Red agent…") is model-driven
delegation *inside* the cycle; these chips are harness-rendered buttons at the point where a
human chooses what happens *next*. `send: false` on the security chip demos the
confirm-before-dispatch behavior.

### 2. `.github/agents/reviewer.agent.md` — chain onward to security + drop overlapping scope

Add a handoff so `reviewer` chains into the dedicated security agent. Handoffs live in the
frontmatter and only render a button *after* the response completes — they do **not** change the
reviewer's output (it still produces its numbered findings + verdict).

```yaml
handoffs:
  - label: "🔒 Security check"
    agent: se-security-reviewer
    prompt: "Security-review the code we just added."
    send: false
```

Because there's now a dedicated security agent, remove security from the general reviewer so the
two agents have clean, non-overlapping responsibilities:

- Drop the **Security — OWASP Top 10** checklist item (and renumber the remaining items).
- Update the description/intro to focus on **correctness and maintainability**, noting security
  is handled by the SE Security Reviewer via the 🔒 Security check handoff.

### 3. `DEMO_GUIDE.md` — add section `### 3c` after the hooks demo (3b)

```markdown
### 3c. Explicit handoffs vs. free-text delegation

After the TDD cycle from 3a completes, point out the buttons that appear at the bottom of the
response: **🔁 Next criterion · 🔍 Review · 🔒 Security check**. Handoffs are one-at-a-time —
clicking one transitions into that agent and starts a new turn, so we chain them into a sequence
rather than clicking several at once.

**Live action**

1. Click **🔍 Review** — routes to the `reviewer` agent with a fixed prompt, no typing. It
   produces its full review: numbered findings by file with 🔴/🟡/🟢 severity and a verdict.
2. When the review finishes, a **🔒 Security check** button appears below it — this handoff is
   declared in `reviewer.agent.md`, chaining the workflow onward.
3. Click **🔒 Security check** — note it pre-fills the prompt and waits for confirmation
   (`send: false`) instead of auto-dispatching, so the audience can read the review first.
4. Open `tdd.agent.md` and `reviewer.agent.md` and show the `handoffs:` YAML next to the prose
   workflow steps.

**Talking point**

Two ways to move between agents. The Red → Green → Refactor steps are _free-text handoffs_ — the
model reads the workflow and decides when to delegate; adaptive, invisible, non-deterministic.
The buttons are the `handoffs:` _attribute_ — the harness renders them, the prompt sent is fixed,
and the user stays in control of the branch point. Because each handoff is a single transition,
chaining them (tdd → review → security) is how you build a guided, multi-step workflow.

Rule of thumb: **free-text when the model should judge the flow; the attribute when a human
should pick the next step or you need the routing to be repeatable and auditable.** They
compose — the same agent uses both.
```

## Resulting demo flow

```
@tdd (free-text handoffs)
   └─ Red → Green → Refactor   ← model-driven delegation inside the cycle
        │
        ▼  (handoffs: buttons appear after the response)
   🔁 Next criterion · 🔍 Review · 🔒 Security check
        │
        ├─ 🔍 Review ─→ reviewer   (produces bullet-list findings + verdict)
        │                   │
        │                   ▼  (handoffs: button appears)
        │              🔒 Security check ─→ se-security-reviewer
        │
        └─ (each button is a single transition; chaining builds the sequence)
```

## Reference

- VS Code — Custom agents: https://code.visualstudio.com/docs/copilot/customization/custom-agents
- Example of the `handoffs:` attribute in the wild: microsoft/hve-core `rpi-agent.agent.md`
