import { Resend } from "resend"
import { storeBranding } from "@/lib/constants/branding-store"

let _resend: Resend | null = null
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || storeBranding.name
const siteUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || storeBranding.url

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export type OrderEmailItem = {
  name: string
  quantity: number
  price_at_purchase: number
  sku_code?: string | null
}

export type OrderEmailData = {
  orderId: string
  customerName: string
  customerEmail: string
  shippingAddress: string
  totalAmount: number
  wompiTransactionId?: string | null
  items: OrderEmailItem[]
}

// -------------------------------------------------------
// Formato de precio
// -------------------------------------------------------
function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount)
}

// -------------------------------------------------------
// Template HTML del email
// -------------------------------------------------------
function buildEmailHtml(data: OrderEmailData): string {
  const orderShortId = data.orderId.slice(0, 8).toUpperCase()

  const itemsRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-weight:600;color:#1a1a1a;">${item.name}</span>
          ${item.sku_code ? `<br><span style="font-size:12px;color:#888;">${item.sku_code}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;">
          x${item.quantity}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1a1a1a;">
          ${formatCOP(item.price_at_purchase * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("")

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de pedido — ${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;border:1px solid #27272a;border-radius:12px;">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
              <a href="${siteUrl}" target="_blank" style="display:inline-block;text-decoration:none;">
                <img alt="Logo PRIGMA - Desarrollo de Software a Medida en Colombia" loading="lazy" width="70" height="70" decoding="async" data-nimg="1" style="color:transparent;display:block;margin:0 auto;" srcset="https://prigma.net/_next/image?url=%2Fimages%2Fprigma_logo_sin_fondo.png&amp;w=96&amp;q=75 1x, https://prigma.net/_next/image?url=%2Fimages%2Fprigma_logo_sin_fondo.png&amp;w=256&amp;q=75 2x" src="https://prigma.net/_next/image?url=%2Fimages%2Fprigma_logo_sin_fondo.png&amp;w=256&amp;q=75">
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#18181b;padding:40px 40px 32px;border-radius:0 0 12px 12px;">

              <!-- Icono de éxito -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:60px;height:60px;background:#8a5cf620;border-radius:50%;line-height:60px;text-align:center;">
                  <span style="font-size:28px;color:#8a5cf6;">✓</span>
                </div>
              </div>

              <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff;text-align:center;">
                ¡Pago confirmado!
              </h2>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:15px;text-align:center;line-height:1.6;">
                Hola <strong style="color:#ffffff;">${data.customerName}</strong>, recibimos tu pago correctamente.<br>
                Pronto procesaremos y enviaremos tu pedido.
              </p>

              <!-- Referencia del pedido -->
              <div style="background:#27272a;border-radius:8px;padding:16px 20px;margin-bottom:32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">
                      N° de Pedido
                    </td>
                    <td style="text-align:right;font-family:monospace;font-size:14px;color:#ffffff;font-weight:700;">
                      #${orderShortId}
                    </td>
                  </tr>
                  ${data.wompiTransactionId ? `
                  <tr>
                    <td style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding-top:8px;">
                      ID Transacción Wompi
                    </td>
                    <td style="text-align:right;font-family:monospace;font-size:11px;color:#a1a1aa;padding-top:8px;word-break:break-all;">
                      ${data.wompiTransactionId}
                    </td>
                  </tr>` : ""}
                </table>
              </div>

              <!-- Items del pedido -->
              <h3 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;">
                Resumen del pedido
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                ${itemsRows.replace(/#1a1a1a/g, '#ffffff').replace(/#555/g, '#a1a1aa').replace(/#f0f0f0/g, '#27272a')}
                <tr>
                  <td colspan="3" style="padding-top:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:16px;font-weight:700;color:#ffffff;">Total pagado</td>
                        <td style="text-align:right;font-size:18px;font-weight:800;color:#8a5cf6;">
                          ${formatCOP(data.totalAmount)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Dirección de envío -->
              <div style="background:#27272a;border-left:4px solid #8a5cf6;border-radius:8px;padding:16px 20px;margin-bottom:32px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">
                  Dirección de envío
                </p>
                <p style="margin:0;font-size:14px;color:#e4e4e7;line-height:1.5;">
                  ${data.shippingAddress}
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${siteUrl}/profile/orders"
                   style="display:inline-block;background:#8a5cf6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;">
                  Ver mis pedidos
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #27272a;margin:0 0 24px;">

              <p style="margin:0;font-size:13px;color:#71717a;text-align:center;line-height:1.6;">
                Si tienes dudas sobre tu pedido, responde este correo.<br>
                <a href="${siteUrl}" style="color:#a1a1aa;text-decoration:none;font-weight:600;">${siteName}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// -------------------------------------------------------
// Función principal de envío
// -------------------------------------------------------
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${process.env.NEXT_PUBLIC_SITE_URL?.replace(/https?:\/\//, "") || "example.com"}`

  if (!apiKey || apiKey === "re_REEMPLAZAR_CON_API_KEY_DE_RESEND") {
    console.warn("[Email] RESEND_API_KEY no configurado. Email de confirmación no enviado.")
    return
  }

  const orderShortId = data.orderId.slice(0, 8).toUpperCase()

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("[Email] RESEND_API_KEY no configurado, omitiendo envío de email")
      return
    }

    const { error } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [data.customerEmail],
      subject: `✓ Pedido #${orderShortId} confirmado — ${siteName}`,
      html: buildEmailHtml(data),
    })

    if (error) {
      console.error("[Email] Error enviando confirmación de orden:", error)
    } else {
      console.log(`[Email] Confirmación enviada a ${data.customerEmail} para orden #${orderShortId}`)
    }
  } catch (err) {
    // No lanzar error — el pago ya se procesó, no queremos fallar el webhook por el email
    console.error("[Email] Error inesperado enviando email:", err)
  }
}
