"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export function WorkOrdersFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    startTransition(() => {
      router.push(pathname + "?" + createQueryString("search", value));
    });
  }, 300);

  const handleStatusChange = (value: string) => {
    startTransition(() => {
      router.push(pathname + "?" + createQueryString("status", value));
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
      <div className="flex flex-1 items-center gap-2 w-full sm:max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por cliente, tracking o teléfono..."
            className="pl-9 pr-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => {
                setSearchTerm("");
                handleSearch("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los Estados</SelectItem>
            <SelectItem value="RECEIVED">Recibido</SelectItem>
            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
            <SelectItem value="ON_HOLD">En Pausa</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="DELIVERED">Entregado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {(currentSearch || currentStatus !== "ALL") && (
          <Button variant="ghost" onClick={clearFilters} className="px-2" disabled={isPending}>
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
