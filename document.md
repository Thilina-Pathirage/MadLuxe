# MADLAXUE System Documentation

## 1. Overview

This project is an inventory + order + finance system with:

- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: Next.js + MUI dashboard
- **Storage model**: Master data (Category/Type/Color), sellable Variants, immutable stock ledger, Orders, Coupons, Finance reports

The main business flow is:

1. Configure product masters (Category, Product Type, Color, Sizes)
2. Create sellable Variant (SKU level)
3. Add stock (stock-in batches)
4. Sell via order (stock out + discounts + coupon)
5. Compute profit from sold items (FIFO batch cost snapshots)

---

## 2. Database Structure (Collections / “Tables”)

## 2.1 `categories`
Purpose: top-level grouping (e.g., Bedsheets, Blankets).

Fields:

- `_id`
- `name` (unique, required)
- `description`
- `isActive` (soft-delete flag)
- `createdAt`, `updatedAt`

Rules:

- Category names must be unique.
- Category is soft-deleted (`isActive=false`) if no product types depend on it.

## 2.2 `producttypes`
Purpose: product model/type under a category (e.g., Stripe, Egyptian Cotton).

Fields:

- `_id`
- `category` (FK -> `categories._id`)
- `name`
- `hasSizes` (boolean)
- `sizes` (string array)
- `isActive`
- `createdAt`, `updatedAt`

Indexes:

- Unique compound index: `{ category, name }`

Rules:

- Type must belong to a valid category.
- If `hasSizes=false`, variants normally use `N/A` size.
- Type is soft-deleted if no variants depend on it.

## 2.3 `colors`
Purpose: color master.

Fields:

- `_id`
- `name` (unique)
- `hexCode`
- `isActive`
- `createdAt`, `updatedAt`

Rules:

- Color names must be unique.
- Color is soft-deleted if no variants depend on it.

## 2.4 `variants`
Purpose: sellable SKU-level product (category + type + size + color).

Fields:

- `_id`
- `sku` (unique, uppercase)
- `category` (FK)
- `productType` (FK)
- `size` (default `N/A`)
- `color` (FK)
- `costPrice`
- `sellPrice`
- `stockQty`
- `lowStockThreshold`
- `images[]`
  - `fileId`
  - `filename`
  - `contentType`
  - `size`
  - `url`
  - `isPrimary`
  - `sortOrder`
- `isActive`
- `createdAt`, `updatedAt`

Virtual field:

- `status`
  - `Out of Stock` when `stockQty == 0`
  - `Low Stock` when `stockQty <= lowStockThreshold`
  - `In Stock` otherwise

Rules:

- SKU is generated automatically from category/type code + sequence.
- Variant identity is treated as category+type+size+color; update API avoids changing those identity fields.

## 2.5 `stockmovements`
Purpose: immutable inventory ledger for all stock changes.

Fields:

- `_id`
- `variant` (FK)
- `type` (`IN` | `OUT` | `ADJUST`)
- `adjustDirection` (`add` | `reduce` | null)
- `qty`
- `qtyBefore`
- `qtyAfter`
- `costPrice` (usually set for `IN` batches)
- `reason`
- `orderId` (FK, nullable)
- `supplier`
- `notes`
- `createdBy`
- `qtyRemaining` (for FIFO, mainly on `IN` rows)
- `createdAt`, `updatedAt`

Rules:

- `IN`: stock added (purchase/initial)
- `OUT`: stock reduced due to order fulfillment
- `ADJUST`: manual corrections
- Ledger is append-only in normal flows.

## 2.6 `orders`
Purpose: sales transaction header + line items.

Order Header fields:

- `_id`
- `orderRef` (unique, e.g., `ORD-001`)
- `customerName`
- `customerPhone`
- `items[]`
- `subtotal` (gross sum of line totals)
- `itemDiscountAmount` (sum of line-level discount amounts)
- `coupon` (FK to coupon, nullable)
- `couponCode`
- `discountAmount` (coupon discount amount)
- `manualDiscountType` (`percent` | `fixed` | null)
- `manualDiscount`
- `manualDiscountAmount`
- `total`
- `status` (`Pending` | `Completed` | `Cancelled`), default `Completed`
- `notes`
- `createdAt`, `updatedAt`

Order Line fields:

- `variant` (FK)
- `variantLabel` (snapshot text)
- `qty`
- `unitPrice` (snapshot sell price)
- `costPrice` (snapshot cost used in P&L)
- `lineTotal` (`qty * unitPrice`)
- `discountType` (`percent` | `fixed` | null)
- `discount`
- `discountAmount`
- `lineFinal` (`lineTotal - discountAmount`)
- `batchSourceMovementId` (first FIFO batch used)
- `batchCostPrice` (weighted cost across consumed batches)

Rules:

- Order is the source of truth for revenue and cost snapshots.
- Line snapshots protect finance reporting from future product price edits.

## 2.7 `couponcodes`
Purpose: reusable discount definitions.

