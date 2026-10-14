import type { CSSProperties } from "react";

export type FormTheme = {
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonTextColor?: string;
  fontFamily?: "sans" | "serif" | "mono";
  borderRadius?: "none" | "small" | "medium" | "large" | "full";
  cardStyle?: "flat" | "bordered" | "shadow";
  layout?: "centered" | "full-bleed";
  progressStyle?: "bar" | "steps" | "none";
  logoUrl?: string;
};

/**
 * Recreates today's default look exactly, so a form published before theming
 * existed (theme = {}) renders identically to before — nothing "unexpectedly
 * changes" for old published forms.
 */
export const DEFAULT_FORM_THEME: Required<Omit<FormTheme, "logoUrl">> & { logoUrl?: string } = {
  accentColor: "#4338ca",
  backgroundColor: "#f4f4f5",
  textColor: "#18181b",
  buttonTextColor: "#ffffff",
  fontFamily: "sans",
  borderRadius: "medium",
  cardStyle: "shadow",
  layout: "centered",
  progressStyle: "bar",
  logoUrl: undefined,
};

export type ResolvedFormTheme = typeof DEFAULT_FORM_THEME;

export function resolveFormTheme(theme?: FormTheme | null): ResolvedFormTheme {
  return { ...DEFAULT_FORM_THEME, ...theme };
}

export const RADIUS_PX: Record<NonNullable<FormTheme["borderRadius"]>, string> = {
  none: "0px",
  small: "0.375rem",
  medium: "0.625rem",
  large: "1rem",
  full: "9999px",
};

const FONT_VAR: Record<NonNullable<FormTheme["fontFamily"]>, string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
};

export const CARD_SHADOW: Record<NonNullable<FormTheme["cardStyle"]>, string> = {
  flat: "none",
  bordered: "none",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.10)",
};

/**
 * Every existing UI primitive (Button, Input, Card, Checkbox, RadioGroup,
 * Select…) is already built on Tailwind classes that resolve through the
 * app's CSS custom properties (--primary, --background, --radius, etc — see
 * globals.css's `@theme inline` block). Overriding those same variables on a
 * wrapper element re-themes every one of those components for free, with no
 * per-component or per-field changes needed.
 */
export function getThemeCssVars(theme: ResolvedFormTheme): CSSProperties {
  return {
    "--background": theme.backgroundColor,
    "--foreground": theme.textColor,
    "--card": theme.cardStyle === "flat" ? theme.backgroundColor : "#ffffff",
    "--card-foreground": theme.textColor,
    "--popover": "#ffffff",
    "--popover-foreground": theme.textColor,
    "--primary": theme.accentColor,
    "--primary-foreground": theme.buttonTextColor,
    "--primary-hover": theme.accentColor,
    "--secondary": "color-mix(in srgb, " + theme.textColor + " 6%, transparent)",
    "--secondary-foreground": theme.textColor,
    "--muted": "color-mix(in srgb, " + theme.textColor + " 6%, transparent)",
    "--muted-foreground": "color-mix(in srgb, " + theme.textColor + " 55%, transparent)",
    "--accent": "color-mix(in srgb, " + theme.accentColor + " 14%, transparent)",
    "--accent-foreground": theme.accentColor,
    "--border": theme.cardStyle === "bordered" ? "color-mix(in srgb, " + theme.textColor + " 15%, transparent)" : "color-mix(in srgb, " + theme.textColor + " 10%, transparent)",
    "--input": "color-mix(in srgb, " + theme.textColor + " 18%, transparent)",
    "--ring": theme.accentColor,
    "--radius": RADIUS_PX[theme.borderRadius],
    "--font-sans": FONT_VAR[theme.fontFamily],
    boxShadow: CARD_SHADOW[theme.cardStyle],
  } as CSSProperties;
}
