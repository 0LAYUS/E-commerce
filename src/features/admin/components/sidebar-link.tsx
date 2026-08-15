"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SidebarLinkProps } from "@/types/admin.types";

export function SidebarLink({ href, label, icon: Icon, active }: SidebarLinkProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start font-medium transition-colors text-sm h-10 px-3",
        active
          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      <Link href={href} className="flex items-center gap-3">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
