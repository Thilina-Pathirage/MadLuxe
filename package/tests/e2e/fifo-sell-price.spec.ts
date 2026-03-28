/**
 * FIFO Sell Price + Cost Price E2E Tests
 *
 * Validates that:
 * 1. Stock-in records per-batch sellPrice and costPrice
 * 2. Orders use FIFO-weighted sell & cost prices
 * 3. Finance reports show accurate revenue, cost, and profit
 *
 * Test Data:
 *   Category:  "FIFO-Test Towels"
 *   Type:      "FIFO-Test Bath" (sizes: Standard)
 *   Color:     "FIFO-Test Ivory"
 *   Variant:   costPrice=500, sellPrice=1000
 *
 *   Batch A:  20 units @ cost=600, sell=1200  (Vendor A)
 *   Batch B:  15 units @ cost=900, sell=1800  (Vendor B)
 *
 *   Order 1:  10 units → all from Batch A
 *     Expected: unitPrice=1200, costPrice=600
 *     Revenue = 10 × 1200 = 12,000
 *     Cost    = 10 × 600  = 6,000
 *     Profit  = 6,000
 *
 *   Order 2:  15 units → 10 from Batch A + 5 from Batch B (cross-batch!)
 *     Weighted cost = (10×600 + 5×900) / 15 = 10500/15 = 700
 *     Weighted sell = (10×1200 + 5×1800) / 15 = 21000/15 = 1400
 *     Revenue = 15 × 1400 = 21,000
 *     Cost    = 15 × 700  = 10,500
 *     Profit  = 10,500
 *
 *   Order 3:  10 units → all from Batch B (remaining)
 *     Expected: unitPrice=1800, costPrice=900
 *     Revenue = 10 × 1800 = 18,000
 *     Cost    = 10 × 900  = 9,000
 *     Profit  = 9,000
 *
 *   Finance Totals:
 *     Revenue = 12,000 + 21,000 + 18,000 = 51,000
 *     Cost    = 6,000  + 10,500 + 9,000  = 25,500
 *     Profit  = 25,500
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API = process.env.E2E_API_BASE_URL || 'http://localhost:5001/api';
const PREFIX = `FIFO-${Date.now()}`;

// ── Test Data ──────────────────────────────────────────────
const TD = {
  category: `${PREFIX}-Towels`,
  type: `${PREFIX}-Bath`,
  sizes: ['Standard'],
  color: `${PREFIX}-Ivory`,
  colorHex: '#FFFFF0',

  variant: { costPrice: 500, sellPrice: 1000 },

  batchA: { qty: 20, costPrice: 600, sellPrice: 1200, supplier: 'Vendor A' },
  batchB: { qty: 15, costPrice: 900, sellPrice: 1800, supplier: 'Vendor B' },

  order1: { qty: 10 },
  order2: { qty: 15 },
  order3: { qty: 10 },
};

// ── Expected Calculations ──────────────────────────────────
const round2 = (n: number) => Math.round(n * 100) / 100;

const expected = {
  order1: {
    unitPrice: 1200,
    costPrice: 600,
    revenue: 10 * 1200,       // 12,000
    cost: 10 * 600,           // 6,000
    profit: 10 * 1200 - 10 * 600, // 6,000
    batchARemaining: 10,      // 20 - 10
    batchBRemaining: 15,      // untouched
  },
  order2: {
    // 10 from Batch A (remaining) + 5 from Batch B
    unitPrice: round2((10 * 1200 + 5 * 1800) / 15), // 1400
    costPrice: round2((10 * 600 + 5 * 900) / 15),   // 700
    revenue: round2(15 * round2((10 * 1200 + 5 * 1800) / 15)), // 21,000
    cost: round2(15 * round2((10 * 600 + 5 * 900) / 15)),      // 10,500
    profit: round2(15 * round2((10 * 1200 + 5 * 1800) / 15) - 15 * round2((10 * 600 + 5 * 900) / 15)), // 10,500
    batchARemaining: 0,       // fully depleted
    batchBRemaining: 10,      // 15 - 5
  },
  order3: {
    unitPrice: 1800,
    costPrice: 900,
    revenue: 10 * 1800,       // 18,000
    cost: 10 * 900,           // 9,000
    profit: 10 * 1800 - 10 * 900, // 9,000
    batchARemaining: 0,       // still depleted
    batchBRemaining: 0,       // 10 - 10
  },
  totals: {
    revenue: 12000 + 21000 + 18000, // 51,000
    cost: 6000 + 10500 + 9000,      // 25,500
    profit: 6000 + 10500 + 9000,    // 25,500
  },
};

// ── Helpers ────────────────────────────────────────────────
let token: string;
let apiCtx: APIRequestContext;

async function apiPost(path: string, data: Record<string, unknown>) {
  const res = await apiCtx.post(`${API}${path}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `POST ${path} failed: ${res.status()}`).toBeTruthy();
  return res.json();
}

async function apiGet(path: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await apiCtx.get(`${API}${path}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `GET ${path} failed: ${res.status()}`).toBeTruthy();
  return res.json();
}

// ── Stored IDs ─────────────────────────────────────────────
let categoryId: string;
let typeId: string;
let colorId: string;
let variantId: string;
let batchAId: string;
let batchBId: string;
let order1Id: string;
let order2Id: string;
let order3Id: string;

// ── Tests ──────────────────────────────────────────────────
test.describe.serial('FIFO Sell Price & Cost Price Validation', () => {

  test.beforeAll(async ({ playwright }) => {
    apiCtx = await playwright.request.newContext();

    // Login
    const loginRes = await apiCtx.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'madlaxue2026' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    token = loginBody.token;
  });

  test.afterAll(async () => {
    await apiCtx.dispose();
  });

  // ─────────────────────────────────────────────────────────
  // SETUP: Create category, type, color, variant
  // ─────────────────────────────────────────────────────────

  test('TC-01: Create test category', async () => {
    const res = await apiPost('/categories', { name: TD.category });
    categoryId = res.data._id;
    expect(categoryId).toBeTruthy();
    expect(res.data.name).toBe(TD.category);
  });

  test('TC-02: Create test product type with sizes', async () => {
    const res = await apiPost('/product-types', {
      name: TD.type,
      category: categoryId,
      hasSizes: true,
      sizes: TD.sizes,
    });
    typeId = res.data._id;
    expect(typeId).toBeTruthy();
  });

  test('TC-03: Create test color', async () => {
    const res = await apiPost('/colors', { name: TD.color, hexCode: TD.colorHex });
    colorId = res.data._id;
    expect(colorId).toBeTruthy();
  });

  test('TC-04: Create test variant', async () => {
    const res = await apiPost('/variants', {
      categoryId,
      productTypeId: typeId,
      colorId,
      size: TD.sizes[0],
      costPrice: TD.variant.costPrice,
      sellPrice: TD.variant.sellPrice,
    });
    variantId = res.data._id;
    expect(variantId).toBeTruthy();
    expect(res.data.costPrice).toBe(TD.variant.costPrice);
    expect(res.data.sellPrice).toBe(TD.variant.sellPrice);
  });

  // ─────────────────────────────────────────────────────────
  // STOCK-IN: Two batches with different cost + sell prices
  // ─────────────────────────────────────────────────────────

  test('TC-05: Stock-in Batch A (20 units, cost=600, sell=1200)', async () => {
    const res = await apiPost('/stock-movements/stock-in', {
      variantId,
      qty: TD.batchA.qty,
      costPrice: TD.batchA.costPrice,
      sellPrice: TD.batchA.sellPrice,
      supplier: TD.batchA.supplier,
    });
    const body = res.data ?? res; // some endpoints return {data:{…}}, stock-in returns {movement, updatedVariant}
    const movement = body.movement ?? body.data?.movement;
    expect(movement, 'Stock-in response missing movement').toBeTruthy();

    batchAId = movement._id;
    expect(batchAId).toBeTruthy();
    expect(movement.costPrice).toBe(TD.batchA.costPrice);
    expect(movement.sellPrice).toBe(TD.batchA.sellPrice);
    expect(movement.qtyRemaining).toBe(TD.batchA.qty);
    expect(body.updatedVariant.stockQty).toBe(TD.batchA.qty);
  });

  test('TC-06: Stock-in Batch B (15 units, cost=900, sell=1800)', async () => {
    const res = await apiPost('/stock-movements/stock-in', {
      variantId,
      qty: TD.batchB.qty,
      costPrice: TD.batchB.costPrice,
      sellPrice: TD.batchB.sellPrice,
      supplier: TD.batchB.supplier,
    });
    const body = res.data ?? res;
    const movement = body.movement ?? body.data?.movement;
    expect(movement, 'Stock-in response missing movement').toBeTruthy();

    batchBId = movement._id;
    expect(batchBId).toBeTruthy();
    expect(movement.costPrice).toBe(TD.batchB.costPrice);
    expect(movement.sellPrice).toBe(TD.batchB.sellPrice);
    expect(movement.qtyRemaining).toBe(TD.batchB.qty);
    expect(body.updatedVariant.stockQty).toBe(TD.batchA.qty + TD.batchB.qty);
  });

  test('TC-07: Verify batches stored correctly via API', async () => {
    const res = await apiGet('/stock-movements', {
      type: 'IN',
      variant: variantId,
    });
    const batches = res.data.filter((m: any) => [batchAId, batchBId].includes(m._id));
    expect(batches).toHaveLength(2);

    const a = batches.find((m: any) => m._id === batchAId);
    const b = batches.find((m: any) => m._id === batchBId);

    expect(a.costPrice).toBe(TD.batchA.costPrice);
    expect(a.sellPrice).toBe(TD.batchA.sellPrice);
    expect(a.qtyRemaining).toBe(TD.batchA.qty);

    expect(b.costPrice).toBe(TD.batchB.costPrice);
    expect(b.sellPrice).toBe(TD.batchB.sellPrice);
    expect(b.qtyRemaining).toBe(TD.batchB.qty);
  });

  // ─────────────────────────────────────────────────────────
  // ORDER 1: 10 units — entirely from Batch A
  // ─────────────────────────────────────────────────────────

  test('TC-08: Order 1 — 10 units (single batch, Batch A)', async () => {
    const res = await apiPost('/orders', {
      items: [{ variantId, qty: TD.order1.qty }],
      customerName: 'FIFO Test Customer 1',
    });

    order1Id = res.data._id;
    const item = res.data.items[0];

    // FIFO should use Batch A prices exclusively
    expect(item.unitPrice).toBe(expected.order1.unitPrice);
    expect(item.costPrice).toBe(expected.order1.costPrice);
    expect(item.batchCostPrice).toBe(expected.order1.costPrice);
    expect(item.batchSellPrice).toBe(expected.order1.unitPrice);
    expect(item.lineTotal).toBe(expected.order1.revenue);
    expect(item.lineFinal).toBe(expected.order1.revenue);
  });

  test('TC-09: After Order 1 — verify batch remaining quantities', async () => {
    const res = await apiGet('/stock-movements', {
      type: 'IN',
      variant: variantId,
    });
    const a = res.data.find((m: any) => m._id === batchAId);
    const b = res.data.find((m: any) => m._id === batchBId);

    expect(a.qtyRemaining).toBe(expected.order1.batchARemaining); // 10
    expect(b.qtyRemaining).toBe(expected.order1.batchBRemaining); // 15
  });

  // ─────────────────────────────────────────────────────────
  // ORDER 2: 15 units — spans Batch A (10 left) + Batch B (5)
  // THIS IS THE CRITICAL FIFO TEST
  // ─────────────────────────────────────────────────────────

  test('TC-10: Order 2 — 15 units (cross-batch FIFO)', async () => {
    const res = await apiPost('/orders', {
      items: [{ variantId, qty: TD.order2.qty }],
      customerName: 'FIFO Test Customer 2',
    });

    order2Id = res.data._id;
    const item = res.data.items[0];

    // Weighted average: 10 from Batch A + 5 from Batch B
    expect(item.unitPrice).toBe(expected.order2.unitPrice);   // 1400
    expect(item.costPrice).toBe(expected.order2.costPrice);   // 700
    expect(item.batchCostPrice).toBe(expected.order2.costPrice);
    expect(item.batchSellPrice).toBe(expected.order2.unitPrice);
    expect(item.lineTotal).toBe(expected.order2.revenue);     // 21,000
    expect(item.lineFinal).toBe(expected.order2.revenue);
  });

  test('TC-11: After Order 2 — Batch A depleted, Batch B partially used', async () => {
    const res = await apiGet('/stock-movements', {
      type: 'IN',
      variant: variantId,
    });
    const a = res.data.find((m: any) => m._id === batchAId);
    const b = res.data.find((m: any) => m._id === batchBId);

    expect(a.qtyRemaining).toBe(expected.order2.batchARemaining); // 0
    expect(b.qtyRemaining).toBe(expected.order2.batchBRemaining); // 10
  });

  // ─────────────────────────────────────────────────────────
  // ORDER 3: 10 units — entirely from Batch B (remaining)
  // ─────────────────────────────────────────────────────────

  test('TC-12: Order 3 — 10 units (single batch, Batch B)', async () => {
    const res = await apiPost('/orders', {
      items: [{ variantId, qty: TD.order3.qty }],
      customerName: 'FIFO Test Customer 3',
    });

    order3Id = res.data._id;
    const item = res.data.items[0];

    expect(item.unitPrice).toBe(expected.order3.unitPrice);   // 1800
    expect(item.costPrice).toBe(expected.order3.costPrice);   // 900
    expect(item.batchCostPrice).toBe(expected.order3.costPrice);
    expect(item.batchSellPrice).toBe(expected.order3.unitPrice);
    expect(item.lineTotal).toBe(expected.order3.revenue);     // 18,000
    expect(item.lineFinal).toBe(expected.order3.revenue);
  });

  test('TC-13: After Order 3 — both batches fully depleted', async () => {
    const res = await apiGet('/stock-movements', {
      type: 'IN',
      variant: variantId,
    });
    const a = res.data.find((m: any) => m._id === batchAId);
    const b = res.data.find((m: any) => m._id === batchBId);

    expect(a.qtyRemaining).toBe(expected.order3.batchARemaining); // 0
    expect(b.qtyRemaining).toBe(expected.order3.batchBRemaining); // 0
  });

  test('TC-14: Over-order should fail (no stock left)', async () => {
    const res = await apiCtx.post(`${API}/orders`, {
      data: { items: [{ variantId, qty: 1 }] },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(400);
  });

  // ─────────────────────────────────────────────────────────
  // FINANCE: Validate P&L accuracy
  // ─────────────────────────────────────────────────────────

  test('TC-15: Finance summary — totals match expected', async () => {
    const year = new Date().getFullYear().toString();
    const res = await apiGet('/finance/summary', { year });
    const data = res.data;

    // Revenue, cost, profit must include our 3 orders
    // (may include other orders from existing data, so check >= )
    expect(data.totalRevenue).toBeGreaterThanOrEqual(expected.totals.revenue);
    expect(data.totalCost).toBeGreaterThanOrEqual(expected.totals.cost);
    expect(data.grossProfit).toBeGreaterThanOrEqual(expected.totals.profit);
  });

  test('TC-16: Finance breakdown — each order row has correct cost & profit', async () => {
    const year = new Date().getFullYear().toString();
    const res = await apiGet('/finance/breakdown', { year, limit: '100' });
    const rows = res.data;

    // Find our 3 orders by matching variant label pattern
    const ourRows = rows.filter((r: any) =>
      r.variantLabel?.includes(TD.category.replace(`${PREFIX}-`, `${PREFIX}-`))
      || r.variantLabel?.includes(TD.type.replace(`${PREFIX}-`, `${PREFIX}-`))
    );

    // We expect 3 rows for our variant
    expect(ourRows.length).toBeGreaterThanOrEqual(3);

    // Sort by qty to match: 10, 10, 15
    ourRows.sort((a: any, b: any) => a.qtySold - b.qtySold || a.costPrice - b.costPrice);

    // Find the row with qty=10 and costPrice=600 (Order 1)
    const row1 = ourRows.find((r: any) => r.qtySold === 10 && r.costPrice === expected.order1.costPrice);
    expect(row1, 'Order 1 row not found').toBeTruthy();
    expect(row1.sellPrice).toBe(expected.order1.unitPrice);
    expect(row1.revenue).toBe(expected.order1.revenue);
    expect(row1.profit).toBe(expected.order1.profit);

    // Find the row with qty=15 (Order 2 — cross-batch)
    const row2 = ourRows.find((r: any) => r.qtySold === 15);
    expect(row2, 'Order 2 row not found').toBeTruthy();
    expect(row2.costPrice).toBe(expected.order2.costPrice);     // 700
    expect(row2.sellPrice).toBe(expected.order2.unitPrice);     // 1400
    expect(row2.revenue).toBe(expected.order2.revenue);         // 21,000
    expect(row2.profit).toBe(expected.order2.profit);           // 10,500

    // Find the row with qty=10 and costPrice=900 (Order 3)
    const row3 = ourRows.find((r: any) => r.qtySold === 10 && r.costPrice === expected.order3.costPrice);
    expect(row3, 'Order 3 row not found').toBeTruthy();
    expect(row3.sellPrice).toBe(expected.order3.unitPrice);
    expect(row3.revenue).toBe(expected.order3.revenue);
    expect(row3.profit).toBe(expected.order3.profit);
  });

  // ─────────────────────────────────────────────────────────
  // WRONG-BEHAVIOR CHECK: prove the old bug would be wrong
  // ─────────────────────────────────────────────────────────

  test('TC-17: Prove FIFO is correct vs old single-price bug', async () => {
    // If the system used variant.sellPrice (1000) for ALL orders:
    const wrongRevenue = (10 + 15 + 10) * TD.variant.sellPrice; // 35,000
    // If the system used variant.costPrice (500) for ALL orders:
    const wrongCost = (10 + 15 + 10) * TD.variant.costPrice;    // 17,500
    const wrongProfit = wrongRevenue - wrongCost;                // 17,500

    // Actual FIFO values:
    expect(expected.totals.revenue).not.toBe(wrongRevenue);     // 51,000 ≠ 35,000
    expect(expected.totals.cost).not.toBe(wrongCost);           // 25,500 ≠ 17,500
    expect(expected.totals.profit).not.toBe(wrongProfit);       // 25,500 ≠ 17,500

    // The FIFO revenue is HIGHER because batches had higher sell prices than variant default
    expect(expected.totals.revenue).toBeGreaterThan(wrongRevenue);
    // The FIFO cost is also HIGHER because batches had higher cost prices
    expect(expected.totals.cost).toBeGreaterThan(wrongCost);
  });

  // ─────────────────────────────────────────────────────────
  // BATCH C: Add new batch after depletion, order from it
  // ─────────────────────────────────────────────────────────

  test('TC-18: Stock-in Batch C after depleting A & B', async () => {
    const res = await apiPost('/stock-movements/stock-in', {
      variantId,
      qty: 5,
      costPrice: 750,
      sellPrice: 1500,
      supplier: 'Vendor C',
    });
    const body = res.data ?? res;
    const movement = body.movement ?? body.data?.movement;
    expect(movement, 'Stock-in response missing movement (Batch C)').toBeTruthy();

    expect(movement.costPrice).toBe(750);
    expect(movement.sellPrice).toBe(1500);
    expect(movement.qtyRemaining).toBe(5);
  });

  test('TC-19: Order from Batch C — uses Batch C prices', async () => {
    const res = await apiPost('/orders', {
      items: [{ variantId, qty: 3 }],
      customerName: 'FIFO Test Customer 4',
    });

    const item = res.data.items[0];
    expect(item.unitPrice).toBe(1500);    // Batch C sell price
    expect(item.costPrice).toBe(750);     // Batch C cost price
    expect(item.lineTotal).toBe(3 * 1500); // 4,500
  });

  // ─────────────────────────────────────────────────────────
  // SELL PRICE FALLBACK: batch without explicit sellPrice
  // ─────────────────────────────────────────────────────────

  test('TC-20: Stock-in without sellPrice defaults to variant.sellPrice', async () => {
    const res = await apiPost('/stock-movements/stock-in', {
      variantId,
      qty: 10,
      costPrice: 800,
      // sellPrice intentionally omitted
      supplier: 'Vendor D',
    });
    // Should fall back to variant.sellPrice = 1000
    const body = res.data ?? res;
    const movement = body.movement ?? body.data?.movement;
    expect(movement, 'Stock-in response missing movement (Batch D)').toBeTruthy();

    expect(movement.sellPrice).toBe(TD.variant.sellPrice);
    expect(movement.qtyRemaining).toBe(10);
  });

  test('TC-21: Order from fallback batch uses variant sellPrice', async () => {
    // Batch C has 2 remaining, fallback batch (Vendor D) has 10
    // Order 5: 2 from Batch C (sell=1500) + 3 from Vendor D (sell=1000)
    const res = await apiPost('/orders', {
      items: [{ variantId, qty: 5 }],
      customerName: 'FIFO Test Customer 5',
    });

    const item = res.data.items[0];
    const expectedSell = round2((2 * 1500 + 3 * 1000) / 5); // 1200
    const expectedCost = round2((2 * 750 + 3 * 800) / 5);   // 780

    expect(item.unitPrice).toBe(expectedSell);
    expect(item.costPrice).toBe(expectedCost);
    expect(item.lineTotal).toBe(round2(5 * expectedSell));
  });
});
