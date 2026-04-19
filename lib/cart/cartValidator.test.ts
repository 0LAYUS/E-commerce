import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateCartItems, validateSingleItem, CartValidationItem } from '@/lib/cart/cartValidator'

const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

function mockProductSelect(data: any) {
  const mock = vi.fn()
  mock.mockReturnValue({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data, error: null }),
    })),
  })
  mockSupabaseClient.from.mockReturnValue({ select: mock })
}

function mockSkuSelect(data: any) {
  const mock = vi.fn()
  mock.mockReturnValue({
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data, error: null }),
    })),
  })
  mockSupabaseClient.from.mockReturnValue({ select: mock })
}

function mockProductNotFound() {
  mockSupabaseClient.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: 'Not found' }),
      })),
    })),
  })
}

describe('cartValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('validateCartItems', () => {
    it('should return success with empty items when array is empty', async () => {
      const result = await validateCartItems([])
      
      expect(result.success).toBe(true)
      expect(result.items).toEqual([])
      expect(result.has_problems).toBe(false)
      expect(result.blocked_items).toEqual([])
    })

    it('should return success when null/undefined items passed', async () => {
      const result = await validateCartItems([] as any)
      
      expect(result.success).toBe(true)
      expect(result.items).toEqual([])
    })

    it('should mark variant as inactive when SKU not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: 'Not found' }),
          })),
        })),
      })

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
      mockSkuSelect({
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'ROJO-M',
        price_override: 10000,
        stock: 5,
        active: false,
      })

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
      mockSkuSelect({
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'ROJO-M',
        price_override: 10000,
        stock: 0,
        active: true,
      })

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
      mockSkuSelect({
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'ROJO-M',
        price_override: 10000,
        stock: 3,
        active: true,
      })

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
      mockProductNotFound()

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
      mockProductSelect({
        id: 'prod-123',
        name: 'Producto Test',
        price: 15000,
        stock: 10,
        active: false,
        has_active_reservation: false,
      })

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
      mockProductSelect({
        id: 'prod-123',
        name: 'Producto Test',
        price: 18000,
        stock: 10,
        active: true,
        has_active_reservation: false,
      })

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
      mockProductSelect({
        id: 'prod-123',
        name: 'Producto Test',
        price: 15000,
        stock: 10,
        active: true,
        has_active_reservation: false,
      })

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

    it('should validate multiple items and aggregate results correctly', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: any) => ({
            single: vi.fn().mockImplementation(() => {
              if (table === 'product_skus' && value === 'sku-not-found') {
                return Promise.resolve({ data: null, error: 'Not found' })
              }
              if (table === 'products') {
                if (value === 'prod-1') {
                  return Promise.resolve({
                    data: { id: 'prod-1', name: 'Prod 1', price: 10000, stock: 5, active: true, has_active_reservation: false },
                    error: null,
                  })
                }
                return Promise.resolve({ data: null, error: 'Not found' })
              }
              return Promise.resolve({ data: null, error: null })
            }),
          })),
        })),
      }))

      const items: CartValidationItem[] = [
        { id: 'item-1', product_id: 'prod-1', quantity: 2 },
        { id: 'item-2', product_id: 'prod-not-found', quantity: 1 },
      ]

      const result = await validateCartItems(items)

      expect(result.items).toHaveLength(2)
      expect(result.has_problems).toBe(true)
      expect(result.items[0].status).toBe('valid')
      expect(result.items[1].status).toBe('product_inactive')
    })

    it('should handle variant with price_override correctly', async () => {
      mockSkuSelect({
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'VERDE-L',
        price_override: 20000,
        stock: 8,
        active: true,
      })

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

    it('should use product base price when variant has no price_override', async () => {
      mockSkuSelect({
        id: 'sku-456',
        product_id: 'prod-123',
        sku_code: 'VERDE-L',
        price_override: null,
        stock: 8,
        active: true,
      })

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        variant_id: 'sku-456',
        quantity: 3,
        price_snapshot: 15000,
      }]

      const result = await validateCartItems(items)

      expect(result.items[0].current_price).toBeNull()
    })
  })

  describe('validateSingleItem', () => {
    it('should call validateCartItems with quantity 1', async () => {
      mockProductSelect({
        id: 'prod-123',
        name: 'Test',
        price: 10000,
        stock: 5,
        active: true,
        has_active_reservation: false,
      })

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
      mockProductSelect({
        id: 'prod-123',
        name: 'Producto Test',
        price: 15000,
        stock: 5,
        active: true,
        has_active_reservation: true,
      })

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 3,
      }]

      await validateCartItems(items)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('cleanup_expired_reservations_for_product', {
        p_product_id: 'prod-123',
      })
    })

    it('should validate reserved stock correctly after cleanup', async () => {
      let callCount = 0
      
      mockSupabaseClient.from.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockImplementation(() => {
              callCount++
              if (callCount === 1) {
                return Promise.resolve({
                  data: {
                    id: 'prod-123',
                    name: 'Producto Test',
                    price: 15000,
                    stock: 2,
                    active: true,
                    has_active_reservation: true,
                  },
                  error: null,
                })
              }
              return Promise.resolve({
                data: { stock: 5 },
                error: null,
              })
            }),
          })),
        })),
      }))

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 3,
      }]

      const result = await validateCartItems(items)

      expect(mockSupabaseClient.rpc).toHaveBeenCalled()
      expect(result.items[0].status).toBe('valid')
      expect(result.items[0].current_stock).toBe(5)
    })

    it('should allow checkout when reserved stock was released and is sufficient', async () => {
      let callCount = 0
      mockSupabaseClient.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockImplementation(() => {
              callCount++
              if (callCount === 1) {
                return Promise.resolve({
                  data: {
                    id: 'prod-123',
                    name: 'Producto Test',
                    price: 15000,
                    stock: 2,
                    active: true,
                    has_active_reservation: true,
                  },
                  error: null,
                })
              }
              return Promise.resolve({
                data: { stock: 8 },
                error: null,
              })
            }),
          })),
        })),
      }))

      const items: CartValidationItem[] = [{
        id: 'cart-item-1',
        product_id: 'prod-123',
        quantity: 5,
      }]

      const result = await validateCartItems(items)

      expect(result.items[0].status).toBe('valid')
      expect(result.items[0].available_stock).toBeUndefined()
    })
  })
})