import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be defined in your .env or .env.local file');
  }

  console.log(`Authenticating as: ${email}`);

  await page.goto('/login');
  
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  
  // Click login button
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // Wait for the redirect to the dashboard (or anywhere in /admin) to ensure login succeeded
  // If credentials are wrong, the test will fail here on timeout
  await page.waitForURL('**/admin**', { timeout: 10000 });

  // Save the storage state (cookies/local storage)
  await page.context().storageState({ path: authFile });
});
