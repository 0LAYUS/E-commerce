"use server";

import { createClient } from "@/lib/supabase/server";

export async function createOrder(
  items: {id: string, quantity: string, price: number}[], 
  totalAmount: number,
  customerName: string,
  customerEmail: string,
  shippingAddress: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Debes iniciar sesión para comprar");

  // Create Parent Order
  const { data: order, error } = await supabase.from('orders')
    .insert([{ 
      user_id: user.id, 
      total_amount: totalAmount, 
      status: 'PENDING',
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress
    }])
    .select()
    .single();

  if (error || !order) throw new Error("Error creando orden: " + error?.message);

  // Parse items
  const orderItems = items.map(i => ({
    order_id: order.id,
    product_id: i.id,
    quantity: i.quantity,
    price_at_purchase: i.price
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw new Error("Error insertando items: " + itemsError.message);

  return order.id;
}
