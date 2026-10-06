# Zava Storefront

A premium e-commerce storefront for coffee, accessories, and lifestyle products. Built as a TypeScript monorepo with a React SPA and an Express REST API.

## Project Structure

```
packages/shared   — Shared types and utility functions (@zava/shared)
apps/api          — Express REST API with Prisma + SQLite (@zava/api)
apps/web          — React SPA with Vite (@zava/web)
```

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | React 18, React Router, Vite             |
| Backend  | Express, Prisma, SQLite                  |
| Language | TypeScript (strict mode)                 |
| Testing  | Vitest, React Testing Library, Supertest |
| Tooling  | npm workspaces, Prettier                 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```sh
npm install
```

### Set up the database

```sh
npm run db:push
npm run db:seed
```

### Configure environment

```sh
cp .env.example .env
```

Edit `.env` and set `JWT_SECRET` to a secure value. The default is only suitable for local development.

### Run in development

```sh
# Start both API and web dev servers
npm run dev

# Or run them individually
npm run dev:api   # API on http://localhost:3001
npm run dev:web   # Web on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the API at `localhost:3001`.

### Run tests

```sh
npm test
```

### Format code

```sh
npm run format
```

## API

The API serves RESTful JSON endpoints under `/api/`. See [docs/api-reference.md](docs/api-reference.md) for full details.

**Response shapes:**

- Success: `{ data }`
- Error: `{ error, message }`

Auth-protected routes require a `Bearer` token in the `Authorization` header. Tokens are obtained via the login endpoint.

## Architecture Notes

- Prices are stored as **integers in cents** (e.g., 1899 = $18.99). Use `formatPrice()` from `@zava/shared` to display.
- Auth uses JWT signed with the `JWT_SECRET` environment variable.
- The SQLite database is stored at `apps/api/prisma/dev.db` (gitignored).

## Docker (Local)

Run the full stack with Docker Compose using PostgreSQL:

```sh
cp .env.example .env          # edit secrets for your environment
docker compose up --build
```

The app will be available at `http://localhost:8080`. The API runs on port 3001.

See `docker-compose.yml` for service details and environment variables.

## Deployment (Azure)

The repo includes infrastructure-as-code for Azure Container Apps:

```sh
# Provision Azure resources + OIDC federation for GitHub Actions
.\infra\deploy.ps1 -GitHubRepo "owner/repo" -SubscriptionId "<your-subscription-id>"
```

This creates:

- **Container Apps Environment** with API (internal) and Web (external) apps
- **PostgreSQL Flexible Server** (Burstable B1ms)
- **Entra ID app** with federated credentials for GitHub Actions OIDC (no stored secrets)

Pushing to the `live-demo` branch triggers CI/CD via GitHub Actions: build → push to ghcr.io → deploy to Azure.

See [DEMO_GUIDE.md](DEMO_GUIDE.md) for the full deployment setup checklist.

## License

MIT
