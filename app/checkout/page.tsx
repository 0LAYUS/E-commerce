"use client";

import { useCart } from "@/components/providers/CartProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/actions/checkoutActions";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");

  const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "pub_test_wompi_key_placeholder"; 

  useEffect(() => {
    // Add Wompi Script widget securely
    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError("");
    try {
      // 1. Create order in DB as PENDING
      const orderId = await createOrder(
        items.map(i => ({ id: i.id, quantity: i.quantity.toString(), price: i.price })), 
        total,
        nombre,
        email,
        direccion
      );
      
      // 2. Open Wompi Checkout Widget
      const checkout = new (window as any).WidgetCheckout({
        currency: 'COP',
        amountInCents: total * 100,
        reference: orderId,
        publicKey: wompiPublicKey,
        redirectUrl: `${window.location.origin}/checkout/result`,
        customerData: {
          email: email,
          fullName: nombre
        }
      });

      checkout.open((result: any) => {
        const transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
          clearCart();
        }
        router.push(`/checkout/result?id=${transaction.id}&status=${transaction.status}`);
      });
    } catch (err: any) {
      setError(err.message || "Error al procesar. Verifica tu sesión.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <div className="text-center mt-20 text-gray-500">Tu carrito está vacío. <a href="/" className="text-blue-500 font-medium hover:underline">Volver a la tienda</a></div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-20 px-4">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900">Checkout</h1>
      
      <div className="bg-white shadow-sm border rounded-xl overflow-hidden p-8">
        <form onSubmit={handlePayment}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Información de Envío</h2>
          
          <div className="space-y-5 mb-10">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
                placeholder="juan"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
                placeholder="juan@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección de Envío</label>
              <textarea 
                rows={3} 
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
                placeholder="Calle, ciudad, código postal, país"
              ></textarea>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h2>
          <div className="space-y-3 mb-6">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm text-gray-600">
                <span className="font-medium">{item.name} x {item.quantity}</span>
                <span className="font-semibold text-gray-900 font-mono text-xs">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-gray-200 mb-5" />

          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-extrabold text-gray-900">Total</span>
            <span className="text-lg font-extrabold text-blue-500">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          {error && <div className="mb-4 text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#60A5FA] text-white font-bold py-3.5 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition shadow-sm mt-2"
          >
            {loading ? "Cargando pasarela..." : "Proceder al Pago"}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-5">
            Serás redirigido a Wompi para completar tu pago de forma segura.
          </p>
        </form>
      </div>
    </div>
  );
}
