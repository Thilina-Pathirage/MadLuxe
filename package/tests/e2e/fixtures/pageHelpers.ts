import { expect, type Locator, type Page } from '@playwright/test';

type OpenPageOptions = {
  readyRole?: 'button' | 'link' | 'textbox' | 'heading';
  readyName?: string;
  readyExact?: boolean;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function openPage(
  page: Page,
  path: string,
  headingText?: string,
  options?: OpenPageOptions
) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => {
    const expectedPath = path || '/';
    return url.pathname === expectedPath;
  });

  if (headingText) {
    const exactHeading = new RegExp(`^${escapeRegExp(headingText)}$`);
    await expect(page.getByRole('heading', { name: exactHeading }).first()).toBeVisible();
  }

  if (options?.readyRole && options?.readyName) {
    await expect(
      page.getByRole(options.readyRole, {
        name: options.readyName,
        exact: options.readyExact ?? true,
      }).first()
    ).toBeVisible();
  }
}

export function parseCurrency(text: string): number {
  const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/g);
  if (!match || match.length === 0) return 0;
  return Number(match[match.length - 1]);
}

export async function getNumericText(locator: Locator): Promise<number> {
  const text = (await locator.textContent()) || '';
  return parseCurrency(text);
}

export async function clickByText(page: Page, role: 'button' | 'menuitem' | 'option', text: string) {
  await page.getByRole(role, { name: text, exact: true }).click();
}
