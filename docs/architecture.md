# Architecture

## System overview

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser     │────▶│  Vite Dev Server  │────▶│   Express    │
│  (React SPA)  │     │  localhost:5173   │     │  localhost:   │
│               │     │  proxies /api →   │     │    3001       │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                       │
                                                ┌──────▼───────┐
                                                │   Prisma      │
                                                │   (SQLite)    │
                                                └──────────────┘
```

## Monorepo structure

```
zava-storefront/
├── packages/
│   └── shared/          # Types + utilities (npm: @zava/shared)
├── apps/
│   ├── api/             # Express REST API
│   │   ├── prisma/      # Schema + seed data
│   │   └── src/
│   │       ├── routes/      # Route handlers
│   │       ├── middleware/  # Auth, validation, error handling
│   │       ├── services/    # Business logic (email, etc.)
│   │       └── models/      # Prisma client
│   └── web/             # React SPA (Vite)
│       └── src/
│           ├── components/  # Reusable UI components
│           ├── pages/       # Route-level pages
│           ├── layouts/     # Layout wrappers
│           ├── hooks/       # Custom React hooks
│           └── services/    # API client
├── .github/
│   ├── agents/          # Custom Copilot agents
│   ├── hooks/           # Copilot lifecycle hooks
│   └── copilot-instructions.md
└── docs/
```

## Data model

### User
| Field        | Type     | Notes             |
|-------------|----------|-------------------|
| id          | String   | CUID              |
| email       | String   | Unique            |
| name        | String   |                   |
| password    | String   | bcrypt hashed     |
| role        | Enum     | CUSTOMER / ADMIN  |

### Product
| Field       | Type     | Notes             |
|------------|----------|-------------------|
| id         | String   | CUID              |
| name       | String   |                   |
| description| String   |                   |
| price      | Int      | Cents (1899=$18.99)|
| imageUrl   | String   |                   |
| category   | String   |                   |
| stock      | Int      |                   |

### Cart / CartItem
- One Cart per User by convention. This is not enforced: `Cart.userId` is not unique.
- CartItem links Cart ↔ Product with a quantity field.

### DiscountCode / CartDiscount
- `DiscountCode`: `code` (unique, upper case), `percentOff`, `active`. Seeded; no admin UI.
- `CartDiscount` links a Cart to the DiscountCode applied to it. `cartId` is unique, so a cart
  holds at most one discount (no stacking); it is deleted with its cart.
- Totals are computed only on the server (`apps/api/src/services/pricing.ts`): percentage off the
  whole subtotal, capped at 50%, floored to whole cents. Free shipping (≥ $75 of pre-discount
  subtotal) is computed in the web checkout. See `docs/features/3-discount-codes/`.

## Key design decisions

1. **Prices in cents** — Avoids floating-point issues. The `formatPrice()` utility handles display.
2. **SQLite** — Zero-config for local dev. PostgreSQL for Docker and production via a separate Prisma schema (`schema.docker.prisma`).
3. **JWT auth** — Stateless tokens in `Authorization: Bearer <token>` header.
4. **Vite proxy** — Avoids CORS in development; `/api` requests proxy to Express.
5. **Monorepo with npm workspaces** — Shared types are imported as `@zava/shared`.

## Production architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Browser     │────▶│  Nginx (Web)     │────▶│   Express    │
│  (React SPA)  │     │  Container App   │     │  Container   │
│               │     │  (external)      │     │  App (int.)  │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                       │
                                                ┌──────▼───────┐
                                                │  PostgreSQL   │
                                                │  Flex Server  │
                                                └──────────────┘
```

- **Web container**: Nginx serves the Vite-built SPA and reverse-proxies `/api` to the API container.
- **API container**: Express with Prisma, connects to PostgreSQL.
- **CI/CD**: GitHub Actions builds images on push to `live-demo`, pushes to ghcr.io, and updates Azure Container Apps via OIDC.
