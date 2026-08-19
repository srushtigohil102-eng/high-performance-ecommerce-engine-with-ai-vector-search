<#
.SYNOPSIS
  End-to-end regression suite for the ShopNest API. Covers every feature phase:
  auth/RBAC, product CRUD + caching, search & discovery (filters/sort/suggest/
  trending), wishlist, reviews, checkout (stock + discount), order management
  (cancel/reorder/tracking), admin orders, admin stats, admin users, and audit.

.DESCRIPTION
  Builds the server (tsc), starts it against the configured MongoDB, runs ~60
  assertions over the public + admin API, cleans up all test artifacts, and
  stops the server. Requires MongoDB running locally and node_modules installed.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File tests/e2e.ps1
#>

$ErrorActionPreference = 'Stop'
$serverDir = Split-Path -Parent $PSScriptRoot
$base = 'http://localhost:5000'
$pass = 0
$fail = 0
$serverProc = $null
$adminToken = ''
$custToken = ''
$createdProduct = $null
$orders = @()

function Check([string]$name, [bool]$ok, [string]$detail = '') {
  if ($ok) { $script:pass++; Write-Host "  PASS: $name" }
  else { $script:fail++; Write-Host "  FAIL: $name $detail" }
}

function NewHeaders([string]$token = '') {
  $h = @{}
  if ($token) { $h.Authorization = "Bearer $token" }
  return $h
}

function GetJson([string]$url, [string]$token = '') {
  Invoke-RestMethod -Method Get -Uri "$base$url" -Headers (NewHeaders $token)
}

