import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CartProvider, useCart } from '@/components/providers/CartProvider'
import React from 'react'

const mockFetch = vi.fn()
global.fetch = mockFetch

function createMockLocalStorage(initialData: Record<string, string> = {}) {
  const store = { ...initialData }
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value }),
      removeItem: vi.fn((key: string) => { delete store[key] }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    },
    writable: true,
  })
  return store
}

function TestConsumer() {
  const { items, addItem, removeFromCart, updateQuantity, clearCart, total, hasBlockedItems } = useCart()
  return (
    <div>
      <span data-testid="item-count">{items.length}</span>
      <span data-testid="total">{total}</span>
      <span data-testid="has-blocked">{hasBlockedItems ? 'true' : 'false'}</span>
      {items.map((item) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <span data-testid={`name-${item.id}`}>{item.name}</span>
          <span data-testid={`qty-${item.id}`}>{item.quantity}</span>
          <span data-testid={`price-${item.id}`}>{item.price}</span>
        </div>
      ))}
      <button data-testid="add-btn" onClick={() => addItem({ id: 'prod-1', product_id: 'prod-1', name: 'Test Product', price: 10000 })}>
        Add Item
      </button>
      <button data-testid="remove-btn" onClick={() => removeFromCart('prod-1')}>
        Remove Item
      </button>
      <button data-testid="update-btn" onClick={() => updateQuantity('prod-1', 3)}>
        Update Qty
      </button>
      <button data-testid="clear-btn" onClick={() => clearCart()}>
        Clear
      </button>
    </div>
  )
}

describe('CartProvider', () => {
  let store: Record<string, string>

  beforeEach(() => {
    vi.clearAllMocks()
    store = createMockLocalStorage({ 'wompi-cart': '[]' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('addItem', () => {
    it('should call fetch to validate item before adding', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{ id: 'prod-1', status: 'valid', current_price: 10000 }],
          has_problems: false,
          blocked_items: [],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('add-btn'))
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cart/validate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should add item with price_snapshot when validation succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{ id: 'prod-1', status: 'valid', current_price: 10000 }],
          has_problems: false,
          blocked_items: [],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('add-btn'))
      })

      const itemCount = screen.getByTestId('item-count')
      expect(itemCount.textContent).toBe('1')

      const nameEl = screen.getByTestId('name-prod-1')
      expect(nameEl.textContent).toBe('Test Product')
    })

    it('should not add item when validation returns blocked item', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          items: [{ id: 'prod-1', status: 'product_inactive' }],
          has_problems: true,
          blocked_items: ['prod-1'],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      fireEvent.click(screen.getByTestId('add-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('item-count').textContent).toBe('0')
      })
    })

    it('should increment quantity when adding existing item', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 }
      ])

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{ id: 'prod-1', status: 'valid', current_price: 10000 }],
          has_problems: false,
          blocked_items: [],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await waitFor(() => {
        expect(screen.getByTestId('item-count').textContent).toBe('1')
      })

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{ id: 'prod-1', status: 'valid', current_price: 10000 }],
          has_problems: false,
          blocked_items: [],
        }),
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('add-btn'))
      })

      const qtyEl = screen.getByTestId('qty-prod-1')
      expect(qtyEl.textContent).toBe('2')
    })
  })

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 },
        { id: 'prod-2', product_id: 'prod-2', name: 'Test 2', price: 15000, quantity: 1 },
      ])

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('remove-btn'))
      })

      const itemCount = screen.getByTestId('item-count')
      expect(itemCount.textContent).toBe('1')
    })
  })

  describe('updateQuantity', () => {
    it('should update quantity for existing item', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 }
      ])

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-btn'))
      })

      const qtyEl = screen.getByTestId('qty-prod-1')
      expect(qtyEl.textContent).toBe('3')
    })

    it('should remove item when quantity set to 0', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 2 }
      ])

      let removeFn: (id: string) => void
      function TestConsumerWithRemove() {
        const ctx = useCart()
        removeFn = ctx.removeFromCart
        return <div data-testid="count">{ctx.items.length}</div>
      }

      await act(async () => {
        render(<CartProvider><TestConsumerWithRemove /></CartProvider>)
      })

      await act(async () => {
        removeFn!('prod-1')
      })

      const count = screen.getByTestId('count')
      expect(count.textContent).toBe('0')
    })
  })

  describe('clearCart', () => {
    it('should remove all items', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 },
        { id: 'prod-2', product_id: 'prod-2', name: 'Test 2', price: 15000, quantity: 2 },
      ])

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId('clear-btn'))
      })

      const itemCount = screen.getByTestId('item-count')
      expect(itemCount.textContent).toBe('0')
    })
  })

  describe('total calculation', () => {
    it('should calculate total correctly', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 2 },
        { id: 'prod-2', product_id: 'prod-2', name: 'Test 2', price: 15000, quantity: 1 },
      ])

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      const total = screen.getByTestId('total')
      expect(total.textContent).toBe('35000')
    })
  })

  describe('hasBlockedItems', () => {
    it('should be true when validation returns blocked items', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 },
      ])

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          items: [{ id: 'prod-1', status: 'out_of_stock' }],
          has_problems: true,
          blocked_items: ['prod-1'],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await waitFor(() => {
        const hasBlocked = screen.getByTestId('has-blocked')
        expect(hasBlocked.textContent).toBe('true')
      })
    })

    it('should be false when all items are valid or price_changed only', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 },
      ])

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{ id: 'prod-1', status: 'price_changed', available_stock: 5, current_price: 12000 }],
          has_problems: true,
          blocked_items: [],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await waitFor(() => {
        const hasBlocked = screen.getByTestId('has-blocked')
        expect(hasBlocked.textContent).toBe('false')
      })
    })
  })

  describe('revalidateCart', () => {
    it('should not call API when cart is empty', async () => {
      store['wompi-cart'] = '[]'

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should update statuses after validation', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 1 },
      ])

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{
            id: 'prod-1',
            status: 'price_changed',
            current_price: 12000,
            original_price: 10000,
            available_stock: 3,
            price_increased: true,
          }],
          has_problems: true,
          blocked_items: [],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await waitFor(() => {
        const hasBlocked = screen.getByTestId('has-blocked')
        expect(hasBlocked.textContent).toBe('false')
      })
    })

    it('should adjust quantity when stock is reduced during revalidation', async () => {
      store['wompi-cart'] = JSON.stringify([
        { id: 'prod-1', product_id: 'prod-1', name: 'Test', price: 10000, quantity: 10 },
      ])

      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          items: [{
            id: 'prod-1',
            status: 'price_changed',
            current_stock: 3,
            available_stock: 3,
            current_price: 10000,
            quantity: 3,
          }],
          has_problems: true,
          blocked_items: [],
        }),
      })

      await act(async () => {
        render(<CartProvider><TestConsumer /></CartProvider>)
      })

      await waitFor(() => {
        const qtyEl = screen.getByTestId('qty-prod-1')
        expect(qtyEl.textContent).toBe('3')
      })
    })
  })

  describe('useCart hook', () => {
    it('should throw error when used outside CartProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow('useCart must be used within CartProvider')

      consoleError.mockRestore()
    })
  })
})