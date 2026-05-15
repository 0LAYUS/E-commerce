// ============================================
// CSV EXPORT UTILITIES
// ============================================

/**
 * Trigger CSV file download in the browser.
 * @param csvContent - The CSV string (should include BOM for Excel compatibility)
 * @param filename - Name for the downloaded file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate filename with timestamp.
 * Format: orders_YYYY-MM-DD_HHMMSS.csv
 */
export function generateCSVFilename(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  return `orders_${year}-${month}-${day}_${hours}${minutes}${seconds}.csv`
}

/**
 * Format date for CSV (locale-specific for Colombia)
 */
export function formatDateForCSV(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-CO")
}

/**
 * Format time for CSV (locale-specific for Colombia)
 */
export function formatTimeForCSV(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
}

/**
 * Format amount from cents to pesos
 */
export function formatAmountForCSV(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Escape CSV field value
 */
export function escapeCSVField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}