# Final Review Demo Script

**Duration:** ~6 minutes
**Prerequisites:** `npm run dev` running in `client/` **and** the API server running on `http://localhost:5000` (seeded database with 73 products). Re-run `npm run seed` in `server/` right before the demo for a clean state (0 orders, full stock).

---

## Demo Flow

### 1. Home — Browse, Filter, Pagination (40s)
- Open `http://localhost:5173/`
- Point out the product grid with **73 seeded products**
- Show pagination: click page 2 and page 1 (13 pages at 12/page)
- **Category filter:** select "Electronics" → grid filters, "X products found" count updates; switch back to "All Categories"
- **What to say (caching):** *"The product list endpoint is served through a Redis cache with a 5-minute TTL. When an admin creates or edits a product, we invalidate the cached keys immediately, so the public storefront never shows stale data."*

### 2. Search — 3 Queries (45s)
Type these in the navbar search bar and hit Enter (or press the search button):
- **`wireless headphones`** → *"This is MongoDB full-text search using a weighted text index — name matches score 10x, descriptions 5x, categories 3x. Headphones rank above unrelated items."*
- **`headphonse`** (typo) → *"The typo-tolerant fallback kicks in: Levenshtein distance finds Wireless Bluetooth Headphones within 2 edits. Notice the 'fuzzy' badge on the results page."*
- **`electro`** (partial) → *"No product name contains 'electro', so the regex partial-match fallback surfaces the Electronics category. The badge shows 'regex'."*
- Mention: every query returns the `searchMethod` field (`text` / `fuzzy` / `regex`) and empty or malformed queries never crash — they just return an empty list.

### 3. Product Detail (30s)
- Click the **Wireless Bluetooth Headphones** card
- Show image, name, price, description, category, and the **stock badge** (In Stock / Low Stock / Out of Stock)
- Use the quantity selector; note the + button disables at the stock limit

### 4. Add to Cart (20s)
- Add quantity 2 of the headphones → toast "Product added to cart!"
- Add a second product (e.g. "Dark Chocolate 85%")

### 5. Cart + Discount Code (40s)
- Open the cart
- Increase one item's quantity → subtotal recalculates
- Enter code **`SAVE10`** → *"The discount code is validated server-side against the discount codes collection, then the backend applies the percentage to the order total. You can't just fake it in the browser — the total comes from the API."*
- Show discount line and updated total

### 6. Login + Checkout (45s)
- Click **Login** — show validation on an empty submit
- Sign in with **`customer@example.com` / `customer123`** (or register a new account)
- Complete checkout: shipping address form + "Cash on Delivery"
- Place order → **Order Confirmation** page with order ID and totals
- **What to say (inventory):** *"Checkout is atomic — the server decrements stock inside the same transaction that creates the order, so stock and orders can't drift out of sync. If stock were insufficient, the order is rejected with a 400 and the cart is preserved."*

### 7. Order History + Detail + Logout (30s)
- Open **My Orders** → the new order is listed with status "pending"
- Open the order detail → line items, pricing breakdown, shipping address
- Click **Logout** → back to home; cart badge/context is reset

### 8. Admin — Login, Product CRUD (50s)
- Log in as **`admin@example.com` / `admin123`** → navbar shows "Admin"
- **RBAC demo:** log out, try `http://localhost:5173/admin` directly → redirected to login
- Log back in as admin → **Admin Dashboard**
- Create a product (e.g. "Demo Gadget", price 29.99, Electronics) → appears in the table with a toast
- Edit its price → table refreshes
- Search for "Demo Gadget" on the public storefront → *"the product is immediately searchable, and the cache was invalidated on create."*

### 9. Admin — Order Management (30s)
- Open **Orders** tab → the customer's order is listed
- Change status to **"shipped"** → status badge updates
- Show **Stats** tab → totals, low-stock products, revenue

### 10. Public Pages Reflect Changes (20s)
- Return to the storefront (log out first)
- Search "Demo Gadget" → still findable (verify delete later if time)
- Check the product detail page shows the updated stock after the admin edit

### 11. Responsive + Error Handling (20s)
- Resize the browser: 4-col desktop → 2-col tablet → 1-col mobile; hamburger nav works
- Mention the 401 interceptor: an expired session auto-redirects to `/login?session=expired` with a banner

---

## Key Talking Points

### Search (what to say)
- **Primary path:** MongoDB `$text` with a weighted index (`product_text_search`: name 10x, description 5x, category 3x)
- **Fallbacks:** Levenshtein typo matching (≤2 edits) then regex partial match (including category names)
- **Honesty:** this is full-text search with typo tolerance, *not* AI vector search. A semantic `$vectorSearch` + OpenAI path is scaffolded but needs an Atlas index + API key — the demo uses the zero-setup path that works on any MongoDB instance.

### Caching
- Redis caches product list + search responses for 5 minutes
- Writes (product create/update/delete, order placement) invalidate the affected cache keys immediately
- If Redis is down, the server logs "running without cache" and continues — caching never blocks a request

### Inventory
- Stock is the source of truth in MongoDB; checkout validates and decrements in one atomic operation
- The UI enforces the same limits (quantity selector capped at stock, checkout blocked on out-of-stock)

### Discount logic
- Codes are validated server-side by percentage against the `discountcodes` collection
- The order total, subtotal, and discount are computed by the backend — the frontend only displays what the API returns

---

## Pre-Demo Checklist

- [ ] `npm run seed` run in `server/` (clean state: 73 products, 0 orders, full stock)
- [ ] `npm run dev` running in `client/`
- [ ] Server running on `http://localhost:5000` (`GET /api/health` → `{ status: "ok" }`)
- [ ] Browser window clean, sized for desktop first
- [ ] Test credentials at hand: admin `admin@example.com` / `admin123`, customer `customer@example.com` / `customer123`
- [ ] Discount code noted: `SAVE10`
- [ ] DevTools device toolbar ready for the mobile/responsive step
