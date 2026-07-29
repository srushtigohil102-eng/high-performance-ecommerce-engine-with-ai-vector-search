# E-Commerce API Server

Express + MongoDB + Redis backend with JWT auth, product management, cart/checkout, order tracking, admin panel, and AI vector search.

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
| `OPENAI_API_KEY` | Optional — enables vector search embeddings | —                                        |

### Run Locally

```bash
npm install
npm run dev          # starts ts-node-dev with hot reload
```

Seed the database with sample products:

```bash
npm run seed
```

### Run via Docker

```bash
docker-compose up --build
```

This starts three containers:
- **server** (this app, compiled from TypeScript)
- **mongo** (MongoDB 7, port 27017)
- **redis** (Redis 7, port 6379)

The server reaches mongo/redis by Docker service name, so `MONGO_URI` and `REDIS_URL` in `.env` are overridden by `docker-compose.yml`.

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

Rate-limited: **5 requests per 15 minutes per IP**.

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

Rate-limited: **5 requests per 15 minutes per IP**.

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

Public. AI-powered semantic search with MongoDB full-text fallback.

**Query params**
| Param   | Type   | Default | Description                |
| ------- | ------ | ------- | -------------------------- |
| `q`     | string | —       | Search query (required)    |
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

`searchMethod` is `"text"` (full-text search) or `"vector"` (Atlas vector search).

**Errors** — `400` (missing `q`)

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

**Query params**: `page` (default 1), `limit` (default 20)

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
- **Rate limiting** — auth routes (`/register`, `/login`) limited to 5 requests per 15 minutes per IP.
- **Input validation** — all `POST`/`PUT`/`PATCH` routes validate required fields and types via `express-validator` before reaching controllers.
- **JWT auth** — tokens expire after 7 days. Passwords hashed with bcrypt (salt rounds: 10).
- **RBAC** — admin routes guarded by `adminMiddleware` which checks `role: "admin"`.

---

## Project Structure

```
server/
  src/
    config/         db.ts, redis.ts
    controllers/    authController, productController, orderController, searchController
    middleware/     authMiddleware (JWT), adminMiddleware (role check), validate (express-validator chains)
    models/         User, Product, Order, DiscountCode
    routes/         auth, products, orders, admin, search
    utils/          generateToken
    index.ts        App entry point
  scripts/          seed.ts, generateEmbeddings.ts
  Dockerfile
  .dockerignore
  .env.example
```
