export type OptionDef = {
  name: string
  values: string[]
}

export type VariantStock = {
  sku_code: string
  stock: number
}

export type ProductInput = {
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  image_url?: string
}

export type VariantInput = {
  sku_code: string
  price_override: number | null
  stock: number
  option_value_ids: string[]
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  image_url: string
  active?: boolean
  has_variants?: boolean
  effective_stock?: number
  categories?: { name: string }
}

export type Category = {
  id: string
  name: string
  description?: string
}
