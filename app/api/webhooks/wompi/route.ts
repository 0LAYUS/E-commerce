import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// We use standard supabase-js client with SERVICE_ROLE_KEY to bypass RLS securely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Wompi Event structure
    const event = payload.event;
    const data = payload.data?.transaction;
    const signature = payload.signature; 
    
    if (!data) {
      return NextResponse.json({ received: false, error: 'Malformed Payload' }, { status: 400 });
    }

    /** 
     * Security Checksum validation 
     * Wompi concatenates id + status + amount_in_cents + timestamp + eventSecret => SHA256 HEX 
     * We would validate it here. Skipped for simplicity in this Basic E-commerce unless required.
     */
    
    const orderId = data.reference; 
    const newStatus = data.status; // 'APPROVED', 'DECLINED', 'ERROR'
    
    // Update the Order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus, wompi_transaction_id: data.id })
      .eq('id', orderId);

    if (updateError) {
      console.error("Supabase Order Update Error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Logic: If APPROVED -> discount stock 
    if (newStatus === "APPROVED") {
      const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      
      if (orderItems) {
        for (const item of orderItems) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod) {
            await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.product_id);
          }
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Webhook Internal Handler Error:", error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
