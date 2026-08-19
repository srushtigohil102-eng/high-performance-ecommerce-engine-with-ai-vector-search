# E-Commerce API Server

Express + MongoDB + Redis backend with JWT auth, product management, cart/checkout, wishlist, order tracking, admin panel, and full-text product search (with a scaffolded vector-search upgrade path).

> **Weeks 1-8 Complete** — Full REST API delivered and stabilized for final review: auth + RBAC, product CRUD with Redis caching, checkout with stock decrement and discount validation, order management (cancel with stock restore, reorder, tracking, status timeline), wishlist, customer reviews with rolling ratings, order lifecycle, admin operations (dashboard analytics, customer management, audit), and a search & discovery layer (faceted full-text search, live suggestions, trending searches, category counts).

---

## Weeks 1-4 — Complete Feature Summary

### Authentication & Authorization
- `POST /api/auth/register` and `POST /api/auth/login` with bcrypt-hashed passwords (salt rounds 10) and 7-day JWT access tokens
- `GET /api/auth/me` to fetch the current user from a Bearer token
- Refresh-token rotation via httpOnly cookies (`POST /api/auth/refresh`), server-side logout revocation (`POST /api/auth/logout`), email verification (`GET /api/auth/verify-email`, `POST /api/auth/resend-verification`), and password reset (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`)
- Rate limiting on auth routes (100 req / 15 min / IP, configurable)
- Role-based access control: `authMiddleware` (JWT) + `adminMiddleware` (role check) guard all admin routes server-side

### Products
- Paginated `GET /api/products` with `page` / `limit` (max 50) / `category` filter
- Product detail, create (admin), update (admin), delete (admin) with `express-validator` input validation
- Redis caching for list responses (5-min TTL), invalidated on create/update/delete so writes are never stale

### Search
- `GET /api/search` — MongoDB `$text` weighted scoring (name 10x / description 5x / category 3x) via the `product_text_search` index
- Typo-tolerant fallbacks: Levenshtein-distance matching (≤2 edits, `searchMethod: "fuzzy"`) and regex partial matching incl. category (`searchMethod: "regex"`)
- Faceted filters: `category`, `minPrice`/`maxPrice` (in cents), `inStock`; sort via `sort` (`relevance` | `price-asc` | `price-desc` | `rating` | `newest` | `name`) — filters/sort applied on text results and every fallback
- `searchMethod` field reports which engine produced results; malformed/empty queries always return `200` with a products array (never a 500)
- `GET /api/search/suggest?q=…` — live as-you-type suggestions: matching product names, up to 5 product hits (id/name/category/price/image), and up to 4 matching categories with counts
- `GET /api/search/trending` — top 8 most-searched terms, tracked in a Redis sorted set (`search:trending`) on every non-empty search with results; degrades to `{ terms: [] }` when Redis is unavailable
- `GET /api/products/categories` — category names with live product counts, Redis-cached and invalidated on product changes
- Semantic vector path (`$vectorSearch` + OpenAI embeddings) scaffolded, auto-activates only when product embeddings exist

### Orders & Checkout
- `POST /api/orders` — atomic checkout: validates items/stock, decrements stock, snapshots item name/price, applies discount codes server-side
- `POST /api/orders/discount/validate` — validates a discount code before checkout
- Customer order history + order detail (owner-only); admin order listing, detail, and status updates (`pending` → `confirmed` → `shipped` → `delivered` → `cancelled`)
- `POST /api/orders/:id/cancel` — customer cancels a `pending`/`confirmed` order; stock is restored and cached product/search responses invalidated
- `POST /api/orders/:id/reorder` — one-click reorder: re-validates stock/prices and places a new order from a past one
- `PATCH /api/admin/orders/:id/tracking` — admin sets/clears a carrier tracking number, visible on the customer's order page
- Every order keeps an append-only `statusHistory` timeline (status + timestamp + optional note) surfaced to the customer
- `GET /api/admin/stats` — dashboard totals (products, orders, low-stock, revenue) plus recent orders, top-selling products (by units sold), and a low-stock product list
- `GET /api/admin/users` — paginated, searchable customer list with order counts and total spend (non-cancelled orders)
- `GET /api/admin/users/:id` — customer detail with their 20 most recent orders and lifetime stats
- `GET /api/admin/audit` — paginated audit trail of admin/auth actions (including `order.status_changed` and `order.tracking_updated`)

### Wishlist
- `GET /api/wishlist` — list the user's saved products (newest first, product populated)
- `POST /api/wishlist/:productId` — save a product (idempotent, unique per user)
- `DELETE /api/wishlist/:productId` — unsave a product (idempotent)
- Wishlist entries are auto-cleaned when the saved product is deleted

### Reviews
- `GET /api/products/:id/reviews` — paginated reviews for a product (public, newest first, user populated) plus the rolling `averageRating` / `ratingCount`
- `POST /api/products/:id/reviews` — create a review (authenticated, one per user per product via a unique index)
- `PUT /api/reviews/:id` — edit your own review (admin may edit any review)
- `DELETE /api/reviews/:id` — delete your own review (admin may delete any review)
- Every review write recomputes the product's `rating` / `numReviews` from a live aggregation and invalidates the product/search caches, so list and detail responses always show a fresh rating with zero per-request cost

### Cross-Cutting
- Helmet security headers, locked CORS origin, NoSQL-injection sanitization, layered rate limiting, and centralized error handling with consistent status codes
- Audit trail (`AuditLog`) for user registration, product CRUD, and order status changes — surfaced in the admin UI and filterable by action
- Auto-seed on empty database (73 products, 2 users, 5 discount codes) so a fresh install is immediately usable
- Redis failure-isolated: if Redis is down the server logs and continues without cache

---

## Setup

### Prerequisites

- Node.js 20+
- MongoDB 7+ (running on `localhost:27017`)
- Redis 7+ (running on `localhost:6379`)
- Docker Desktop (optional — for Docker-based dev)

### Environment Variables

Copy `.env.example` to `.env` and adjust:

| Variable       | Description                              | Default                                   |
| -------------- | ---------------------------------------- | ----------------------------------------- |
| `PORT`         | Server port                              | `5000`                                    |
| `MONGO_URI`    | MongoDB connection string                | `mongodb://localhost:27017/ecommerce`     |
| `REDIS_URL`    | Redis connection URL                     | `redis://localhost:6379`                  |
| `JWT_SECRET`   | Secret key for signing JWT tokens (required, min 16 chars — server fails fast) | `your-super-secret-jwt-key-change-in-production` |
| `CORS_ORIGIN`  | Allowed CORS origin (frontend URL)       | `http://localhost:5173`                   |
| `AUTH_RATE_LIMIT_MAX` | Auth route rate limit per 15 min per IP | `100` |
| `CLIENT_URL`   | Base URL for dev-mode email links logged to the console | `http://localhost:5173` |
| `COOKIE_SECURE` | Marks the refresh-token cookie `Secure` (set `true` behind HTTPS) | `false` |
| `TRUST_PROXY`  | Set `true` behind a reverse proxy so rate limiting uses the real client IP | `false` |
| `OPENAI_API_KEY` | Optional — enables vector search embeddings | —                                        |

### Run Locally

```bash
npm install
npm run dev          # starts ts-node-dev with hot reload
```

Seed the database with sample products (optional):

```bash
npm run seed
```

The server **auto-seeds on first boot**: if the database is empty it creates 2 demo users (`admin@example.com` / `admin123`, `customer@example.com` / `customer123`), 73 products across 10 categories, and 5 discount codes (e.g. `SAVE10`). `npm run seed` is only needed to reset/re-seed an existing database.

### Run via Docker

```bash
docker-compose up --build
```

This starts three containers:
- **server** (this app, compiled from TypeScript)
- **mongo** (MongoDB 7, port 27017)
- **redis** (Redis 7, port 6379)

**Prerequisite:** create `server/.env` first — `docker-compose.yml` loads it via `env_file` (`./server/.env`) and refuses to start if it's missing: `cp .env.example .env`. Only `PORT`, `JWT_SECRET`, `CORS_ORIGIN`, and `OPENAI_API_KEY` matter for the container; the `MONGO_URI` and `REDIS_URL` you set there are overridden by the Docker service names below.

The server reaches mongo/redis by Docker service name, so `MONGO_URI` and `REDIS_URL` in `.env` are overridden by `docker-compose.yml`. A fresh `mongo_data` volume is empty on first boot — the server's auto-seed populates it automatically, so `docker-compose up` is immediately usable.

---

## API Endpoints

### Health

#### `GET /api/health`

No auth required.

**Response `200`**
```json
{ "status": "ok", "timestamp": "2026-07-29T12:00:00.000Z" }
```

---

### Authentication

#### `POST /api/auth/register`

Rate-limited: **100 requests per 15 minutes per IP** (configurable via `AUTH_RATE_LIMIT_MAX`).

**Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `201`**
```json
{
  "_id": "664a...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer",
  "emailVerified": false,
  "token": "eyJhbGci..."
}
```

New accounts start **unverified** (`emailVerified: false`). A verification link is
generated and, since no mail service is configured yet, **logged to the server
console** (`[DEV-EMAIL] ...`) as a dev-mode stand-in for a real email. An
httpOnly `refreshToken` cookie is also set.

**Errors** — `400` (missing fields / user exists)

**Example**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'
```

---

#### `POST /api/auth/login`

Rate-limited: **100 requests per 15 minutes per IP** (configurable via `AUTH_RATE_LIMIT_MAX`).

**Body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "_id": "664a...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer",
  "emailVerified": true,
  "token": "eyJhbGci..."
}
```

Sets a fresh httpOnly `refreshToken` cookie (rotated on every login/refresh).

**Errors** — `400` (missing fields), `401` (invalid credentials)

**Example**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

---

#### `GET /api/auth/me`

Auth required: **Bearer token**.

**Headers**
```
Authorization: Bearer <token>
```

**Response `200`**
```json
{
  "_id": "664a...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer"
}
```

**Example**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGci..."
```

---

#### `POST /api/auth/refresh`

No auth header required — uses the `refreshToken` httpOnly cookie. Rotates the
refresh token (old one is invalidated) and returns a new access token.

**Response `200`**
```json
{
  "token": "eyJhbGci..."
}
```

**Errors** — `401` (missing / invalid / expired refresh token)

---

#### `POST /api/auth/logout`

No auth header required — clears the `refreshToken` cookie and invalidates the
refresh token server-side.

**Response `200`** — `{ "message": "Logged out successfully" }`

---

#### `POST /api/auth/forgot-password`

Rate-limited: **20 requests per 15 minutes per IP**. Always returns the same
message regardless of whether the email exists (no user enumeration). When the
email exists, a one-time reset link is logged to the server console (`[DEV-EMAIL]`).

**Body**
```json
{ "email": "john@example.com" }
```

**Response `200`**
```json
{ "message": "If an account exists for that email, a password reset link has been sent." }
```

---

#### `POST /api/auth/reset-password`

Rate-limited: **20 requests per 15 minutes per IP**. Token is single-use and
expires after **1 hour**.

**Body**
```json
{ "token": "abc123...", "password": "newpassword456" }
```

**Response `200`**
```json
{ "message": "Password has been reset. You can now sign in." }
```

**Errors** — `400` (missing/invalid/expired token)

---

#### `GET /api/auth/verify-email`

Rate-limited: **20 requests per 15 minutes per IP**. Token is single-use and
expires after **24 hours**.

**Query**
```
?token=<one-time-token>&email=<account-email>
```

**Response `200`**
```json
{ "message": "Email verified successfully", "emailVerified": true }
```

**Errors** — `400` (missing/invalid/expired token)

---

#### `POST /api/auth/resend-verification`

Rate-limited: **20 requests per 15 minutes per IP**. Always returns the same
message regardless of whether the email exists. When the account exists and is
still unverified, a fresh verification link is logged to the server console
(`[DEV-EMAIL]`).

**Body**
```json
{ "email": "john@example.com" }
```

**Response `200`**
```json
{ "message": "If an account exists for that email, a verification link has been sent." }
```

---

### Products

#### `GET /api/products`

Public. Paginated with optional category filter.

**Query params**
| Param    | Type   | Default | Description              |
| -------- | ------ | ------- | ------------------------ |
| `page`   | number | `1`     | Page number              |
| `limit`  | number | `12`    | Items per page (max 50) |
| `category` | string | —     | Filter by category       |
| `search` | string | —       | Full-text search query   |

**Response `200`**
```json
{
  "products": [ { "_id": "...", "name": "Wireless Headphones", "price": 79.99, ... } ],
  "page": 1,
  "limit": 12,
  "total": 42,
  "totalPages": 4
}
```

Responses are cached in Redis for 5 minutes.

**Example**
```bash
curl "http://localhost:5000/api/products?page=1&limit=12&category=Electronics"
```

---

#### `GET /api/products/:id`

Public. Returns a single product.

**Response `200`**
```json
{
  "_id": "664a...",
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones with noise cancelling.",
  "price": 79.99,
  "category": "Electronics",
  "imageUrl": "https://example.com/image.jpg",
  "stock": 15,
  "createdAt": "2026-07-29T12:00:00.000Z"
}
```

**Errors** — `404` (not found)

---

#### `POST /api/products`

Auth required: **admin** (Bearer token).

**Body**
```json
{
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones.",
  "price": 79.99,
  "category": "Electronics",
  "imageUrl": "https://...",
  "stock": 100
}
```

`imageUrl` and `stock` are optional.

**Response `201`** — Created product object.

**Errors** — `400` (validation), `401` (no auth), `403` (not admin)

---

#### `PUT /api/products/:id`

Auth required: **admin** (Bearer token). Accepts partial updates.

**Body** (all fields optional)
```json
{ "price": 69.99, "stock": 150 }
```

**Response `200`** — Updated product object.

**Errors** — `400` (validation), `401`, `403`, `404` (not found)

---

#### `DELETE /api/products/:id`

Auth required: **admin** (Bearer token).

**Response `200`**
```json
{ "message": "Product deleted" }
```

**Errors** — `401`, `403`, `404`

---

### Search

#### `GET /api/search`

Public. Full-text product search built on MongoDB `$text` weighted scoring (name 10x, description 5x, category 3x), with typo-tolerant fallbacks: Levenshtein-distance matching (up to 2 edits) and regex partial matching. A semantic vector path (`$vectorSearch` + OpenAI embeddings) is scaffolded and auto-activates only if product embeddings exist — see Known Limitations below.

**Query params**
| Param      | Type    | Default     | Description                |
| ---------- | ------- | ----------- | -------------------------- |
| `q`        | string  | —           | Search query (optional — empty returns no results) |
| `page`     | number  | `1`         | Page number                |
| `limit`    | number  | `12`        | Items per page (max 50)   |
| `category` | string  | —           | Only products in this category |
| `minPrice` | number  | —           | Minimum price (in cents)  |
| `maxPrice` | number  | —           | Maximum price (in cents)  |
| `inStock`  | boolean | —           | `true` = only items with stock > 0 |
| `sort`     | string  | `relevance` | `relevance` \| `price-asc` \| `price-desc` \| `rating` \| `newest` \| `name` |

**Response `200`**
```json
{
  "products": [ ... ],
  "page": 1,
  "limit": 12,
  "total": 5,
  "totalPages": 1,
  "searchMethod": "text"
}
```

`searchMethod` reports which engine produced the results: `"text"` (MongoDB `$text`), `"fuzzy"` (Levenshtein typo match), `"regex"` (partial match), or `"none"` (empty query / no matches). A `"vector"` value appears only when embeddings are present.

**Errors** — none expected for bad input: missing/empty/malformed `q` returns `200` with an empty `products` array. A `500` only occurs on a genuine server/database failure.

**Example**
```bash
curl "http://localhost:5000/api/search?q=wireless+headphones&category=Electronics&minPrice=500&maxPrice=3000&inStock=true&sort=price-asc"
```

---

#### `GET /api/search/suggest`

Public. Live as-you-type suggestions for the navbar search box. Returns matching
product names, a few product hits (for direct links), and matching categories
with counts. Regex is escaped so input is treated literally.

**Query params** — `q` (required, capped at 40 chars).

**Response `200`**
```json
{
  "queries": ["Wireless Bluetooth Headphones", "Wireless Charging Pad"],
  "products": [
    { "id": "664a...", "name": "Wireless Bluetooth Headphones", "category": "Electronics", "price": 2499, "imageUrl": "..." }
  ],
  "categories": [ { "name": "Electronics", "count": 2 } ]
}
```

**Errors** — none expected; an empty `q` returns empty arrays. A `500` only on a server/database failure.

---

#### `GET /api/search/trending`

Public. Top 8 most-searched terms with counts, tracked in a Redis sorted set
(`search:trending`) every time a non-empty search returns results. The set is
trimmed to keep its top 50 entries and expires after 7 days; the response is
cached for 60 seconds. Returns `{ "terms": [] }` when Redis is unavailable.

**Response `200`**
```json
{
  "terms": [ { "term": "wireless headphones", "count": 7 }, { "term": "jacket", "count": 4 } ]
}
```

---

#### `GET /api/products/categories`

Public. Category names with live product counts, computed by aggregation and
cached in Redis for 5 minutes. Invalidated together with the product caches on
create/update/delete/stock/rating changes.

**Response `200`**
```json
{
  "categories": [ { "name": "Clothing", "count": 12 }, { "name": "Electronics", "count": 9 } ]
}
```

---

### Orders (Customer)

#### `POST /api/orders`

Auth required: **Bearer token**. Creates a new order (checkout).

**Body**
```json
{
  "items": [
    { "product": "664a...", "quantity": 2 }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "discountCode": "SAVE10"
}
```

`discountCode` is optional.

**Response `201`** — Created order object.

**Errors** — `400` (validation, insufficient stock, invalid discount), `401`

**Example**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{"items":[{"product":"664a...","quantity":1}],"shippingAddress":{"street":"123 Main St","city":"New York","state":"NY","zipCode":"10001","country":"US"}}'
```

---

#### `GET /api/orders`

Auth required: **Bearer token**. Returns the authenticated user's orders (newest first).

**Response `200`** — Array of order objects.

---

#### `GET /api/orders/:id`

Auth required: **Bearer token**. Returns a single order. Only the order owner or an admin can view.

**Errors** — `403` (access denied), `404` (not found)

---

#### `POST /api/orders/discount/validate`

Auth required: **Bearer token**. Validates a discount code.

**Body**
```json
{ "code": "SAVE10" }
```

**Response `200`**
```json
{
  "code": "SAVE10",
  "percentage": 10,
  "message": "10% discount applied"
}
```

**Errors** — `400` (missing code), `404` (invalid/inactive code)

---

#### `POST /api/orders/:id/cancel`

Auth required: **Bearer token**. Cancels an order that is still `pending` or
`confirmed`. The reserved stock is returned to the products, cached
product/search responses are invalidated, a `cancelled` entry is appended to
the order's `statusHistory`, and an `order.status_changed` audit entry is
written. Cancelling an already-cancelled order is an idempotent `200`.

**Response `200`** — the updated order, e.g.
```json
{
  "id": "664a...",
  "status": "cancelled",
  "statusHistory": [
    { "status": "pending", "at": "2026-08-13T09:00:00.000Z" },
    { "status": "cancelled", "at": "2026-08-13T11:30:00.000Z", "note": "Cancelled by customer" }
  ]
}
```

**Errors** — `400` (invalid ID or order already shipped/delivered), `401` (unauthenticated), `403` (not the owner/admin), `404` (not found)

---

#### `POST /api/orders/:id/reorder`

Auth required: **Bearer token**. Places a new `pending` order using the same
items and shipping address as a previous order. Stock and current prices are
re-validated; quantities that are no longer available fail the whole reorder.

**Response `201`** — the new order (no discount is re-applied; prices are current).

**Errors** — `400` (invalid ID or insufficient stock), `401` (unauthenticated), `403` (not the owner/admin), `404` (order not found)

---
---

### Wishlist

Auth required for all endpoints: **Bearer token**. A product can be saved once per
user (enforced by a unique `user + product` index); add/remove are idempotent.

#### `GET /api/wishlist`

The authenticated user's saved products, newest first, with the full product populated.

**Response `200`**
```json
[
  {
    "id": "664a...",
    "product": { "id": "664a...", "name": "Wireless Mouse", "price": 29.99, "...": "..." },
    "createdAt": "2026-08-13T07:29:02.825Z"
  }
]
```

#### `POST /api/wishlist/:productId`

Saves a product. Returns `201` with the saved item (or the existing item on an idempotent repeat).

**Errors** — `400` (invalid product ID), `404` (product not found)

#### `DELETE /api/wishlist/:productId`

Removes a product. Always `200` (removing an absent entry is a no-op).

**Errors** — `400` (invalid product ID)

Wishlist entries for a product are automatically deleted when the product itself is deleted.

---

### Reviews

Product-scoped reads/writes live under `/api/products/:id/reviews`; review
management (edit/delete) lives under `/api/reviews/:id`. Each user may review a
product once (unique `user + product` index). Every write recomputes the
product's `rating` / `numReviews` and invalidates the product + search caches.

#### `GET /api/products/:id/reviews`

Paginated reviews for a product, newest first, with the reviewer's name populated.

**Query params**: `page` (default 1), `limit` (default 10, max 50)

**Response `200`**
```json
{
  "reviews": [
    {
      "id": "665a...",
      "user": { "id": "664a...", "name": "Jamie Lee" },
      "rating": 5,
      "title": "Great",
      "comment": "Loved it!",
      "createdAt": "2026-08-13T09:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1,
  "totalPages": 1,
  "averageRating": 5,
  "ratingCount": 1
}
```

**Errors** — `400` (invalid product ID), `404` (product not found)

#### `POST /api/products/:id/reviews`

Creates a review. Body: `rating` (integer 1-5, required), `comment` (required,
max 2000), `title` (optional, max 200). Returns `201` with the populated review.

**Errors** — `400` (invalid ID, missing/invalid fields, or already reviewed), `401` (unauthenticated), `404` (product not found)

#### `PUT /api/reviews/:id`

Updates your own review (partial updates allowed). Body: `rating` / `comment` / `title`.
Returns `200` with the updated review.

**Errors** — `400` (invalid ID or fields), `401` (unauthenticated), `403` (not the review owner and not admin), `404` (review not found)

#### `DELETE /api/reviews/:id`

Deletes your own review (admin may delete any). Returns `200`.

**Errors** — `400` (invalid ID), `401` (unauthenticated), `403` (not the owner), `404` (review not found)

---

### Admin

All admin endpoints require **Bearer token** with `role: "admin"`.

#### `GET /api/admin/audit`

Paginated audit trail — records user registrations, product create/update/delete, and order status changes.

**Query params**: `page` (default 1), `limit` (default 20, max 50), `action` (optional — e.g. `product.created`, `order.status_changed`)

**Response `200`**
```json
{
  "logs": [
    {
      "id": "665a...",
      "actor": { "id": "664a...", "name": "Admin User", "email": "admin@example.com" },
      "action": "order.status_changed",
      "resource": "order",
      "resourceId": "664a...",
      "details": { "from": "pending", "to": "shipped" },
      "ip": "::1",
      "userAgent": "Mozilla/5.0 ...",
      "createdAt": "2026-08-13T07:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

---

#### `GET /api/admin/stats`

Dashboard statistics, including recent activity panels.

**Response `200`**
```json
{
  "totalProducts": 50,
  "totalOrders": 120,
  "lowStockProducts": 3,
  "totalRevenue": 15420.50,
  "recentOrders": [
    { "id": "665a...", "customerName": "Alice", "customerEmail": "alice@example.com", "total": 2499, "status": "shipped", "createdAt": "2026-08-13T07:00:00.000Z" }
  ],
  "topProducts": [
    { "name": "Wireless Headphones", "quantitySold": 14, "revenue": 34986 }
  ],
  "lowStockList": [
    { "id": "664a...", "name": "Charging Cable", "stock": 2, "price": 499, "imageUrl": "..." }
  ]
}
```

- `recentOrders` — the 5 most recent orders (cancelled orders still appear as history).
- `topProducts` — top 5 products by units sold, excluding cancelled orders (name, units, revenue).
- `lowStockList` — up to 8 products with stock ≤ 5, sorted by lowest stock first.

---

#### `GET /api/admin/users`

Paginated customer list with live order statistics. Searchable by name or email.

**Query params**: `page` (default 1), `limit` (default 20, max 50), `search` (name/email substring), `role` (`customer` | `admin`)

**Response `200`**
```json
{
  "users": [
    { "id": "664a...", "name": "Alice", "email": "alice@example.com", "role": "customer", "emailVerified": true, "createdAt": "2026-08-13T07:00:00.000Z", "orderCount": 3, "totalSpent": 6499 }
  ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

`orderCount` and `totalSpent` count non-cancelled orders only.

---

#### `GET /api/admin/users/:id`

Single user with their most recent orders and lifetime stats.

**Response `200`**
```json
{
  "user": { "id": "664a...", "name": "Alice", "email": "alice@example.com", "role": "customer", "emailVerified": true, "createdAt": "..." },
  "orders": [ { "id": "665a...", "items": [...], "total": 2499, "status": "shipped", "createdAt": "..." } ],
  "orderCount": 3,
  "totalSpent": 6499
}
```

`orders` holds the 20 most recent orders for the customer; `orderCount`/`totalSpent` cover all non-cancelled orders.

---

#### `GET /api/admin/orders`

Paginated list of all orders.

**Query params**: `page` (default 1), `limit` (default 20), `status` (optional — filter by `pending`/`confirmed`/`shipped`/`delivered`/`cancelled`)

**Response `200`**
```json
{
  "orders": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 120,
  "totalPages": 6
}
```

---

#### `GET /api/admin/orders/:id`

Single order detail with full user info.

**Response `200`** — Order object with populated `user` (name, email) and `items.product`.

---

#### `PATCH /api/admin/orders/:id/status`

Update an order's status.

**Body**
```json
{ "status": "shipped" }
```

Valid statuses: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`.

Cancelling (or moving an order to `cancelled`) is irreversible and restores the
reserved stock. Each change appends an entry to the order's `statusHistory`
and writes an `order.status_changed` audit record.

**Response `200`** — Updated order object.

**Errors** — `400` (invalid status), `404` (order not found)

---

#### `PATCH /api/admin/orders/:id/tracking`

Set or clear the carrier tracking number for an order. The number is shown to
the customer on their order page; saving with an empty value clears it.

**Body**
```json
{ "trackingNumber": "1Z999AA10123456784" }
```

**Response `200`** — Updated order object with `trackingNumber` set and a
`statusHistory` entry noting the change. Also writes an
`order.tracking_updated` audit record.

**Errors** — `400` (invalid ID or tracking number > 100 chars), `404` (order not found)

---

## Testing

An automated end-to-end regression suite lives in `tests/` and exercises every feature phase against a live server: auth/RBAC, product CRUD + caching, search & discovery (filters, sort, suggest, trending fallback), wishlist, reviews, checkout (stock decrement + discount), order management (cancel with stock restore, reorder, tracking, status timeline), admin orders/stats/users, and the audit trail. It builds the server, starts it, runs ~50 assertions, then cleans up all test data.

```powershell
# From server/ — requires MongoDB running locally
powershell -ExecutionPolicy Bypass -File tests/e2e.ps1
```

The suite is self-cleaning: test artifacts (users `e2e.*@test.local`, products named `E2E Product …`, their orders) are removed at the end via `tests/e2e-cleanup.js`, so it is safe to re-run repeatedly against a seeded database.

---

## Security

- **Helmet** — secure HTTP headers (CSP, X-Frame-Options, etc.) globally enabled.
- **CORS** — locked to the frontend origin from `CORS_ORIGIN` env var (no wildcard).
- **NoSQL injection protection** — `express-mongo-sanitize` strips `$`-prefixed and dotted keys from request bodies, queries, and params before validators/controllers run; controllers additionally treat non-string query params as absent.
- **Rate limiting** (per IP, 15-min windows, generous for demos):
  - Auth (`/register`, `/login`): `AUTH_RATE_LIMIT_MAX` (default 100).
  - Token flows (`/forgot-password`, `/reset-password`, `/verify-email`, `/resend-verification`, `/refresh`): 20.
  - Checkout (`POST /orders`): 10.
  - Discount validation: 30.
  - Search (`GET /search`, `/search/suggest`, `/search/trending`): 120.
  - Admin routes: 120.
- **Input validation** — all `POST`/`PUT`/`PATCH` routes validate required fields and types via `express-validator` before reaching controllers.
- **JWT auth** — 7-day access tokens (Bearer) + rotating, server-stored httpOnly refresh-token cookies (7-day, single-use, hashed at rest) for silent session renewal and logout revocation. The cookie is marked `Secure` when `COOKIE_SECURE=true`.
- **RBAC** — admin routes guarded by `adminMiddleware` which checks `role: "admin"`, plus a rate-limit safety net.
- **Audit trail** — `AuditLog` collection records user registrations, product create/update/delete, and order status changes (actor, action, resource, details, IP, user-agent), readable by admins via `GET /api/admin/audit`.
- **Body limits & fail-fast config** — JSON body limit `1mb`; server refuses to start without a valid `JWT_SECRET`.
- **Dependency hygiene** — `npm audit` reports **0 vulnerabilities** (transitive `tar` is overridden to a patched release).

---

## Known Limitations

1. **Vector search requires Atlas + OpenAI** — The production search path is MongoDB full-text (`$text` weighted scoring) with typo-tolerant fallbacks (Levenshtein + regex partial match). It works on any MongoDB instance with zero external setup and is what the demo uses. The true semantic vector path (`$vectorSearch` + `embedding` field, cosine similarity) is scaffolded but requires an `OPENAI_API_KEY` and an Atlas vector search index; the controller auto-falls back to text search when embeddings are unavailable.
2. **Docker Compose not verified live on the authoring machine** — Docker is not installed on the dev machine, so `docker-compose up` was not executed end-to-end here. `docker-compose.yml` and the `Dockerfile` are provided and statically consistent, and the auto-seed guarantees a fresh volume is immediately usable, but a live container run should be confirmed on a machine with Docker before relying on it.
3. **Redis is optional** — If Redis is unavailable the server logs "Redis unavailable — running without cache" and continues; caching is skipped but every endpoint still works. Trending searches need Redis: they record into a sorted set and the `/search/trending` endpoint returns an empty `terms` array (and the UI hides the section) when Redis is down.
4. **Auth rate limiting is intentionally permissive** — register/login default to 100 requests/15 min per IP to keep demos friction-free. Tighten this (e.g. `AUTH_RATE_LIMIT_MAX=10`) in production.
5. **Email delivery is a dev-mode stand-in** — verification and password-reset links are printed to the server console with a `[DEV-EMAIL]` prefix instead of being emailed. Swap in a real mailer (e.g. Nodemailer + SMTP) before production.
6. **Discount codes are global and not one-time-use** — codes like `SAVE10` apply to any checkout; there is no per-code usage cap or user binding.
7. **Single-developer scope** — This backend was built solo, covering the scope of a three-person team's server work. Some areas favor breadth over depth (see the client README for the frontend's equivalent note). See *Team & Contribution Transparency* below.

---

## Team & Contribution Transparency

This project was scoped as a **three-person team**: a frontend developer, a backend developer, and an AI/search engineer. During Weeks 1-4 the assigned team members were inactive, so **all frontend, backend, and AI/search work in this repository was completed by one author** (the repository's author), covering all three roles' scope.

| Intended role | Scope covered by the author |
|---------------|-----------------------------|
| Frontend developer | Entire `client/` — React 19 app, all pages, routing, state, styling, responsive design |
| Backend developer | This entire `server/` — Express API, MongoDB models, JWT auth, RBAC, Redis caching, Docker setup |
| AI/search engineer | `GET /api/search` — MongoDB `$text` weighted search + Levenshtein/regex typo fallbacks + scaffolded vector-search path |

This is documented openly rather than hidden: the code, tests, and bug-fix history (`INTEGRATION_TEST_BUGS.md`) are all attributable to a single contributor, and the scope was delivered in full across Weeks 1-4.

---

## Project Structure

```
server/
  src/
    config/         db.ts, redis.ts
    controllers/    authController, productController, orderController, searchController
    data/           seedData.ts (shared demo products, users, discount codes)
    middleware/     authMiddleware (JWT), adminMiddleware (role check), validate (express-validator chains)
    models/         User, Product, Order, DiscountCode
    routes/         auth, products, orders, admin, search
    utils/          generateToken, seedIfEmpty (auto-seed on empty database)
    index.ts        App entry point
  scripts/          seed.ts, generateEmbeddings.ts
  Dockerfile
  .dockerignore
  .env.example
```
