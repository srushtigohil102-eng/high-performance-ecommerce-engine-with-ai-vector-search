# E-Commerce Frontend — Client

React-based e-commerce frontend with AI-powered vector search, built as part of a high-performance e-commerce engine.

## Tech Stack

- **React** 19 — UI library
- **TypeScript** — Strictly typed throughout
- **Vite** — Build tool and dev server
- **Tailwind CSS** v4 — Utility-first styling
- **React Router** v7 — Client-side routing
- **Context API** — State management (cart, auth)

## Folder Structure

```
src/
├── components/       Reusable UI components (Button, Input, Navbar, LoadingSpinner, ErrorBoundary, etc.)
├── context/          React context providers (CartContext, AuthContext)
├── data/             Mock data (mockProducts.ts) — used by productService during development
├── hooks/            Custom hooks (useCart, useAuth)
├── pages/            Route-level page components
├── services/         API client, endpoint helpers, and mock product service
└── types/            Shared TypeScript interfaces (Product, User, CartItem, ApiError)
```

## How to Run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

For the backend API, copy `.env.example` to `.env` and set `VITE_API_URL` to your API base URL (default: `http://localhost:5000/api`).

## Current Status (Week 1 Complete)

### Features built
- Product listing (HomePage) — loads via `productService.getProducts()` with loading/error states
- Product detail page (ProductDetailPage) — loads via `productService.getProductById()` with loading/error states
- Shopping cart (CartPage) — fully functional with local state (add, remove, quantity, subtotal)
- Navigation (Navbar) — responsive hamburger menu, cart badge, auth-aware login/logout
- Admin login (LoginPage) — client-side validation, redirect to `/admin`
- Protected route (ProtectedRoute) — guards `/admin` via AuthContext
- 404 page (NotFoundPage) — catch-all for unmatched routes
- ErrorBoundary — catches unexpected rendering errors with fallback UI
- Responsive design — tested across mobile, tablet, and desktop breakpoints
- Accessibility — proper ARIA attributes, keyboard navigation, labeled form inputs, adequate color contrast

### Mock data layer
Product data is served through `services/productService.ts`, which wraps `mockProducts.ts` in async functions with simulated network delay. Swapping to real API calls in Week 2 requires changing only the internals of `getProducts()` and `getProductById()` — no component changes needed.

### Known Issues / TODO for Week 2

| Area | What's Mocked | What Needs Wiring |
|------|---------------|-------------------|
| **Products** | `productService.ts` returns hardcoded `mockProducts` array with 300ms delay | Replace with real `GET /products` and `GET /products/:id` API calls via `apiClient` |
| **Authentication** | `AuthContext` checks `admin@shop.com` against a hardcoded `FAKE_USER` object — no token, no session | Implement JWT-based auth with `POST /auth/login`, store token in localStorage/cookie, add `GET /auth/me` for session persistence |
| **Cart persistence** | Cart lives in React state only — lost on page refresh or new tab | Wire cart to backend (`GET /cart`, `POST /cart`, `PUT /cart/:id`, `DELETE /cart/:id`) or add localStorage fallback |
| **Checkout flow** | "Proceed to Checkout" button is disabled and non-functional | Build checkout page with address form, payment integration (Stripe/similar), order confirmation |
| **Search & filtering** | No search or category filter exists | Implement product search (AI vector search per project spec) and category filtering |
| **User roles** | Only `admin` role exists in the mock user | Add customer role, role-based UI, order history |
| **Product images** | Placeholder images from placehold.co | Upload real product images to CDN/storage |
| **Error handling** | `productService` catches errors but the real API layer (`services/api.ts`) is not yet wired into the service functions | Wire `apiClient` into `productService` with proper error types, retry logic, and toast notifications |

### Known credentials (mock only)
- Email: `admin@shop.com` — any password works (min 8 chars required by form validation)