Fields:

- `_id`
- `code` (unique, uppercase)
- `type` (`percent` | `fixed`)
- `value`
- `minOrderValue`
- `usageLimit`
- `usedCount`
- `expiryDate`
- `isActive`
- `createdAt`, `updatedAt`

Rules:

- Percent coupon value cannot exceed 100.
- Coupon application checks active, expiry, usage limit, and minimum order value.

## 2.8 `users`
Purpose: authentication users.

Fields:

- `_id`
- `username` (unique, lowercase)
- `password` (hashed in auth flow)
- `role` (`admin`)
- `createdAt`, `updatedAt`

---

## 3. Product Configuration Flow (Master Data)

Frontend page: `settings/product-config`

1. Create/update/deactivate Category.
2. Create/update/deactivate Product Type under a selected Category.
3. Enable/disable type sizing (`hasSizes`) and manage `sizes[]`.
4. Create/update/deactivate Color.

Business logic:

- Category cannot be deleted if Product Types exist under it.
- Product Type cannot be deleted if Variants exist under it.
- Color cannot be deleted if Variants use it.
- Deletes are soft deletes (`isActive=false`), not hard deletes.

---

## 4. Variant Creation Flow

Frontend page: `products/variants` (New Variant dialog)

User selects:

- Category
- Type
- Size (or `N/A`)
- Color
- Cost price, sell price
- Initial stock qty
- Low-stock threshold
- Optional image

Backend logic:

1. Validates IDs and prices.
2. Loads category and type.
3. Generates next SKU using category/type-based code + sequence.
4. Creates Variant with selected attributes.
5. Uploads images to GridFS and stores image metadata in Variant.
6. If initial stock > 0, creates stock movement `IN` row.

Important note:

- Initial stock is recorded in stock quantity and movement log.

---

## 5. Stock-In Flow (Purchasing / Refill)

Frontend page: `inventory/stock-in`

1. User picks exact variant identity (category, type, size, color).
2. System finds matching variant.
3. User enters qty and unit cost.
4. Backend increments `Variant.stockQty`.
5. Backend inserts `StockMovement` type `IN` with:
   - `qtyBefore`, `qtyAfter`
   - batch `costPrice`
   - `qtyRemaining = qty` (FIFO availability)

Business meaning:

- Every stock-in is a FIFO batch with its own unit cost.
- Inventory value and order COGS can come from batch-level costs.

---

## 6. Manual Adjustment Flow

Frontend page: `inventory/adjustments`

Use when physical count differs from system count.

1. Pick variant identity.
2. Choose `add` or `reduce`.
3. Enter qty + reason + optional notes.
4. Backend validates non-negative final stock.
5. Backend updates `Variant.stockQty` and logs `ADJUST` movement.

Business rules:

- Reason is mandatory.
- Quantity must be >= 1.
- Reducing beyond available stock is blocked.

---

## 7. Order Creation Flow (Checkout)

Frontend page: `orders/new-order`

## 7.1 Add line items

Each line is selected by category/type/size/color and qty.

For each line, backend:

1. Validates variant exists and is active.
2. Validates requested qty <= available stock.
3. Computes line gross: `lineTotal = qty * sellPrice`.
4. Applies line discount:
   - percent: `lineTotal * percent / 100`
   - fixed: min(fixed, lineTotal)
5. Computes `lineFinal = lineTotal - lineDiscount`.

## 7.2 FIFO batch cost allocation

For each line, backend allocates from oldest `IN` batches first (`qtyRemaining > 0`):

- Consume from oldest batch to newest until full qty allocated.
- Decrement batch `qtyRemaining` as units are consumed.
- Compute weighted average cost across consumed batches:

`weightedAvgCost = sum(allocatedQty * batchCost) / sum(allocatedQty)`

Store in order line:

- `batchSourceMovementId` (first consumed batch)
- `batchCostPrice` and `costPrice` = weighted average

## 7.3 Order-level discounts and total

Order-level discount layers:

1. **Item-level discounts** (already in each line)
2. **Coupon discount** on base `(subtotal - itemDiscountAmount)`
3. **Manual discount** on base `(subtotal - itemDiscountAmount - couponDiscount)`

Final total:

`total = max(0, subtotal - itemDiscountAmount - couponDiscountAmount - manualDiscountAmount)`

## 7.4 Persist + stock update

1. Generate `orderRef` (`ORD-xxx`).
2. Save order with full snapshots.
3. Deduct variant stock quantities.
4. Create `OUT` stock movement rows.
5. Increment coupon `usedCount` if coupon applied.

---

## 8. Coupon Logic

Coupon validation endpoint checks:

- Coupon code exists
- Active status
- Not expired
- Usage limit not reached
- Minimum order value satisfied

If valid:

- Discount amount is returned (percent or fixed)
- Order creation re-validates coupon server-side before final save

---

## 9. Finance & Profit Logic

Frontend page: `finance/revenue-profit`

