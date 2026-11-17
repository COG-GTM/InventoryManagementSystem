# Inventory Management System — Web Client

Browser client for the migrated **WinForms Inventory Management System**
(C# / .NET Framework 4.7.2 desktop `.exe`). TypeScript + Vite, no framework.
All data is loaded from and saved to the REST API in `../server`
(see `../api-contract.md`); the dev and preview servers proxy `/api` to it.

## Feature parity

| Legacy WinForms | Web app |
| --- | --- |
| `MainScreen` — Parts & Products grids, per-grid search | Two-panel main screen with search boxes |
| `AddPart` / `ModPart` — In-House vs Outsourced radios, validation | Add/Modify Part modal, same radio + validation |
| `AddProduct` / `ModProduct` — associate/remove parts | Add/Modify Product modal with candidate + associated parts tables |
| Delete with confirm; block deleting a product with associated parts | Same rules (also enforced by the API) |
| Seed data (`Inventory.fakeData()`) | Seeded by the API on first start |

Business rules: `min <= max`, `min <= inventory <= max`, search by
name-contains (case-insensitive) or exact id.

## Develop

Start the API first (`cd ../server && npm install && npm run dev`, port 3001), then:

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to API_PROXY_TARGET (default http://localhost:3001)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest unit tests (validation helpers)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build (also proxies /api)
```

## Structure

- `src/model.ts` — domain types, REST client (`partsApi`, `productsApi`), validation helpers.
- `src/main.ts` — UI: main screen, part/product modals, event wiring.
- `src/style.css` — styling.
- `src/model.test.ts` — unit tests for validation.
