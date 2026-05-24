import {
  LayoutDashboard,
  Tag,
  Package,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";

const ICONS = [
  LayoutDashboard,
  Tag,
  Package,
  ShoppingBag,
  ShoppingCart,
  ShoppingBag,
  Truck,
];

export function AdminSkeleton() {
  return (
    <div className="flex sticky top-0 max-h-[100dvh] overflow-auto bg-transparent">
      <div className="w-64 bg-card shadow-sm border-r border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
        </div>
        <nav className="p-4 space-y-2">
          {ICONS.map((Icon, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2 text-muted-foreground"
            >
              <Icon className="w-5 h-5" />
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            </div>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-8 min-h-full flex flex-col">
          <div className="flex-1">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-border">
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
