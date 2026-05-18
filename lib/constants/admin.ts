import {
  Package,
  Tag,
  ShoppingBag,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  ListOrdered,
} from "lucide-react";
import type { MensajeResponse } from "@/types/license.types";
import type { SidebarItem } from "@/types/admin.types";

export const MENSAJE_BLOQUEADO: MensajeResponse = {
  title: "PAGO NO REGISTRADO",
  description:
    "Tu licencia se encuentra suspendida. Comunícate con PRIGMA para renovar tu servicio.",
  status: "suspended",
};

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/categories", label: "Categorías", icon: Tag },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/sales", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/orders", label: "Órdenes", icon: ListOrdered },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/admin/pos", label: "Ventas POS", icon: ShoppingBag },
  { href: "/admin/shipping", label: "Envíos", icon: Truck },
];

export const DEVELOPER_CONTACT = {
  company: "PRIGMA",
  email: "contacto@prigma.com",
};
