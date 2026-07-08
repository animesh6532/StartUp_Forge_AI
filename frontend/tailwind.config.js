/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--text-primary)",
        card: "var(--card)",
        "card-secondary": "var(--card-secondary)",
        "card-hover": "var(--card-hover)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "ui-monospace",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "700" }],
        hero: ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        section: ["1.75rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        title: ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        subtitle: ["0.9375rem", { lineHeight: "1.5", fontWeight: "500" }],
        body: ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "600" }],
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
        card: "0 1px 2px rgba(15, 23, 42, 0.03), 0 1px 1px rgba(15, 23, 42, 0.02)",
        "card-hover": "0 4px 10px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)",
        dock: "0 8px 24px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)",
        popover: "0 12px 32px rgba(15, 23, 42, 0.10), 0 4px 10px rgba(15, 23, 42, 0.05)",
      },
      spacing: {
        4.5: "1.125rem",
        18: "4.5rem",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
