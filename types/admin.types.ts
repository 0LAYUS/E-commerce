import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  featureFlag?: string;
};

export type SidebarLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

export type FilterRole = "all" | "administrador" | "cliente"
