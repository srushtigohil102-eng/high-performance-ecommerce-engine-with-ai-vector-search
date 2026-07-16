# E-Commerce Frontend — Client

React-based e-commerce frontend with AI-powered vector search, built as part of a high-performance e-commerce engine.

## Tech Stack

- **React** 19 — UI library
- **TypeScript** 6 — Strict mode enabled (`strict: true`)
- **Vite** 8 — Build tool and dev server
- **Tailwind CSS** v4 — Utility-first styling
- **React Router** v7 — Client-side routing
- **Context API** — State management (cart, auth, toasts)
- **Axios** — HTTP client with interceptors (JWT, 401 handling)
- **oxlint** — Fast Rust-based linter

## Features

### Pages

| Page | Route | Description | Status |
|------|-------|-------------|--------|
| Home | `/` | Product grid with pagination, category filter, debounced search | Complete |
| Product Detail | `/product/:id` | Image, info, quantity selector, stock badge, add to cart with toast | Complete |
| Cart | `/cart` | Item list, quantity adjust, remove, subtotal, backend sync on login | Complete |
| Login | `/login` | JWT auth via real backend, client-side validation, error display | Complete |
| Admin | `/admin` | Protected CRUD dashboard — create/edit/delete products, refresh | Complete |
| 404 | `*` | Catch-all for unmatched routes | Complete |

### Components

| Component | Purpose |
|-----------|---------|
| `Button` | Shared button with 3 variants (primary/secondary/outline) |
| `Input` | Labeled input with error state and auto-generated IDs |
| `Navbar` | Responsive nav with hamburger menu, cart badge, auth-aware login/logout |
| `Layout` | Page shell: Navbar + Outlet + Footer |
| `Footer` | Copyright footer |
| `ProductCard` | Product grid card with image, info, stock badge, add-to-cart |
| `ProductImage` | Lazy-loaded image with skeleton pulse and fallback placeholder |
| `StockBadge` | Color-coded stock status (In Stock / Low Stock / Out of Stock) |
| `LoadingSpinner` | Animated spinner in 3 sizes |
| `ErrorMessage` | Red error box with optional children slot (retry button) |
| `ErrorBoundary` | Class component catching render errors with fallback UI |
| `ProtectedRoute` | Auth guard — redirects to /login when not authenticated |
| `Pagination` | Smart pagination with ellipsis for large page counts |

### State Management

- **CartContext** — `addToCart(product, qty)`, `removeFromCart`, `updateQuantity`, `clearCart`, `cartTotal` (all with optimistic UI + backend sync + rollback on failure)
- **AuthContext** — `login`, `logout`, `user`, `isAuthenticated`, `authError` (JWT-based, with token persistence in localStorage)
- **ToastContext** — `showToast(message, type)` with auto-dismiss after 3s

### Cross-Cutting

- Responsive design across mobile, tablet, and desktop
- Accessibility: ARIA attributes, keyboard navigation, labeled inputs, color contrast
- Error boundary at app root with fallback UI
- Loading states on all data-fetching pages
- JWT token persistence with auto-clear on 401 responses

## Backend Connectivity Matrix

| Feature | Backend Status | Fallback |
|---------|---------------|----------|
| Product listing (GET /products) | Live — real API | Mock data in dev mode if API unavailable |
| Product detail (GET /products/:id) | Live — real API | Mock data in dev mode if API unavailable |
| Product CRUD (POST/PUT/DELETE /products) | Live — real API | None (throws on failure) |
| Auth login (POST /auth/login) | Live — real API | None (shows error) |
| Cart sync (POST/GET/PUT/DELETE /cart) | Live — real API | Local-only state if API unavailable |
| Search & category filter | Passed as query params to backend | Client-side filtering on mock fallback |
| AI vector search | Not yet — Week 3 | Text search by name/description |

## Architecture Overview

```
src/
├── components/       Reusable UI components (13 components)
├── context/          React context providers (Cart, Auth, Toast)
├── data/             Mock data (mockProducts.ts) — dev-mode fallback only
├── hooks/            Custom hooks (useCart, useAuth, useToast, useDebounce)
├── pages/            Route-level page components (6 pages)
├── services/         API client, auth, product, and cart services
└── types/            Shared TypeScript interfaces
```

