/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // OMNYX Brand Colors
        void: "#080808",       // Deep Black background
        violet: "#7B61FF",     // Electric Violet primary
        "violet-dim": "#5B44D4",
        "violet-glow": "#9B82FF",
        "neon-blue": "#00D4FF",
        "neon-purple": "#BF00FF",
        threat: "#FF3B5C",     // Alert red
        "threat-dim": "#FF3B5C33",
        safe: "#00FF87",       // Safe green
        "safe-dim": "#00FF8733",
        warning: "#FFB800",    // Warning amber
        // Glass layers
        "glass-1": "rgba(255,255,255,0.04)",
        "glass-2": "rgba(255,255,255,0.08)",
        "glass-3": "rgba(255,255,255,0.12)",
        // Text
        "text-primary": "#F0EFFF",
        "text-secondary": "#8B8BA7",
        "text-dim": "#4A4A6A",
        // Surface
        "surface-1": "#0E0E1A",
        "surface-2": "#141425",
        "surface-3": "#1C1C35",
        "border": "rgba(123,97,255,0.2)",
      },
      fontFamily: {
        sans: ["Inter_400Regular", "Inter"],
        mono: ["GeistMono", "SpaceMono"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
};
