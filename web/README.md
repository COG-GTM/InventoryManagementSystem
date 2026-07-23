# Inventory Management System — Web Migration

A modern, browser-based port of the legacy **WinForms Inventory Management System**
(C# / .NET Framework 4.7.2 desktop `.exe`). This is a demo of migrating a legacy
Windows desktop application to a modern web app.

- **Before:** C# WinForms desktop app (`FelixBerinde-InventoryManagementSystem`),
  five `Form` windows, state held in static `BindingList<Part>` / `BindingList<Product>`.
- **After:** A static single-page web app — TypeScript + Vite, no framework, no
  backend. State lives in memory (`src/model.ts`), mirroring the original design.

## Feature parity

| Legacy WinForms | Web app |
| --- | --- |
| `MainScreen` — Parts & Products grids, per-grid search | Two-panel main screen with search boxes |
| `AddPart` / `ModPart` — In-House vs Outsourced radios, validation | Add/Modify Part modal, same radio + validation |
| `AddProduct` / `ModProduct` — associate/remove parts | Add/Modify Product modal with candidate + associated parts tables |
| Delete with confirm; block deleting a product with associated parts | Same rules |
| Seed data (`Inventory.fakeData()`) | Same seed data in `model.ts` |

Business rules ported verbatim: `min <= max`, `min <= inventory <= max`, search by
name-contains (case-insensitive) or exact id, and legacy id assignment
(`id = count + 1`).

## Develop

```bash
npm install
npm run dev        # start dev server
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest unit tests (model)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

## Structure

- `src/model.ts` — domain types (`Part`, `InhousePart`, `OutsourcedPart`, `Product`),
  the in-memory `Inventory` store, search + validation helpers.
- `src/main.ts` — UI: main screen, part/product modals, event wiring.
- `src/style.css` — styling.
- `src/model.test.ts` — unit tests for seed data, search, and validation.
