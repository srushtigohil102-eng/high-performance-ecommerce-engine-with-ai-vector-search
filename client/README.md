# E-Commerce Frontend — Client

React-based e-commerce frontend with AI-powered vector search, built as part of a high-performance e-commerce engine.

## Tech Stack

- **React** 19 — UI library
- **TypeScript** 6 — Strict mode enabled (`strict: true`)
- **Vite** 8 — Build tool and dev server
- **Tailwind CSS** v4 — Utility-first styling
- **React Router** v7 — Client-side routing
- **Context API** — State management (cart, auth)
- **oxlint** — Fast Rust-based linter

## Week 1 Summary

All core UI, cart flow, auth flow, and mock data layer are complete.

### Pages Built

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Product grid (12 items), loading spinner, error state |
| Product Detail | `/product/:id` | Image, info, quantity selector, add to cart with confirmation |
| Cart | `/cart` | Item list, quantity adjust, remove, subtotal, disabled checkout |
| Login | `/login` | Email/password form with client-side validation |
| Admin | `/admin` | Protected placeholder (requires login) |
| 404 | `*` | Catch-all for unmatched routes |

### Components

| Component | Purpose |
|-----------|---------|
| `Button` | Shared button with 3 variants (primary/secondary/outline) |
| `Input` | Labeled input with error state and auto-generated IDs |
| `Navbar` | Responsive nav with hamburger menu, cart badge, auth-aware login/logout |
| `Layout` | Page shell: Navbar + Outlet + Footer |
| `Footer` | Copyright footer |
| `ProductCard` | Product grid card with image, info, add-to-cart |
| `LoadingSpinner` | Animated spinner in 3 sizes |
| `ErrorMessage` | Red error box with optional children slot |
| `ErrorBoundary` | Class component catching render errors with fallback UI |
| `ProtectedRoute` | Auth guard, redirects to /login |

### State Management

- **CartContext** — `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `cartTotal` (computed via `useMemo`)
- **AuthContext** — `login`, `logout`, `user`, `isAuthenticated` (with `useCallback`/`useMemo` optimization)

### Cross-Cutting

- Responsive design across mobile, tablet, and desktop
- Accessibility: ARIA attributes, keyboard navigation, labeled inputs, color contrast
- Error boundary at app root with fallback UI
- Loading states on all data-fetching pages

## Architecture Overview

```
src/
├── components/       Reusable UI components (Button, Input, Navbar, etc.)
├── context/          React context providers (CartContext, AuthContext)
├── data/             Mock data (mockProducts.ts) — used by productService during development
├── hooks/            Custom hooks (useCart, useAuth) — thin wrappers with null guards
├── pages/            Route-level page components
├── services/         API client, endpoint helpers, and mock product service
└── types/            Shared TypeScript interfaces (Product, User, CartItem, ApiError)
```

**Service layer pattern**: Pages import from `services/productService.ts`, which wraps mock data in async functions with simulated delay. The `services/api.ts` file contains a generic `apiClient` fetch wrapper ready for real API integration. Swapping to real backend calls requires changing only the internals of `getProducts()` and `getProductById()` — no component changes needed.

**Provider nesting**: `BrowserRouter` > `AuthProvider` > `CartProvider` > `Routes`

## How to Run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

For the backend API, copy `.env.example` to `.env` and set `VITE_API_URL` to your API base URL (default: `http://localhost:5000/api`).

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build |

## Next Week (Week 2)

| Area | Current (Mock) | Target (Real) |
|------|----------------|---------------|
| **Products** | `productService.ts` returns hardcoded `mockProducts` with 300ms delay | Replace with real `GET /products` and `GET /products/:id` via `apiClient` |
| **Authentication** | Hardcoded `admin@shop.com` check, no token | JWT-based auth: `POST /auth/login`, token in localStorage/cookie, `GET /auth/me` for session persistence |
| **Cart persistence** | React state only — lost on refresh | Wire to backend (`GET /cart`, `POST /cart`, `PUT /cart/:id`, `DELETE /cart/:id`) or add localStorage fallback |
| **Checkout** | Disabled "Proceed to Checkout" button | Checkout page with address form, payment integration, order confirmation |
| **Search & filtering** | None | Product search (AI vector search per project spec) and category filtering |
| **User roles** | Only `admin` role | Customer role, role-based UI, order history |
| **Product images** | Placeholder images from placehold.co | Real product images from CDN/storage |
| **Error handling** | Basic error states per page | Wire `apiClient` into `productService` with retry logic and toast notifications |

## Known Mock Credentials

- Email: `admin@shop.com`
- Password: any password (min 8 chars required by form validation)
