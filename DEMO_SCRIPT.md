# Mid Review Demo Script

**Duration:** ~5 minutes
**Prerequisites:** `npm run dev` running in `client/` (dev mode uses mock data fallback when no backend)

---

## Demo Flow

### 1. Home Page — Product Browsing (30s)
- Open `http://localhost:5173/`
- Point out the product grid with 12 mock products
- Show responsive layout (resize browser to show 1-col mobile → 4-col desktop)
- **Mobile check:** Open DevTools device toolbar, show hamburger nav works

### 2. Category Filter (20s)
- Click the "All Categories" dropdown
- Select "Electronics" — grid filters to electronics only
- Show results count updates ("X products found")
- Switch back to "All Categories"

### 3. Search (20s)
- Type "wireless" in the search bar
- Show debounce behavior (300ms delay, no excessive API calls)
- Show filtered results
- Clear search → all products return

### 4. Empty State (15s)
- Search for "xyznonexistent" — show "No products found" message
- Show "Clear all filters" button appears
- Click it → products return

### 5. Product Detail (30s)
- Click any product card
- Show product image, name, price, description, category, stock badge
- Demonstrate quantity selector (+ / - buttons)
- Show stock limit: if product has stock=5, the + button disables at 5
- Point out "Out of Stock" state on low-stock items

### 6. Add to Cart (20s)
- Click "Add to Cart" on a product
- Show toast notification appears ("Product added to cart!")
- Cart badge in navbar updates with count
- Add a second product

### 7. Cart Page (30s)
- Click "Cart" in navbar
- Show both items with images, prices, quantities
- Increase quantity of one item → subtotal updates
- Remove an item → it disappears, subtotal updates
- Show empty cart state: "Your cart is empty" with "Browse Products" link
- Note: "Checkout coming soon — Week 3"

### 8. Login (40s)
- Click "Login" in navbar
- Show form validation: submit empty → errors appear
- Enter test credentials (email + password, min 8 chars)
- On successful login: toast "Login successful"
- If admin: navbar now shows "Admin" link and "Logout" replaces "Login"
- If customer: redirected to Home

### 9. Admin Dashboard (40s)
- Click "Admin" in navbar (only visible when logged in as admin)
- **Security demo:** Log out, try navigating directly to `/admin` → redirected to `/login`
- Log in as non-admin → navigate to `/admin` → redirected to Home
- Log in as admin → access Admin Dashboard
- Show product table with Name, Price, Category, Stock, Actions

### 10. Admin CRUD (40s)
- Click "+ Add Product" → modal form opens
- Fill in Name, Price, Category (required fields)
- Submit → product appears in table, toast "Product added successfully"
- Click "Edit" on the new product → pre-filled form
- Change name → Update → table refreshes
- Click "Delete" → confirmation dialog → Delete → product removed
- Click "Refresh" button → products reload

### 11. Error Handling (20s)
- Show the error boundary by noting it exists (don't force a crash)
- Mention: 401 interceptor auto-logs out and redirects to `/login?session=expired`
- Show the "session expired" banner on the login page

### 12. Responsive Design (20s)
- Resize browser from desktop (3-4 columns) to tablet (2 columns) to mobile (1 column)
- Show mobile hamburger menu opens/closes
- Show admin table is horizontally scrollable on small screens

---

## Key Talking Points

### Architecture
- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4
- **State:** React Context (Auth, Cart, Toast) — no external state library needed at this scale
- **Routing:** React Router v7 with nested routes and layout pattern
- **HTTP:** Axios with JWT interceptor, automatic token management

### What's Working (Week 2 Complete)
- Full product browsing with filter, search, pagination
- Product detail with stock-aware quantity selector
- Shopping cart with optimistic updates and backend sync readiness
- Admin CRUD dashboard with form validation
- Auth flow with JWT parsing, role detection, session expiry handling
- Route protection (role-based: admin vs customer)
- Responsive design (mobile-first)
- Error boundaries and graceful error states
- Toast notification system
- Loading states with descriptive messages
- Empty states with actionable CTAs

### Blocked by Backend (Flag to Backend Team)
- Redis caching (no backend server yet)
- Cache invalidation (no backend)
- AI vector search endpoint `/api/search` (planned Week 3)
- Server-side RBAC enforcement (route guard is frontend-only)
- Checkout/payment flow
- Real database persistence

---

## Pre-Demo Checklist

- [ ] `npm run dev` is running in `client/`
- [ ] Browser is clean (no devtools open initially)
- [ ] Test admin account exists (or use mock flow)
- [ ] Network tab visible for one quick reveal (show mock fallback in dev)
- [ ] DevTools device toolbar ready for mobile demo
