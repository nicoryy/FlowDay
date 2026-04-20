import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0a0a",
          secondary: "#111111",
          tertiary: "#1a1a1a",
        },
        border: {
          DEFAULT: "#222222",
          subtle: "#1a1a1a",
        },
        purple: {
          primary: "#7c3aed",
          hover: "#6d28d9",
          accent: "#a78bfa",
          muted: "#4c1d95",
        },
        text: {
          primary: "#f8f8f8",
          secondary: "#a1a1aa",
          muted: "#71717a",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Outfit", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
