/**
 * E-commerce Theme Configuration
 *
 * Edit this file to change your store's appearance.
 * All colors use HEX format (e.g., "#2a2a2a" or "#fff").
 *
 * Palette:
 *   #2D5A27 — Verde oscuro (fondo principal, brand, hover botones)
 *   #A8D5BA — Verde menta (bordes, inputs, acentos sutiles)
 *   #E0F2F1 — Azul menta claro (fondos sutiles, badges)
 *   #F9F7F2 — Crema (texto principal, cards en dark mode)
 *   #D4E157 — Lima (success, highlights, ring)
 *
 * Structure:
 * - brand: Main brand colors (buttons, links, accents)
 * - surfaces: Page backgrounds, cards, borders
 * - semantic: Status colors (success, warning, info, destructive, danger)
 * - custom: Extra colors for special features
 * - borderRadius: Global border radius
 *
 * lightTheme overrides can be added for light mode.
 * Values not overridden in lightTheme fall back to dark theme.
 *
 * Theme detection: automatic via next-themes (enableSystem in app/layout.tsx)
 */

export interface ThemeConfig {
  brand: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
  };
  surfaces: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  semantic: {
    destructive: string;
    destructiveForeground: string;
    success: string;
    successForeground: string;
    successMuted: string;
    warning: string;
    warningForeground: string;
    warningMuted: string;
    info: string;
    infoForeground: string;
    infoMuted: string;
    danger: string;
    dangerForeground: string;
    dangerMuted: string;
  };
  custom: {
    purple: string;
  };
  borderRadius: string;
}

// ─────────────────────────────────────────────
// DARK THEME (default)
// Fondo: verde oscuro #2D5A27
// ─────────────────────────────────────────────

export const themeConfig: ThemeConfig = {
  // ── BRAND ──────────────────────────────────
  brand: {
    // bg-primary, text-primary, border-primary, ring-primary
    // → Botones principales, CTA, links de navegación
    primary: "#2D5A27",

    // text-primary-foreground, bg-primary-foreground
    // → Texto sobre fondos primarios (botones, iconos, toggles)
    primaryForeground: "#F9F7F2",

    // bg-secondary, text-secondary
    // → Fondos secundarios: badges, icon containers, table headers
    secondary: "#A8D5BA",

    // text-secondary-foreground
    // → Texto sobre fondos secundarios
    secondaryForeground: "#2D5A27",

    // bg-accent — VERDE OSCURO (hover de botones, mismo que background)
    // → Texto crema sobre verde oscuro = legible
    accent: "#2D5A27",

    // text-accent-foreground — CREMA (texto sobre hover verde oscuro)
    accentForeground: "#F9F7F2",
  },

  // ── SURFACES ───────────────────────────────
  surfaces: {
    // bg-background — VERDE OSCURO (fondo de toda la página)
    background: "#2D5A27",

    // text-foreground — CREMA (texto principal)
    foreground: "#F9F7F2",

    // bg-card — CREMA (tarjetas sobre fondo oscuro)
    card: "#F9F7F2",

    // text-card-foreground — VERDE OSCURO (texto sobre cards crema)
    cardForeground: "#2D5A27",

    // bg-muted — VERDE MENTA (fondos sutiles, placeholders, toggle off)
    muted: "#A8D5BA",

    // text-muted-foreground — VERDE OSCURO SUAVE (texto secundario)
    mutedForeground: "#4a6b45",

    // border-border — VERDE MENTA (bordes generales)
    border: "#A8D5BA",

    // border-input, bg-input — VERDE MENTA (inputs)
    input: "#A8D5BA",

    // ring-ring — LIMA (focus rings)
    ring: "#D4E157",
  },

  // ─ SEMANTIC ───────────────────────────────
  semantic: {
    destructive: "#dc2626",
    destructiveForeground: "#F9F7F2",

    // success — LIMA
    success: "#D4E157",
    successForeground: "#2D5A27",
    // successMuted — AZUL MENTA CLARO
    successMuted: "#E0F2F1",

    // warning — LIMA
    warning: "#D4E157",
    warningForeground: "#2D5A27",
    // warningMuted — AZUL MENTA CLARO
    warningMuted: "#E0F2F1",

    // info — VERDE MENTA
    info: "#A8D5BA",
    infoForeground: "#2D5A27",
    // infoMuted — AZUL MENTA CLARO
    infoMuted: "#E0F2F1",

    danger: "#dc2626",
    dangerForeground: "#F9F7F2",
    dangerMuted: "#fecaca",
  },

  // ── CUSTOM ─────────────────────────────────
  custom: {
    // purple — VERDE MENTA (método transferencia en admin POS)
    purple: "#A8D5BA",
  },

  borderRadius: "0.75rem",
};

// ─────────────────────────────────────────────
// LIGHT THEME (overrides only)
// Values not specified here fall back to dark theme.
// Fondo también verde oscuro para consistencia.
// ─────────────────────────────────────────────

export const lightTheme: Partial<ThemeConfig> & {
  surfaces?: Partial<ThemeConfig["surfaces"]>;
  brand?: Partial<ThemeConfig["brand"]>;
  semantic?: Partial<ThemeConfig["semantic"]>;
  custom?: Partial<ThemeConfig["custom"]>;
} = {
  surfaces: {
    background: "#2D5A27",
    foreground: "#F9F7F2",
    card: "#2D5A27",
    cardForeground: "#d4e157",
    muted: "#A8D5BA",
    mutedForeground: "#ffff",
    border: "#A8D5BA",
    input: "#F9F7F2",
    ring: "#D4E157",
  },
  brand: {
    primary: "#D4E157",
    primaryForeground: "#2D5A27",
    secondary: "#D4E157",
    secondaryForeground: "#2D5A27",
    accent: "#A8D5BA",
    accentForeground: "#2D5A27",
  },
  semantic: {
    destructive: "#dc2626",
    destructiveForeground: "#F9F7F2",
    success: "#D4E157",
    successForeground: "#2D5A27",
    successMuted: "#E0F2F1",
    warning: "#D4E157",
    warningForeground: "#2D5A27",
    warningMuted: "#E0F2F1",
    info: "#A8D5BA",
    infoForeground: "#2D5A27",
    infoMuted: "#E0F2F1",
    danger: "#dc2626",
    dangerForeground: "#F9F7F2",
    dangerMuted: "#fecaca",
  },
  custom: {
    purple: "#A8D5BA",
  },
};
