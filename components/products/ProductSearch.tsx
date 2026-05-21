"use client";

import { Input } from "@/components/ui/input";
import { MagnifyingGlass } from "@phosphor-icons/react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function ProductSearch({
  value,
  onChange,
  placeholder = "Buscar productos...",
}: Props) {
  return (
    <div className="relative">
      <MagnifyingGlass
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
        weight="bold"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 pl-12 pr-4 rounded-full bg-background/80  text-foreground placeholder:text-muted-foreground border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
      />
    </div>
  );
}
