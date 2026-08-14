import { test, expect } from '@playwright/test';

test.describe('Sanity Check - Homepage', () => {
  test('should load the homepage and display correct branding', async ({ page }) => {
    // Navigate to the base URL (http://localhost:3000)
    await page.goto('/');

    // Wait for network idle to ensure everything is mounted
    await page.waitForLoadState('networkidle');

    // The page title should contain some relevant keywords.
    // For now we check that the page title is not empty.
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Verify the navbar is visible
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Take a screenshot of the homepage for debugging/reporting
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage.png', fullPage: true });
  });
});
