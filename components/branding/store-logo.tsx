"use client"

import Image from "next/image"
import { storeBranding } from "@/lib/constants/branding-store"

type StoreLogoProps = {
  src?: string
  alt?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizePx = { sm: 28, md: 40, lg: 80 } as const

export function StoreLogo({ src, alt, size = "md", className = "" }: StoreLogoProps) {
  const px = sizePx[size]
  const logoSrc = src ?? storeBranding.assets.logo
  const logoAlt = alt ?? storeBranding.name

  return (
    <Image
      src={logoSrc}
      alt={logoAlt}
      width={px}
      height={px}
      className={`object-contain ${className}`}
    />
  )
}
