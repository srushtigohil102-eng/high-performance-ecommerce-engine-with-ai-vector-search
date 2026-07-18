# E-Commerce Frontend — Client

React-based e-commerce frontend with AI-powered vector search, built as part of a high-performance e-commerce engine.

> **Mid Review (Week 1 + Week 2)** — All features below are complete and demo-ready.

---

## Quick Start

```bash
cd client
npm install
cp .env.example .env        # set VITE_API_URL=http://localhost:5000/api
npm run dev                  # opens at http://localhost:5173
```

**Backend dependency:** The frontend connects to an Express/MongoDB backend on `http://localhost:5000`. Without it, product listing/detail pages fall back to 12 mock products. Cart, auth, and admin CRUD require the backend to be running.

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

## Week 1 + Week 2 — Completed Features

### Core UI & Layout
- Responsive layout with Navbar (hamburger on mobile), Footer, and content outlet
- Mobile-first design across all pages (1-col → 2-col → 3/4-col grid)
- Keyboard navigation and ARIA attributes on interactive elements
- Error boundary at app root with fallback UI

### Home Page (`/`)
- Product grid with responsive columns (1/2/3/4 based on screen width)
- Category filter dropdown populated from backend product data
- Debounced search input (300ms) with backend query params
- Smart pagination with ellipsis for large page counts
- Empty state with "Clear all filters" action when no results found
- Results count display ("X products found")

### Product Detail (`/product/:id`)
- Full product page with image, name, price, description, category
- Stock badge (In Stock / Low Stock / Out of Stock) with color coding
- Quantity selector with stock-aware limits (disables + at max stock)
- Add to cart button with toast notification
- Loading spinner and error/retry state
- "Product Not Found" state for invalid IDs

### Shopping Cart (`/cart`)
- Cart item list with images, names, prices, quantities
- Quantity increase/decrease with stock limit enforcement
- Remove item button per cart entry
- Subtotal calculation (price × quantity per item, summed)
- Empty cart state with "Browse Products" link
- Backend sync: optimistic UI updates with rollback on API failure
- Cart merge on login (local + remote, takes higher quantity per product)

### Authentication (`/login`)
- JWT-based login via `POST /auth/login`
- Client-side form validation (email format, password min 8 chars)
- Error display with dismiss button
- Session expired banner (shown after 401 redirect)
- Redirect to admin dashboard for admin users, home for customers
- Token persistence in localStorage with auto-clear on logout
- Auto-parse JWT for user info (id, name, email, role)

### Admin Dashboard (`/admin`)
- Protected route — requires authenticated admin role
- Product table: Name, Price, Category, Stock, Actions
- **Create**: Modal form with name, price, category (required), stock, image URL, description
- **Edit**: Pre-filled modal form, updates product via `PUT /products/:id`
- **Delete**: Confirmation dialog before deletion via `DELETE /products/:id`
- Form validation with error messages on required fields
- Refresh button to reload product list
- Toast notifications for all CRUD operations
- Security warning banner about pending backend RBAC enforcement

### Cross-Cutting
- Toast notification system (success/error/info) with auto-dismiss
- Loading spinners on all data-fetching pages
- Error messages with retry buttons on all pages
- JWT 401 interceptor: auto-clear token + redirect to `/login?session=expired`
- 404 catch-all page for unmatched routes
- Protected route guard with role-based access (admin vs customer)

---

## Architecture

```
src/
├── components/       13 reusable UI components
├── context/          3 React context providers (Cart, Auth, Toast)
├── data/             Mock data fallback (mockProducts.ts)
├── hooks/            4 custom hooks (useCart, useAuth, useToast, useDebounce)
├── pages/            6 route-level page components
├── services/         API client + auth/product/cart services
└── types/            Shared TypeScript interfaces
```

**Provider nesting:** `BrowserRouter` → `AuthProvider` → `ToastProvider` → `CartProvider` → `Routes`

**Service layer:** Pages call `productService`, `authService`, `cartService` which use `apiClient` (Axios with JWT interceptor). If the backend is unavailable, product services fall back to mock data.

**Cart sync:** Optimistic UI (instant feedback) + async backend sync. On failure, rolls back to previous state. On login, fetches remote cart and merges with local cart.

---

## Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List products (`?page`, `?limit`, `?category`, `?search`) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| POST | `/api/auth/login` | Login — returns `{ token, user }` |
| POST | `/api/auth/register` | Register — returns `{ token, user }` |
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Sync full cart |
| PUT | `/api/cart/:itemId` | Update cart item quantity |
| DELETE | `/api/cart/:itemId` | Remove cart item |

---

## Known Issues

1. **RBAC enforcement pending** — Backend role-based access control is not enforced server-side. The admin UI route guard is frontend-only. Any authenticated user could hit admin endpoints directly.
2. **Cart cleared on logout** — Local cart state resets on logout. Remote cart persists on the backend; re-login merges automatically.
3. **401 redirect uses full page reload** — The Axios interceptor redirects via `window.location.href`, which loses React state. Acceptable for current scope.
4. **Search is text-based** — Filters by name/description via query params. AI semantic (vector) search is planned for Week 3.
5. **Checkout disabled** — "Proceed to Checkout" button is disabled. Checkout flow is a Week 3 feature.
6. **Product images** — Using placeholder images from placehold.co. Real CDN/storage images planned for Week 3.

---

## Demo Script

A structured 5-minute demo walkthrough is available in [`DEMO_SCRIPT.md`](../DEMO_SCRIPT.md), covering all features with talking points and a pre-demo checklist.

---

## Week 3 — Planned

| Area | Current | Target |
|------|---------|--------|
| AI vector search | Text filter by name/description | Semantic search via vector embeddings |
| Checkout | Disabled button | Address form, payment, order confirmation |
| Product images | placehold.co placeholders | Real images from CDN/storage |
| Order history | None | User order history page |
| User roles | Admin only | Full customer role UI |
