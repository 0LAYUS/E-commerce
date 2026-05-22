/**
 * E-commerce Theme Configuration
 *
 * Edit this file to change your store's appearance.
 * All colors use HEX format (e.g., "#2a2a2a" or "#fff").
 *
 * Palette:
 *   #0b231c — Verde noche profundo
 *   #153f31 — Verde bosque oscuro
 *   #194c3a — Verde esmeralda profundo
 *   #1d5f48 — Verde hoja
 *   #247758 — Verde vibrante
 *   #34956e — Verde fresco
 *   #56b18a — Verde suave
 *   #81caa8 — Verde menta claro
 *   #b7e3cc — Verde crema
 *   #daf1e4 — Verde agua
 *   #f0f9f4 — Crema claro
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
    primary: "#194c3a",

    // text-primary-foreground, bg-primary-foreground
    // → Texto sobre fondos primarios (botones, iconos, toggles)
    primaryForeground: "#f0f9f4",

    // bg-secondary, text-secondary
    // → Fondos secundarios: badges, icon containers, table headers
    secondary: "#247758",

    // text-secondary-foreground
    // → Texto sobre fondos secundarios
    secondaryForeground: "#f0f9f4",

    // bg-accent — VERDE SUAVE
    // → Texto crema sobre acento natural
    accent: "#56b18a",

    // text-accent-foreground — OSCURO PROFUNDO
    accentForeground: "#0b231c",
  },

  // ── SURFACES ───────────────────────────────
  surfaces: {
    // bg-background — VERDE NOCHE PROFUNDO (fondo de toda la página)
    background: "#0b231c",

    // text-foreground — CREMA CLARO (texto principal)
    foreground: "#f0f9f4",

    // bg-card — VERDE BOSQUE OSCURO (tarjetas sobre fondo oscuro)
    card: "#153f31",

    // text-card-foreground — CREMA CLARO (texto sobre cards)
    cardForeground: "#f0f9f4",

    // bg-muted — VERDE HOJA (fondos sutiles, placeholders, toggle off)
    muted: "#1d5f48",

    // text-muted-foreground — VERDE AGUA CLARO (texto secundario)
    mutedForeground: "#daf1e4",

    // border-border — VERDE VIBRANTE (bordes generales)
    border: "#247758",

    // border-input, bg-input — VERDE ESMERALDA PROFUNDO (inputs)
    input: "#194c3a",

    // ring-ring — VERDE MENTA CLARO (focus rings)
    ring: "#81caa8",
  },

  // ─ SEMANTIC ───────────────────────────────
  semantic: {
    destructive: "#dc2626",
    destructiveForeground: "#f0f9f4",

    // success — VERDE SUAVE
    success: "#56b18a",
    successForeground: "#0b231c",
    // successMuted — VERDE AGUA
    successMuted: "#daf1e4",

    // warning — VERDE VIBRANTE
    warning: "#247758",
    warningForeground: "#f0f9f4",
    // warningMuted — VERDE CREMA
    warningMuted: "#b7e3cc",

    // info — VERDE MENTA CLARO
    info: "#81caa8",
    infoForeground: "#0b231c",
    // infoMuted — VERDE AGUA
    infoMuted: "#daf1e4",

    danger: "#dc2626",
    dangerForeground: "#f0f9f4",
    dangerMuted: "#fecaca",
  },

  // ── CUSTOM ─────────────────────────────────
  custom: {
    // purple — TONO VERDE FRESCO (método transferencia en admin POS)
    purple: "#34956e",
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
    background: "#f0f9f4",
    foreground: "#0b231c",
    card: "#daf1e4",
    cardForeground: "#0b231c",
    muted: "#b7e3cc",
    mutedForeground: "#153f31",
    border: "#81caa8",
    input: "#ffffff",
    ring: "#247758",
  },
  brand: {
    primary: "#247758",
    primaryForeground: "#f0f9f4",
    secondary: "#34956e",
    secondaryForeground: "#f0f9f4",
    accent: "#81caa8",
    accentForeground: "#0b231c",
  },
  semantic: {
    destructive: "#dc2626",
    destructiveForeground: "#f0f9f4",
    success: "#56b18a",
    successForeground: "#0b231c",
    successMuted: "#daf1e4",
    warning: "#34956e",
    warningForeground: "#0b231c",
    warningMuted: "#b7e3cc",
    info: "#81caa8",
    infoForeground: "#0b231c",
    infoMuted: "#daf1e4",
    danger: "#dc2626",
    dangerForeground: "#f0f9f4",
    dangerMuted: "#fecaca",
  },
  custom: {
    purple: "#34956e",
  },
};
