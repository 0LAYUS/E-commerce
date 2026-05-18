export const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "pub_test_wompi_key_placeholder"

export const wompiWidgetDefaults = {
  currency: "COP",
  redirectUrl: typeof window !== "undefined" ? `${window.location.origin}/checkout/result` : "/checkout/result",
  scriptSrc: "https://checkout.wompi.co/widget.js",
}
