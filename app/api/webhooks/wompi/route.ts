import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const data = payload.data?.transaction;

    if (!data) {
      return NextResponse.json({ received: false, error: 'Malformed Payload' }, { status: 400 });
    }

    const orderId = data.reference;
    const newStatus = data.status;

    const supabase = await createAdminClient()

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus, wompi_transaction_id: data.id })
      .eq('id', orderId);

    if (updateError) {
      console.error("Supabase Order Update Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (newStatus === "DECLINED") {
      const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.variant_id) {
            await supabase.rpc("increment_sku_stock", {
              p_sku_id: item.variant_id,
              p_quantity: item.quantity,
            })
          } else {
            await supabase.rpc("increment_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            })
          }
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    console.error("Webhook Internal Handler Error:", error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}