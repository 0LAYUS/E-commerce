import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateCartItems, validateSingleItem, type CartValidationItem } from '@/lib/services/cart/cartValidationService'

// Mock de admin client para las dependencias internas
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => Promise.resolve({})),
}))

// Mock de repositorios
vi.mock('@/features/cart/repositories/stockRepository', () => {
  return {
    findSkusByIds: vi.fn(),
    findProductsWithReservationFlag: vi.fn(),
    findProductsStockByIds: vi.fn(),
    findProductArchivedStatus: vi.fn(),
    cleanupExpiredReservationsForProduct: vi.fn(),
  }
})

vi.mock('@/features/orders/repositories/orderRepository', () => {
  return {
    findPendingOrdersOlderThan: vi.fn(() => Promise.resolve([])),
    findOrderItems: vi.fn(() => Promise.resolve([])),
    markOrderAsError: vi.fn(),
  }
})

// Acceso a los mocks para las pruebas
import { findSkusByIds, findProductsWithReservationFlag, findProductsStockByIds, findProductArchivedStatus, cleanupExpiredReservationsForProduct } from '@/features/cart/repositories/stockRepository'

describe('cartValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findSkusByIds).mockResolvedValue([])
    vi.mocked(findProductsWithReservationFlag).mockResolvedValue([])
    vi.mocked(findProductsStockByIds).mockResolvedValue([])
    vi.mocked(findProductArchivedStatus).mockResolvedValue(null)
  })

  describe('validateCartItems', () => {
    it('should return success with empty items when array is empty', async () => {
      const result = await validateCartItems([])
      
      expect(result.success).toBe(true)
      expect(result.items).toEqual([])
      expect(result.has_problems).toBe(false)
      expect(result.blocked_items).toEqual([])
    })

    it('should mark variant as inactive when SKU not found', async () => {
      vi.mocked(findSkusByIds).mockResolvedValue([]) // No skus found

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        variant_id: 'sku-456',
        quantity: 1,
      }]

      const result = await validateCartItems(items)

      expect(result.success).toBe(false)
      expect(result.blocked_items).toContain('cart-item-1')
      expect(result.items[0].status).toBe('variant_inactive')
    })

    it('should mark variant as inactive when SKU is not active', async () => {
      vi.mocked(findSkusByIds).mockResolvedValue([{
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'ROJO-M',
        price_override: 10000,
        stock: 5,
        active: false,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        variant_id: 'sku-456',
        quantity: 1,
      }]

      const result = await validateCartItems(items)

      expect(result.success).toBe(false)
      expect(result.blocked_items).toContain('cart-item-1')
      expect(result.items[0].status).toBe('variant_inactive')
    })

    it('should mark out of stock when variant has zero stock', async () => {
      vi.mocked(findSkusByIds).mockResolvedValue([{
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'ROJO-M',
        price_override: 10000,
        stock: 0,
        active: true,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        variant_id: 'sku-456',
        quantity: 5,
      }]

      const result = await validateCartItems(items)

      expect(result.success).toBe(false)
      expect(result.blocked_items).toContain('cart-item-1')
      expect(result.items[0].status).toBe('out_of_stock')
    })

    it('should mark as price_changed when requested quantity exceeds stock but has some', async () => {
      vi.mocked(findSkusByIds).mockResolvedValue([{
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'ROJO-M',
        price_override: 10000,
        stock: 3,
        active: true,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        variant_id: 'sku-456',
        quantity: 10,
      }]

      const result = await validateCartItems(items)

      expect(result.has_problems).toBe(true)
      expect(result.items[0].status).toBe('price_changed')
      expect(result.items[0].available_stock).toBe(3)
      expect(result.items[0].quantity).toBe(3)
    })

    it('should mark product as inactive when product not found', async () => {
      vi.mocked(findProductsWithReservationFlag).mockResolvedValue([])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 1,
      }]

      const result = await validateCartItems(items)

      expect(result.success).toBe(false)
      expect(result.blocked_items).toContain('cart-item-1')
      expect(result.items[0].status).toBe('product_inactive')
    })

    it('should mark product as inactive when product is not active', async () => {
      vi.mocked(findProductsWithReservationFlag).mockResolvedValue([{
        id: 'prod-123',
        name: 'Producto Test',
        price: 15000,
        stock: 10,
        active: false,
        archived: false,
        has_active_reservation: false,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 2,
      }]

      const result = await validateCartItems(items)

      expect(result.success).toBe(false)
      expect(result.blocked_items).toContain('cart-item-1')
      expect(result.items[0].status).toBe('product_inactive')
    })

    it('should detect price changes when snapshot differs from current', async () => {
      vi.mocked(findProductsWithReservationFlag).mockResolvedValue([{
        id: 'prod-123',
        name: 'Producto Test',
        price: 18000,
        stock: 10,
        active: true,
        archived: false,
        has_active_reservation: false,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 2,
        price_snapshot: 15000,
      }]

      const result = await validateCartItems(items)

      expect(result.items[0].status).toBe('price_changed')
      expect(result.items[0].original_price).toBe(15000)
      expect(result.items[0].current_price).toBe(18000)
      expect(result.items[0].price_increased).toBe(true)
    })

    it('should mark as valid when product has sufficient stock', async () => {
      vi.mocked(findProductsWithReservationFlag).mockResolvedValue([{
        id: 'prod-123',
        name: 'Producto Test',
        price: 15000,
        stock: 10,
        active: true,
        archived: false,
        has_active_reservation: false,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 5,
      }]

      const result = await validateCartItems(items)

      expect(result.success).toBe(true)
      expect(result.items[0].status).toBe('valid')
      expect(result.items[0].current_price).toBe(15000)
      expect(result.items[0].current_stock).toBe(10)
    })

    it('should handle variant with price_override correctly', async () => {
      vi.mocked(findSkusByIds).mockResolvedValue([{
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'VERDE-L',
        price_override: 20000,
        stock: 8,
        active: true,
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        variant_id: 'sku-456',
        quantity: 3,
      }]

      const result = await validateCartItems(items)

      expect(result.items[0].current_price).toBe(20000)
      expect(result.items[0].status).toBe('valid')
    })
  })

  describe('validateSingleItem', () => {
    it('should call validateCartItems with quantity 1', async () => {
      vi.mocked(findProductsWithReservationFlag).mockResolvedValue([{
        id: 'prod-123',
        name: 'Test',
        price: 10000,
        stock: 5,
        active: true,
        archived: false,
        has_active_reservation: false,
      }])

      const item = {
        id: 'cart-item-1',
        product_id: 'prod-123',
      }

      const result = await validateSingleItem(item)

      expect(result.items[0].quantity).toBe(1)
      expect(result.items[0].status).toBe('valid')
    })
  })

  describe('stock reservation validation', () => {
    it('should detect when product has active reservation and cleanup is needed', async () => {
      vi.mocked(findProductsWithReservationFlag).mockResolvedValue([{
        id: 'prod-123',
        name: 'Producto Test',
        price: 15000,
        stock: 5,
        active: true,
        archived: false,
        has_active_reservation: true,
      }])
      
      vi.mocked(findProductsStockByIds).mockResolvedValue([{
        id: 'prod-123',
        stock: 5
      }])

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 3,
      }]

      await validateCartItems(items)

      expect(cleanupExpiredReservationsForProduct).toHaveBeenCalledWith(expect.anything(), 'prod-123')
    })
  })
})
