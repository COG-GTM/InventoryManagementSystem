# Inventory Management System — End-to-end tests

This directory contains Playwright end-to-end tests for the modernized Inventory Management System.

## What is covered

- **Happy path**: add a part, modify a part, add a product, associate a part with a product, modify the product, search by name, search by id, delete a part with confirmation.
- **Edge cases**: save part with `min > max`; save part with inventory outside `min`/`max`; delete product that has associated parts is blocked; switch In-House/Outsourced and validate the machine-id/company-name fields; cancel a modal and return to the main screen; save product with non-numeric input is rejected (requires the full stack backend).

## Run against the full stack

1. Start the backend (Express server):
   ```bash
   cd ../server
   npm install
   npm run dev
   ```
2. Start the frontend (Vite dev server):
   ```bash
   cd ../web
   npm install
   npm run dev
   ```
3. In this directory, install dependencies and run the tests:
   ```bash
   npm install
   npm run test        # headless
   npm run test:ui     # headed UI/debug mode
   ```

## Run headless only

```bash
npm run test
```

## Run in headed / debug mode

```bash
npm run test:ui
```

## Configuration

`playwright.config.ts`:
- Uses `http://localhost:5173` (frontend) as the base URL.
- Automatically starts the frontend dev server from `../web` before the tests run.
- If `../server/package.json` exists, it also starts the backend dev server from `../server`.
- Sequential execution with one worker (`workers: 1`) because the tests share the live application state.

## Notes

- The `save product with non-numeric input is rejected` test is skipped when the backend is not running, because the static in-memory frontend does not enforce numeric validation on its own. It will run automatically once the full stack is available.
