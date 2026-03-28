import fs from 'node:fs/promises';
import path from 'node:path';
import { request, type FullConfig } from '@playwright/test';

const TOKEN_KEY = 'madlaxue_token';

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || config.projects[0]?.use?.baseURL?.toString() || 'http://localhost:3000';
  const apiBaseURL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';
  const username = process.env.E2E_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing admin credentials. Set E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD or ADMIN_USERNAME/ADMIN_PASSWORD.');
  }

  const apiContext = await request.newContext();
  const response = await apiContext.post(`${apiBaseURL}/auth/login`, {
    data: { username, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to authenticate test user (${response.status()}): ${body}`);
  }

  const payload = await response.json();
  const token: string | undefined = payload?.token;

  if (!token) {
    throw new Error('Login succeeded but no token was returned by /auth/login.');
  }

  const authDir = path.resolve(__dirname, '../.auth');
  const storagePath = path.resolve(authDir, 'admin.json');

  await fs.mkdir(authDir, { recursive: true });

  const origin = new URL(baseURL).origin;
  await fs.writeFile(
    storagePath,
    JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin,
            localStorage: [{ name: TOKEN_KEY, value: token }],
          },
        ],
      },
      null,
      2
    )
  );

  await apiContext.dispose();
}

export default globalSetup;
