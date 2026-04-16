import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const mockAdminClient = {
  from: vi.fn(),
  rpc: vi.fn(),
}

const mockClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

function createQueryChain(returnData: any, error: any = null) {
  const chain: any = {
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: returnData, error }),
    single: vi.fn().mockResolvedValue({ data: returnData, error }),
  }
  chain.in = vi.fn().mockReturnThis()
  return chain
}

function createSelectChain(returnData: any, error: any = null) {
  const chain: any = {
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: returnData, error }),
  }
  return {
    select: vi.fn().mockReturnValue(chain),
  }
}

describe('POS API - Phase 1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.mocked(createAdminClient).mockResolvedValue(mockAdminClient as any)
    vi.mocked(createClient).mockResolvedValue(mockClient as any)
  })

  describe('GET /api/pos/products', () => {
    it('should return empty array when no products exist', async () => {
      const chain = createQueryChain([])
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { GET } = await import('@/app/api/pos/products/route')
      const request = new NextRequest('http://localhost/api/pos/products')
      
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.products).toEqual([])
    })

    it('should return products with variants', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Camiseta Azul',
          price: 25000,
          stock: 10,
          image_url: '/img/camiseta.jpg',
          active: true,
          category_id: 'cat-1',
        },
      ]
      
      const productChain = createQueryChain(mockProducts)
      const categoriesChain = createQueryChain([])
      const skusChain = createQueryChain([])
      
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: vi.fn().mockReturnValue(productChain) }
        }
        if (table === 'categories') {
          return { select: vi.fn().mockReturnValue(categoriesChain) }
        }
        if (table === 'product_skus') {
          return { select: vi.fn().mockReturnValue(skusChain) }
        }
        return { select: vi.fn() }
      })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { GET } = await import('@/app/api/pos/products/route')
      const request = new NextRequest('http://localhost/api/pos/products')
      
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.products).toHaveLength(1)
      expect(json.products[0].name).toBe('Camiseta Azul')
    })

    it('should filter by search term', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Pantalon Negro',
          price: 50000,
          stock: 5,
          active: true,
          category_id: 'cat-1',
        },
      ]
      
      const chain = createQueryChain(mockProducts)
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { GET } = await import('@/app/api/pos/products/route')
      const request = new NextRequest('http://localhost/api/pos/products?search=Pantalon')
      
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockAdminClient.from).toHaveBeenCalledWith('products')
    })

    it('should filter by category_id', async () => {
      const chain = createQueryChain([])
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { GET } = await import('@/app/api/pos/products/route')
      const request = new NextRequest('http://localhost/api/pos/products?category_id=cat-ropa')
      
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should return 500 on database error', async () => {
      const chain = createQueryChain(null, { message: 'DB error' })
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { GET } = await import('@/app/api/pos/products/route')
      const request = new NextRequest('http://localhost/api/pos/products')
      
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/pos/validate', () => {
    it('should return valid for empty items array', async () => {
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(true)
      expect(json.items).toEqual([])
    })

    it('should validate product with sufficient stock', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'prod-1',
              name: 'Zapatos Rojos',
              price: 80000,
              stock: 15,
              active: true,
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', quantity: 3 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(true)
      expect(json.items[0].status).toBe('valid')
      expect(json.items[0].unit_price).toBe(80000)
    })

    it('should mark out_of_stock when product has zero stock', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'prod-1',
              name: 'Zapatos Rojos',
              price: 80000,
              stock: 0,
              active: true,
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', quantity: 1 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(false)
      expect(json.items[0].status).toBe('out_of_stock')
    })

    it('should mark not_found when product does not exist', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: 'Not found' }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'nonexistent-prod', quantity: 1 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(false)
      expect(json.items[0].status).toBe('not_found')
    })

    it('should mark inactive when product is not active', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'prod-1',
              name: 'Zapatos Rojos',
              price: 80000,
              stock: 15,
              active: false,
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', quantity: 1 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(false)
      expect(json.items[0].status).toBe('inactive')
    })

    it('should validate variant correctly', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sku-1',
              product_id: 'prod-1',
              sku_code: 'ROJO-42',
              price_override: 85000,
              stock: 8,
              active: true,
              product: { name: 'Zapatos Rojos', active: true, price: 80000 },
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', variant_id: 'sku-1', quantity: 2 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(true)
      expect(json.items[0].variant_id).toBe('sku-1')
      expect(json.items[0].unit_price).toBe(85000)
      expect(json.items[0].sku).toBe('ROJO-42')
    })

    it('should use product base price when variant has no price_override', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sku-1',
              product_id: 'prod-1',
              sku_code: 'ROJO-42',
              price_override: null,
              stock: 8,
              active: true,
              product: { name: 'Zapatos Rojos', active: true, price: 80000 },
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', variant_id: 'sku-1', quantity: 1 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.items[0].unit_price).toBe(80000)
    })

    it('should mark inactive when variant is not active', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sku-1',
              product_id: 'prod-1',
              sku_code: 'ROJO-42',
              price_override: 85000,
              stock: 8,
              active: false,
              product: { name: 'Zapatos Rojos', active: true },
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', variant_id: 'sku-1', quantity: 1 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(false)
      expect(json.items[0].status).toBe('inactive')
    })

    it('should mark inactive when variant product is not active', async () => {
      const chain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sku-1',
              product_id: 'prod-1',
              sku_code: 'ROJO-42',
              price_override: 85000,
              stock: 8,
              active: true,
              product: { name: 'Zapatos Rojos', active: false },
            },
            error: null,
          }),
        }),
      }
      mockAdminClient.from.mockReturnValue({ select: vi.fn().mockReturnValue(chain) })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/validate/route')
      const request = new NextRequest('http://localhost/api/pos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', variant_id: 'sku-1', quantity: 1 }],
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.valid).toBe(false)
      expect(json.items[0].status).toBe('inactive')
    })
  })

  describe('POST /api/pos/sales', () => {
    it('should create a sale successfully', async () => {
      const mockUser = { id: 'user-1', email: 'admin@test.com' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      ;(createClient as any).mockResolvedValue(mockClient)
      
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'pos_sales') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'sale-1',
                    seller_id: 'user-1',
                    total: 100000,
                    payment_method: 'efectivo',
                  },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'pos_cash_events') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return { insert: vi.fn() }
      })
      mockAdminClient.rpc.mockResolvedValue({ data: true, error: null })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'Juan Perez',
          items: [
            {
              product_id: 'prod-1',
              name: 'Camiseta Azul',
              quantity: 2,
              unit_price: 25000,
              discount_pct: 0,
              subtotal: 50000,
            },
          ],
          discount_amount: 0,
          subtotal: 50000,
          total: 50000,
          payment_method: 'efectivo',
          amount_received: 60000,
          change_amount: 10000,
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.sale).toBeDefined()
    })

    it('should return 401 when user is not authenticated', async () => {
      mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      ;(createClient as any).mockResolvedValue(mockClient)

      const { POST } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', name: 'Test', quantity: 1, unit_price: 1000, subtotal: 1000 }],
          total: 1000,
          payment_method: 'efectivo',
        }),
      })
      
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 when no items provided', async () => {
      const mockUser = { id: 'user-1' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      ;(createClient as any).mockResolvedValue(mockClient)

      const { POST } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
          total: 0,
          payment_method: 'efectivo',
        }),
      })
      
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should rollback sale when stock decrement fails', async () => {
      const mockUser = { id: 'user-1' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      ;(createClient as any).mockResolvedValue(mockClient)

      let saleDeleted = false
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'pos_sales') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'sale-1' },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation(() => {
                saleDeleted = true
                return Promise.resolve({ error: null })
              }),
            }),
          }
        }
        return { insert: vi.fn() }
      })
      mockAdminClient.rpc.mockResolvedValue({ data: false, error: null })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', name: 'Test', quantity: 999, unit_price: 1000, subtotal: 999000 }],
          total: 999000,
          payment_method: 'efectivo',
        }),
      })
      
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Stock insufficient')
      expect(saleDeleted).toBe(true)
    })

    it('should record cash event for efectivo payments', async () => {
      const mockUser = { id: 'user-1' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      ;(createClient as any).mockResolvedValue(mockClient)

      let cashEventInserted = false
      mockAdminClient.from.mockImplementation((table: string) => {
        if (table === 'pos_sales') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'sale-1' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'pos_cash_events') {
          return {
            insert: vi.fn().mockImplementation(() => {
              cashEventInserted = true
              return Promise.resolve({ error: null })
            }),
          }
        }
        return { insert: vi.fn() }
      })
      mockAdminClient.rpc.mockResolvedValue({ data: true, error: null })
      ;(createAdminClient as any).mockResolvedValue(mockAdminClient)

      const { POST } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: 'prod-1', name: 'Test', quantity: 1, unit_price: 5000, subtotal: 5000 }],
          total: 5000,
          payment_method: 'efectivo',
          amount_received: 6000,
          change_amount: 1000,
        }),
      })
      
      await POST(request)

      expect(cashEventInserted).toBe(true)
    })
  })

  describe('GET /api/pos/sales', () => {
    function createSalesQueryChain(returnData: any, error: any = null) {
      const chain: any = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: returnData, error }),
      }
      const selectFn = vi.fn().mockReturnValue(chain)
      return {
        select: selectFn,
      }
    }

    it('should return sales list for admin user', async () => {
      const mockUser = { id: 'user-1' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      const profileChain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'administrador' },
            error: null,
          }),
        }),
      }
      const profileSelectFn = vi.fn().mockReturnValue(profileChain)

      const salesChain: any = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'sale-1',
              total: 50000,
              payment_method: 'efectivo',
              created_at: '2024-01-15T10:00:00Z',
              seller: { id: 'user-1', email: 'admin@test.com' },
            },
          ],
          error: null,
        }),
      }
      const salesSelectFn = vi.fn().mockReturnValue(salesChain)
      
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { select: profileSelectFn }
        }
        if (table === 'pos_sales') {
          return { select: salesSelectFn }
        }
        return { select: vi.fn() }
      })
      ;(createClient as any).mockResolvedValue(mockClient)

      const { GET } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales')
      
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.sales).toHaveLength(1)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      ;(createClient as any).mockResolvedValue(mockClient)

      const { GET } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales')
      
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      const mockUser = { id: 'user-1' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { role: 'vendedor' },
              error: null,
            }),
          }),
        }),
      })
      ;(createClient as any).mockResolvedValue(mockClient)

      const { GET } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales')
      
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should filter by date range and other params', async () => {
      const mockUser = { id: 'user-1' }
      mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      
      const profileChain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'administrador' },
            error: null,
          }),
        }),
      }
      const profileSelectFn = vi.fn().mockReturnValue(profileChain)

      // Create a chainable query builder that limit returns
      const baseQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      
      // Make limit return the query builder itself (chainable)
      const salesChain: any = { ...baseQuery }
      const salesSelectFn = vi.fn().mockReturnValue(salesChain)
      
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { select: profileSelectFn }
        }
        if (table === 'pos_sales') {
          return { select: salesSelectFn }
        }
        return { select: vi.fn() }
      })
      ;(createClient as any).mockResolvedValue(mockClient)

      const { GET } = await import('@/app/api/pos/sales/route')
      const request = new NextRequest('http://localhost/api/pos/sales?from=2024-01-01&to=2024-01-31&seller_id=user-1&payment_method=efectivo')
      
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockClient.from).toHaveBeenCalledWith('pos_sales')
    })
  })
})