import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#041208",
          900: "#0a1f12",
          800: "#122a1a",
          700: "#1a3d28",
          600: "#245c3a",
          500: "#2d7a4a",
          400: "#3d9e62",
          300: "#5bc48a",
          200: "#8fd9b0",
        },
        turf: {
          DEFAULT: "#1e5631",
          light: "#2a7a45",
          dark: "#0f3d22",
        },
        goal: {
          gold: "#f5c542",
          white: "#f0fdf4",
          muted: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45,122,74,0.35), transparent)",
      },
      boxShadow: {
        pitch:
          "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        glow: "0 0 40px rgba(45,122,74,0.25)",
      },
      borderRadius: {
        pitch: "0.75rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;