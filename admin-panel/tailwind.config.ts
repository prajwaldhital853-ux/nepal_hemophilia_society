import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        sidebar: "var(--sidebar)",
        "sidebar-ink": "var(--sidebar-ink)",
        "sidebar-muted": "var(--sidebar-muted)",
        "sidebar-line": "var(--sidebar-line)",
        card: "var(--card)",
        elevated: "var(--elevated)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "line-subtle": "var(--line-subtle)",
        "line-table": "var(--line-table)",
        "line-inner": "var(--line-inner)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        navy: {
          950: "#041325",
          900: "#06182E",
          800: "#0A2342",
        },
        brand: {
          DEFAULT: "var(--brand)",
          blue: "var(--brand)",
          blueDark: "var(--brand-dark)",
          soft: "var(--brand-soft)",
        },
        page: "var(--surface)",
        red: "var(--red)",
        status: {
          green: "var(--green)",
          "green-soft": "var(--green-soft)",
          amber: "var(--amber)",
          "amber-soft": "var(--amber-soft)",
          red: "var(--red)",
          "red-soft": "var(--red-soft)",
        },
      },
      keyframes: {
        pageIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pageIn: "pageIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
