import { test, expect } from '@playwright/test';

test.describe('Admin - Products Module', () => {
  const testId = Date.now().toString().slice(-6);
  const testProductName = `Test Product E2E - ${testId}`;
  
  test('should create, edit, search, and delete a product', async ({ page }) => {
    // 0. Ensure Category exists
    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');
    const categoryRows = page.locator('tbody tr');
    if (await categoryRows.count() === 0) {
      await page.getByRole('button', { name: 'Nueva Categoría' }).click();
      await page.locator('input[name="name"]').fill(`Category ${testId}`);
      await page.getByRole('button', { name: /Guardar/i }).click();
      await expect(page.getByRole('heading', { name: 'Nueva Categoría' })).not.toBeVisible();
    }

    // 1. Navigation
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');

    // 2. Create Product
    await page.getByRole('button', { name: /Nuevo Producto/i }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo Producto' })).toBeVisible();

    // Fill form
    await page.locator('input[name="name"]').fill(testProductName);
    await page.locator('textarea[name="description"]').fill('E2E Description para borrar');
    await page.locator('input[name="price"]').fill('150000');
    await page.locator('input[name="stock"]').fill('50');
    
    // Select category (if there are categories, select the first actual one)
    const categorySelect = page.locator('select[name="category_id"]');
    const options = await categorySelect.locator('option').all();
    if (options.length > 1) {
       const val = await options[1].getAttribute('value');
       await categorySelect.selectOption(val!);
    } else {
       throw new Error("No categories found despite creating one!");
    }


    // Submit
    await page.getByRole('button', { name: 'Crear Producto' }).click();

    // Check if an alert dialog appeared (meaning an error occurred)
    try {
      await expect(page.getByRole('heading', { name: 'Nuevo Producto' })).not.toBeVisible({ timeout: 5000 });
    } catch (e) {
      // Check for AlertDialog
      const dialog = page.getByRole('dialog').last();
      if (await dialog.isVisible()) {
        const text = await dialog.textContent();
        throw new Error(`Modal failed to close, alert says: ${text}`);
      }
      throw e;
    }

    // 3. Search and Find Product
    // Wait for the grid to update
    await page.waitForTimeout(1000); 
    
    // Look for the card containing our test product
    const productCard = page.locator('div.bg-card').filter({ hasText: testProductName }).first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    
    // 4. Edit Product
    await productCard.getByRole('button', { name: /Editar/i }).click();
    await expect(page.getByRole('heading', { name: 'Editar Producto' })).toBeVisible();
    
    // Change price
    await page.locator('input[name="price"]').fill('200000');
    await page.getByRole('button', { name: 'Actualizar Producto' }).click();
    
    // The modal should close
    await expect(page.getByRole('heading', { name: 'Editar Producto' })).not.toBeVisible();

    // Verify price updated (we look for 200.000 or similar formatting inside the card)
    await expect(productCard).toContainText('200'); // It should contain 200 because formatPrice('200000') gives $200.000 or similar

    // 5. Delete Product
    // The trash button is the one with Trash2 icon. It is the last button in the card.
    // Let's grab all buttons in the card and click the one that doesn't say "Editar" or "ON"/"OFF"
    const buttons = productCard.getByRole('button');
    // There are 3 buttons: Toggle Active, Editar, Eliminar
    // We can filter by CSS class or just get the 3rd one
    await buttons.nth(2).click();

    // Confirm dialog
    const dialog = page.getByRole('dialog').filter({ hasText: '¿Eliminar producto?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Eliminar' }).click();

    // Wait for the card to disappear
    await expect(productCard).not.toBeVisible({ timeout: 10000 });
  });
});