**Service layer pattern**: Pages import from `services/productService.ts`, which uses `apiClient` (Axios) for real backend calls. In dev mode, if the API is unavailable, it falls back to mock data with a console warning. The `services/cartService.ts` provides CRUD operations for the cart API. The `services/authService.ts` handles JWT login/register.

**Provider nesting**: `BrowserRouter` > `AuthProvider` > `ToastProvider` > `CartProvider` > `Routes`

**Cart sync strategy**: Optimistic UI updates (instant feedback) + async backend sync. On backend failure, the previous state is restored (rollback). On login, the remote cart is fetched and merged with any local cart items (takes the higher quantity for each product).

## Known Issues

1. **RBAC enforcement pending** — Backend role-based access control is not yet enforced. Currently any authenticated user can hit admin endpoints. The admin UI shows a warning banner about this.
2. **Cart lost on logout** — Cart is cleared locally on logout. Remote cart persists on the backend but local state resets. Re-login will re-fetch and merge.
3. **401 redirect causes full page reload** — The Axios interceptor redirects to `/login` via `window.location.href` on 401, which loses React state. Acceptable for now; would use React Router navigate in future.
4. **Search is text-based** — Product search filters by name/description. AI semantic (vector) search is planned for Week 3.
5. **Checkout disabled** — The "Proceed to Checkout" button is disabled. Checkout flow is a Week 3 feature.
6. **Product images** — Currently using placeholder images from placehold.co. Real product images from CDN/storage planned for Week 3.
7. **Fast-refresh lint warnings** — Context files export types alongside components, causing oxlint fast-refresh warnings. Non-functional, cosmetic only.

## How to Run (Full Stack)

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Backend server running on `http://localhost:5000`

### 1. Clone and install client

```bash
git clone <repo-url>
cd high-performance-ecommerce-engine-with-ai-vector-search/client
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different port:

```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the backend server

The backend must be running before the client can make real API calls. See the backend team's setup instructions. Expected endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/products | List products (supports `?page`, `?limit`, `?category`, `?search` query params) |
| GET | /api/products/:id | Get single product |
| POST | /api/products | Create product (admin) |
| PUT | /api/products/:id | Update product (admin) |
| DELETE | /api/products/:id | Delete product (admin) |
| POST | /api/auth/login | Login — returns `{ token, user }` |
| POST | /api/auth/register | Register — returns `{ token, user }` |
| GET | /api/cart | Get user's cart |
| POST | /api/cart | Sync full cart |
| PUT | /api/cart/:itemId | Update cart item quantity |
| DELETE | /api/cart/:itemId | Remove cart item |

### 4. Start the client dev server

```bash
npm run dev
```

The app starts at `http://localhost:5173`.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build locally |

### Dev Mode Fallback

If the backend is not running, the product listing and detail pages will fall back to 12 mock products (with a console warning). Cart, auth, and admin CRUD will fail gracefully with error messages.

## Known Mock Credentials (dev fallback)

- Email: `admin@shop.com`
- Password: any password (min 8 chars required by form validation)

## Week 1 — Complete

- All core UI pages, components, and shared layout
- Cart flow with local state (add/remove/update quantity, totals)
- Auth flow with hardcoded mock credentials
- Responsive design, accessibility, error boundary
- Product grid with pagination

## Week 2 — Complete

- Real JWT auth connected to backend (`POST /auth/login`)
- Product listing/detail connected to real backend API
- Admin CRUD (create/edit/delete) connected to real backend
- Cart backend sync with optimistic UI and rollback
- Cart merge on login (local + remote)
- Category filtering and text search via backend query params
- Debounced search input
- Stock badges (In Stock / Low Stock / Out of Stock)
- Toast notifications for user feedback
- 401 auto-redirect and token persistence
- Full regression testing and stabilization

## Week 3 — Planned

| Area | Current | Target |
|------|---------|--------|
| AI vector search | Text filter by name/description | Semantic search via vector embeddings endpoint |
| Checkout | Disabled button | Address form, payment integration, order confirmation |
| User roles | Admin only | Customer role, role-based UI |
| Product images | placehold.co placeholders | Real images from CDN/storage |
| Error handling | Basic per-page errors | Retry logic, toast notifications for network errors |
| Order history | None | User order history page |
