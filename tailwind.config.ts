import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        brand: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          900: "#1E40AF",
        },
        salud: { 500: "#10B981", 600: "#059669" },
        // Acento premium hero (dark) — azul
        nest: { azul: "#38bdf8", fondo: "#070b0a" },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument)", "Georgia", "serif"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
    },
  },
  plugins: [],
};

export default config;
