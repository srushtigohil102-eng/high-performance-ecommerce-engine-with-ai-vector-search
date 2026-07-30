# Integration Test: Bugs Found & Fixed

## Date: 2026-07-30
## Environment: Backend (localhost:5000), Frontend (localhost:5173), MongoDB (local)

---

## BUG 1: Discount validation endpoint URL mismatch (BLOCKER)

**Severity:** High — discount code "Apply" button on Cart page always fails

**Symptoms:** Frontend calls `POST /api/discount/validate` which returns 404

**Root cause:** Backend mounts the discount validation route at `/api/orders/discount/validate` (via `orderRoutes.ts` mounted under `/api/orders`). The frontend `cartService.ts` was calling `/discount/validate` directly.

**Fix applied:** `client/src/services/cartService.ts:44` — changed URL from `/discount/validate` to `/orders/discount/validate`

**Note:** The checkout `placeOrder` flow was NOT affected — it sends the discount code directly in the order payload and the backend validates it server-side. Only the interactive "Apply" button on the Cart page was broken.

---

## BUG 2 & 3: Order item normalization — imageUrl and productId fields (BLOCKER)

**Severity:** High — Order confirmation, order detail, and admin order detail pages would show broken images and incorrect productId

**Symptoms:** 
- Order item images render as placeholders (gray boxes with "Product" text)
- `productId` resolves to the string `"[object Object]"` instead of the actual MongoDB ObjectId

**Root cause:** The backend uses Mongoose's `.populate("items.product", "name imageUrl category")` when fetching orders. This replaces the `product` field (which is an ObjectId reference) with a populated object containing `{ _id, name, imageUrl, category }`. The frontend's `normalizeOrderItem` function in `orderService.ts` was looking for `raw.imageUrl` directly on the item object, but the actual data structure is:

```json
{
  "product": { "_id": "...", "name": "...", "imageUrl": "..." },
  "name": "Snapshotted name",
  "quantity": 2,
  "price": 19.99
}
```

**Fix applied:** `client/src/services/orderService.ts:54-66` — Updated `RawOrderItem` interface to allow `product` to be `string | { _id, name, imageUrl }`. Updated `normalizeOrderItem` to extract `imageUrl` from `productObj.imageUrl` and `productId` from `productObj._id`.

---

## BUG 4: Admin service order items not normalized (MEDIUM)

**Severity:** Medium — same data shape issue as BUG 2/3 but affects admin order detail pages

**Symptoms:** Admin order detail page shows broken product images and incorrect IDs

**Root cause:** `adminService.ts` was casting items with `(raw.items ?? []) as AdminOrder['items']` without calling the normalizer. Since items from the backend have the same populated-product-object shape, they hit the same missing-imageUrl/missing-productId problem.

**Fix applied:** `client/src/services/adminService.ts:58` — Now imports and uses `normalizeOrderItem` from `orderService.ts` to properly normalize each item.

---

## Minor Notes (not fixed, observed during testing)

1. **No registration page in frontend:** The frontend has no `/register` route/page. Users must register via API directly. The LoginPage only has sign-in. (Low priority, can be added.)

2. **"electro" search returns 0 results:** The text index doesn't match "electro" to "Electronics" (grapheme-level difference — text search stems by word boundaries but "electro" vs "Electronics" don't share a stem). The regex/Levenshtein fallbacks also don't match because no product name contains "e-l-e-c-t-r-o" in sequence. This is expected behavior for the current approach (name-only regex). Category filtering remains available as a separate mechanism. Not a bug.

3. **Search page references "Accessories" category:** The "No results" view shows links to "Electronics", "Clothing", and "Accessories" categories, but "Accessories" doesn't exist in the seed data. Minor UI cosmetic issue.

4. **Rate limiter on auth routes (5 req / 15 min):** Functional but aggressive during testing. Fine for production.

5. **Redis unavailable on local dev:** Gracefully handled by the server (falls back to no-cache mode). Expected behavior.

---

## Fixes Applied in This Session (Day 2 - 2026-07-30)

### 1. Server-side Mongoose toJSON transforms — `_id` → `id`, strip `__v`/`password`

**What:** Added `toJSON.transform` to all 4 Mongoose models (User, Product, Order, DiscountCode) so every model serialized via `res.json()` automatically includes an `id` field (Mongoose already provides `id` as a virtual), strips `__v`, and (for User) strips `password`.

**Why:** Centralizes normalization in the backend so every API client gets consistent output. Eliminates the need for each frontend service to independently guess the correct ID field.

**Changes:**
- `server/src/models/User.ts` — toJSON transform: adds `id` from `_id`, deletes `__v` and `password`
- `server/src/models/Product.ts` — toJSON transform: adds `id`, deletes `__v`
- `server/src/models/Order.ts` — toJSON transform: adds `id`, deletes `__v`
- `server/src/models/DiscountCode.ts` — toJSON transform: adds `id`, deletes `__v`

**Backward compatibility:** `_id` is kept alongside `id` so existing frontend normalization (which checks `raw.id ?? raw._id`) continues to work. Only `__v` and `password` are removed.

### 2. Auth controller uses `id` alongside `_id`

