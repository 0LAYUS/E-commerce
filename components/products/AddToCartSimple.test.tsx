import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AddToCartSimple from '@/components/product/AddToCartSimple'
import { useCart } from '@/components/providers/CartProvider'

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockAddItem = vi.fn()
vi.mock('@/components/providers/CartProvider', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}))

describe('AddToCartSimple', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddItem.mockReset()
  })

  describe('render', () => {
    it('should render add to cart button when stock > 0', () => {
      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={5} />)
      expect(screen.getByText('Añadir al carrito')).toBeInTheDocument()
    })

    it('should render "Agotado" button when stock is 0', () => {
      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={0} />)
      expect(screen.getByText('Agotado')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Agotado' })).toBeDisabled()
    })

    it('should disable button when stock is 0', () => {
      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={0} />)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('add to cart behavior', () => {
    it('should call addItem with correct parameters when clicked', async () => {
      mockAddItem.mockResolvedValueOnce({ success: true })

      render(<AddToCartSimple productId="prod-1" productName="Camisa Azul" price={15000} stock={5} />)

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'prod-1',
          product_id: 'prod-1',
          name: 'Camisa Azul',
          price: 15000,
        })
      )
    })

    it('should show loading state while adding', async () => {
      let resolveAddItem: (value: any) => void
      mockAddItem.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAddItem = resolve
          })
      )

      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={5} />)

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      expect(screen.getByText('Agregando...')).toBeInTheDocument()

      act(() => {
        resolveAddItem!({ success: true })
      })
    })

    it('should show error message when addItem fails', async () => {
      mockAddItem.mockResolvedValueOnce({ success: false, error: 'Este producto no está disponible' })

      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={5} />)

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      await waitFor(() => {
        expect(screen.getByText('Este producto no está disponible')).toBeInTheDocument()
      })
    })

    it('should clear error state after addItem succeeds', async () => {
      mockAddItem.mockResolvedValueOnce({ success: false, error: 'Error' })
      mockAddItem.mockResolvedValueOnce({ success: true })

      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={5} />)

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Error')).not.toBeInTheDocument()
      })
    })

    it('should disable button while loading', async () => {
      let resolveAddItem: (value: any) => void
      mockAddItem.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAddItem = resolve
          })
      )

      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={5} />)

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      const button = screen.getByRole('button', { name: 'Agregando...' })
      expect(button).toBeDisabled()

      act(() => {
        resolveAddItem!({ success: true })
      })
    })
  })

  describe('stock handling', () => {
    it('should not call addItem when stock is 0', () => {
      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={0} />)
      expect(mockAddItem).not.toHaveBeenCalled()
    })

    it('should show "Agotado" text when stock is 0', () => {
      render(<AddToCartSimple productId="prod-1" productName="Test" price={10000} stock={0} />)
      expect(screen.getByText('Agotado')).toBeInTheDocument()
    })
  })
})