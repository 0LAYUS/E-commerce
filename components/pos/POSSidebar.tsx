"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SIDEBAR_ITEMS } from "@/lib/constants/admin"

export function POSSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="w-64 bg-card shadow-sm border-r border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-card-foreground">Panel Admin</h2>
      </div>
      <nav className="p-4 space-y-2">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${
                isActive(item.href) ? "bg-primary/10 text-primary font-medium" : ""
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