**What:** Updated `register` and `login` response objects in `authController.ts` to include `id` alongside `_id`.

**Changes:**
- `server/src/controllers/authController.ts:107` — register response: `id: user.id` added, `_id` kept
- `server/src/controllers/authController.ts:126` — login response: `id: user.id` added, `_id` kept

**Note:** The `getMe` route returns the Mongoose document directly (`res.json(user)`), so the User toJSON transform handles it automatically.

### 3. TypeScript strict fix — `delete` on non-optional property

**What:** Wrapped toJSON `ret` objects with `const obj = ret as Record<string, unknown>` before calling `delete`. TypeScript 5.x strict mode disallows `delete` on required properties.

**Changes:** All 4 model files — replaced direct `delete ret._id` / `delete ret.__v` / `delete ret.password` with `delete obj._id` / `delete obj.__v` / `delete obj.password` after casting to `Record<string, unknown>`.

### 4. Search aggregation — add `id`, strip `__v`

**What:** The search controller uses MongoDB `aggregate()` which bypasses Mongoose document serialization. Added a `$project` stage to exclude `__v` and a `$addFields` stage to include `id` from `_id`.

**Changes:**
- `server/src/controllers/searchController.ts:289-303` — text search pipeline now has `{ $project: { score: 0, __v: 0 } }` and `{ $addFields: { id: "$_id" } }` stages.

### 5. GitHub Actions CI pipeline

**What:** Created `.github/workflows/ci.yml` with a single `ci` job that:
- Checks out code with `actions/checkout@v4`
- Sets up Node.js 22 with `actions/setup-node@v4`
- Installs dependencies for both `server/` and `client/` with `npm ci`
- Type-checks server with `npm run lint` (`tsc --noEmit`)
- Builds server with `npm run build` (`tsc`)
- Type-checks and builds client with `npm run build` (`tsc -b && vite build`)

**Trigger:** Runs on push/PR to `main`.

---

## Day 3 — 2026-07-30: Search Feature Finalization

### 1. Search response shape alignment — all paths now return `id` field

**Problem:** The `levenshteinFallback()` function used `.lean()` which bypasses Mongoose's toJSON transform, so products had `_id` and `__v` but no `id`. The vector search aggregation pipeline also had no `$project: { __v: 0 }` or `$addFields: { id: "$_id" }`.

**Fix:**
- `server/src/controllers/searchController.ts:353` — `levenshteinFallback()`: removed `.lean()` from `Product.find()` to ensure Mongoose toJSON transform applies (products now have `id`, no `__v`)
- `server/src/controllers/searchController.ts:193-194` — vector search pipeline: added `$project: { __v: 0 }` and `$addFields: { id: "$_id" }`

**Verification:** All three search paths (text, fuzzy, regex) now return products with `id` present and `__v` absent.

### 2. Final decision — text search is primary for Final Review

**Decision:** MongoDB full-text search (`$text` + `$meta.textScore`) with three fallback layers is the production-ready, demo-ready search implementation.

**Vector search status:** Scaffolded but not active — requires:
  1. `OPENAI_API_KEY` in `.env`
  2. `npm run generate-embeddings` to populate `Product.embedding`
  3. Atlas Vector Search index on `embedding` field (Atlas cluster required)

**Code change:** Simplified `searchProducts` handler to always use text search directly, removing the dead `checkEmbeddingsExist()` gate. Vector search function retained as reference code for future upgrade.

**File header updated:** `server/src/controllers/searchController.ts` — clear docstring stating text search is demo-primary, vector search is future upgrade path.

### 3. Search performance — all queries under 120ms

| Query type | Min | Avg | Max |
|---|---|---|---|
| Text search (cold cache) | 4ms | 59ms | 115ms |
| Text search (hot) | 5ms | 6ms | 7ms |
| Fuzzy/typo | 13ms | 15ms | 17ms |
| Regex | 11ms | 13ms | 17ms |

All well under the 1-2 second target on 70 products.

### 4. Edge case handling — zero 500 errors

Tested and confirmed safe:
- Empty query, whitespace-only → `searchMethod: "none"`, `products: []`
- Special characters `!@#$%^&*()` → sanitized away, 0 results (not a crash)
- Very long query (500 chars) → truncated to 200 by `sanitizeQuery()`
- SQL injection / XSS attempts → stripped by character filter `[^a-zA-Z0-9\s\-'&]`
- Unicode (café, résumé) → non-ASCII purged, 0 results (not a crash)
- Negative/invalid page/limit → clamped to valid range via `Math.max`/`Math.min`

### 5. Demo queries (Final Review)

| # | Query | Method | Total | What it demonstrates |
|---|---|---|---|---|
| 1 | `chocolate` | text | 1 | Exact product match via weighted text index (name 10x) |
| 2 | `wireless headphones` | text | 2 | Multi-word relevance ranking — headphones first, charger second (description match) |
| 3 | `headphonse` | fuzzy | 1 | Typo tolerance — Levenshtein distance ≤ 2 catches "headphones" |
| 4 | `kitchen` | text | 11 | Category match — text index covers category field (3x weight), returns Home & Kitchen + Beauty items with "kitchen" in description |
