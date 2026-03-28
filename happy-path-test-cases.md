# Happy Path Test Cases

## Scope

These test cases validate the complete positive-flow lifecycle:

1. Product configuration
2. Variant creation
3. Stock-in (inventory batch)
4. Order creation and completion
5. Revenue/profit validation in dashboard and finance reports

## Test Data Set

Use this exact data to keep expected numbers deterministic.

- Category: `Bedsheets`
- Product Type: `Stripe`
- Sizes: `Single`, `King`
- Color 1: `White` (`#FFFFFF`)
- Color 2: `Blue` (`#0000FF`)

Variants:

- Variant A: Bedsheets / Stripe / Single / White
  - Cost: `1000`
  - Sell: `1500`
- Variant B: Bedsheets / Stripe / King / Blue
  - Cost: `1200`
  - Sell: `1800`

Stock-in batches:

- Batch A1 (Variant A): qty `10`, cost `1000`
- Batch B1 (Variant B): qty `8`, cost `1200`

Order:

- Customer: `John Test`, phone `0771234567`
- Item 1: Variant A qty `2` (no item discount)
- Item 2: Variant B qty `1` (10% item discount)
- Coupon: optional for second scenario (`SAVE5` as fixed 500)
- Manual discount: optional for second scenario (`100` fixed)

## Pre-Conditions

1. Backend and frontend are running.
2. Admin user is logged in.
3. Database is clean for this test set or uses unique names.
4. System timezone is consistent for date-based reports.

---

## Phase 1: Product Config

## TC-HP-001 Create Category

- Page: `Settings > Product Config`
- Steps:
  1. Add category `Bedsheets`.
- Expected:
  1. Success message shown.
  2. Category appears in category list.
  3. Category selectable in Product Type section.

## TC-HP-002 Create Product Type with Sizes

- Steps:
  1. Select category `Bedsheets`.
  2. Add type `Stripe`.
  3. Open sizes section for `Stripe`.
  4. Enable `Has sizes`.
  5. Add sizes `Single` and `King`.
- Expected:
  1. Type appears under `Bedsheets`.
  2. `Has sizes` is ON.
  3. Sizes list contains `Single`, `King`.

## TC-HP-003 Create Colors

- Steps:
  1. Add color `White` with hex `#FFFFFF`.
  2. Add color `Blue` with hex `#0000FF`.
- Expected:
  1. Both colors appear in colors list.
  2. Both colors selectable in Variant creation form.

---

## Phase 2: Variant Creation

## TC-HP-004 Create Variant A

- Page: `Products > Variants`
- Steps:
  1. Click `New Variant`.
  2. Select category `Bedsheets`, type `Stripe`, size `Single`, color `White`.
  3. Set cost `1000`, sell `1500`, initial stock `0`, low-stock threshold `5`.
  4. Save.
- Expected:
  1. Variant saved successfully.
  2. SKU generated automatically.
  3. Stock is `0`.
  4. Status shows `Out of Stock`.

## TC-HP-005 Create Variant B

- Steps:
  1. Create second variant: Bedsheets / Stripe / King / Blue.
  2. Set cost `1200`, sell `1800`, initial stock `0`, low-stock threshold `5`.
  3. Save.
- Expected:
  1. Variant B saved and visible in variant list.
  2. Unique SKU generated.

---

## Phase 3: Stock-In

## TC-HP-006 Stock-In Batch for Variant A

- Page: `Inventory > Stock In`
- Steps:
  1. Select Variant A combination.
  2. Enter qty `10`, cost/unit `1000`, supplier `Supplier A`.
  3. Save stock in.
- Expected:
  1. Success message.
  2. Variant A stock becomes `10`.
  3. Stock-in history has one `IN` movement with qty `10`.
  4. Batch remaining shown as `10 / 10`.

## TC-HP-007 Stock-In Batch for Variant B

- Steps:
  1. Select Variant B combination.
  2. Enter qty `8`, cost/unit `1200`, supplier `Supplier B`.
  3. Save.
- Expected:
  1. Variant B stock becomes `8`.
  2. Stock-in history has `IN` movement for Variant B with qty `8`.

## TC-HP-008 Verify All Stock Snapshot

- Page: `Inventory > All Stock` / `Products > Variants`
- Expected:
  1. Variant A stock = `10`.
  2. Variant B stock = `8`.
  3. Both show `In Stock` status.

