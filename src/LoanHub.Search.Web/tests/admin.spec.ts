import { test, expect } from '@playwright/test';

test('admin can register and log in via live api', async ({ page }) => {
  const timestamp = Date.now();
  const email = `admin_${timestamp}@o2.pl`;
  const password = 'AdminDemo123!';
  const slow = async () => page.waitForTimeout(50);

  const bankName = 'BocianBank';
  const bankApiEndpoint = 'https://loanhub-web-pw2025-d2b4b6bse4dkaaf8.westus2-01.azurewebsites.net/';
  const bankApiKey = 'KODlTlZIAmxAvojtwWv2zOwpZ6oz3Stxu3HRceB4rs8=';

  await page.goto('/login?mode=register');

  await page.getByRole('button', { name: 'Bank Admin' }).click();

  await page.getByLabel('First name').fill('Anna');
  await slow();
  await page.getByLabel('Last name').fill('Nowak');
  await slow();
  await page.getByLabel('Email').fill(email);
  await slow();
  await page.getByLabel('Phone').fill('700200300');
  await slow();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await slow();
  await page.getByLabel('Confirm password').fill(password);
  await slow();

  await page.getByLabel('Bank name').fill(bankName);
  await slow();
  await page.getByLabel('Bank API endpoint').fill(bankApiEndpoint);
  await slow();
  await page.getByLabel('Bank API key').fill(bankApiKey);
  await slow();

  await page.getByRole('button', { name: 'Register' }).click();

  let registered = false;
  try {
    await expect(page.getByText('Registration successful', { exact: false })).toBeVisible({
      timeout: 50_000,
    });
    await page.waitForURL('**/admin', { timeout: 10_000 });
    registered = true;
  } catch {
    registered = false;
  }

  if (registered) {
    await page.evaluate(() => {
      (globalThis as any).localStorage?.clear();
      (globalThis as any).sessionStorage?.clear();
    });
    await page.context().clearCookies();
  }

  await page.goto('/login');
  await page.getByRole('button', { name: 'Bank Admin' }).click();

  await page.getByLabel('Email').fill(email);
  await slow();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await slow();

  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByText('Login successful', { exact: false })).toBeVisible({ timeout: 10_000 });
  await page.waitForURL('**/admin', { timeout: 10_000 });

  await expect(page.getByText('Admin Dashboard')).toBeVisible();
  await expect(page.getByRole('heading', { name: '📋 Loan Applications Overview' })).toBeVisible();
});