function PostJson([string]$url, $body, [string]$token = '') {
  Invoke-RestMethod -Method Post -Uri "$base$url" -Headers (NewHeaders $token) -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

function PatchJson([string]$url, $body, [string]$token = '') {
  Invoke-RestMethod -Method Patch -Uri "$base$url" -Headers (NewHeaders $token) -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

function PutJson([string]$url, $body, [string]$token = '') {
  Invoke-RestMethod -Method Put -Uri "$base$url" -Headers (NewHeaders $token) -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json'
}

function DeleteJson([string]$url, [string]$token = '') {
  Invoke-RestMethod -Method Delete -Uri "$base$url" -Headers (NewHeaders $token)
}

function ExpectFailure([scriptblock]$action) {
  try { & $action | Out-Null; return $false }
  catch { return $true }
}

try {
  Write-Host '== Building server =='
  Push-Location $serverDir
  & npm run build 2>&1 | Out-Null
  $buildExit = $LASTEXITCODE
  Pop-Location
  if ($buildExit -ne 0) { throw 'server build failed' }

  Write-Host '== Starting server =='
  $serverProc = Start-Process node -ArgumentList 'dist/index.js' -WorkingDirectory $serverDir -PassThru -WindowStyle Hidden
  $ready = $false
  for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Milliseconds 500
    try { GetJson '/api/health' | Out-Null; $ready = $true; break } catch {}
  }
  Check 'server starts and reports healthy' $ready
  if (-not $ready) { throw 'server never became ready' }

  Write-Host '== Auth & RBAC =='
  $admin = PostJson '/api/auth/login' @{ email = 'admin@example.com'; password = 'admin123' }
  $script:adminToken = $admin.token
  Check 'admin login returns token' ($null -ne $script:adminToken)

  $suffix = Get-Random -Minimum 100000 -Maximum 999999
  $custEmail = "e2e.$suffix@test.local"
  $cust = PostJson '/api/auth/register' @{ name = 'E2E Tester'; email = $custEmail; password = 'password123' }
  $script:custToken = $cust.token
  Check 'customer registers and gets token' ($null -ne $script:custToken)
  Check 'guest blocked from admin endpoints' (ExpectFailure { GetJson '/api/admin/stats' })
  Check 'customer blocked from admin endpoints' (ExpectFailure { GetJson '/api/admin/stats' $script:custToken })

  Write-Host '== Products =='
  $list = GetJson '/api/products?limit=1'
  Check 'product list works' ($list.products.Count -ge 1)
  $cats = GetJson '/api/products/categories'
  Check 'categories endpoint returns 10' ($cats.categories.Count -eq 10)

  $pname = "E2E Product $suffix"
  $prod = PostJson '/api/products' @{
    name = $pname; description = 'E2E regression product'; price = 2000
    category = 'Electronics'; imageUrl = 'https://picsum.photos/seed/e2e/400/400'; stock = 10
  } $script:adminToken
  $script:createdProduct = $prod
  Check 'admin creates product' ($null -ne $prod.id)
  $productId = $prod.id

  $byId = GetJson "/api/products/$productId"
  Check 'product fetchable by id' ($byId.id -eq $productId)
  Check 'invalid product id rejected' (ExpectFailure { GetJson '/api/products/not-an-id' })

  $updated = PutJson "/api/products/$productId" @{ stock = 8 } $script:adminToken
  Check 'admin updates product stock' ($updated.stock -eq 8)
  $restored = PutJson "/api/products/$productId" @{ stock = 10 } $script:adminToken
  Check 'product stock restored for tests' ($restored.stock -eq 10)

  $cats2 = GetJson '/api/products/categories'
  $catCount = ($cats2.categories | Where-Object { $_.name -eq 'Electronics' }).count
  Check 'category count includes new product' ($catCount -ge 11)

  Write-Host '== Search & Discovery =='
  $search = GetJson "/api/search?q=$([uri]::EscapeDataString($pname))"
  Check 'text search finds new product' ($search.total -ge 1)
  $priceAsc = GetJson '/api/search?q=phone&sort=price-asc'
  $prices = @($priceAsc.products | ForEach-Object { $_.price })
  $sorted = $true
  for ($i = 1; $i -lt $prices.Count; $i++) { if ($prices[$i] -lt $prices[$i - 1]) { $sorted = $false } }
  Check 'sort=price-asc is sorted' $sorted

  $filt = GetJson "/api/search?category=Electronics&minPrice=1500&maxPrice=2500&inStock=true"
  Check 'category+price+stock filter returns array' ($filt.products -is [array])

  $sugg = GetJson "/api/search/suggest?q=E2E"
  Check 'suggest returns query/product matches' (@($sugg.queries).Count -ge 1 -or @($sugg.products).Count -ge 1)

  $tr = GetJson '/api/search/trending'
  Check 'trending degrades gracefully without redis' (@($tr.terms).Count -eq 0)

  $garbage = GetJson '/api/search?q=zzzzzzzzzz-no-such-thing'
  Check 'no-match search returns empty' ($garbage.total -eq 0)

  Write-Host '== Wishlist =='
  $null = PostJson "/api/wishlist/$productId" @{} $script:custToken
  $wl = GetJson '/api/wishlist' $script:custToken
  Check 'wishlist contains product' (@($wl | Where-Object { $_.id -eq $productId -or $_.product.id -eq $productId }).Count -ge 1)
  $null = DeleteJson "/api/wishlist/$productId" $script:custToken
  $wl2 = GetJson '/api/wishlist' $script:custToken
  Check 'wishlist remove works' (@($wl2 | Where-Object { $_.id -eq $productId -or $_.product.id -eq $productId }).Count -eq 0)

  Write-Host '== Reviews =='
  $rev = PostJson "/api/products/$productId/reviews" @{ rating = 5; comment = 'E2E review comment'; title = 'E2E review' } $script:custToken
  Check 'review created' ($null -ne $rev.id)
  $pAfter = GetJson "/api/products/$productId"
  Check 'product rating synced to 5' ($pAfter.rating -eq 5 -and $pAfter.numReviews -eq 1)
  $revs = GetJson "/api/products/$productId/reviews"
  Check 'product reviews lists review' ($revs.reviews.Count -eq 1)
  $null = PutJson "/api/reviews/$($rev.id)" @{ rating = 4; comment = 'E2E review edited' } $script:custToken
  $pAfter2 = GetJson "/api/products/$productId"
  Check 'product rating synced to 4 after edit' ($pAfter2.rating -eq 4)
  $null = DeleteJson "/api/reviews/$($rev.id)" $script:custToken
  $pAfter3 = GetJson "/api/products/$productId"
  Check 'product rating cleared after review delete' ($pAfter3.numReviews -eq 0)

  Write-Host '== Checkout (stock + discount) =='
  $orderA = PostJson '/api/orders' @{
    items = @(@{ product = $productId; quantity = 2 })
    shippingAddress = @{ street = '1 E2E St'; city = 'Mumbai'; state = 'MH'; zipCode = '400001'; country = 'India' }
    paymentMethod = 'cod'; discountCode = 'SAVE10'
  } $script:custToken
  $script:orders = @($orderA)
  Check 'order created' ($null -ne $orderA.id)
  Check 'subtotal 2x2000' ($orderA.subtotal -eq 4000)
  Check 'SAVE10 discount applied' ($orderA.discount -eq 400)
  Check 'total 4000-400' ($orderA.total -eq 3600)
  $stockAfter = GetJson "/api/products/$productId"
  Check 'stock decremented 10->8' ($stockAfter.stock -eq 8)

  Write-Host '== Order management (cancel / reorder / tracking) =='
  $cancelled = PostJson "/api/orders/$($orderA.id)/cancel" @{} $script:custToken
  Check 'order cancelled' ($cancelled.status -eq 'cancelled')
  $stockRestored = GetJson "/api/products/$productId"
  Check 'stock restored to 10 after cancel' ($stockRestored.stock -eq 10)

  $orderB = PostJson "/api/orders/$($orderA.id)/reorder" @{} $script:custToken
  $script:orders = @($orderB, $orderA)
  Check 'reorder creates new order' ($null -ne $orderB.id -and $orderB.id -ne $orderA.id)
  Check 'reorder carries items/qty' ($orderB.subtotal -eq 4000)
  $stockAfterReorder = GetJson "/api/products/$productId"
  Check 'reorder decrements stock' ($stockAfterReorder.stock -eq 8)

  $adminOrders = GetJson '/api/admin/orders' $script:adminToken
  Check 'admin orders list contains our order' (@($adminOrders.orders | Where-Object { $_.id -eq $orderB.id }).Count -ge 1)
  $confirmed = PatchJson "/api/admin/orders/$($orderB.id)/status" @{ status = 'confirmed' } $script:adminToken
  Check 'admin confirms order' ($confirmed.status -eq 'confirmed')
  Check 'statusHistory has 2 entries' ($confirmed.statusHistory.Count -eq 2)
  $tracked = PatchJson "/api/admin/orders/$($orderB.id)/tracking" @{ trackingNumber = 'TRK-E2E-0001' } $script:adminToken
  Check 'tracking number set' ($tracked.trackingNumber -eq 'TRK-E2E-0001')
  $orderDetail = GetJson "/api/admin/orders/$($orderB.id)" $script:adminToken
  Check 'admin order detail has customer' ($null -ne $orderDetail.user -and $orderDetail.user.email -eq $custEmail)

  Write-Host '== Admin stats =='
  $stats = GetJson '/api/admin/stats' $script:adminToken
  Check 'stats totals present' ($stats.totalProducts -ge 1 -and $stats.totalOrders -ge 1)
  $top = $stats.topProducts | Where-Object { $_.name -eq $pname }
  Check 'topProducts includes our product' ($null -ne $top)
  Check 'topProducts quantity = 2' ($top.quantitySold -eq 2)
  Check 'recentOrders includes order B' ($null -ne ($stats.recentOrders | Where-Object { $_.id -eq $orderB.id }))
  Check 'lowStockList is array' ($stats.lowStockList -is [array])

  Write-Host '== Admin users =='
  $users = GetJson '/api/admin/users' $script:adminToken
  Check 'users list is array' ($users.users -is [array])
  $found = GetJson "/api/admin/users?search=$([uri]::EscapeDataString($custEmail))" $script:adminToken
  $u = $found.users | Where-Object { $_.email -eq $custEmail } | Select-Object -First 1
  Check 'user search finds customer' ($null -ne $u)
  Check 'orderCount excludes cancelled (1 active)' ($u.orderCount -eq 1)
  Check 'totalSpent = 4000 (reorder, no discount)' ($u.totalSpent -eq 4000)
  $detail = GetJson "/api/admin/users/$($u.id)" $script:adminToken
  Check 'user detail returns orders' ($detail.orders.Count -ge 1)

  Write-Host '== Audit =='
  $audit = GetJson '/api/admin/audit?action=product.created' $script:adminToken
  Check 'audit product.created for our product' (@($audit.logs | Where-Object { $_.resourceId -eq $productId }).Count -ge 1)
  $auditStatus = GetJson '/api/admin/audit?action=order.status_changed' $script:adminToken
  Check 'audit order.status_changed for order B' (@($auditStatus.logs | Where-Object { $_.resourceId -eq $orderB.id }).Count -ge 1)

  Write-Host ''
  Write-Host "RESULT: $pass passed, $fail failed"
}
catch {
  Write-Host "ERROR: $_"
  $script:fail++
  Write-Host "RESULT: $pass passed, $fail failed"
}
finally {
  Write-Host '== Cleanup =='
  # Cancel any still-active orders (restores stock) and delete the test product
  foreach ($order in $script:orders) {
    if ($order.status -eq 'cancelled') { continue }
    try {
      $c = PostJson "/api/orders/$($order.id)/cancel" @{} $script:custToken
      Write-Host "  cancelled order $($order.id) -> $($c.status)"
    } catch { Write-Host "  cancel $($order.id): $_" }
  }
  if ($script:createdProduct) {
    try { DeleteJson "/api/products/$($script:createdProduct.id)" $script:adminToken | Out-Null; Write-Host '  deleted test product' }
    catch { Write-Host "  delete product: $_" }
  }
  # Remove all test users/orders/products (idempotent, pattern-scoped)
  try {
    Push-Location $serverDir
    & node tests/e2e-cleanup.js
    Pop-Location
  } catch { Write-Host "  cleanup script: $_" }
  if ($serverProc -and -not $serverProc.HasExited) { Stop-Process -Id $serverProc.Id -Force }
}
