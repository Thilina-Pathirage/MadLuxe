import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { openPage, parseCurrency } from './fixtures/pageHelpers';

const API = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
const PREFIX = `PAYDEL-${Date.now()}`;

const TD = {
  category: `${PREFIX} Linens`,
  type: `${PREFIX} Sheets`,
  size: 'Single',
  color: `${PREFIX} Mist`,
  colorHex: '#dbeafe',
  variant: { costPrice: 1200, sellPrice: 2000 },
  stock: { qty: 20, supplier: 'Supplier A' },
  order1: { customerName: 'PayDel COD', phone: '0778000001', qty: 2 },
  order2: { customerName: 'PayDel Bank', phone: '0778000002', qty: 3, deliveryFee: 450 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

type Expected = {
  order1: { revenue: number; cost: number };
  order2: { revenue: number; cost: number; deliveryFee: number };
  totals: { revenue: number; cost: number; profit: number };
  codReceivable: number;
  codOrderCount: number;
};

const expected: Expected = {
  order1: {
    revenue: TD.order1.qty * TD.variant.sellPrice,
    cost: TD.order1.qty * TD.variant.costPrice,
  },
  order2: {
    revenue: TD.order2.qty * TD.variant.sellPrice,
    cost: TD.order2.qty * TD.variant.costPrice,
    deliveryFee: TD.order2.deliveryFee,
  },
  totals: {
    revenue: TD.order1.qty * TD.variant.sellPrice + TD.order2.qty * TD.variant.sellPrice,
    cost: TD.order1.qty * TD.variant.costPrice + TD.order2.qty * TD.variant.costPrice,
    profit: round2(
      (TD.order1.qty * TD.variant.sellPrice - TD.order1.qty * TD.variant.costPrice) +
      (TD.order2.qty * TD.variant.sellPrice - TD.order2.qty * TD.variant.costPrice)
    ),
  },
  codReceivable: TD.order1.qty * TD.variant.sellPrice,
  codOrderCount: 1,
};

type FinanceSnapshot = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  codReceivable: number;
  codOrderCount: number;
};

let token: string;
let apiCtx: APIRequestContext;
let categoryId: string;
let typeId: string;
let colorId: string;
let variantId: string;
let baselineFinance: FinanceSnapshot | null = null;
let order1Ref = '';
let order2Ref = '';
let order1Id = '';
let order2Id = '';

const currentYear = new Date().getFullYear().toString();

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

async function chooseSelectByLabel(page: Page, label: string, option: string) {
  const field = page.getByLabel(label).first();
  const attemptSelect = async () => {
    const optionLocator = page.getByRole('option', { name: option, exact: true });
    if (await optionLocator.count()) {
      await optionLocator.first().click();
      return true;
    }
    const listboxText = page.locator('[role="listbox"] >> text="' + option + '"');
    if (await listboxText.count()) {
      await listboxText.first().click();
      return true;
    }
    return false;
  };

  await field.click();
  await page.waitForTimeout(80);
  if (await attemptSelect()) return;
  await field.click();
  await page.waitForTimeout(80);
  if (await attemptSelect()) return;
  throw new Error(`Option "${option}" not found for select "${label}"`);
}

async function addOrderLine(page: Page, qty: number) {
  await chooseSelectByLabel(page, 'Category', TD.category);
  await chooseSelectByLabel(page, 'Type', TD.type);
  await chooseSelectByLabel(page, 'Size', TD.size);
  await chooseSelectByLabel(page, 'Color', TD.color);
  await page.getByLabel('Qty').fill(String(qty));
  await page.getByRole('button', { name: 'Add' }).click();
}

function variantLabel() {
  return `${TD.category} / ${TD.type} / ${TD.size} / ${TD.color}`;
}

function displayDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

async function setAppDate(page: Page, label: string, value: string) {
  const input = page.getByLabel(label).first();
  await input.focus();
  await input.fill(displayDate(value));
  await input.press('Enter');
}

async function getLineTotal(page: Page) {
  const totalRow = page.getByText('Total', { exact: true }).locator('..').first();
  const amountText = await totalRow.getByText(/Rs\./).first().textContent();
  return parseCurrency(amountText ?? '');
}

async function getCustomerPays(page: Page) {
  const paysRow = page.getByText('Customer Pays', { exact: true });
  if (await paysRow.count() === 0) return null;
  const amountText = await paysRow.locator('..').getByText(/Rs\./).first().textContent();
  return parseCurrency(amountText ?? '');
}

async function getDeliveryFeeAmount(page: Page) {
  const feeRow = page.getByText('Delivery Fee', { exact: true });
  if (await feeRow.count() === 0) return null;
  const amountText = await feeRow.locator('..').getByText(/Rs\./).first().textContent();
  return parseCurrency(amountText ?? '');
}

async function waitForOrderRow(page: Page, orderRef: string) {
  const row = page.locator('tbody tr').filter({ hasText: orderRef }).first();
  await expect(row).toBeVisible();
  return row;
}

async function waitForFinanceSummary(page: Page, params: Record<string, string>) {
  await page.waitForResponse((resp) =>
    resp.url().includes('/finance/summary') &&
    Object.entries(params).every(([key, value]) =>
      resp.request().url().includes(`${key}=${encodeURIComponent(value)}`)
    )
  );
}

async function waitForOrdersFetch(page: Page, filter: string) {
  await page.waitForResponse((resp) =>
    resp.url().includes('/orders') &&
    resp.request().method() === 'GET' &&
    resp.request().url().includes(`paymentMethod=${filter}`)
  );
}

async function waitForOrdersFetchAll(page: Page) {
  await page.waitForResponse((resp) =>
    resp.url().includes('/orders') && resp.request().method() === 'GET' && !resp.request().url().includes('paymentMethod=')
  );
}

test.describe.serial('Payment & Delivery Flow', () => {
  test.beforeAll(async ({ playwright }) => {
    apiCtx = await playwright.request.newContext();
    const username = process.env.E2E_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
    const password = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!username || !password) {
      throw new Error('Missing admin credentials for E2E login.');
    }
    const loginRes = await apiCtx.post(`${API}/auth/login`, {
      data: { username, password },
    });
    expect(loginRes.ok(), 'Login failed').toBeTruthy();
    const body = await loginRes.json();
    token = body.token;
  });

  test.afterAll(async () => {
    await apiCtx.dispose();
  });

  test('TC-01: Seed catalog + capture finance baseline', async () => {
    const categoryRes = await apiPost('/categories', { name: TD.category });
    categoryId = categoryRes.data._id;

    const typeRes = await apiPost('/product-types', {
      name: TD.type,
      category: categoryId,
      hasSizes: true,
      sizes: [TD.size],
    });
    typeId = typeRes.data._id;

    const colorRes = await apiPost('/colors', { name: TD.color, hexCode: TD.colorHex });
    colorId = colorRes.data._id;

    const variantRes = await apiPost('/variants', {
      categoryId,
      productTypeId: typeId,
      colorId,
      size: TD.size,
      costPrice: TD.variant.costPrice,
      sellPrice: TD.variant.sellPrice,
    });
    variantId = variantRes.data._id;

    await apiPost('/stock-movements/stock-in', {
      variantId,
      qty: TD.stock.qty,
      costPrice: TD.variant.costPrice,
      sellPrice: TD.variant.sellPrice,
      supplier: TD.stock.supplier,
    });

    const summary = await apiGet('/finance/summary', { period: 'monthly', year: currentYear });
    baselineFinance = summary.data;
    expect(baselineFinance).toBeTruthy();
  });

  test('TC-02: COD store pickup order resets fee and payload', async ({ page }) => {
    await openPage(page, '/orders/new-order', 'New Order', {
      readyRole: 'button',
      readyName: 'Confirm Order',
    });

    await page.getByLabel('Customer Name').fill(TD.order1.customerName);
    await page.getByLabel('Phone').fill(TD.order1.phone);

    await addOrderLine(page, TD.order1.qty);

    const initialTotal = await getLineTotal(page);
    expect(initialTotal).toBe(expected.order1.revenue);

    await expect(page.getByLabel('Delivery Fee')).toBeVisible();
    await expect(page.getByText('Customer Pays')).toBeVisible();

    await chooseSelectByLabel(page, 'Payment Method', 'COD (Cash on Delivery)');
    await chooseSelectByLabel(page, 'Delivery Method', 'Store Pickup');

    await expect(page.getByLabel('Delivery Fee')).toHaveCount(0);
    await expect(page.getByText('Customer Pays')).toHaveCount(0);

    const [orderResp] = await Promise.all([
      page.waitForResponse((resp) =>
        resp.url().includes('/orders') && resp.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Confirm Order' }).click(),
    ]);

    const payload = await orderResp.request().postDataJSON();
    expect(payload.paymentMethod).toBe('COD');
    expect(payload.deliveryFee).toBe(0);

    const body = await orderResp.json();
    order1Ref = body.data.orderRef;
    order1Id = body.data._id;

    await page.waitForURL('**/orders/all-orders');
    await expect(page.getByRole('heading', { name: 'All Orders' })).toBeVisible();
  });

  test('TC-03: Bank transfer delivery order honors custom fee', async ({ page }) => {
    await openPage(page, '/orders/new-order', 'New Order', {
      readyRole: 'button',
      readyName: 'Confirm Order',
    });

    await page.getByLabel('Customer Name').fill(TD.order2.customerName);
    await page.getByLabel('Phone').fill(TD.order2.phone);

    await addOrderLine(page, TD.order2.qty);

    await chooseSelectByLabel(page, 'Payment Method', 'Bank Transfer');
    const deliveryMethod = page.getByRole('combobox', { name: /Delivery Method/i }).first();
    await deliveryMethod.click();
    await page.getByRole('option', { name: 'Delivery', exact: true }).click();
    await expect(deliveryMethod).toContainText('Delivery');

    const feeInput = page.getByLabel('Delivery Fee');
    await expect(feeInput).toBeVisible();
    await feeInput.fill(String(TD.order2.deliveryFee));
    await feeInput.press('Enter');
    await expect(feeInput).toHaveValue(String(TD.order2.deliveryFee));

    const totalBeforeDelivery = await getLineTotal(page);
    const customerPays = await getCustomerPays(page);
    expect(customerPays).toBe(round2(totalBeforeDelivery + TD.order2.deliveryFee));

    const [orderResp] = await Promise.all([
      page.waitForResponse((resp) =>
        resp.url().includes('/orders') && resp.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Confirm Order' }).click(),
    ]);

    const payload = await orderResp.request().postDataJSON();
    expect(payload.paymentMethod).toBe('BankTransfer');
    expect(payload.deliveryFee).toBe(TD.order2.deliveryFee);

    const body = await orderResp.json();
    order2Ref = body.data.orderRef;
    order2Id = body.data._id;

    await page.waitForURL('**/orders/all-orders');
  });

  test('TC-04: All orders shows payment chips + filters', async ({ page }) => {
    await openPage(page, '/orders/all-orders', 'All Orders');

    const codRow = await waitForOrderRow(page, order1Ref);
    await expect(codRow.locator('td').nth(8).getByText('COD')).toBeVisible();
    await expect(codRow.locator('td').nth(8).getByText('+Rs.')).toHaveCount(0);

    const bankRow = await waitForOrderRow(page, order2Ref);
    await expect(bankRow.locator('td').nth(8).getByText('Bank')).toBeVisible();
    await expect(bankRow.locator('td').nth(8).getByText(`+Rs.${TD.order2.deliveryFee.toFixed(2)} delivery`)).toBeVisible();

    const paymentFilter = page.getByRole('combobox').filter({ hasText: /^Payment:/ }).first();

    await paymentFilter.click();
    await page.getByRole('option', { name: 'COD', exact: true }).click();
    await waitForOrdersFetch(page, 'COD');
    await expect(page.locator('tbody tr', { hasText: order2Ref })).toHaveCount(0);
    await expect(page.locator('tbody tr', { hasText: order1Ref })).toHaveCount(1);

    await paymentFilter.click();
    await page.getByRole('option', { name: 'Bank Transfer', exact: true }).click();
    await waitForOrdersFetch(page, 'BankTransfer');
    await expect(page.locator('tbody tr', { hasText: order1Ref })).toHaveCount(0);
    await expect(page.locator('tbody tr', { hasText: order2Ref })).toHaveCount(1);

    await paymentFilter.click();
    await page.getByRole('option', { name: 'All', exact: true }).click();
    await waitForOrdersFetchAll(page);
    await expect(page.locator('tbody tr', { hasText: order1Ref })).toHaveCount(1);
    await expect(page.locator('tbody tr', { hasText: order2Ref })).toHaveCount(1);
  });

  test('TC-05: Finance page payment/date filters surface COD info', async ({ page }) => {
    if (!baselineFinance) throw new Error('Baseline finance snapshot missing.');

    const afterSummary = await apiGet('/finance/summary', { period: 'monthly', year: currentYear });
    const revenueDelta = round2(afterSummary.data.totalRevenue - baselineFinance.totalRevenue);
    const costDelta = round2(afterSummary.data.totalCost - baselineFinance.totalCost);
    const profitDelta = round2(afterSummary.data.grossProfit - baselineFinance.grossProfit);

    const codReceivableDelta = round2(afterSummary.data.codReceivable - baselineFinance.codReceivable);
    const codOrderCountDelta = afterSummary.data.codOrderCount - baselineFinance.codOrderCount;

    expect(revenueDelta).toBe(expected.totals.revenue);
    expect(costDelta).toBe(expected.totals.cost);
    expect(profitDelta).toBe(expected.totals.profit);
    expect(codReceivableDelta).toBe(expected.codReceivable);
    expect(codOrderCountDelta).toBe(expected.codOrderCount);

    await openPage(page, '/finance/revenue-profit', 'Revenue & Profit');

    await page.getByRole('button', { name: 'All Payments' }).click();
    await page.getByRole('option', { name: 'COD Only' }).click();
    await waitForFinanceSummary(page, { period: 'monthly', year: currentYear, paymentMethod: 'COD' });
    await expect(page.getByText('COD Receivable')).toBeVisible();
    await expect(page.getByText(`${expected.codOrderCount} COD orders`)).toBeVisible();
    await expect(page.getByText(`Rs. ${expected.codReceivable.toLocaleString()}`)).toBeVisible();

    await page.getByRole('button', { name: 'COD Only' }).click();
    await page.getByRole('option', { name: 'Bank Transfer Only' }).click();
    await waitForFinanceSummary(page, {
      period: 'monthly',
      year: currentYear,
      paymentMethod: 'BankTransfer',
    });
    await expect(page.getByText('COD Receivable')).toHaveCount(0);

    await page.getByRole('button', { name: 'Bank Transfer Only' }).click();
    await page.getByRole('option', { name: 'All Payments' }).click();
    await waitForFinanceSummary(page, { period: 'monthly', year: currentYear });
    await expect(page.getByText('COD Receivable')).toBeVisible();

    const today = new Date().toISOString().split('T')[0];
    await setAppDate(page, 'From', today);
    await setAppDate(page, 'To', today);
    await waitForFinanceSummary(page, { period: 'monthly', year: currentYear, dateFrom: today, dateTo: today });
    await expect(page.locator('tbody tr', { hasText: variantLabel() })).toHaveCount(2);

    const ghostDate = '2000-01-01';
    await setAppDate(page, 'From', ghostDate);
    await setAppDate(page, 'To', ghostDate);
    await waitForFinanceSummary(page, {
      period: 'monthly',
      year: currentYear,
      dateFrom: ghostDate,
      dateTo: ghostDate,
    });
    await expect(page.getByText('No data for this period.')).toBeVisible();
  });
});
