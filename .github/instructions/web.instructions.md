---
applyTo: 'apps/web/**'
---

# Zava Web — Copilot Instructions

These rules apply to the React SPA (`apps/web`) and extend the repo-wide
[`copilot-instructions.md`](../copilot-instructions.md).

## React conventions

- Functional components only.p
- Custom hooks in `src/hooks/` prefixed with `use`.
- Shared components in `src/components/`, page components in `src/pages/`.
- Use React Router `<Outlet>` for layout composition.
- Co-locate test files next to the source: `Component.test.tsx`.

## Testing

- React tests use **React Testing Library** with jsdom.

## Architecture notes

- The Vite dev server proxies `/api` requests to `localhost:3001`.
