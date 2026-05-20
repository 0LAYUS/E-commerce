import { themeConfig, lightTheme } from "@/lib/theme.config";

function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function configKeyToCSSVar(key: string): string | null {
  const mapping: Record<string, string> = {
    "brand.primary": "--primary",
    "brand.primaryForeground": "--primary-foreground",
    "brand.secondary": "--secondary",
    "brand.secondaryForeground": "--secondary-foreground",
    "brand.accent": "--accent",
    "brand.accentForeground": "--accent-foreground",
    "surfaces.background": "--background",
    "surfaces.foreground": "--foreground",
    "surfaces.card": "--card",
    "surfaces.cardForeground": "--card-foreground",
    "surfaces.muted": "--muted",
    "surfaces.mutedForeground": "--muted-foreground",
    "surfaces.border": "--border",
    "surfaces.input": "--input",
    "surfaces.ring": "--ring",
    "semantic.destructive": "--destructive",
    "semantic.destructiveForeground": "--destructive-foreground",
    "semantic.success": "--color-success",
    "semantic.successForeground": "--success-foreground",
    "semantic.successMuted": "--bg-success",
    "semantic.warning": "--color-warning",
    "semantic.warningForeground": "--warning-foreground",
    "semantic.warningMuted": "--bg-warning",
    "semantic.info": "--color-info",
    "semantic.infoForeground": "--info-foreground",
    "semantic.infoMuted": "--bg-info",
    "custom.purple": "--color-purple",
    "custom.purpleLight": "--color-purple-light",
    "custom.purpleDark": "--bg-purple-dark",
    "custom.gray": "--color-gray",
    "custom.grayLight": "--color-gray-light",
    "custom.grayDark": "--bg-gray-dark",
    "typography.textPrimary": "--text-primary",
    "typography.textSecondary": "--text-secondary",
    "typography.textMuted": "--text-muted",
    "typography.bgSurface": "--bg-surface",
    "typography.bgSurfaceMuted": "--bg-surface-muted",
    "typography.borderSubtle": "--border-subtle",
  };
  return mapping[key] || null;
}

function generateCSSVars(config: typeof themeConfig): string {
  const flat = flatten(config as unknown as Record<string, unknown>);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(flat)) {
    const cssVar = configKeyToCSSVar(key);
    if (cssVar) {
      lines.push(`    ${cssVar}: ${hexToHSL(value)};`);
    }
  }
  return lines.join("\n");
}

export function ThemeVariables({ children }: { children: React.ReactNode }) {
  const darkVars = generateCSSVars(themeConfig);
  const lightVars = lightTheme ? generateCSSVars(lightTheme as typeof themeConfig) : "";
  const radius = themeConfig.borderRadius || "0.75rem";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              ${darkVars}
              --radius: ${radius};
            }
            .light {
              ${lightVars}
            }
          `,
        }}
      />
      {children}
    </>
  );
}
