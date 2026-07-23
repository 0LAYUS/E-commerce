import { test, expect } from '@playwright/test';

test.describe('Admin - POS Sales History Module', () => {
  test('should view sales history list', async ({ page }) => {
    // 1. Navigation
    await page.goto('/admin/pos/sales');
    await page.waitForLoadState('networkidle');
    
    // Verify header exists
    await expect(page.getByRole('heading', { name: 'Historial de Ventas POS' })).toBeVisible();

    // 2. Check table rows
    // Wait for data to load
    await page.waitForTimeout(1000);
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    if (count > 0) {
      // 3. Verify at least one sale is visible
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();
      
      // Check for elements in the table
      await expect(page.getByRole('columnheader', { name: 'Fecha' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Cliente' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Método' })).toBeVisible();
    } else {
      // If no sales, expect empty state text
      await expect(page.getByText('No hay ventas registradas')).toBeVisible();
    }
  });
});
