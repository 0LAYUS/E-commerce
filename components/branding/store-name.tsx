"use client"

import { storeBranding } from "@/lib/constants/branding-store"

type StoreNameProps = {
  as?: "span" | "h1" | "h2" | "h3" | "p"
  className?: string
  children?: React.ReactNode
}

export function StoreName({ as: Tag = "span", className = "", children }: StoreNameProps) {
  return <Tag className={className}>{children ?? storeBranding.name}</Tag>
}