---

## Phase 4: Order Completion (No Coupon Scenario)

## TC-HP-009 Create Order with Item Discount Only

- Page: `Orders > New Order`
- Steps:
  1. Set customer `John Test`, phone `0771234567`.
  2. Add line 1: Variant A qty `2`, item discount `0`.
  3. Add line 2: Variant B qty `1`, item discount type `percent`, value `10`.
  4. Do not apply coupon.
  5. Do not apply manual discount.
  6. Confirm order.
- Expected calculations:
  1. Line 1 gross: `2 * 1500 = 3000`.
  2. Line 2 gross: `1 * 1800 = 1800`.
  3. Line 2 discount: `10% of 1800 = 180`.
  4. Subtotal: `3000 + 1800 = 4800`.
  5. Item discount total: `180`.
  6. Final total: `4800 - 180 = 4620`.
- Expected system results:
  1. Order created with status `Completed`.
  2. Order total = `4620.00`.
  3. Order appears in `All Orders` list.

## TC-HP-010 Verify Stock Out After Order

- Expected:
  1. Variant A stock: `10 -> 8`.
  2. Variant B stock: `8 -> 7`.
  3. Stock Out screen has 2 `OUT` movements linked to order.
  4. Stock History has matching `OUT` entries with correct before/after.

---

## Phase 5: Revenue & Profit Validation

## TC-HP-011 Validate COGS and Profit for Order

- Manual expected values:
  1. COGS item 1: `2 * 1000 = 2000`.
  2. COGS item 2: `1 * 1200 = 1200`.
  3. Total COGS: `3200`.
  4. Revenue: `4620`.
  5. Gross Profit: `4620 - 3200 = 1420`.
  6. Margin: `1420 / 4620 * 100 = 30.74%` (rounded).

- Pages to verify:
  1. `Finance > Revenue & Profit` summary.
  2. `Finance > Breakdown` row(s) for this order date.

- Expected:
  1. Summary total revenue includes `4620`.
  2. Summary total cost includes `3200`.
  3. Summary gross profit includes `1420`.
  4. Profit margin approximately `30.74%`.

## TC-HP-012 Validate Dashboard KPI Consistency

- Page: `Dashboard`
- Expected:
  1. Month revenue increased by `4620`.
  2. Month profit increased by `1420`.
  3. Top selling includes Variant A qty `2` and Variant B qty `1`.
  4. Recent movement table shows order-related `OUT` entries.

---

## Phase 6: Optional Happy Path with Coupon + Manual Discount

## TC-HP-013 Create Coupon

- Page: `Finance > Coupon Codes`
- Steps:
  1. Create coupon `SAVE5`, type `fixed`, value `500`, active true.
- Expected:
  1. Coupon appears active in coupon list.

## TC-HP-014 Create Order with Coupon + Manual Discount

- Steps:
  1. Add one line: Variant A qty `1` (no item discount).
  2. Subtotal = `1500`.
  3. Apply coupon `SAVE5` => discount `500`.
  4. Apply manual fixed discount `100`.
  5. Confirm order.
- Expected:
  1. Total = `1500 - 500 - 100 = 900`.
  2. Coupon usage count increments by `1`.
  3. Stock reduces by 1 for Variant A.

## TC-HP-015 Validate Finance Impact of Discounted Order

- Expected values for this extra order:
  1. Revenue contribution = `900`.
  2. Cost contribution = `1000`.
  3. Profit contribution = `-100`.
- Expected:
  1. Finance summary aggregates include this delta.
  2. Breakdown includes this line with negative profit.

---

## End-to-End Acceptance Checklist

Mark all as pass before sign-off:

- [ ] Product masters created and selectable across pages
- [ ] Variants created with correct pricing and SKU
- [ ] Stock-in updates stock and movement history correctly
- [ ] Order totals match formula exactly
- [ ] Stock deducts correctly for each ordered line
- [ ] Stock movement ledger shows IN and OUT accurately
- [ ] Finance summary revenue/cost/profit matches manual math
- [ ] Dashboard KPIs are consistent with finance
- [ ] Coupon and manual discounts reflect correctly in totals and reports

## Execution Notes

- Run tests in sequence; each phase depends on previous data.
- Capture screenshots for each phase for audit trail.
- If reports look stale, refresh page and verify date filters include today.
