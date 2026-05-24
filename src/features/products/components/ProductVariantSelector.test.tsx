import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ProductVariantSelector from '@/features/products/components/ProductVariantSelector'
import type { SKU, OptionDef } from '@/features/products/types/product.types'

const mockAddItem = vi.fn()
vi.mock('@/shared/components/CartProvider', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}))

const mockSkus: SKU[] = [
  { id: 'sku-1', product_id: 'prod-1', sku_code: 'ROJO-S', price_override: 12000, stock: 5, active: true, option_values: ['Rojo', 'S'] },
  { id: 'sku-2', product_id: 'prod-1', sku_code: 'ROJO-M', price_override: 12000, stock: 3, active: true, option_values: ['Rojo', 'M'] },
  { id: 'sku-3', product_id: 'prod-1', sku_code: 'AZUL-S', price_override: 15000, stock: 0, active: true, option_values: ['Azul', 'S'] },
  { id: 'sku-4', product_id: 'prod-1', sku_code: 'AZUL-M', price_override: 15000, stock: 8, active: true, option_values: ['Azul', 'M'] },
]

const mockOptions: OptionDef[] = [
  { name: 'Color', values: ['Rojo', 'Azul'] },
  { name: 'Talle', values: ['S', 'M'] },
]

describe('ProductVariantSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddItem.mockReset()
  })

  describe('render', () => {
    it('should render option selectors', () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      expect(screen.getByText('Color')).toBeInTheDocument()
      expect(screen.getByText('Talle')).toBeInTheDocument()
    })

    it('should render option values as buttons', () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      expect(screen.getByText('Rojo')).toBeInTheDocument()
      expect(screen.getByText('Azul')).toBeInTheDocument()
    })

    it('should show price and stock info', () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      expect(screen.getByText('Precio')).toBeInTheDocument()
      expect(screen.getByText('Stock disponible')).toBeInTheDocument()
    })

    it('should show "Stock disponible" when no options', () => {
      render(
        <ProductVariantSelector
          options={[]}
          skus={[]}
          basePrice={15000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      expect(screen.getByText('Stock disponible')).toBeInTheDocument()
    })
  })

  describe('option selection', () => {
    it('should require a selection before adding to cart', () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      const button = screen.getByRole('button', { name: 'Selecciona una variante' })
      expect(button).toBeDisabled()
    })

    it('should change selected option when clicked', async () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      const azulButton = screen.getByRole('button', { name: 'Azul' })
      const mButton = screen.getByRole('button', { name: 'M' })

      fireEvent.click(azulButton)
      fireEvent.click(mButton)

      await waitFor(() => {
        expect(screen.getByText('SKU: AZUL-M')).toBeInTheDocument()
      })
    })

    it('should show "Agotado" when variant has zero stock', async () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      const azulButton = screen.getByRole('button', { name: 'Azul' })
      const sButton = screen.getByRole('button', { name: 'S' })

      fireEvent.click(azulButton)
      fireEvent.click(sButton)

      await waitFor(() => {
        const agotadoButton = screen.getByRole('button', { name: 'Agotado' })
        expect(agotadoButton).toBeDisabled()
      })
    })
  })

  describe('add to cart', () => {
    it('should call addItem with variant info', async () => {
      mockAddItem.mockResolvedValueOnce({ success: true })

      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      fireEvent.click(screen.getByRole('button', { name: 'Rojo' }))
      fireEvent.click(screen.getByRole('button', { name: 'S' }))

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sku-1',
          product_id: 'prod-1',
          variant_id: 'sku-1',
          name: 'Test Product',
        })
      )
    })

    it('should use price_override from variant', async () => {
      mockAddItem.mockResolvedValueOnce({ success: true })

      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      fireEvent.click(screen.getByRole('button', { name: 'Rojo' }))
      fireEvent.click(screen.getByRole('button', { name: 'S' }))

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          price: expect.any(Number),
        })
      )
    })

    it('should show loading state while adding', async () => {
      let resolveAddItem: (value: unknown) => void
      mockAddItem.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAddItem = resolve
          })
      )

      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      fireEvent.click(screen.getByRole('button', { name: 'Rojo' }))
      fireEvent.click(screen.getByRole('button', { name: 'S' }))

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      expect(screen.getByText('Agregando...')).toBeInTheDocument()

      act(() => {
        resolveAddItem!({ success: true })
      })
    })

    it('should show error when addItem fails', async () => {
      mockAddItem.mockResolvedValueOnce({ success: false, error: 'Variante no disponible' })

      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      fireEvent.click(screen.getByRole('button', { name: 'Rojo' }))
      fireEvent.click(screen.getByRole('button', { name: 'S' }))

      await act(async () => {
        fireEvent.click(screen.getByText('Añadir al carrito'))
      })

      await waitFor(() => {
        expect(screen.getByText('Variante no disponible')).toBeInTheDocument()
      })
    })

    it('should disable button when stock is 0', async () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      const buttons = screen.getAllByRole('button')
      const azulButton = buttons.find((b) => b.textContent === 'Azul')
      const sButton = buttons.find((b) => b.textContent === 'S')

      if (azulButton) fireEvent.click(azulButton)
      await act(async () => {})

      if (sButton) fireEvent.click(sButton)

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: 'Agotado' })
        expect(addButton).toBeDisabled()
      })
    })
  })

  describe('SKU display', () => {
    it('should show SKU code when variant selected', async () => {
      render(
        <ProductVariantSelector
          options={mockOptions}
          skus={mockSkus}
          basePrice={10000}
          productId="prod-1"
          productName="Test Product"
        />
      )

      await waitFor(() => {})

      fireEvent.click(screen.getByRole('button', { name: 'Rojo' }))
      fireEvent.click(screen.getByRole('button', { name: 'S' }))

      await waitFor(() => {
        expect(screen.getByText(/SKU: ROJO-S/)).toBeInTheDocument()
      })
    })
  })
})