import { expect, test, type APIRequestContext } from '@playwright/test';
import { openPage } from './fixtures/pageHelpers';

type CustomerListItem = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
};

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

test('Orders search supports phone/email and customers directory opens customer orders', async ({ page, request }) => {
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const token = await loginApi(request);

  const customersRes = await request.get(`${apiBaseURL}/customers?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(customersRes.ok(), 'Customers endpoint should return 200').toBeTruthy();
  const customersBody = await customersRes.json();
  const customers = (customersBody.data || []) as CustomerListItem[];
  expect(Array.isArray(customers), 'Customers payload should be an array').toBeTruthy();

  const target = customers.find((c) => c.orderCount > 0 && !!c.email?.trim()) || null;
  test.skip(!target, 'No registered customer with orders and email available in this environment.');

  const searchEmailRes = await request.get(
    `${apiBaseURL}/orders?page=1&limit=25&search=${encodeURIComponent(target!.email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(searchEmailRes.ok(), 'Order search by email should return 200').toBeTruthy();
  const searchEmailBody = await searchEmailRes.json();
  expect((searchEmailBody.data || []).length).toBeGreaterThan(0);

  if (target!.phone?.trim()) {
    const searchPhoneRes = await request.get(
      `${apiBaseURL}/orders?page=1&limit=25&search=${encodeURIComponent(target!.phone)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(searchPhoneRes.ok(), 'Order search by phone should return 200').toBeTruthy();
    const searchPhoneBody = await searchPhoneRes.json();
    expect((searchPhoneBody.data || []).length).toBeGreaterThan(0);
  }

  await openPage(page, '/orders/customers', 'Customers');
  await expect(page.getByText(target!.name).first()).toBeVisible();

  const targetRow = page.locator('tr', { has: page.getByText(target!.name).first() }).first();
  await targetRow.getByRole('button', { name: 'View Orders' }).click();
  await expect(page).toHaveURL(/\/(portal\/)?orders\/customers\/[^/]+$/);
  await expect(page.getByRole('heading', { name: /Orders/i }).first()).toBeVisible();
});
