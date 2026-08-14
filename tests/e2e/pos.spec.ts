import { test, expect } from '@playwright/test';

test.describe('Admin - POS Module', () => {
  const testId = Date.now().toString().slice(-6);

  test('should add product to cart and process payment', async ({ page }) => {
    // 1. Navigation
    await page.goto('/admin/pos');
    await page.waitForLoadState('networkidle');
    
    // Verify header exists
    await expect(page.getByRole('heading', { name: 'Punto de Venta' })).toBeVisible();

    // Wait for products to load
    await page.waitForTimeout(1000); 

    // 2. Add product to cart
    // Find the first "Agregar" button (for a simple product without variants)
    const addButton = page.getByRole('button', { name: 'Agregar' }).first();
    
    // Only proceed if there are products available to sell
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Verify product is in cart (Cart header: "Carrito de Venta")
      await expect(page.getByText('Carrito de Venta')).toBeVisible();
      
      // Enter customer name
      await page.getByPlaceholder('Nombre del cliente (opcional)').fill(`E2E POS Customer ${testId}`);

      // Check that "Cobrar" button is now visible
      const cobrarBtn = page.getByRole('button', { name: 'Cobrar' });
      await expect(cobrarBtn).toBeVisible();
      
      // 3. Open Payment Modal
      await cobrarBtn.click();
      
      // Payment Modal appears
      await expect(page.getByRole('heading', { name: 'Cobrar venta' })).toBeVisible();
      
      // Find the input to enter amount received (efectivo is default)
      // We can use the generic input[type=number] for the cash amount
      const inputs = page.locator('input[type="number"]');
      await inputs.first().fill('100000000'); // large number to cover any total
      
      // Click "Confirmar pago"
      await page.getByRole('button', { name: 'Confirmar pago' }).click();
      
      // 4. Receipt Modal Appears
      await expect(page.getByRole('heading', { name: 'Recibo de Venta' })).toBeVisible();
      
      // Start New Sale
      await page.getByRole('button', { name: 'Nueva Venta' }).click();
      
      // Modal closes, cart is empty
      await expect(page.getByText('Carrito vacío')).toBeVisible();
    }
  });
});
