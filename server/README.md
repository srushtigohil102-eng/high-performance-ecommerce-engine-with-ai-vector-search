# E-Commerce API Server

Express + MongoDB + Redis backend with JWT auth, product management, cart/checkout, order tracking, admin panel, and full-text product search (with a scaffolded vector-search upgrade path).

> **Weeks 1-4 Complete** — Full REST API delivered and stabilized for final review: auth + RBAC, product CRUD with Redis caching, checkout with stock decrement and discount validation, order lifecycle, admin stats, and a reliable multi-method search endpoint.

---

## Weeks 1-4 — Complete Feature Summary

### Authentication & Authorization
- `POST /api/auth/register` and `POST /api/auth/login` with bcrypt-hashed passwords (salt rounds 10) and 7-day JWT tokens
- `GET /api/auth/me` to fetch the current user from a Bearer token
- Rate limiting on auth routes (100 req / 15 min / IP, configurable)
- Role-based access control: `authMiddleware` (JWT) + `adminMiddleware` (role check) guard all admin routes server-side

### Products
- Paginated `GET /api/products` with `page` / `limit` (max 50) / `category` filter
- Product detail, create (admin), update (admin), delete (admin) with `express-validator` input validation
- Redis caching for list responses (5-min TTL), invalidated on create/update/delete so writes are never stale

### Search
- `GET /api/search` — MongoDB `$text` weighted scoring (name 10x / description 5x / category 3x) via the `product_text_search` index
- Typo-tolerant fallbacks: Levenshtein-distance matching (≤2 edits, `searchMethod: "fuzzy"`) and regex partial matching incl. category (`searchMethod: "regex"`)
- `searchMethod` field reports which engine produced results; malformed/empty queries always return `200` with a products array (never a 500)
- Semantic vector path (`$vectorSearch` + OpenAI embeddings) scaffolded, auto-activates only when product embeddings exist

### Orders & Checkout
- `POST /api/orders` — atomic checkout: validates items/stock, decrements stock, snapshots item name/price, applies discount codes server-side
- `POST /api/orders/discount/validate` — validates a discount code before checkout
- Customer order history + order detail (owner-only); admin order listing, detail, and status updates (`pending` → `confirmed` → `shipped` → `delivered`)
- `GET /api/admin/stats` — dashboard totals (products, orders, low-stock, revenue)

### Cross-Cutting
- Helmet security headers, locked CORS origin, centralized error handling with consistent status codes
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
| `JWT_SECRET`   | Secret key for signing JWT tokens        | `your-super-secret-jwt-key-change-in-production` |
| `CORS_ORIGIN`  | Allowed CORS origin (frontend URL)       | `http://localhost:5173`                   |
| `AUTH_RATE_LIMIT_MAX` | Auth route rate limit per 15 min per IP | `100` |
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
  "token": "eyJhbGci..."
}
```

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
  "token": "eyJhbGci..."
}
```

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
| Param   | Type   | Default | Description                |
| ------- | ------ | ------- | -------------------------- |
| `q`     | string | —       | Search query (optional — empty returns no results) |
| `page`  | number | `1`     | Page number                |
| `limit` | number | `12`    | Items per page (max 50)   |

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
curl "http://localhost:5000/api/search?q=wireless+headphones"
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

### Admin

All admin endpoints require **Bearer token** with `role: "admin"`.

#### `GET /api/admin/stats`

Dashboard statistics.

**Response `200`**
```json
{
  "totalProducts": 50,
  "totalOrders": 120,
  "lowStockProducts": 3,
  "totalRevenue": 15420.50
}
```

---

#### `GET /api/admin/orders`

Paginated list of all orders.

**Query params**: `page` (default 1), `limit` (default 20), `status` (optional — filter by `pending`/`confirmed`/`shipped`/`delivered`)

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

Valid statuses: `pending`, `confirmed`, `shipped`, `delivered`.

**Response `200`** — Updated order object.

**Errors** — `400` (invalid status), `404` (order not found)

---

## Security

- **Helmet** — secure HTTP headers (CSP, X-Frame-Options, etc.) globally enabled.
- **CORS** — locked to the frontend origin from `CORS_ORIGIN` env var (no wildcard).
- **Rate limiting** — auth routes (`/register`, `/login`) limited to 100 requests per 15 minutes per IP (configurable via `AUTH_RATE_LIMIT_MAX`).
- **Input validation** — all `POST`/`PUT`/`PATCH` routes validate required fields and types via `express-validator` before reaching controllers.
- **JWT auth** — tokens expire after 7 days. Passwords hashed with bcrypt (salt rounds: 10).
- **RBAC** — admin routes guarded by `adminMiddleware` which checks `role: "admin"`.

---

## Known Limitations

1. **Vector search requires Atlas + OpenAI** — The production search path is MongoDB full-text (`$text` weighted scoring) with typo-tolerant fallbacks (Levenshtein + regex partial match). It works on any MongoDB instance with zero external setup and is what the demo uses. The true semantic vector path (`$vectorSearch` + `embedding` field, cosine similarity) is scaffolded but requires an `OPENAI_API_KEY` and an Atlas vector search index; the controller auto-falls back to text search when embeddings are unavailable.
2. **Docker Compose not verified live on the authoring machine** — Docker is not installed on the dev machine, so `docker-compose up` was not executed end-to-end here. `docker-compose.yml` and the `Dockerfile` are provided and statically consistent, and the auto-seed guarantees a fresh volume is immediately usable, but a live container run should be confirmed on a machine with Docker before relying on it.
3. **Redis is optional** — If Redis is unavailable the server logs "Redis unavailable — running without cache" and continues; caching is skipped but every endpoint still works.
4. **Auth rate limiting is intentionally permissive** — register/login default to 100 requests/15 min per IP to keep demos friction-free. Tighten this (e.g. `AUTH_RATE_LIMIT_MAX=10`) in production.
5. **JWT sessions only** — 7-day expiring tokens with no refresh-token rotation or server-side revocation; a leaked token is valid until expiry.
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
