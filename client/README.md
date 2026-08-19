# E-Commerce Frontend — Client

React-based e-commerce frontend with full-text product search (MongoDB `$text` with typo-tolerant fallbacks), built as part of a high-performance e-commerce engine.

> **Weeks 1-8 Complete** — Full purchase journey built and stabilized: register, search & discovery (autocomplete, filters, sort, trending), browse by category, cart, discount codes, checkout, order history + cancellation + reorder + tracking, wishlist, customer reviews with ratings, and a full admin suite (dashboard analytics, products, orders, customers, audit log). Ready for final review.

---

## Quick Start

```bash
cd client
npm install
cp .env.example .env        # set VITE_API_URL=http://localhost:5000/api
npm run dev                  # opens at http://localhost:5173
```

**Backend dependency:** The frontend connects to an Express/MongoDB backend on `http://localhost:5000`. Product data, auth, search, discount validation, and order placement all come from the backend. Without it the app cannot function — there is no mock-data fallback.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | oxlint — zero warnings |
| `npm run preview` | Preview production build |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript 6 (strict mode) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 (nested routes) |
| State | React Context API (Auth, Cart, Toast) |
| HTTP | Axios with JWT interceptor |
| Linting | oxlint (Rust-based) |

---

## Weeks 1-3 — Complete Feature Summary

### Core UI & Layout
- Responsive layout with Navbar (hamburger on mobile), Footer, and content outlet
- Mobile-first design across all pages (1-col to 2-col to 3/4-col grid)
- Keyboard navigation and ARIA attributes on interactive elements
- Error boundary at app root with fallback UI

### Home Page (`/`)
- Product grid with responsive columns (1/2/3/4 based on screen width)
- **Shop by Category**: chip row with live product counts per category (from `GET /products/categories`), active chip highlighted, click to filter
- Smart pagination with ellipsis for large page counts
- Empty state with "Clear all filters" action when no results found
- Results count display ("X products found")

### Search (`/search`)
- Full-page search results via `GET /search?q=<query>` (MongoDB full-text search + typo-tolerant fallbacks)
- Search method badge on results page (text / fuzzy / regex)
- **Faceted filter bar**: category dropdown (with counts), min/max price, "In stock only" toggle, and sort (Relevance / Price ↑↓ / Top Rated / Newest / Name)
- Filters live in the URL (`?category=&minPrice=&maxPrice=&inStock=&sort=`) so they're shareable/back-button-safe; active filters shown as removable chips with "Clear all"
- Empty query state with trending-search chips (when Redis-powered trending is available) and example suggestions
- Zero-results state with category quick-links, popular products, and trending chips
- Pagination for search results
- Retry button on search errors

### Search Bar (navbar)
- As-you-type **autocomplete dropdown** (debounced `GET /search/suggest`): product hits with thumbnail + price that link straight to the product page, matching categories with counts, and a "Search for…" row
- Keyboard support (↑/↓ navigate, Enter selects, Esc closes) and click-outside dismissal
- On focus with an empty box, shows **trending searches** (from `GET /search/trending`) as one-click chips

### Product Detail (`/product/:id`)
- Full product page with image, name, price, description, category
- Star rating summary (average + count) under the price
- Stock badge (In Stock / Low Stock / Out of Stock) with color coding
- Quantity selector with stock-aware limits (disables + at max stock)
- Add to cart button with toast notification
- "Save to Wishlist" toggle beside Add to Cart
- "Customer Reviews" section: list of reviews with star ratings, reviewer names, dates, titles/comments, and "Load More" pagination
- Write/edit/delete your own review (guests see a log-in prompt; one review per user per product)
- Loading spinner and error/retry state
- "Product Not Found" state for invalid IDs

### Wishlist (`/wishlist`)
- Heart toggle on every product card (home, search, related, wishlist) with optimistic updates
- Dedicated wishlist page: responsive product grid, item count header, empty state with "Browse Products" CTA
- Navbar wishlist link with live count badge (desktop + mobile)
- Saved state persisted server-side per user; guests are prompted to log in when tapping the heart
- Idempotent add/remove (a product can be saved once); entries auto-clean when a product is deleted

