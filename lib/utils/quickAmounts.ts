export function getQuickAmounts(total: number): number[] {
  return [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
  ]
}
