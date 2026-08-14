import {
  Package,
  Tag,
  ShoppingBag,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  ListOrdered,
  Wrench,
} from "lucide-react";
import type { MensajeResponse } from "@/shared/types/license.types";
import type { SidebarItem } from "@/types/admin.types";
import { prigmaBranding } from "@/lib/constants/branding-prigma";

export const MENSAJE_BLOQUEADO: MensajeResponse = {
  title: "PAGO NO REGISTRADO",
  description:
    `Tu licencia se encuentra suspendida. Comunícate con ${prigmaBranding.company} para renovar tu servicio.`,
  status: "suspended",
};

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/categories", label: "Categorías", icon: Tag },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/sales", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/orders", label: "Órdenes", icon: ListOrdered },
  { href: "/admin/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/pos/sales", label: "Ventas POS", icon: ShoppingBag },
  { href: "/admin/shipping", label: "Envíos", icon: Truck },
  { href: "/admin/work-orders", label: "Reparaciones", icon: Wrench, featureFlag: "workOrders" },
];

export const DEVELOPER_CONTACT = {
  company: prigmaBranding.company,
  email: prigmaBranding.email,
};
