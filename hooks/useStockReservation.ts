"use client"

import { useState, useEffect, useCallback } from "react"

type UseStockReservationReturn = {
  reservationId: string | null
  reservationExpiresAt: Date | null
  reserveStock: (items: { product_id: string; variant_id?: string; quantity: number }[]) => Promise<void>
  cancelReservation: () => void
}

export function useStockReservation(items: unknown[], hasBlockedItems: boolean): UseStockReservationReturn {
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [reservationExpiresAt, setReservationExpiresAt] = useState<Date | null>(null)

  const reserveStock = useCallback(
    async (items: { product_id: string; variant_id?: string; quantity: number }[]) => {
      if (items.length === 0 || hasBlockedItems) return

      try {
        const response = await fetch("/api/cart/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        })

        if (response.ok) {
          const data = await response.json()
          setReservationId(data.reservation_id)
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
          setReservationExpiresAt(expiresAt)
        }
      } catch (err) {
        console.error("Failed to reserve stock:", err)
      }
    },
    [hasBlockedItems]
  )

  const cancelReservation = useCallback(() => {
    if (reservationId) {
      fetch("/api/cart/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: reservationId }),
      }).catch(console.error)
    }
  }, [reservationId])

  useEffect(() => {
    if (!reservationExpiresAt) return

    window.addEventListener("beforeunload", cancelReservation)
    return () => window.removeEventListener("beforeunload", cancelReservation)
  }, [reservationExpiresAt, cancelReservation])

  return { reservationId, reservationExpiresAt, reserveStock, cancelReservation }
}
