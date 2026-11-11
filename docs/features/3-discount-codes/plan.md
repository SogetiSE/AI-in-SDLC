---
feature: 3-discount-codes
issue: 3
status: approved            # approved by Mattias Jonsson at the Stage 2 gate, 2026-11-11
review: { stage2: blocked-then-fixed, by: design-reviewer, date: 2026-11-11 }
---

# Plan: Add discount code support to the demo application

Design: [design.md](design.md) · Branch: `feature/3-discount-codes`

## 0. Spec in one line each

- **S1** — Applying an active code returns a cart with `subtotal`, `discount {code, percentOff, amount}` and `total = subtotal − amount`.
- **S2** — Codes match case-insensitively after trimming.
- **S3** — `amount = floor(subtotal × clamp(percentOff, 0, 50) / 100)` over all items; `0 ≤ total ≤ subtotal`.
- **S4** — A different second code returns 409 `DISCOUNT_ALREADY_APPLIED` with a "Remove X" message, and the first code stays.
- **S5** — Re-applying the same code returns 200 with the cart unchanged.
- **S6** — An unknown or inactive code returns 404 `DISCOUNT_NOT_FOUND`; a bad body returns 400.
- **S7** — `DELETE /api/cart/discount` returns 200 (also when no code is applied), and a new code can then be applied.
- **S8** — The discount is recomputed from current items on every cart response.
- **S9** — Checkout shows a Discount row, and Place Order = `cart.total + shipping`.
- **S10** — At most one discount per cart, enforced by the unique `CartDiscount.cartId`.
- **S11** — Handler outcomes log `discount.applied`, `.rejected` (with reason), `.removed` and `.dropped`.
- **S12** — A deactivated applied code is dropped by any cart response.
- **S13** — The discount stays attached on an empty cart, and the empty view shows it with Remove.
- **S14** — Any error in a cart route (including `authenticate`) or in login/register returns 500 with `http.error`, and the process keeps running.
- **S15** — The code input stays visible while a code is applied; `discountError` clears on success.
- **N1** — `GET /api/cart` shape: `total` = subtotal with no code; an empty cart has total 0.
- **N2** — Add/increment, the stock check and the unknown-product 404 still work.
- **N3** — DELETE item returns 204, and the ownership check still holds.
- **N4** — Deleting carts and users (tests, seed) still works.
- **N5** — Free shipping is based on the pre-discount subtotal.
- **N6** — Auth-only routes; no access to another user's cart.
- **N7** — The header count updates after a mutation.
- **N8** — The three schema files stay identical, apart from the datasource.
- **N9** — The Docker API still starts; it imports shared types only.
- **N10** — Removing an item doesn't flash the page.
- **N11** — The web build passes `tsc -b`.
- **O1–O7** — One JSON log line per discount outcome; `http.error` with method, path and userId on 500 (design §2.4).

**Test-isolation rule:** all API integration tests go in the existing
`apps/api/src/routes/routes.test.ts`. Vitest runs test files in parallel, and every file shares
`prisma/test.db`, so a second DB test file would race the `deleteMany` calls. `pricing.test.ts` is
pure, with no DB. Each new `describe` registers its own users and creates its codes with
`prisma.discountCode.create` in `beforeAll` (after `cartDiscount.deleteMany()` and
`discountCode.deleteMany()`), so it doesn't depend on seed data.

## 1. Tasks

### packages/shared

- [ ] **T1** — Correct the `CartItem` type to the API's wire shape (`product: { id, name, price, imageUrl }`, no flat `price`). Extend `Cart` with `subtotal` and `discount: AppliedDiscount | null`, make the dates `string`, and document `total` as post-discount. Add `AppliedDiscount` and `ApplyDiscountInput`, and export them from `index.ts`. **Types only, no runtime values** (D8) · serves S1, N9, N11
  - Test first: none at runtime, because the change is types only. Proved by `npm run build -w packages/shared` and by T9's web `tsc -b`, which currently uses a local `Cart` and will compile against the shared one.
  - Files: `packages/shared/src/types/cart.ts`, `packages/shared/src/index.ts`