### Reviews
- Interactive star picker + read-only star display component (partial-star support for averages)
- Product cards show a compact star rating + review count (from the product's rolling rating)
- Rating summary and review list stay in sync after create/edit/delete via a silent product refresh

### Shopping Cart (`/cart`)
- Cart item list with images, names, prices, quantities
- Quantity increase/decrease with stock limit enforcement
- Remove item button per cart entry
- Subtotal calculation (price x quantity per item, summed)
- Empty cart state with "Browse Products" link
- Cart is frontend-local (React context) — there is no server-side cart; checkout sends the item list directly to the order API
- Per-item loading overlay during quantity updates
- Discount code input with apply/remove functionality (backend-integrated via `POST /api/orders/discount/validate`)
- Checkout blocking when items are out of stock or over stock limit

### Checkout Flow (`/checkout`)
- Shipping address form with client-side validation (name, address, city, state, postal code, phone)
- US postal code format validation (`12345` or `12345-6789`)
- Payment method selection: Cash on Delivery or Mock Card
- Order summary sidebar with line items, subtotal, discount, total
- Auth guard: requires login to complete checkout (with return-to URL preservation)
- Submit button with loading spinner during order placement
- Error banner with server message on order failure (cart preserved for retry)
- Checkout blocked when cart items are out of stock

### Order Management
- **Order Confirmation** (`/order-confirmation/:orderId`): Success header with checkmark, order details, items, pricing, shipping, payment info
- **Order History** (`/orders`): List of all orders with status badges, dates, item counts, totals; empty state with "Start Shopping" CTA
- **Order Detail** (`/orders/:orderId`): Full order view with items, pricing breakdown (subtotal, discount, total), shipping address, payment method, carrier tracking number, and a vertical status timeline (from the order's `statusHistory`)
- **Cancel Order**: on `pending`/`confirmed` orders (with confirmation dialog); stock is restored server-side and the order moves to `cancelled`
- **Buy Again**: one-click reorder from any past order — re-validates stock and prices and opens the new order
- Auth-protected: redirects to login if not authenticated
- Loading, error (with retry), and empty states on all order pages
- Status badges color-coded: pending (yellow), confirmed/processing (blue), shipped (purple), delivered (green), cancelled (gray)

### Authentication (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`)
- JWT-based login via `POST /auth/login` and registration via `POST /auth/register`
- Registration page with name/email/password/confirm-password validation; successful sign-up auto-signs-in
- New accounts are unverified until the emailed link is clicked — a dismissible verification banner offers "Resend email" (links are logged to the server console in dev)
- Full password-reset flow: `POST /auth/forgot-password` → one-time link → `POST /auth/reset-password`
- Silent session renewal: a 401 auto-triggers `POST /auth/refresh` (httpOnly cookie, single-flight with queued retries) before any logout redirect
- Client-side form validation (email format, password min 8 chars)
- Error display with dismiss button
- Session expired banner (shown only after refresh fails and the user is redirected)
- Return-to URL support (`?returnTo=/checkout`) for post-login redirect
- Redirect to admin dashboard for admin users, home for customers
- Token persistence in localStorage with auto-clear on logout
- Auto-parse JWT for user info (id, name, email, role); full profile hydrated from `GET /auth/me`

### Admin Area (`/admin`)
- Protected route — requires authenticated admin role; guarded server-side by `authMiddleware` + `adminMiddleware` (RBAC enforced on the API, not just the UI)
- **Dashboard (`/admin`)**: stat cards (products, orders, low-stock, revenue) plus Top Selling Products (ranked by units sold), Low Stock Items (with out-of-stock highlighting), and Recent Orders — all linking into the detail pages
- **Products (`/admin/products`)**: product table (Name, Price, Category, Stock, Actions) with create/edit modals and delete confirmation, toast notifications for all CRUD
- **Orders (`/admin/orders`)**: filterable order list and detail page with status updates, tracking number, and customer info
- **Customers (`/admin/customers`)**: searchable user list (name/email) with role + verification badges, order counts, and total spend; detail page shows customer info, lifetime stats, and their 20 most recent orders (link to each order)
- **Audit Log (`/admin/audit`)**: paginated append-only trail of admin/auth actions, filterable by action type, with actor, resource, details, IP, and timestamp (desktop table + mobile cards)

### Cross-Cutting
- Toast notification system (success/error/info) with auto-dismiss
- Loading spinners on all data-fetching pages
- Error messages with retry buttons on all pages
- JWT 401 interceptor: silent refresh (single-flight, queued) → retry once → clear token + redirect to `/login?session=expired` on failure
- 404 catch-all page for unmatched routes
- Protected route guard with role-based access (admin vs customer)

---

## Architecture

```
src/
├── components/       21 reusable UI components
├── context/          5 React context providers (Cart, Auth, Toast, Theme, Wishlist)
├── hooks/            7 custom hooks (useCart, useAuth, useToast, useDebounce, ...)
├── pages/            22 route-level page components
├── services/         API client + auth/product/cart/order/review/wishlist/admin services (9 files)
└── types/            Shared TypeScript interfaces
```

**Provider nesting:** `BrowserRouter` -> `AuthProvider` -> `ToastProvider` -> `CartProvider` -> `Routes`

**Service layer:** Pages call `productService`, `authService`, `cartService`, `orderService`, `adminService` which use `apiClient` (Axios with JWT interceptor). All data comes from the backend API.

**Cart:** Managed entirely in frontend React state (CartContext) and **persisted to `localStorage`** (`shopnest_cart_v1`), so the cart survives page refreshes and browser restarts and is cleared after a successful checkout. There is no server-side cart API — cartService exposes no-op sync stubs. Discount validation is the one cart feature that hits the real backend. Prices/stock are re-validated server-side at checkout, so a stale persisted cart can never buy at an outdated price or oversell stock.

**Auth flow:** JWT stored in localStorage, decoded client-side for user info; full profile hydrated from `GET /auth/me`. On any 401 the Axios interceptor silently calls `POST /auth/refresh` (httpOnly cookie, requests during the refresh are queued and retried) and only redirects to `/login?session=expired` if refresh fails. Logout calls the backend to revoke the refresh token server-side. Checkout requires authentication with `?returnTo=` URL preservation.

---

## Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List products (`?page`, `?limit`, `?category`, `?search`) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/categories` | Category names with product counts |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/search` | Search (`?q`, `?page`, `?limit`, `?category`, `?minPrice`, `?maxPrice`, `?inStock`, `?sort`) — text + typo-tolerant fallbacks |
| GET | `/api/search/suggest` | Autocomplete suggestions (`?q`) — product hits, names, categories |
| GET | `/api/search/trending` | Top trending search terms |
| POST | `/api/auth/register` | Register — returns `{ token, id, name, email, role, emailVerified }` (sets refresh cookie) |
| POST | `/api/auth/login` | Login — returns `{ token, id, name, email, role, emailVerified }` (rotates refresh cookie) |
| POST | `/api/auth/refresh` | Silent session renewal — returns `{ token }`, rotates refresh cookie |
| POST | `/api/auth/logout` | Revoke refresh token + clear cookie |
| POST | `/api/auth/forgot-password` | Send password-reset link (generic response, no enumeration) |
| POST | `/api/auth/reset-password` | Reset password with one-time token |
| GET | `/api/auth/verify-email` | Verify email with one-time token (`?token=&email=`) |
| POST | `/api/auth/resend-verification` | Resend verification link (generic response, no enumeration) |
| POST | `/api/orders` | Place order (auth) |
| GET | `/api/orders` | Get user's order history (auth) |
| GET | `/api/orders/:orderId` | Get single order detail (auth) |
| POST | `/api/orders/:orderId/cancel` | Cancel a pending/confirmed order, restores stock (auth) |
| POST | `/api/orders/:orderId/reorder` | Place a new order from a past one (auth) |
| POST | `/api/orders/discount/validate` | Validate a discount code (auth) |
| GET | `/api/admin/orders` | All orders, optional `?status=` filter (admin) |
| GET | `/api/admin/orders/:orderId` | Single order detail (admin) |
| PATCH | `/api/admin/orders/:orderId/status` | Update order status (admin) |
| PATCH | `/api/admin/orders/:orderId/tracking` | Set/clear carrier tracking number (admin) |
| GET | `/api/admin/stats` | Dashboard stats incl. recent orders, top products, low-stock list (admin) |
| GET | `/api/admin/users` | Customer list w/ order stats, `?search=`/`?role=` filters (admin) |
| GET | `/api/admin/users/:userId` | Customer detail with recent orders (admin) |
| GET | `/api/admin/audit` | Paginated audit trail, optional `?action=` filter (admin) |

> Note: there is no server-side cart API. The cart lives in frontend state only; the discount validation and order placement endpoints above are the cart's backend touchpoints.

---

## Known Limitations

1. **Cart persistence is localStorage, not server-side** — The cart is persisted to `localStorage` (`shopnest_cart_v1`) so it survives refreshes, but it is device-local and not shared between devices. There is no server-side cart API: checkout sends the item list directly to the order API, which re-validates stock and prices.
2. **Guest checkout not supported** — Placing an order requires a logged-in account. Guest checkout is out of scope for the current version.
3. **Payment is mock only** — Only "Cash on Delivery" and a fake "Mock Card" option are offered. No real payment gateway or card processing is integrated.
4. **Product images are placeholders** — Seed products use picsum.photos placeholder URLs, which depend on an external service being reachable.
5. **401 redirect does a full page reload** — The Axios interceptor redirects via `window.location.href`, which loses React state. Acceptable for the current scope.
6. **Single-developer scope** — This frontend was built solo, covering the scope of a three-person team's client work (see the server README for the backend's equivalent note). Some areas favor breadth over depth. See *Team & Contribution Transparency* below for the full picture.

---

## Team & Contribution Transparency

This project was scoped as a **three-person team**: a frontend developer, a backend developer, and an AI/search engineer. During Weeks 1-4 the assigned team members were inactive, so **all frontend, backend, and AI/search work in this repository was completed by one author** (the repository's author), covering all three roles' scope.

What that means concretely:

| Intended role | Scope covered by the author |
|---------------|-----------------------------|
| Frontend developer | This entire `client/` — React 19 app, all pages, routing, state, styling, responsive design |
| Backend developer | Entire `server/` — Express API, MongoDB models, JWT auth, RBAC, Redis caching, Docker setup |
| AI/search engineer | `GET /api/search` — MongoDB `$text` weighted search + Levenshtein/regex typo fallbacks + scaffolded vector-search path |

This is documented openly rather than hidden: the code, tests, and bug-fix history (`INTEGRATION_TEST_BUGS.md`) are all attributable to a single contributor, and the scope was delivered in full across Weeks 1-4.

---

## Search — Demo Queries

These queries showcase the search engine's relevance ranking and typo tolerance (MongoDB `$text` weighted scoring with Levenshtein + regex fallbacks):

| Query | Expected Result |
|-------|-----------------|
| "wireless headphones" | Ranked electronics results (headphones before unrelated items) |
| "headphonse" (typo) | Headphones via typo-tolerant fuzzy fallback |
| "chocolate" | Grocery item(s) containing chocolate |
| "electro" (partial) | Electronics items via regex partial-match fallback |

> True semantic vector search (Atlas `$vectorSearch` + OpenAI embeddings) is scaffolded on the server but requires an embedding provider and an Atlas vector index. The shipping search path above works on any MongoDB instance with zero external setup — this is what the demo uses.

---

## Demo Script

A structured step-by-step demo walkthrough is available in [`DEMO_SCRIPT.md`](../DEMO_SCRIPT.md), covering the full purchase journey with search examples, talking points, and a pre-demo checklist.

---

## Week 4 — Remaining Work

| Area | Target | Status |
|------|--------|--------|
| Admin dashboard | UI polish, improved forms, responsive layout | Done |
| User registration | Registration page with form validation | Done |
| RBAC enforcement | Server-side role-based access control | Done |
| Final integration | Cross-team end-to-end testing with backend | Done — full E2E passing |
| Product images | Real images from CDN/storage (replace placeholder URLs) | Pending |
| Cart persistence | localStorage persistence across refreshes (server-side cart not implemented) | Done — localStorage |
| Real payments | Payment gateway integration (currently mock) | Pending |
| Responsive polish | Mobile/tablet refinements across all pages | Pending |
| Deployment | Production build optimization, deployment prep | Pending |
