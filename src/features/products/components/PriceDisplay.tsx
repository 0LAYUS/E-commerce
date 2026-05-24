import { formatPrice } from "@/lib/format"

type Props = {
  price: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function PriceDisplay({ price, size = "md", className = "" }: Props) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  return (
    <span className={`font-bold text-foreground ${sizeClasses[size]} ${className}`}>
      {formatPrice(price)}
    </span>
  )
}