### apps/api

- [ ] **T2** — Prisma models `DiscountCode` and `CartDiscount` (`cartId @unique`, `onDelete: Cascade`), plus the `Cart.cartDiscount` back-relation, added identically to all three schema files. Seed gets `WELCOME10`/10, `BREW15`/15 and `RETIRED20`/20 (inactive), and cleanup deletes `cartDiscount` then `discountCode` before `cart`. · serves S10, N4, N8
  - Test first: `routes.test.ts > Discount API > DB rejects a second CartDiscount for the same cart with P2002`. It fails today because `prisma.cartDiscount` doesn't exist.
  - Also: the existing `Products API` / `Auth API` `beforeAll` `cart.deleteMany()` still passes (cascade).
  - After editing the schemas, run `npx prisma generate` in `apps/api`. `run-vitest.mjs` uses `--skip-generate`, so without this the client has no `cartDiscount` delegate and API `tsc` fails.
  - Files: `apps/api/prisma/schema.prisma`, `schema.test.prisma`, `schema.docker.prisma`, `apps/api/prisma/seed.ts`

- [ ] **T3** — `priceCart(items, discounts)`: a pure function with a single-discount policy (uses `discounts[0]` only). `MAX_DISCOUNT_PERCENT = 50` lives here. Returns `{ subtotal, discount: { code, percentOff, amount } | null, total }`. · serves S3, AC3, D2, D3, D5
  - Test first: `apps/api/src/services/pricing.test.ts > priceCart >` `applies percent to all items across categories`, `floors to whole cents`, `caps at 50%`, `percentOff ≤ 0 → discount 0`, `never below 0`, `no discount → total = subtotal`. These fail today because the module doesn't exist.
  - Files: `apps/api/src/services/pricing.ts`, `apps/api/src/services/pricing.test.ts`

- [ ] **T4** — **Guard tests, not red tests:** they pass today and are written first to pin existing behaviour before T5 touches `cart.ts`. · serves N2, N3, N6
  - Tests (in `routes.test.ts > Cart API`):
    - `POST /api/cart/items → 404 for unknown product`
    - `→ 400 when quantity > stock`
    - `DELETE another user's item → 404 and item still exists` (registers a second user)
  - Files: `apps/api/src/routes/routes.test.ts`

- [ ] **T5** — Error handling. · serves S14, O4, D9
  - `asyncHandler(fn)` forwards rejections to `next`.
  - `logEvent(event, fields)` writes `console.info(JSON.stringify({ event, ...fields }))`.
  - `errorHandler` writes `console.error(JSON.stringify({ event: 'http.error', method, path, userId, message }))` and keeps the same 500 body.
  - `authenticate` keeps 401 for missing or bad headers, for `jwt.JsonWebTokenError`/`TokenExpiredError` (which covers `NotBeforeError`), and for a missing user. Any other error goes to `next(err)`.
  - Wrap the three existing cart handlers and `POST /api/auth/login` and `/register`.
  - Test first: a `routes.test.ts > Cart errors` block. `afterEach(() => vi.restoreAllMocks())`. In `beforeAll` it registers `process.on('unhandledRejection', spy)`, and every test asserts the spy was never called.
    - `GET /api/cart → 500 INTERNAL_ERROR when prisma throws`, using `vi.spyOn(prisma.cart, 'findFirst').mockRejectedValueOnce(new Error('db down'))`. It asserts the 500 body and that the `console.error` spy's JSON has `event: "http.error"`, `method`, `path` and `userId`.
    - The same for `POST /api/cart/items` (`prisma.product.findUnique`) and `DELETE /api/cart/items/:id` (`prisma.cartItem.findUnique`).
    - `GET /api/cart → 500 when authenticate's user lookup throws`, using `prisma.user.findUnique` with a valid token. It fails today with a 401.
    - `POST /api/auth/login → 500 when prisma throws`.
    - The others fail today because the rejection is unhandled: supertest waits until the 5 s timeout, and Vitest reports an unhandled rejection.
  - Files: `apps/api/src/lib/asyncHandler.ts`, `apps/api/src/lib/log.ts`, `apps/api/src/middleware/error.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/routes/cart.ts`

