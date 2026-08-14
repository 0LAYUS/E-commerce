/**
 * E-commerce Theme Configuration - Vitaminas Pa' Ti
 *
 * Edit this file to change your store's appearance.
 * All colors use HEX format (e.g., "#2a2a2a" or "#fff").
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
// DARK THEME (Fondo negro y tonos verdes oscuros sobrios)
// ─────────────────────────────────────────────

export const themeConfig: ThemeConfig = {
  // ── BRAND ──────────────────────────────────
  brand: {
    primary: "#16a34a",
    primaryForeground: "#f0f9f4",
    secondary: "#14532d",
    secondaryForeground: "#f0f9f4",
    accent: "#1e3a2b",
    accentForeground: "#dcfce7",
  },

  // ── SURFACES ───────────────────────────────
  surfaces: {
    background: "#0a0a0a", // Fondo negro puro
    foreground: "#f0f9f4",
    card: "#141414", // Tarjetas oscuras
    cardForeground: "#f0f9f4",
    muted: "#18201a",
    mutedForeground: "#8fa397",
    border: "#202822",
    input: "#141414",
    ring: "#16a34a",
  },

  // ─ SEMANTIC ───────────────────────────────
  semantic: {
    destructive: "#dc2626",
    destructiveForeground: "#f0f9f4",
    success: "#22c55e",
    successForeground: "#0a0a0a",
    successMuted: "#14532d",
    warning: "#eab308",
    warningForeground: "#0a0a0a",
    warningMuted: "#713f12",
    info: "#38bdf8",
    infoForeground: "#0a0a0a",
    infoMuted: "#0c4a6e",
    danger: "#dc2626",
    dangerForeground: "#f0f9f4",
    dangerMuted: "#7f1d1d",
  },

  // ── CUSTOM ─────────────────────────────────
  custom: {
    purple: "#10b981",
  },

  borderRadius: "0.75rem",
};

// ─────────────────────────────────────────────
// LIGHT THEME (El tema claro original de Vitaminas Pa' Ti)
// ─────────────────────────────────────────────

export const lightTheme: ThemeConfig = {
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
  borderRadius: "0.75rem",
};
