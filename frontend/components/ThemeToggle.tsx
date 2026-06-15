"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./providers";
import { motion } from "framer-motion";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  const handleSetTheme = (mode: "light" | "dark") => {
    if (theme !== mode) {
      toggleTheme();
    }
  };

  if (compact) {
    return (
      <div className="relative inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card-secondary/60 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => handleSetTheme("light")}
          className={`relative z-10 p-1.5 rounded-full transition-colors duration-200 ${
            theme === "light" ? "text-accent" : "text-text-muted hover:text-text-primary"
          }`}
          aria-label="Switch to light mode"
        >
          <Sun className="h-3.5 w-3.5" />
          {theme === "light" && (
            <motion.div
              layoutId="compactThemeActive"
              className="absolute inset-0 bg-card rounded-full -z-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => handleSetTheme("dark")}
          className={`relative z-10 p-1.5 rounded-full transition-colors duration-200 ${
            theme === "dark" ? "text-accent" : "text-text-muted hover:text-text-primary"
          }`}
          aria-label="Switch to dark mode"
        >
          <Moon className="h-3.5 w-3.5" />
          {theme === "dark" && (
            <motion.div
              layoutId="compactThemeActive"
              className="absolute inset-0 bg-card rounded-full -z-10 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center p-1 rounded-xl border border-border bg-card-secondary/50 backdrop-blur-lg shadow-[0_4px_15px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        onClick={() => handleSetTheme("light")}
        className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-300 ${
          theme === "light" ? "text-accent" : "text-text-muted hover:text-text-primary"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        <span>Light</span>
        {theme === "light" && (
          <motion.div
            layoutId="themeActive"
            className="absolute inset-0 bg-card rounded-lg -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-border/50"
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          />
        )}
      </button>
      <button
        type="button"
        onClick={() => handleSetTheme("dark")}
        className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-300 ${
          theme === "dark" ? "text-accent" : "text-text-muted hover:text-text-primary"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span>Dark</span>
        {theme === "dark" && (
          <motion.div
            layoutId="themeActive"
            className="absolute inset-0 bg-card rounded-lg -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-border/50"
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          />
        )}
      </button>
    </div>
  );
}