- [ ] **T6** — `loadPricedCart(cartId)` runs one `findFirst` including `items.product` and `cartDiscount.discountCode`. If the attached code is inactive, it deletes the row and logs `discount.dropped`, then calls `priceCart`. `toCartResponse(cart, priced)` builds `{ id, userId, items, subtotal, discount, total, createdAt, updatedAt }` explicitly, with no spread. GET and POST items use both. · serves S1, S8, S12, N1, O6, P1
  - Test first:
    - `Cart API > returns empty cart for new user`, extended to assert `subtotal === 0` and `discount === null`. It fails today because `subtotal` is undefined.
    - `Discount API > deactivated code: GET returns discount null and logs discount.dropped`. Set it up by creating a `CartDiscount` directly with prisma, then setting `active=false`.
    - `> POST /items after deactivation → discount null`
    - `> adding items recalculates discount`. Set it up by creating a `CartDiscount` directly.
    - `> removing an item then GET recalculates the discount` (fails today: `discount` undefined)
    - `> removing the last item keeps the discount attached (amount 0)`. **Guard:** it passes once this task lands, because `DELETE /items` never touches `CartDiscount`.
    - The deactivation tests use a dedicated code (`TEMP30`), so `WELCOME10` stays active for later tests.
  - Files: `apps/api/src/routes/cart.ts`

