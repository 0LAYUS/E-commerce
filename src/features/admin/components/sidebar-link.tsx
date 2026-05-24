"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SidebarLinkProps } from "@/types/admin.types";

export function SidebarLink({ href, label, icon: Icon }: SidebarLinkProps) {
  return (
    <Button asChild className="w-full justify-start">
      <Link href={href} className="flex items-center gap-3">
        <Icon className="w-5 h-5 shrink-0" />
        {label}
      </Link>
    </Button>
  );
}
