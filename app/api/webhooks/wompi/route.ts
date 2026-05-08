import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { sendOrderConfirmationEmail } from '@/lib/email/orderConfirmation';

/**
 * Valida la firma del evento de Wompi para asegurar que el payload es auténtico.
 * Documentación: https://docs.wompi.co/docs/en/eventos#verificaci%C3%B3n-de-integridad
 *
 * Algoritmo: SHA256(event.timestamp + event.checksum + eventsSecret)
 * El header 'x-event-checksum' contiene el valor a verificar.
 */
function verifyWompiSignature(payload: any, checksumHeader: string | null): boolean {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

  // Si el secret no está configurado (aún en placeholder), omitir validación en dev
  if (!eventsSecret || eventsSecret.startsWith('test_events_REEMPLAZAR')) {
    console.warn('[Wompi Webhook] WOMPI_EVENTS_SECRET no configurado. Omitiendo validación de firma (solo para desarrollo).');
    return true;
  }

  if (!checksumHeader) {
    console.error('[Wompi Webhook] Falta el header x-event-checksum.');
    return false;
  }

  const timestamp = payload.timestamp;
  if (!timestamp) {
    console.error('[Wompi Webhook] Falta el campo timestamp en el payload.');
    return false;
  }

  // La firma se calcula sobre: timestamp + checksum_del_evento + events_secret
  const stringToHash = `${timestamp}${checksumHeader}${eventsSecret}`;
  const expectedSignature = crypto.createHash('sha256').update(stringToHash).digest('hex');

  const isValid = expectedSignature === checksumHeader;
  if (!isValid) {
    console.error('[Wompi Webhook] Firma inválida. Posible intento de manipulación.');
  }
  return isValid;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Verificar autenticidad del evento
    const checksumHeader = req.headers.get('x-event-checksum');
    if (!verifyWompiSignature(payload, checksumHeader)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const event = payload.event;
    // Solo procesar eventos de transacción actualizados
    if (event !== 'transaction.updated') {
      return NextResponse.json({ received: true, skipped: true });
    }

    const data = payload.data?.transaction;
    if (!data) {
      return NextResponse.json({ received: false, error: 'Payload malformado' }, { status: 400 });
    }

    const orderId = data.reference;
    const newStatus = data.status; // APPROVED | DECLINED | ERROR | VOIDED

    const supabase = await createAdminClient();

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus, wompi_transaction_id: data.id })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Wompi Webhook] Error actualizando orden:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Si fue declinado/error, devolver el stock
    if (newStatus === 'DECLINED' || newStatus === 'ERROR' || newStatus === 'VOIDED') {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.variant_id) {
            await supabase.rpc('increment_sku_stock', {
              p_sku_id: item.variant_id,
              p_quantity: item.quantity,
            });
          } else {
            await supabase.rpc('increment_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            });
          }
        }
      }
    }

    // Si el pago fue aprobado, enviar email de confirmación al cliente
    if (newStatus === 'APPROVED') {
      // Obtener datos completos de la orden con sus items y nombres de productos
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          shipping_address,
          total_amount,
          wompi_transaction_id,
          order_items (
            quantity,
            price_at_purchase,
            product_id,
            variant_id,
            products ( name ),
            product_skus ( sku_code )
          )
        `)
        .eq('id', orderId)
        .single();

      if (order && order.customer_email) {
        const items = (order.order_items || []).map((item: any) => ({
          name: item.products?.name || 'Producto',
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
          sku_code: item.product_skus?.sku_code ?? null,
        }));

        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: order.customer_name || 'Cliente',
          customerEmail: order.customer_email,
          shippingAddress: order.shipping_address || '',
          totalAmount: order.total_amount,
          wompiTransactionId: order.wompi_transaction_id,
          items,
        });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    console.error('[Wompi Webhook] Error interno:', error);
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
  }
}