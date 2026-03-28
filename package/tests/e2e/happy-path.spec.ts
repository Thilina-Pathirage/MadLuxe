import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { calculations, round2, testData } from './fixtures/testData';
import { openPage } from './fixtures/pageHelpers';

type FinanceSummary = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
};

let baselineFinance: FinanceSummary | null = null;
let firstOrderRef: string | null = null;
let secondOrderRef: string | null = null;

const currentYear = String(new Date().getFullYear());

async function loginApi(request: APIRequestContext): Promise<string> {
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const username = process.env.E2E_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing admin credentials in env for API login.');
  }

  const response = await request.post(`${apiBaseURL}/auth/login`, {
    data: { username, password },
  });

  expect(response.ok(), 'API login should succeed for test user').toBeTruthy();
  const body = await response.json();
  expect(body.token, 'Login response should include JWT token').toBeTruthy();
  return body.token as string;
}

async function getFinanceSummary(request: APIRequestContext, token: string): Promise<FinanceSummary> {
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const response = await request.get(
    `${apiBaseURL}/finance/summary?period=monthly&year=${currentYear}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  expect(response.ok(), 'Finance summary API should return 200').toBeTruthy();
  const body = await response.json();
  return body.data as FinanceSummary;
}

async function fetchByName(
  request: APIRequestContext,
  token: string,
  path: string,
  name: string
): Promise<{ _id: string; name: string }> {
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const response = await request.get(`${apiBaseURL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const found = (body.data || []).find((item: { name: string }) => item.name === name);
  expect(found, `Expected to find '${name}' from ${path}`).toBeTruthy();
  return found as { _id: string; name: string };
}

async function findVariant(
  request: APIRequestContext,
  token: string,
  params: Record<string, string>
): Promise<{ _id: string; stockQty: number; sku: string }> {
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const qs = new URLSearchParams(params).toString();
  const response = await request.get(`${apiBaseURL}/variants?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(Array.isArray(body.data) && body.data.length > 0).toBeTruthy();
  return body.data[0] as { _id: string; stockQty: number; sku: string };
}

async function chooseSelectByLabel(page: Page, label: string, option: string) {
  const field = page.getByLabel(label).first();
  const attemptSelect = async () => {
    const optionRole = page.getByRole('option', { name: option, exact: true });
    const optionText = page.locator('[role="listbox"] >> text="' + option + '"');

    if (await optionRole.count()) {
      await optionRole.first().click();
      return true;
    }
    if (await optionText.count()) {
      await optionText.first().click();
      return true;
    }
    return false;
  };

  await field.click();
  await page.waitForTimeout(80);
  if (await attemptSelect()) return;

  // Retry once in case the menu closed or did not open.
  await field.click();
  await page.waitForTimeout(80);
  const success = await attemptSelect();
  if (!success) {
    throw new Error(`Option "${option}" not found for select "${label}"`);
  }
}

async function closeOpenMuiMenus(page: Page) {
  // MUI selects can leave transient popover backdrops that intercept clicks.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
}

async function createProductConfigViaUI(page: Page) {
  await openPage(page, '/settings/product-config', 'Product Config');

  await page.getByPlaceholder('New category name…').fill(testData.categoryName);
  await page.getByPlaceholder('New category name…').press('Enter');
  await expect(page.getByText(testData.categoryName).first()).toBeVisible();

  await page.getByTestId('types-category-select').click();
  await page.getByRole('option', { name: testData.categoryName, exact: true }).click();

  await page.getByPlaceholder('New type name…').fill(testData.typeName);
  await page.getByPlaceholder('New type name…').press('Enter');
  await expect(page.getByText(testData.typeName).first()).toBeVisible();

  await page.getByTestId('sizes-type-select').click();
  await page.getByRole('option', { name: testData.typeName, exact: true }).click();
  await closeOpenMuiMenus(page);

  await page.getByPlaceholder('Colour name…').fill(testData.colorAName);
  await page.getByPlaceholder('Colour name…').press('Enter');
  await page.getByPlaceholder('Colour name…').fill(testData.colorBName);
  await page.getByPlaceholder('Colour name…').press('Enter');

  await expect(page.getByText(testData.colorAName).first()).toBeVisible();
  await expect(page.getByText(testData.colorBName).first()).toBeVisible();
}

async function enforceTypeSizesViaApi(request: APIRequestContext, token: string, categoryId: string) {
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const type = await fetchByName(
    request,
    token,
    `/product-types?category=${categoryId}`,
    testData.typeName
  );

  const response = await request.put(`${apiBaseURL}/product-types/${type._id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: testData.typeName,
      hasSizes: true,
      sizes: testData.sizes,
    },
  });

  expect(response.ok(), 'Setting hasSizes/sizes via API should succeed').toBeTruthy();
}

async function createVariant(page: Page, variant: typeof testData.variantA, colorName: string) {
  await page.getByRole('button', { name: 'New Variant' }).click();
  await expect(page.getByRole('heading', { name: 'New Variant' })).toBeVisible();

  await chooseSelectByLabel(page, 'Category', testData.categoryName);
  await chooseSelectByLabel(page, 'Type', testData.typeName);
  await chooseSelectByLabel(page, 'Size', variant.size);
  await chooseSelectByLabel(page, 'Color', colorName);

  await page.getByLabel('Cost Price (Rs.)').fill(String(variant.costPrice));
  await page.getByLabel('Sell Price (Rs.)').fill(String(variant.sellPrice));
  await page.getByLabel('Initial Stock Qty').fill('0');
  await page.getByLabel('Low Stock Threshold').fill(String(variant.lowStockThreshold));

  await page.getByRole('button', { name: 'Add Variant' }).click();
  await expect(page.getByText('Variant created.')).toBeVisible();
}

async function stockInVariant(page: Page, variant: typeof testData.variantA, colorName: string) {
  await chooseSelectByLabel(page, 'Category', testData.categoryName);
  await chooseSelectByLabel(page, 'Type', testData.typeName);
  await chooseSelectByLabel(page, 'Size', variant.size);
  await chooseSelectByLabel(page, 'Color', colorName);

  await page.getByLabel('Quantity to Add').fill(String(variant.stockInQty));
  await page.getByLabel('Cost Price per Unit').fill(String(variant.costPrice));
  await page.getByRole('button', { name: 'Save Stock In' }).click();
  await expect(page.getByText('Added')).toBeVisible();
}

async function addOrderLine(
  page: Page,
  {
    size,
    color,
    qty,
    discount,
    discountType,
  }: { size: string; color: string; qty: number; discount: number; discountType: 'fixed' | 'percent' }
) {
  await chooseSelectByLabel(page, 'Category', testData.categoryName);
  await chooseSelectByLabel(page, 'Type', testData.typeName);
  await chooseSelectByLabel(page, 'Size', size);
  await chooseSelectByLabel(page, 'Color', color);

  await page.getByLabel('Qty').fill(String(qty));
  await page.getByLabel('Item Discount').fill(String(discount));
  await chooseSelectByLabel(page, 'Discount Type', discountType === 'percent' ? '% (Percent)' : 'Rs. (Fixed)');
  await page.getByRole('button', { name: 'Add' }).click();
}

test.describe.serial('Happy path automation: config -> variant -> stock -> order -> finance', () => {
  test('Smoke auth: dashboard loads with stored auth state', async ({ page }) => {
    await openPage(page, '/', 'Revenue vs Profit');
    await expect(page.getByText('Total Variants')).toBeVisible();
  });

  test('Core happy path with explicit arithmetic validation', async ({ page, request }) => {
    const token = await loginApi(request);
    baselineFinance = await getFinanceSummary(request, token);
    if (!baselineFinance) throw new Error('Baseline finance summary not loaded.');

    await createProductConfigViaUI(page);

    const category = await fetchByName(request, token, '/categories', testData.categoryName);
    await enforceTypeSizesViaApi(request, token, category._id);
    const type = await fetchByName(
      request,
      token,
      `/product-types?category=${category._id}`,
      testData.typeName
    );
    const colorA = await fetchByName(request, token, '/colors', testData.colorAName);
    const colorB = await fetchByName(request, token, '/colors', testData.colorBName);

    await openPage(page, '/products/variants', 'Variants', {
      readyRole: 'button',
      readyName: 'New Variant',
    });
    await createVariant(page, testData.variantA, testData.colorAName);
    await createVariant(page, testData.variantB, testData.colorBName);

    await openPage(page, '/inventory/stock-in', 'Stock In', {
      readyRole: 'button',
      readyName: 'Save Stock In',
    });
    await stockInVariant(page, testData.variantA, testData.colorAName);
    await stockInVariant(page, testData.variantB, testData.colorBName);

    await openPage(page, '/orders/new-order', 'New Order', {
      readyRole: 'button',
      readyName: 'Confirm Order',
    });
    await page.getByLabel('Customer Name').fill(testData.order.customerName);
    await page.getByLabel('Phone').fill(testData.order.customerPhone);

    await addOrderLine(page, {
      size: testData.variantA.size,
      color: testData.colorAName,
      qty: testData.order.itemAQTY,
      discount: 0,
      discountType: 'fixed',
    });

    await addOrderLine(page, {
      size: testData.variantB.size,
      color: testData.colorBName,
      qty: testData.order.itemBQTY,
      discount: testData.order.itemBDiscountPercent,
      discountType: 'percent',
    });

    const first = calculations.firstOrder();
    await expect(page.getByText(`Rs.${first.total.toFixed(2)}`)).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Order' }).click();
    await expect(page.getByText('confirmed')).toBeVisible();

    await page.waitForURL('**/orders/all-orders');
    const firstOrderRow = page.locator('tbody tr').first();
    firstOrderRef = (await firstOrderRow.locator('td').nth(1).textContent())?.trim() || null;
    expect(firstOrderRef).toBeTruthy();

    const stockA = await findVariant(request, token, {
      category: category._id,
      productType: type._id,
      color: colorA._id,
      size: testData.variantA.size,
      limit: '25',
    });
    const stockB = await findVariant(request, token, {
      category: category._id,
      productType: type._id,
      color: colorB._id,
      size: testData.variantB.size,
      limit: '25',
    });

    const currentFinance = await getFinanceSummary(request, token);
    expect(round2(currentFinance.totalRevenue - baselineFinance.totalRevenue)).toBe(round2(first.total));
    expect(round2(currentFinance.totalCost - baselineFinance.totalCost)).toBe(round2(first.cost));
    expect(round2(currentFinance.grossProfit - baselineFinance.grossProfit)).toBe(round2(first.profit));

    await openPage(page, '/', 'Revenue vs Profit');
    await expect(page.getByText('Month Revenue')).toBeVisible();
    await expect(page.getByText('Month Profit')).toBeVisible();

    expect(stockA.stockQty).toBe(testData.variantA.stockInQty - testData.order.itemAQTY);
    expect(stockB.stockQty).toBe(testData.variantB.stockInQty - testData.order.itemBQTY);
  });

  test('Discount extension path: coupon + manual discount', async ({ page, request }) => {
    const token = await loginApi(request);
    const beforeSecond = await getFinanceSummary(request, token);

    const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
    const couponCreate = await request.post(`${apiBaseURL}/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code: testData.coupon.code,
        type: testData.coupon.type,
        value: testData.coupon.value,
      },
    });
    expect(couponCreate.ok(), 'Coupon should be created').toBeTruthy();

    await openPage(page, '/orders/new-order', 'New Order', {
      readyRole: 'button',
      readyName: 'Confirm Order',
    });

    await addOrderLine(page, {
      size: testData.variantA.size,
      color: testData.colorAName,
      qty: 1,
      discount: 0,
      discountType: 'fixed',
    });

    await page.getByPlaceholder('e.g. SUMMER10').fill(testData.coupon.code);
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Discount of Rs.500.00 applied!')).toBeVisible();

    const manualDiscountCard = page.getByRole('heading', { name: 'Manual Discount' }).locator('..');
    const manualDiscountInput = manualDiscountCard.getByLabel('Discount', { exact: true }).first();
    await manualDiscountInput.fill(String(testData.manualDiscountFixed));

    const second = calculations.secondOrder();
    await expect(page.getByText(`Rs.${second.total.toFixed(2)}`)).toBeVisible();

    await page.getByRole('button', { name: 'Confirm Order' }).click();
    await expect(page.getByText('confirmed')).toBeVisible();

    await page.waitForURL('**/orders/all-orders');
    const firstOrderRow = page.locator('tbody tr').first();
    secondOrderRef = (await firstOrderRow.locator('td').nth(1).textContent())?.trim() || null;
    expect(secondOrderRef).toBeTruthy();

    const afterSecond = await getFinanceSummary(request, token);
    expect(round2(afterSecond.totalRevenue - beforeSecond.totalRevenue)).toBe(round2(second.total));
    expect(round2(afterSecond.totalCost - beforeSecond.totalCost)).toBe(round2(second.cost));
    expect(round2(afterSecond.grossProfit - beforeSecond.grossProfit)).toBe(round2(second.profit));
  });
});
