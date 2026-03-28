import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { openPage } from './fixtures/pageHelpers';

const API = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
const PREFIX = `DRAFT-FIFO-${Date.now()}`;

const TD = {
  category: `${PREFIX} Bedsheet`,
  type: `${PREFIX} King Stripe`,
  size: '90x100 Inches',
  color: `${PREFIX} Maroon`,
  colorHex: '#7f1d1d',
  variant: { costPrice: 700, sellPrice: 900 },
  batchA: { qty: 4, costPrice: 700, sellPrice: 1000, supplier: 'Vendor A' },
  batchB: { qty: 4, costPrice: 900, sellPrice: 1300, supplier: 'Vendor B' },
  customerName: 'Draft FIFO Preview',
  customerPhone: '778000001',
};

let token: string;
let apiCtx: APIRequestContext;
let categoryId: string;
let typeId: string;
let colorId: string;
let variantId: string;

async function apiPost(path: string, data: Record<string, unknown>) {
  const res = await apiCtx.post(`${API}${path}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `POST ${path} failed: ${res.status()}`).toBeTruthy();
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

async function chooseVariant(page: Page) {
  await chooseSelectByLabel(page, 'Category', TD.category);
  await chooseSelectByLabel(page, 'Type', TD.type);
  await chooseSelectByLabel(page, 'Size', TD.size);
  await chooseSelectByLabel(page, 'Color', TD.color);
}

function previewTable(page: Page) {
  return page.locator('table').first();
}

async function expectPreviewStock(page: Page, qty: number) {
  await expect(
    page.getByText(`${TD.category} / ${TD.type} / ${TD.size} / ${TD.color} — ${qty} in stock`)
  ).toBeVisible();
}

test.describe.serial('New Order Draft-Aware FIFO Preview', () => {
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

  test('TC-01: Seed variant with two FIFO batches for the preview flow', async () => {
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
      qty: TD.batchA.qty,
      costPrice: TD.batchA.costPrice,
      sellPrice: TD.batchA.sellPrice,
      supplier: TD.batchA.supplier,
    });

    await apiPost('/stock-movements/stock-in', {
      variantId,
      qty: TD.batchB.qty,
      costPrice: TD.batchB.costPrice,
      sellPrice: TD.batchB.sellPrice,
      supplier: TD.batchB.supplier,
    });
  });

  test('TC-02: Re-adding the same variant uses draft-adjusted FIFO preview and stock', async ({ page }) => {
    await openPage(page, '/orders/new-order', 'New Order', {
      readyRole: 'button',
      readyName: 'Confirm Order',
    });

    await page.getByLabel('Customer Name').fill(TD.customerName);
    await page.getByLabel('Phone').fill(TD.customerPhone);

    await chooseVariant(page);
    await page.getByLabel('Qty').fill('5');

    await expectPreviewStock(page, 8);
    await expect(previewTable(page)).toContainText('Rs.1000.00');
    await expect(previewTable(page)).toContainText('Rs.1300.00');
    await expect(page.getByText(/For 5 units:/)).toContainText('4 × Rs.1000.00 + 1 × Rs.1300.00');
    await expect(page.getByText(/For 5 units:/)).toContainText('Rs.5300.00');
    await expect(page.getByText(/For 5 units:/)).toContainText('avg Rs.1060.00/unit');

    await page.getByRole('button', { name: 'Add' }).click();

    const orderItemsTable = page.locator('table').nth(1);
    const orderRow = orderItemsTable.locator('tbody tr').first();
    await expect(orderRow).toContainText(`${TD.category} / ${TD.type} / ${TD.size} / ${TD.color}`);
    await expect(orderRow).toContainText('5');
    await expect(orderRow).toContainText('Rs.1060.00');
    await expect(orderRow).toContainText('Rs.5300.00');

    await chooseVariant(page);
    await page.getByLabel('Qty').fill('4');

    await expectPreviewStock(page, 3);
    const previewRows = previewTable(page).locator('tbody tr');
    await expect(previewRows).toHaveCount(2);
    await expect(previewRows.nth(0).locator('td').nth(1)).toContainText('0');
    await expect(previewRows.nth(0).locator('td').nth(2)).toContainText('Rs.1000.00');
    await expect(previewRows.nth(1).locator('td').nth(1)).toContainText('3');
    await expect(previewRows.nth(1).locator('td').nth(2)).toContainText('Rs.1300.00');
    await expect(page.getByText('Only 3 units in stock.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    await page.getByLabel('Qty').fill('1');
    await expect(page.getByText('Only 3 units in stock.')).toHaveCount(0);
    await expect(page.getByText(/For 1 unit:/)).toContainText('1 × Rs.1300.00');
    await expect(page.getByText(/For 1 unit:/)).toContainText('Rs.1300.00');

    await page.getByRole('button', { name: 'Add' }).click();

    const mergedRow = orderItemsTable.locator('tbody tr').first();
    await expect(orderItemsTable.locator('tbody tr')).toHaveCount(1);
    await expect(mergedRow).toContainText('6');
    await expect(mergedRow).toContainText('Rs.1100.00');
    await expect(mergedRow).toContainText('Rs.6600.00');

    await mergedRow.getByRole('button').click();
    await expect(page.getByText('Add items above to begin your order.')).toBeVisible();

    await chooseVariant(page);
    await page.getByLabel('Qty').fill('1');
    await expectPreviewStock(page, 8);
    await expect(page.getByText(/For 1 unit:/)).toContainText('1 × Rs.1000.00');
    await expect(page.getByText(/For 1 unit:/)).toContainText('Rs.1000.00');
  });
});
