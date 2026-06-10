import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Config
 * Synchronized with src/index.css @theme directive for absolute compatibility across environments.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f6fc",
          100: "#e1e9f6",
          200: "#c7d7ed",
          300: "#a1bcde",
          400: "#749bcb",
          500: "#1d4ed8", // Premium Academic/School Royal Blue
          600: "#1a40af",
          700: "#18328f",
          800: "#132363",
          900: "#0b1236",
        },
        secondary: {
          50: "#fdfbea",
          100: "#fcf4c7",
          200: "#f8e58c",
          300: "#f2d050",
          400: "#e9b824",
          500: "#cca732", // Warm Academic Gold
          600: "#ad8322",
          700: "#865f1c",
          800: "#654519",
          900: "#442e12",
        },
        surface: {
          50: "#fafbfc",
          100: "#f3f5f8",
          200: "#e9edf2",
        },
        success: {
          base: "#10b981",
          light: "#f0fdf4",
          dark: "#15803d",
        },
        warning: {
          base: "#f59e0b",
          light: "#fffbeb",
          dark: "#b45309",
        },
        danger: {
          base: "#ef4444",
          light: "#fef2f2",
          dark: "#b91c1c",
        },
        info: {
          base: "#3b82f6",
          light: "#eff6ff",
          dark: "#1d4ed8",
        },
        text: {
          dark: "#0f172a",
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
