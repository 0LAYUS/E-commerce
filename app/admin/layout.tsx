"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LicenseOverlay } from "@/components/license/LicenseOverlay";
import { MENSAJE_BLOQUEADO } from "@/lib/constants/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminFooter } from "@/components/admin/admin-footer";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";

function AdminContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const bloqueado = searchParams.get("bloqueado") === "si";

  if (bloqueado) {
    return <LicenseOverlay mensaje={MENSAJE_BLOQUEADO} />;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-transparent">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 min-h-full flex flex-col">
          <div className="flex-1">{children}</div>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  );
}
