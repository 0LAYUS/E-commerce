type OptionDef = {
  name: string
  values: string[]
}

type GeneratedVariant = {
  sku_code: string
  optionValues: { name: string; value: string }[]
}

export function generateCartesianVariants(options: OptionDef[]): GeneratedVariant[] {
  if (options.length === 0 || options.some((o) => o.values.length === 0)) {
    return []
  }

  const results: GeneratedVariant[] = []

  const generate = (
    index: number,
    current: { sku_code: string; optionValues: { name: string; value: string }[] }
  ) => {
    if (index === options.length) {
      results.push({
        sku_code: current.sku_code,
        optionValues: [...current.optionValues],
      })
      return
    }

    const opt = options[index]
    for (const val of opt.values) {
      const separator = current.sku_code ? "-" : ""
      generate(index + 1, {
        sku_code: current.sku_code + separator + val.toUpperCase().replace(/\s+/g, "_"),
        optionValues: [...current.optionValues, { name: opt.name, value: val }],
      })
    }
  }

  generate(0, { sku_code: "", optionValues: [] })
  return results
}
