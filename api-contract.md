# Inventory Management System — API Contract

This contract is the source of truth for the parallel child sessions modernizing the legacy C# WinForms app. All implementations (backend, frontend, tests, Docker) must follow it.

## Development defaults

- Backend dev server: `http://localhost:3001`
- Frontend dev server: `http://localhost:5173`
- The frontend should proxy `/api` requests to the backend during development.
- The backend should allow CORS from the frontend origin and serve JSON with `Content-Type: application/json`.

## Domain

- **Part** — base fields:
  - `partId: number` (server-assigned, auto-increment, starts at 1)
  - `name: string`
  - `price: number` (decimal, dollars)
  - `inStock: number` (integer)
  - `min: number` (integer)
  - `max: number` (integer)
  - `kind: "inhouse" | "outsourced"`
  - `machineId: number` (only when `kind === "inhouse"`)
  - `companyName: string` (only when `kind === "outsourced"`)

- **Product** — fields:
  - `productId: number` (server-assigned, auto-increment, starts at 1)
  - `name: string`
  - `price: number`
  - `inStock: number`
  - `min: number`
  - `max: number`
  - `associatedParts: Part[]` (may be empty)

## Validation rules (mirroring the legacy app)

- `name` must be non-empty.
- `price` must be a non-negative number.
- `inStock`, `min`, `max` must be integers.
- `min` must be less than or equal to `max`.
- `inStock` must be between `min` and `max` (inclusive).
- `machineId` must be an integer when `kind === "inhouse"`.
- `companyName` must be non-empty when `kind === "outsourced"`.
- A product cannot be deleted if it has associated parts.

## REST endpoints

Base path: `/api`

### Parts

- `GET /api/parts`
  - Query: `?search=<term>` (optional)
  - Returns: `Part[]` sorted by `partId`
  - Search semantics: case-insensitive substring match on `name` OR exact match on `partId` string.

- `GET /api/parts/:id`
  - Returns: `Part`
  - 404 if not found.

- `POST /api/parts`
  - Body: `{ name, price, inStock, min, max, kind, machineId?, companyName? }`
  - Returns: created `Part` (server assigns `partId`)
  - 400 with `{ error: string }` if validation fails.

- `PUT /api/parts/:id`
  - Body: same as POST (without `partId`)
  - Returns: updated `Part`
  - 404/400 as appropriate.

- `DELETE /api/parts/:id`
  - Returns: `204 No Content`
  - Note: deleting a part does **not** remove it from associated products. (Legacy behavior: static list; keep simple for this demo.)

### Products

- `GET /api/products`
  - Query: `?search=<term>` (optional)
  - Returns: `Product[]` sorted by `productId` with `associatedParts` populated.
  - Search semantics: case-insensitive substring match on `name` OR exact match on `productId` string.

- `GET /api/products/:id`
  - Returns: `Product` with `associatedParts` populated.
  - 404 if not found.

- `POST /api/products`
  - Body: `{ name, price, inStock, min, max, associatedPartIds: number[] }`
  - Returns: created `Product` with `associatedParts` populated.
  - 400 with `{ error: string }` if validation fails.

- `PUT /api/products/:id`
  - Body: same as POST (without `productId`)
  - Returns: updated `Product` with `associatedParts` populated.
  - 404/400 as appropriate.

- `DELETE /api/products/:id`
  - Returns: `204 No Content` if product has no associated parts.
  - Returns: `400 { error: "Cannot delete a product that has associated parts." }` if associated parts exist.

## Seed data

The server should seed the same data as the legacy `Inventory.fakeData()`:

Parts:
- Light (outsourced, inStock 12, min 4, max 20, price 25.25, companyName "New Paths Inc.")
- Engine (outsourced, inStock 5, min 1, max 10, price 500, companyName "Ford Motor Co.")
- Software (inhouse, inStock 7, min 1, max 100, price 300, machineId 10101)

Products:
- Motorcycle (inStock 3, min 1, max 10, price 240000)
- Boat (inStock 1, min 1, max 1, price 15000)
- Plane (inStock 2, min 1, max 2, price 1090000)

## Error format

All errors return JSON: `{ "error": "human-readable message" }` with the appropriate 4xx/5xx status code.
