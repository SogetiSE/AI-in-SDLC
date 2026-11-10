---
name: architecture-review
description: Run a repeatable, evidence-first architecture audit of this monorepo — boundaries between apps/web, apps/api and packages/shared, API design and error handling, data access and Prisma migrations, configuration and secrets, operability (could on-call debug the busiest flows at 3 am from logs and metrics alone), and code organisation — producing a dated report with severities, a top-risk list and a map from finding to owning work. Use when reviewing a change that touches the API, data access or shared contracts, when asked whether the codebase is "consistent", or to produce a periodic architecture report.
effort: high
---

# Architecture review

Evidence first: every finding gets `path:line` and an excerpt you have actually read. An audit that
overstates is worse than one that misses, because people stop reading it.

Rules come from `CLAUDE.md`, `docs/architecture.md`, `docs/api-reference.md`, any ADRs, and the
previous report. **Start from the previous report** (`docs/reviews/`), so you do not re-report what
an open issue already owns.

## Procedure

1. **Mechanical checks first.** Run `npm run lint`, `npm run build` (type-check) and `npm test`;
   quote failures. If no dependency-boundary tooling exists (dependency-cruiser, eslint
   import rules), say so; recommending it is a finding.
2. **Workspace graph.** Check imports against the boundary rules: `apps/web` never imports from
   `apps/api` and vice versa; both may import `@zava/shared`; `packages/shared` imports neither app
   and holds no I/O; no cycles. Grep imports to verify.
3. **API layer.** Routes validate input at the edge; business logic is not in route handlers if the
   project has a service layer; errors map to consistent status codes and a consistent body; no stack
   traces or Prisma errors leak; outbound calls have timeouts.
4. **Data.** Prisma access goes through one client instance; migrations are committed and apply
   cleanly from empty; queries are paged and free of N+1; multi-step writes use transactions; seed
   data matches real shapes.
5. **Auth and security.** Every non-public route is behind auth middleware; ownership is checked, not
   only identity; secrets come from env, not code; CORS is explicit; user content is rendered safely
   in `apps/web`.
6. **Operability: the 3 am question.** For the two or three busiest or riskiest flows, ask: *if I
   were on call at 3 am and this broke, what observability would I need?* Trace one request end to end
   and check on-call could tell, from signals alone, that it is failing, where, and for which record:
   a request id survives web → api → logs; failures log as structured events with the business key;
   no exception is swallowed without a log; a health endpoint exists and checks the database. A hop
   that drops the id, or a failure path with no signal, is **MED** (**HIGH** when it can lose data
   silently).
7. **Grep set.** Run it and report counts and the worst files:
   ```bash
   grep -rn "catch\s*(.*)\s*{\s*}" apps packages --include='*.ts' --include='*.tsx' | grep -v node_modules | head
   grep -rln "console\.log" apps/api/src | wc -l
   grep -rn "as any\|@ts-ignore\|@ts-expect-error" apps packages --include='*.ts' --include='*.tsx' | grep -v node_modules | wc -l
   grep -rn "process\.env\." apps --include='*.ts' | grep -v node_modules | grep -v test
   ```
8. **Configuration.** Env vars are validated at startup and documented in `.env.example`; no
   localhost fallbacks that would survive into production.
9. **Verify before you write.** Re-check the three worst findings against the real wiring: who
   registers the route, who imports the type, whether the code path is reachable. Record corrections.
10. **Report** to `docs/reviews/YYYY-MM-DD-architecture-review.md`: an inventory table; findings by
    area with severity (**HIGH** can take production down or corrupt state, **MED** will bite under
    load or in an incident, **LOW** is hygiene); what is done well; the top 10 by risk; and a map
    from finding id to the issue or feature that owns it. For a PR, report blocker / should-fix /
    polish with the same evidence format and the failing test that should exist.
