export const COLORS = {
  // Backgrounds
  void: "#080808",
  surface1: "#0E0E1A",
  surface2: "#141425",
  surface3: "#1C1C35",

  // Brand
  violet: "#7B61FF",
  violetDim: "#5B44D4",
  violetGlow: "#9B82FF",
  neonBlue: "#00D4FF",
  neonPurple: "#BF00FF",

  // Semantic
  threat: "#FF3B5C",
  threatDim: "rgba(255,59,92,0.15)",
  safe: "#00FF87",
  safeDim: "rgba(0,255,135,0.15)",
  warning: "#FFB800",
  warningDim: "rgba(255,184,0,0.15)",

  // Glass
  glass1: "rgba(255,255,255,0.04)",
  glass2: "rgba(255,255,255,0.08)",
  glass3: "rgba(255,255,255,0.12)",

  // Text
  textPrimary: "#F0EFFF",
  textSecondary: "#8B8BA7",
  textDim: "#4A4A6A",

  // Borders
  border: "rgba(123,97,255,0.2)",
  borderDim: "rgba(255,255,255,0.06)",
} as const;

export const GRADIENTS = {
  violetDeep: ["#7B61FF", "#5B44D4"] as [string, string],
  threatGlow: ["rgba(255,59,92,0.3)", "rgba(255,59,92,0)"] as [string, string],
  safeGlow: ["rgba(0,255,135,0.3)", "rgba(0,255,135,0)"] as [string, string],
  surface: ["#0E0E1A", "#080808"] as [string, string],
  card: ["#141425", "#0E0E1A"] as [string, string],
  agentActive: ["rgba(123,97,255,0.2)", "rgba(123,97,255,0.05)"] as [string, string],
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 38,
} as const;
