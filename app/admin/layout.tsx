"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LicenseOverlay } from "@/shared/components/license/LicenseOverlay";
import { MENSAJE_BLOQUEADO } from "@/lib/constants/admin";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminFooter } from "@/features/admin/components/admin-footer";
import { AdminSkeleton } from "@/features/admin/components/admin-skeleton";
import { Button } from "@/components/ui/button";
import { List } from "@phosphor-icons/react";

function AdminContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const bloqueado = searchParams.get("bloqueado") === "si";
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  if (bloqueado) {
    return <LicenseOverlay mensaje={MENSAJE_BLOQUEADO} />;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-transparent">
      {isSidebarVisible ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsSidebarVisible(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 h-full">
            <AdminSidebar />
          </div>
        </>
      ) : null}
      <div className="flex-1 overflow-auto">
        <div className="p-8 min-h-full flex flex-col">
          {!isSidebarVisible ? (
            <Button
              variant="secondary"
              className="fixed left-4 top-4 z-50 h-11 w-11 rounded-full p-0 shadow-md"
              onClick={() => setIsSidebarVisible(true)}
              aria-label="Mostrar menu"
            >
              <List className="h-6 w-6" weight="bold" />
              <span className="sr-only">Mostrar menu</span>
            </Button>
          ) : null}
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
