import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function cancelReservation(
  userId: string,
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: reservation, error: fetchError } = await supabase
    .from("stock_reservations")
    .select("user_id")
    .eq("id", reservationId)
    .single()

  if (fetchError || !reservation) {
    return { success: false, error: "Reserva no encontrada" }
  }

  if (reservation.user_id !== userId) {
    return { success: false, error: "No tienes permiso para cancelar esta reserva" }
  }

  const adminClient = await createAdminClient()
  const { error } = await adminClient.rpc("cancel_stock_reservation", {
    p_reservation_id: reservationId,
  })

  if (error) {
    return { success: false, error: "Failed to cancel reservation" }
  }

  return { success: true }
}