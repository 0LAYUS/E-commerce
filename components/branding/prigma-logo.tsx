"use client"

import Image from "next/image"
import { prigmaBranding } from "@/lib/constants/branding-prigma"

type PrigmaLogoProps = {
  src?: string
  alt?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const sizePx = { xs: 16, sm: 56, md: 80, lg: 120 } as const

export function PrigmaLogo({ src, alt, size = "md", className = "" }: PrigmaLogoProps) {
  const px = sizePx[size]
  const logoSrc = src ?? prigmaBranding.assets.logo
  const logoAlt = alt ?? prigmaBranding.company

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