- [ ] **T7** — `POST /api/cart/discount` takes `validate(z.object({ code: z.string().trim().min(1).max(32) }))` and is wrapped in `asyncHandler`. It normalises the code to upper case, then follows the design §5 control flow: 404 for an unknown or inactive code, 200 if the same code is already applied, 409 if another active code is applied, and drop-then-insert if the applied code is inactive. On P2002 it re-reads: the same code gives 200, otherwise 409 with `via: "P2002"`. On success it logs `discount.applied` with subtotal, amount and total. · serves S1, S2, S4, S5, S6, S10, S11, S13, AC1, AC2, AC4, N6, O1, O2, O3, O5
  - Test first (`routes.test.ts > Discount API`). These fail today with 404, because the route doesn't exist:
    - `requires auth` (401)
    - `applies a valid code`: 200, amount = 10% of subtotal, `total = subtotal − amount`, and `discount` has exactly the keys `code, percentOff, amount`
    - `matches code case-insensitively and trimmed`
    - `rejects a second different code with 409 DISCOUNT_ALREADY_APPLIED`: the message contains "Remove WELCOME10", and a follow-up GET still shows WELCOME10
    - `re-applying the same code is idempotent`
    - `unknown code → 404`, `inactive code → 404`, `empty code → 400`
    - `P2002 path returns 409 when pre-check is bypassed`: `vi.spyOn(prisma.cartDiscount, 'findUnique').mockResolvedValueOnce(null)` with a row present, asserting a log with `via:"P2002"`. A same-code variant returns 200. (The handler's pre-check must use `prisma.cartDiscount.findUnique({ where: { cartId } })` for this spy to bite.)
    - `concurrent applies of two codes on an existing cart → one 200, one 409, one row`: GET first, then `Promise.all`
    - `user B applying a code leaves user A's cart unchanged`
    - `applying a code to an empty cart → 200, amount 0`
    - `deactivated applied code → BREW15 applies 200`
    - `POST /api/cart/discount → 500 when prisma throws`
    - a log spy asserts `discount.applied` and `discount.rejected` with `reason` `not_found` / `already_applied`
  - Files: `apps/api/src/routes/cart.ts`, `apps/api/src/routes/routes.test.ts`

- [ ] **T8** — `DELETE /api/cart/discount`, wrapped in `asyncHandler`: `deleteMany({ where: { cartId } })`, then logs `discount.removed` with the code when count > 0 and returns 200 with the priced cart. · serves S7, S13, S14, O7
  - Test first (these fail today because the route doesn't exist):
    - `DELETE /api/cart/discount removes it, then a new code applies`
    - `DELETE with none applied → 200`
    - `logs discount.removed with cartId and code`
    - `DELETE /api/cart/discount → 500 when prisma throws` (`prisma.cartDiscount.deleteMany`)
  - Files: `apps/api/src/routes/cart.ts`, `apps/api/src/routes/routes.test.ts`

### apps/web

- [ ] **T9** — `apiClient`: add `applyDiscount(code)` (POST) and `removeDiscount()` (DELETE), and type `getCart`/`addToCart` as `Cart` from `@zava/shared`. `useCart`:
  - Replace the local `Cart`/`CartItem` interfaces with the shared types.
  - Add a silent `refreshCart()` that doesn't touch `loading`; `removeItem` awaits the delete, then calls `refreshCart()` instead of recomputing `total` locally.
  - Add `applyDiscount(code)`, `removeDiscount()`, `discountError` and `discountPending`. A failed apply sets `discountError` to `ApiError.message` and leaves the cart unchanged; a 401 still clears the session, as the other actions do.

  · serves S1, S4, S7, S8, S15, N7, N10, N11
  - Test harness: use a **partial** mock that keeps the real `ApiError`: `vi.mock('../services/apiClient', async (orig) => ({ ...(await orig()), api: { getCart: vi.fn(), login: vi.fn(), addToCart: vi.fn(), removeFromCart: vi.fn(), applyDiscount: vi.fn(), removeDiscount: vi.fn() } }))`. A bare automock strips the `ApiError` constructor, leaving `message` as `""` and `statusCode` undefined.
    - Before rendering `CartProvider`, seed `zava_token`/`zava_user` in `localStorage` and resolve `getCart`.
    - `await waitFor(() => loading === false)` before recording loading states.
    - `afterEach`: `vi.restoreAllMocks()` and `localStorage.clear()`.
  - Test first: `apps/web/src/hooks/useCart.test.tsx`. It fails today because `applyDiscount` doesn't exist, and `removeItem` computes the total locally instead of fetching it.
    - `removeItem refreshes from server and never sets loading true`
    - `applyDiscount sets cart from response`
    - `applyDiscount 409 sets discountError to the server message and keeps cart`
    - `applyDiscount 401 clears zava_token`
    - `successful apply / remove clears discountError`
    - `itemCount updates after removeItem`. **Guard:** the local filter already updates the count today.
  - Type-check note: `tsc -b` also checks test files, so the mocks must match the full typed API and `CartContextValue`. Build `packages/shared` first, because its types come from `dist/index.d.ts`.
  - Files: `apps/web/src/services/apiClient.ts`, `apps/web/src/hooks/useCart.tsx`, `apps/web/src/hooks/useCart.test.tsx`

- [ ] **T10** — `DiscountCodeForm({ discount, onApply, onRemove, error, pending })`:
  - **Always** renders a `<form>` with a labelled input ("Discount code") and a submit `<button>` that is disabled while `pending` or while the input is empty.
  - With a discount applied, it also shows "WELCOME10 −$X.XX" and a Remove button (S15, D10).
  - The error renders in `role="alert"`, and focus returns to the input after an error.

  · serves AC1, AC2, S4, S7, S15
  - Test first: `apps/web/src/components/DiscountCodeForm.test.tsx`, using `fireEvent`. It fails today because the component doesn't exist.
    - `with a discount applied, submitting another code calls onApply and the 409 alert renders while the applied code stays`
    - `focus returns to the input after an error` (re-render with `error`, then `toHaveFocus`)
    - `submits trimmed input via onApply`
    - `Apply disabled while pending`
    - `Remove calls onRemove`
    - `input has an accessible label`
  - Files: `apps/web/src/components/DiscountCodeForm.tsx`, `apps/web/src/components/DiscountCodeForm.test.tsx`

- [ ] **T11** — `CartPage`:
  - Uses the server's `cart.subtotal`, `cart.discount` and `cart.total`, with no local reduce.
  - Shows a Discount row and a Total row, and renders `DiscountCodeForm` wired to `useCart`.
  - When the cart is empty and has a discount, shows "CODE will apply to your next items · Remove".

  · serves AC1, S13, N10
  - Test first: `apps/web/src/pages/CartPage.test.tsx` (`vi.mock('../hooks/useCart')`). It fails today because the page computes its own subtotal and has no discount UI.
    - `renders server subtotal, discount row and total`
    - `empty cart with discount shows code and Remove`
    - `removing an item keeps the summary rendered and shows the server total`. This re-renders with `loading: false` and the new cart, and asserts that the form and summary are present.
  - Files: `apps/web/src/pages/CartPage.tsx`, `apps/web/src/pages/CartPage.test.tsx`

- [ ] **T12** — `CheckoutPage`:
  - `shipping = cart.subtotal >= 7500 ? 0 : 895`.
  - A "Discount (CODE)" row when there is a discount.
  - Total and Place Order use `cart.total + shipping`.

  · serves S9, N5
  - Test first: `apps/web/src/pages/CheckoutPage.test.tsx`. It fails today because there is no discount row and the total ignores the discount.
    - `shows "Discount (WELCOME10)" and Place Order = cart.total + shipping`
    - `subtotal 7600 with 10% off (total 6840) still ships free`. **Guard:** today's code already passes this; it fails if someone later moves shipping onto the total.
    - `subtotal 5000 → $8.95 shipping`. **Guard.**
  - Files: `apps/web/src/pages/CheckoutPage.tsx`, `apps/web/src/pages/CheckoutPage.test.tsx`

## 2. Bookkeeping

- [ ] **T13** — Docs (written to match the code, never ahead of it):
  - `docs/api-reference.md`: the cart response shape (no `data` wrapper; `subtotal`/`discount`/`total`), DELETE item returns `204`, the new `POST`/`DELETE /api/cart/discount` with their error codes.
  - `docs/architecture.md`: the data model gains `DiscountCode` and `CartDiscount`, and the "One Cart per User (1:1)" line notes that it isn't enforced.
  - `README.md:83-84`: the error shape becomes `{ message, code, statusCode }`, and a note that cart responses aren't wrapped in `{ data }`.
  - `apps/api/src/app.ts` landing-page endpoint list gains `/api/cart/discount`.
- [ ] ADR: none (design §10).
- [ ] Index: create `docs/features/README.md` with the row `| 3-discount-codes | full | approved | [design](3-discount-codes/design.md) · [plan](3-discount-codes/plan.md) |`. Set it to `implemented` on merge.
- [ ] First commit: `docs/features/3-discount-codes/{design.md,plan.md}` and the index. Then one commit per task or small group of tasks, test first.

## 3. Verification

| Spec row | Evidence | Produced by |
|---|---|---|
| S1, AC1 | `routes.test.ts > Discount API > applies a valid code`; `CartPage.test.tsx > renders server subtotal, discount row and total` | T7, T11 |
| S2 | `> matches code case-insensitively and trimmed` | T7 |
| S3, AC3 | `pricing.test.ts > priceCart > *` (6 tests) | T3 |
| S4, AC2 | `> rejects a second different code with 409`; `DiscountCodeForm.test.tsx > shows the server's 409 message…`; `useCart.test.tsx > applyDiscount 409…` | T7, T10, T9 |
| S5 | `> re-applying the same code is idempotent` | T7 |
| S6 | `> unknown code → 404`, `> inactive code → 404`, `> empty code → 400` | T7 |
| S7 | `> DELETE /api/cart/discount removes it, then a new code applies`; `> DELETE with none applied → 200` | T8 |
| S8 | `> adding items recalculates discount`; `> removing an item then GET recalculates the discount`; `useCart.test.tsx > removeItem refreshes from server…` | T6, T9 |
| S9 | `CheckoutPage.test.tsx > shows "Discount (WELCOME10)"…` | T12 |
| S10, AC4 | `> DB rejects a second CartDiscount… P2002`; `> P2002 path returns 409…` (+ same-code 200); `> concurrent applies… one row` | T2, T7 |
| S11 | log spies in `> applies…`, `> rejects…`, `> logs discount.removed…`, `> deactivated code…` | T6, T7, T8 |
| S12 | `> deactivated code: GET returns discount null…`; `> POST /items after deactivation…`; `> deactivated applied code → BREW15 applies` | T6, T7 |
| S13 | `> removing the last item keeps the discount attached`; `> applying a code to an empty cart`; `CartPage.test.tsx > empty cart with discount…` | T6, T7, T11 |
| S14 | `Cart errors > GET / POST items / DELETE item → 500…`; `> 500 when authenticate's user lookup throws`; `POST /api/auth/login → 500…`; `POST`/`DELETE /api/cart/discount → 500…`; `unhandledRejection` spy never called | T5, T7, T8 |
| S15 | `DiscountCodeForm.test.tsx > with a discount applied, submitting another code…`, `> focus returns…`; `useCart.test.tsx > successful apply / remove clears discountError` | T10, T9 |
| N1 | `Cart API > returns empty cart for new user` (extended) | T6 |
| N2 | existing add/increment tests + `→ 404 unknown product`, `→ 400 quantity > stock` | T4 |
| N3 | existing `removes item` (204) + `DELETE another user's item → 404…` | T4 |
| N4 | existing `beforeAll cart.deleteMany()` in all describes; `npm run db:seed` | T2 |
| N5 | `CheckoutPage.test.tsx > subtotal 7600 with 10% off… free`, `> subtotal 5000 → $8.95` | T12 |
| N6 | existing `GET /api/cart requires auth`; `POST /api/cart/discount requires auth`; `user B… leaves user A's cart unchanged` | T7 |
| N7 | `useCart.test.tsx > itemCount updates after removeItem`; existing `Header.test.tsx` | T9 |
| N8 | `npm test` (runs `db push` on `schema.test.prisma`); `git diff` shows the same model block in all three schemas | T2 |
| N9 | `grep -rn "from '@zava/shared'" apps/api/src` shows only `import type`; `docker compose up --build api` → `curl localhost:3001/api/health` 200 (skip if Docker isn't available, and say so in the PR) | T1, T6 |
| N10 | `useCart.test.tsx > removeItem… never sets loading true`; `CartPage.test.tsx > removing an item keeps the summary rendered…` | T9, T11 |
| N11 | `npm run build` (web `tsc -b`) | T1, T9 |
| O1, O2, O5 | `discount.rejected` with `reason` / `via:"P2002"` asserted by log spies | T7 |
| O3 | `discount.applied` with `subtotal, amount, total` asserted | T7 |
| O4 | `http.error` with `method, path, userId` asserted in the 500 tests (including the authenticate and login cases) | T5, T7, T8 |
| O6 | `discount.dropped` asserted | T6 |
| O7 | `discount.removed` asserted | T8 |

```
npm run build -w packages/shared          # web types read shared dist/*.d.ts
(cd apps/api && npx prisma generate)      # tests push with --skip-generate
npm run db:push && npm run db:seed
npm test
npm run build
```

`npm run lint` is **not** in the gate. It can't run today (no ESLint binary or config, a
pre-existing problem), so the PR records that it was skipped and why. The ESLint setup is a follow-up.

- Manual journey (`npm run dev`, demo customer auto-login):
  1. Add the Atlas Espresso ($18.99) and the Copper Kettle ($92.00) → subtotal $110.99.
  2. Cart page: apply ` welcome10 ` → Discount "WELCOME10 −$11.09", Total $99.90.
  3. With WELCOME10 applied, the input is still visible. Apply `BREW15` → an alert shows "Only one discount code can be used per order. Remove WELCOME10 to use a different code.", and WELCOME10 stays.
  4. Apply `RETIRED20` or `NOPE` → "This discount code is not valid."
  5. Remove the Atlas Espresso → the page doesn't flash; the totals update to subtotal $92.00, discount −$9.20, total $82.80, and the header count drops.
  6. Checkout → Discount (WELCOME10) −$9.20, shipping Free (pre-discount $92.00 ≥ $75), Place Order $82.80.
  7. Back to the cart → Remove the code → apply `BREW15` → −$13.80.
  8. In the API logs, check one JSON line per step with `event` `discount.*`.

## Review outcome

**Stage 2 — design-reviewer, 2026-11-11, verdict: blocked** (spec check and risk map verbatim)

Spec check
- **What the change does**: ok — S1–S14 cover AC1–AC4. S14 as written is contradicted by the code (see 3 am + B1).
- **How we'll know it works**: gap (should-fix) — S8's design evidence "removing an item then GET recalculates" has no producing task (SF4); S14's "following request still answers" cannot fail under Vitest (P2); no 500-path test for either DELETE route (SF5).
- **What it must not break**: ok — N1–N11 all appear in plan §3 with a producing task; guard tests exercise what they claim.
- **How we'll debug it at 3 am**: gap (**blocker**) — in a real DB outage the first query is in `authenticate`, which swallows it as an unlogged 401, so O4's `http.error` never fires, and the web's auto-relogin then drives an unwrapped route that kills the process (B1).

Risk map
1. **`authenticate` → auto-relogin → `/auth/login` chain** — `apps/api/src/middleware/auth.ts:25-41`, `apps/web/src/hooks/useCart.tsx:132-150`, `apps/api/src/routes/auth.ts:42-45`. Dangerous because: T4's 500 tests fake only `prisma.cart.findFirst`, so they go green while a real outage still produces silent 401s and then crashes. Verify by hand: an error from `prisma.user.findUnique` during a cart request yields 500 + `http.error`.
2. **Web test harness** — `useCart.test.tsx` with bare `vi.mock('../services/apiClient')`. Dangerous because: automock strips `ApiError`'s constructor (`message` `""`, `statusCode` `undefined`) and `CartProvider` mount calls `api.login`, so the 409/401 tests fail or pass for the wrong reason. Verify by hand: the mock factory keeps the real `ApiError`.
3. **Form hides the input once a code is applied** — T10 vs S4/AC2/manual step 3. Dangerous because: the 409 message can only appear from a second tab, so the AC2 path is not demonstrable in the UI. Verify by hand: the product owner's intent for the applied state is written down and tested.

Findings and how they were resolved
- **B1** outage bypasses S14/O4 and still crashes → fixed: `authenticate` forwards non-JWT errors; login/register wrapped (D9); S14/O4 rewritten; tests for authenticate-lookup and login 500 in T5.
- **SF1** Prisma client never regenerated → fixed: `prisma generate` in T2 and the verification commands, which now run in the right order.
- **SF2** bare automock breaks `useCart` tests → fixed: partial mock keeping the real `ApiError`, seeded `localStorage`, wait for initial load, 401 test.
- **SF3** applied-state form contradicts AC2 → product owner chose **keep the input visible** (S15, D10); test added; manual step 3 updated.
- **SF4** S8 removal evidence dropped → fixed: `removing an item then GET recalculates` in T6.
- **SF5** DELETE /discount unwrapped, no DELETE 500 tests → fixed: T8 wrapped + 500 test; DELETE item 500 test in T5.
- **P1** "test first" that are really guards; T5/T4 order → fixed: guards labelled (T4, T6 last-item, T9 itemCount, T12 shipping); guard task now runs before the error-handling refactor.
- **P2** health-check survival can't fail → fixed: `unhandledRejection` spy asserted never called.
- **P3** `npm run lint` can't run; README line → fixed: lint removed from the gate and recorded as a follow-up; README `:83-84`.
- **P4** tsc checks tests, stale shared dist, no restoreMocks, shared WELCOME10 deactivation → fixed: notes in T9, shared build first, `afterEach(vi.restoreAllMocks)`, dedicated `TEMP30` code.
- **P5** focus and `discountError` clearing untested → fixed: tests in T10 and T9.

Remaining findings: none.
