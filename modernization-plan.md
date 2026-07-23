# Parallel Modernization Plan

This branch (`devin/ims-modernized-base`) contains the starting point for the parallel modernization demo:
- Legacy WinForms app in `FelixBerinde-InventoryManagementSystem/`
- Existing static web migration in `web/`
- API contract in `api-contract.md`

## Parallel child session tasks

Each child session checks out this branch, works in the assigned directory, and pushes their own `devin/ims-*` branch. The coordinator (parent session) merges them at the end.

1. **Backend session** (`server/`)
   - Create an Express + TypeScript + SQLite backend implementing `api-contract.md`.
   - Include `npm run dev`, `npm run build`, `npm run test`, `npm run lint`.
   - Seed data and validation must match the legacy behavior.

2. **Frontend session** (`web/`)
   - Refactor the existing static Vite/TypeScript SPA to load/save state through the REST API.
   - Keep the same UI and behavior: main screen, part/product modals, search, delete confirm, validation.
   - Update `package.json` scripts if needed; ensure `npm run dev`, `npm run build`, `npm run test`, `npm run lint` still work.

3. **E2E / edge-case session** (`e2e/`)
   - Set up Playwright end-to-end tests covering happy path and edge cases.
   - Edge cases: min > max, inventory outside range, delete product with associated parts blocked, delete confirm, search by id/name, In-House/Outsourced validation, invalid numeric input.
   - Include `npm run test` and `npm run test:ui` scripts.

4. **Infra / docs session** (root)
   - Add `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml`, and update `README.md` with setup/run instructions.
   - The CI workflow should install, build, lint, and test all packages.

## Integration

After all sessions complete, the coordinator:
- Merges the four child branches into one.
- Runs `docker compose up` (or `npm run dev` in each package) and verifies end-to-end.
- Records screen recordings of usage and edge cases.
- Opens a PR to `main` and pings the user on Slack.
