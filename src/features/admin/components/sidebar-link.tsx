"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SidebarLinkProps } from "@/types/admin.types";

export function SidebarLink({ href, label, icon: Icon, active }: SidebarLinkProps) {
  return (
    <Button
      asChild
      className={cn(
        "w-full justify-start",
        active && "bg-accent text-primary-foreground border-primary"
      )}
    >
      <Link href={href} className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
