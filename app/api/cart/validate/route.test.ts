import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/cart/validate/route'
import { NextRequest } from 'next/server'
import * as cartValidator from '@/lib/cart/cartValidator'

vi.mock('@/lib/cart/cartValidator', () => ({
  validateCartItems: vi.fn(),
}))

const mockValidateCartItems = cartValidator.validateCartItems as any

describe('POST /api/cart/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 with valid result for empty items', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: true,
      items: [],
      has_problems: false,
      blocked_items: [],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.items).toEqual([])
  })

  it('should call validateCartItems with correct items', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: true,
      items: [{ id: 'item-1', status: 'valid' }],
      has_problems: false,
      blocked_items: [],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { id: 'item-1', product_id: 'prod-1', quantity: 2 },
        ],
      }),
    })

    await POST(request)

    expect(mockValidateCartItems).toHaveBeenCalledWith([
      { id: 'item-1', product_id: 'prod-1', quantity: 2 },
    ])
  })

  it('should return validation result with blocked items', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: false,
      items: [
        { id: 'item-1', product_id: 'prod-1', status: 'product_inactive' },
      ],
      has_problems: true,
      blocked_items: ['item-1'],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'item-1', product_id: 'prod-1', quantity: 1 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.blocked_items).toContain('item-1')
    expect(data.items[0].status).toBe('product_inactive')
  })

  it('should return 200 with items having price_changed status', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: true,
      items: [
        { id: 'item-1', status: 'price_changed', available_stock: 3, quantity: 3 },
      ],
      has_problems: true,
      blocked_items: [],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'item-1', product_id: 'prod-1', quantity: 5 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.has_problems).toBe(true)
    expect(data.items[0].status).toBe('price_changed')
  })

  it('should return 500 on validation error', async () => {
    mockValidateCartItems.mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'item-1', product_id: 'prod-1', quantity: 1 }],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })

  it('should handle multiple items in validation', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: false,
      items: [
        { id: 'item-1', status: 'valid' },
        { id: 'item-2', status: 'out_of_stock' },
        { id: 'item-3', status: 'variant_inactive' },
      ],
      has_problems: true,
      blocked_items: ['item-2', 'item-3'],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { id: 'item-1', product_id: 'prod-1', quantity: 1 },
          { id: 'item-2', product_id: 'prod-2', quantity: 5 },
          { id: 'item-3', product_id: 'prod-1', variant_id: 'sku-1', quantity: 1 },
        ],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.items).toHaveLength(3)
    expect(data.blocked_items).toHaveLength(2)
    expect(data.items[0].status).toBe('valid')
    expect(data.items[1].status).toBe('out_of_stock')
    expect(data.items[2].status).toBe('variant_inactive')
  })

  it('should return empty result for missing body', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: true,
      items: [],
      has_problems: false,
      blocked_items: [],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(mockValidateCartItems).toHaveBeenCalledWith([])
  })

  it('should include all validation result fields in response', async () => {
    mockValidateCartItems.mockResolvedValueOnce({
      success: true,
      items: [
        {
          id: 'item-1',
          product_id: 'prod-1',
          status: 'price_changed',
          current_price: 15000,
          original_price: 12000,
          available_stock: 3,
          quantity: 3,
          price_increased: true,
        },
      ],
      has_problems: true,
      blocked_items: [],
    })

    const request = new NextRequest('http://localhost/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'item-1', product_id: 'prod-1', quantity: 5, price_snapshot: 12000 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.items[0]).toMatchObject({
      id: 'item-1',
      status: 'price_changed',
      current_price: 15000,
      original_price: 12000,
      available_stock: 3,
      price_increased: true,
    })
  })
})