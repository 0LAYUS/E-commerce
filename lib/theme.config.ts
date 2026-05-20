/**
 * E-commerce Theme Configuration
 *
 * Edit this file to change your store's appearance.
 * All colors use HEX format (e.g., "#2a2a2a" or "#fff").
 *
 * Structure:
 * - brand: Main brand colors (buttons, links, accents)
 * - surfaces: Page backgrounds, cards, borders
 * - semantic: Status colors (success, warning, info, destructive)
 * - custom: Extra colors for special features (purple, gray variants)
 * - typography: Text and surface-specific tokens
 * - borderRadius: Global border radius
 *
 * lightTheme overrides can be added for light mode.
 */

export interface ThemeSection {
  [key: string]: string;
}

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
  };
  custom: {
    purple: string;
    purpleLight: string;
    purpleDark: string;
    gray: string;
    grayLight: string;
    grayDark: string;
  };
  typography: {
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    bgSurface: string;
    bgSurfaceMuted: string;
    borderSubtle: string;
  };
  borderRadius: string;
}

// ─────────────────────────────────────────────
// DARK THEME (default)
// ─────────────────────────────────────────────

export const themeConfig: ThemeConfig = {
  brand: {
    primary: "#572364",
    primaryForeground: "#ffffff",
    secondary: "#374151",
    secondaryForeground: "#f9fafb",
    accent: "#404040",
    accentForeground: "#ffffff",
  },
  surfaces: {
    background: "#572364",
    foreground: "#f9fafb",
    card: "#1a1d27",
    cardForeground: "#f9fafb",
    muted: "#374151",
    mutedForeground: "#a1a1aa",
    border: "#3f3f46",
    input: "#3f3f46",
    ring: "#2a2a2a",
  },
  semantic: {
    destructive: "#dc2626",
    destructiveForeground: "#f9fafb",
    success: "#22c55e",
    successForeground: "#f9fafb",
    successMuted: "#dcfce7",
    warning: "#f59e0b",
    warningForeground: "#1c1917",
    warningMuted: "#fef3c7",
    info: "#3b82f6",
    infoForeground: "#f9fafb",
    infoMuted: "#dbeafe",
  },
  custom: {
    purple: "#a855f7",
    purpleLight: "#c084fc",
    purpleDark: "#4c1d95",
    gray: "#a1a1aa",
    grayLight: "#a3a3a3",
    grayDark: "#374151",
  },
  typography: {
    textPrimary: "#f9fafb",
    textSecondary: "#c4c4c4",
    textMuted: "#a1a1aa",
    bgSurface: "#1a1d27",
    bgSurfaceMuted: "#374151",
    borderSubtle: "#3f3f46",
  },
  borderRadius: "0.75rem",
};

// ─────────────────────────────────────────────
// LIGHT THEME (overrides only)
// Values not specified here fall back to dark theme.
// ─────────────────────────────────────────────

export const lightTheme: Partial<ThemeConfig> & {
  surfaces?: Partial<ThemeConfig["surfaces"]>;
  brand?: Partial<ThemeConfig["brand"]>;
  semantic?: Partial<ThemeConfig["semantic"]>;
  custom?: Partial<ThemeConfig["custom"]>;
  typography?: Partial<ThemeConfig["typography"]>;
} = {
  surfaces: {
    background: "#572364",
    foreground: "#1c1917",
    card: "#ffffff",
    cardForeground: "#1c1917",
    muted: "#f3f4f6",
    mutedForeground: "#737373",
    border: "#572364",
    input: "#572364",
    ring: "#2a2a2a",
  },
  brand: {
    primary: "#572364",
    primaryForeground: "#ffffff",
    secondary: "#f3f4f6",
    secondaryForeground: "#1c1917",
    accent: "#4d4d4d",
    accentForeground: "#ffffff",
  },
  semantic: {
    destructive: "#ef4444",
    destructiveForeground: "#f9fafb",
    success: "#16a34a",
    successForeground: "#f9fafb",
    successMuted: "#dcfce7",
    warning: "#d97706",
    warningForeground: "#1c1917",
    warningMuted: "#fef3c7",
    info: "#2563eb",
    infoForeground: "#f9fafb",
    infoMuted: "#dbeafe",
  },
  custom: {
    purple: "#9333ea",
    purpleLight: "#c084fc",
    purpleDark: "#4c1d95",
    gray: "#737373",
    grayLight: "#a3a3a3",
    grayDark: "#374151",
  },
  typography: {
    textPrimary: "#1c1917",
    textSecondary: "#575757",
    textMuted: "#737373",
    bgSurface: "#ffffff",
    bgSurfaceMuted: "#f7f8fa",
    borderSubtle: "#e5e7eb",
  },
};
