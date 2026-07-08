"use client";
 
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth, useCurrency, type CurrencyCode } from "../providers";
import ThemeToggle from "../ThemeToggle";
import { LogOut, Shield, Settings, Bell, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
 
interface SettingsMenuProps {
  onClose: () => void;
  activeProjectId: string | null;
}
 
export default function SettingsMenu({ onClose, activeProjectId }: SettingsMenuProps) {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const menuRef = useRef<HTMLDivElement>(null);
 
  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);
 
  if (!user) return null;
  const userName = user.full_name || user.email || "Founder";
  const userAvatar = userName.charAt(0).toUpperCase();
 
  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="absolute bottom-16 right-0 w-80 rounded-2xl border border-border bg-card p-4 shadow-lg text-foreground z-[999999]"
    >
      {/* Profile Details */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-secondary border border-border font-bold text-foreground text-sm shadow-sm">
          {userAvatar}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold truncate leading-none">{userName}</h4>
          <p className="text-[10px] text-textMuted truncate mt-1 leading-none">{user.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-card-secondary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-textSecondary border border-border">
            <Shield className="h-2.5 w-2.5" />
            {user.role === "admin" ? "Admin" : "Premium"}
          </span>
        </div>
      </div>
 
      {/* Notifications Indicator */}
      <div className="py-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between text-[9px] font-bold text-textMuted uppercase tracking-widest">
          <span className="flex items-center gap-1"><Bell className="h-3 w-3 text-textSecondary" /> Notifications</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
        </div>
        <div className="space-y-1.5 text-[10px] font-medium text-textSecondary leading-normal">
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />
            <span>Agent swarm workspace: Active and listening.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />
            <span>Telemetry logging server: Operational.</span>
          </div>
        </div>
      </div>
 
      {/* Localizations & Themes */}
      <div className="py-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Localization</span>
            <p className="text-[8px] text-textMuted">Set active currency symbol</p>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="rounded-lg border border-border bg-card-secondary px-2 py-1 text-[10px] font-bold text-textSecondary outline-none focus:border-accent transition-all"
            aria-label="Select currency"
          >
            <option value="USD">🇺🇸 USD</option>
            <option value="INR">🇮🇳 INR</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="AED">🇦🇪 AED</option>
            <option value="SGD">🇸🇬 SGD</option>
          </select>
        </div>
 
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Theme Mode</span>
            <p className="text-[8px] text-textMuted">Toggle dark / light styling</p>
          </div>
          <ThemeToggle compact />
        </div>
      </div>
 
      {/* Navigation & Logout Links */}
      <div className="pt-3 flex flex-col gap-2">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 bg-card-secondary hover:bg-card-hover text-textSecondary text-xs font-bold border border-border transition"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Full Settings Preferences</span>
        </Link>
        
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 bg-error/5 hover:bg-error/10 text-error text-xs font-bold border border-error/10 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out Session</span>
        </button>
      </div>
    </motion.div>
  );
}
