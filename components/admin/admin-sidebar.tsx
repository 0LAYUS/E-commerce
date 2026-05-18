"use client";

import { usePathname } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/authActions";
import { SIDEBAR_ITEMS } from "@/lib/constants/admin";
import { SidebarLink } from "./sidebar-link";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card shadow-sm border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <form action={logout}>
          <Button variant="destructive" type="submit" className="w-full justify-start">
            <SignOut className="w-5 h-5 mr-3 text-center" />
            Salir
          </Button>
        </form>
      </div>
    </div>
  );
}
