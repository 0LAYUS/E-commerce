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

export type ProductImage = {
  id: string
  product_id: string
  url: string
  alt?: string | null
  position: number
}

export type VariantImage = {
  id: string
  sku_id: string
  url: string
  alt?: string | null
  position: number
}

export type Category = {
  id: string
  name: string
  description?: string
}

export type SKU = {
  id: string
  product_id: string
  sku_code: string
  price_override: number | null
  stock: number
  active: boolean
  option_values: string[]
}

export type RelatedProduct = {
  id: string
  name: string
  price: number
  image_url: string | null
}

export type GalleryImage = {
  id?: string
  url: string
  alt?: string | null
}
