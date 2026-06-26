import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // Paleta GastroCare (logo: navy índigo → cian). brand-600 acción,
        // brand-900 navy para encabezados/sidebar, brand-400 cian de acento.
        brand: {
          50: "#EFF8FE",
          100: "#D8EEFB",
          200: "#B4DDF7",
          300: "#82C6F1",
          400: "#46A9E6",
          500: "#2387D4",
          600: "#1C6AC0",
          700: "#1C4F9C",
          800: "#1D3A7D",
          900: "#182C61",
          950: "#0F1C40",
        },
        // Cian brillante de los swooshes (acento/gradientes)
        cielo: { 400: "#4BC4F2", 500: "#2BA9E0", 600: "#1E8FCB" },
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