Finance uses only `Order.status = Completed`.

## 9.1 Summary metrics

- `totalRevenue = sum(order.total)`
- `totalCost = sum(order.items.costPrice * qty)`
- `grossProfit = totalRevenue - totalCost`
- `profitMargin = grossProfit / totalRevenue * 100`

## 9.2 Charting

- Monthly mode: Jan–Dec buckets for selected year
- Daily mode: 1..N day buckets for selected month
- Each bucket includes revenue, cost, and profit

## 9.3 Breakdown rows

Per order line, API returns:

- variant label/SKU
- qty sold
- cost snapshot
- revenue (line final)
- line profit

This allows auditing profitability at SKU line level.

---

## 10. Dashboard Logic

Dashboard combines inventory and finance snapshots:

- Total active variants
- Low stock count (`stockQty <= lowStockThreshold`)
- Out-of-stock count (`stockQty == 0`)
- Stock value (`sum(stockQty * variant.costPrice)`) 
- Monthly revenue and profit from completed orders
- Recent stock movements
- Top selling variants of current month

---

## 11. Image Handling

Variant images are stored in MongoDB GridFS.

Flow:

1. Upload image(s) to GridFS bucket.
2. Save metadata in `Variant.images[]`.
3. One image can be marked as primary.
4. Public image stream endpoint serves image by `fileId`.

Benefits:

- Images stay linked to variant records.
- Metadata enables sorting/primary selection/history.

---

## 12. Validation & Error Handling

Validation:

- Express-validator on request payloads for major endpoints.
- Mongoose schema validation for persistence constraints.

Error handling:

- Duplicate key -> friendly message (`field already exists`)
- Invalid ObjectId -> `Invalid ID format`
- Multer upload limits/types handled centrally
- Unified success/error response format

---

## 13. API Protection & Security Basics

- `/api/auth/*` is open for login-related actions.
- Most `/api/*` routes are protected by JWT middleware.
- CORS allowlist via env `ALLOWED_ORIGINS`.
- Rate limiting applied to `/api/*`.
- Helmet security headers enabled.

---

## 14. End-to-End Data Flow (Simple)

1. **Configure Masters**
   - Admin creates Category -> Product Type (+sizes) -> Color

2. **Create Variant**
   - Admin creates SKU-level variant with prices and optional initial stock

3. **Stock In**
   - Admin adds batch stock with cost; system creates `IN` ledger rows

4. **Create Order**
   - Cashier/admin selects variants and qty, adds discounts/coupon
   - Backend validates stock and allocates FIFO batches
   - Order saved with revenue/cost snapshots
   - Stock reduced and `OUT` rows logged

5. **Report Profit**
   - Finance APIs aggregate completed orders
   - Revenue and COGS derived from stored snapshots
   - Profit dashboards/charts/breakdowns rendered in frontend

---

## 15. Business Logic Checklist (What is enforced)

- [x] Soft delete for master data
- [x] Prevent deleting master rows if dependent data exists
- [x] SKU uniqueness
- [x] Non-negative prices and stock thresholds
- [x] Inventory movement audit logging
- [x] Stock cannot go negative in order/adjustment flows
- [x] Multi-layer discounting (item + coupon + manual)
- [x] Coupon validity/expiry/usage/minimum checks
- [x] Cost snapshot persistence for later P&L

---

## 16. Known Logic Risks to Review

These are important for production-hardening and accounting integrity.

1. **Initial stock FIFO availability**
   - Initial stock movement created during variant creation may need `qtyRemaining` initialized like normal `IN` batches.

2. **Order transaction safety**
   - FIFO decrement + order save + stock decrement should ideally run in a DB transaction to avoid partial failure drift.

3. **Order cancellation path**
   - Cancel currently only permits `Pending`, while order default status is `Completed`; this needs clear operational intent.

4. **Adjustment vs FIFO reconciliation**
   - Manual adjustments change total stock but do not always rebalance batch-level remaining quantities.

5. **Category filter pagination in stock movements**
   - Filtering after populate can cause total/page mismatch in response metadata.

---

## 17. Frontend-to-Backend Page Mapping

- Product Config: manages Category/Type/Color masters
- Variants: SKU-level CRUD + image management
- All Products: grouped view of variants by category/type
- Stock In: incoming batch entries (`IN` movements)
- Stock Out: outgoing records (`OUT` movements)
- Adjustments: manual corrections (`ADJUST` movements)
- New Order: checkout + discounts + coupon
- All Orders: order list + line details
- Revenue & Profit: summary KPIs + chart + breakdown
- Dashboard: business overview + top-selling + recent movement

---

## 18. Summary

The system follows a strong pattern:

- Master data defines valid product combinations
- Variant is the sellable SKU unit
- Stock movement ledger captures every inventory change
- Orders snapshot price/cost at sale time
- Finance derives profit from immutable order snapshots

With transaction hardening and FIFO consistency improvements, the current design can support accurate inventory and profitability reporting at scale.
