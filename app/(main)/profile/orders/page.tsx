import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { formatPrice } from "@/lib/format";

export default async function ProfileOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items ( id )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-8 text-foreground">Mis Compras</h1>

      <div className="space-y-6">
        {orders?.map((order) => {
          const productCount = order.order_items?.length || 0;
          return (
            <div
              key={order.id}
              className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-card-foreground">Orden #{order.id.split("-")[0]}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-4 py-1 text-xs font-semibold rounded-full ${
                    order.status === "APPROVED"
                      ? "bg-success-muted/50 text-success"
                      : order.status === "PENDING"
                        ? "bg-info-muted/50 text-info"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {order.status === "PENDING" ? "Procesando" : order.status === "APPROVED" ? "Aprobado" : order.status}
                </span>
              </div>

              <hr className="border-border my-4" />

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{productCount} producto(s)</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                </div>
                <Link
                  href={`/profile/orders/${order.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-lg text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition text-card-foreground shadow-sm"
                >
                  <Eye className="w-4 h-4 text-muted-foreground" /> Ver Detalles
                </Link>
              </div>
            </div>
          );
        })}

        {(!orders || orders.length === 0) && (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-xl shadow-sm border">
            Aún no has realizado ninguna orden en tu cuenta.
          </div>
        )}
      </div>
    </div>
  );
}
