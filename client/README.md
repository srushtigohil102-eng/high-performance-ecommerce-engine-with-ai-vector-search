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
├── components/       Reusable UI components (Button, Input, Navbar, LoadingSpinner, etc.)
├── context/          React context providers (CartContext, AuthContext)
├── data/             Mock data (mockProducts.ts) — to be replaced with API calls
├── hooks/            Custom hooks (useCart, useAuth)
├── pages/            Route-level page components
├── services/         API client and endpoint helpers
└── types/            Shared TypeScript interfaces (Product, User, CartItem, ApiError)
```

## How to Run

```bash
npm install
npm run dev
```

The app starts at `http://localhost:5173` by default.

For the backend API, copy `.env.example` to `.env` and set `VITE_API_URL` to your API base URL (default: `http://localhost:5000/api`).

## Current Status

### Built with mock data
- Product listing (HomePage) — reads from `mockProducts.ts`
- Product detail page (ProductDetailPage) — mock lookup
- Shopping cart (CartPage) — fully functional with local state
- Navigation (Navbar) — responsive, cart badge, auth-aware login/logout
- Admin login (LoginPage) — client-side validation, redirect to `/admin`
- Protected route (ProtectedRoute) — guards `/admin` via AuthContext
- 404 page (NotFoundPage) — catch-all for unmatched routes
- Loading states on detail and cart pages — ready for async swap

### Pending for real API integration (Week 2)
- Replace `mockProducts` with `fetchProducts()` / `fetchProduct()` from `services/api.ts`
- Replace fake login with real authentication endpoint
- Add error handling for API failures and network errors
- Wire up checkout flow

### Known credentials (mock only)
- Email: `admin@shop.com` — any password works (min 8 chars required by form validation)
