export const PRODUCT_ERROR_MESSAGES = {
  variantsRequired: {
    title: "Variantes requeridas",
    description: "Las variantes requieren al menos una opción con valores",
  },
  genericError: {
    title: "Error",
  },
  archiveProduct: (salesCount: number) => ({
    title: "Archivar producto",
    description: `Este producto tiene ${salesCount} venta${salesCount > 1 ? "s" : ""} asociada${salesCount > 1 ? "s" : ""}.\n\nSe archivará en lugar de eliminar.`,
  }),
}
