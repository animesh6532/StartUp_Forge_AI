"use client";

import React from "react";
import { LucideIcon, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: LucideIcon;
  emphasis?: boolean;
}

export default function StatCard({ label, value, helper, icon: Icon, emphasis = false }: StatCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Small label first */}
          <div className="text-[9px] font-semibold uppercase tracking-[1.4px] text-textSecondary">{label}</div>
          {/* Large number below label */}
          <div className="mt-2 text-numbers font-extrabold tracking-tight text-foreground text-3xl">
            {value}
          </div>
        </div>
        {Icon && (
          <div className="rounded-xl bg-gradient-to-br from-[#2F6BFF]/10 to-[#0C969C]/10 border border-[#2F6BFF]/15 p-2.5 text-accent shrink-0">
            <Icon className="h-5 w-5" strokeWidth={1.5} style={{ stroke: "url(#blueTealGradient)" }} />
          </div>
        )}
      </div>
      
      {helper && (
        <div className="mt-4 border-t border-border/50 pt-3 flex items-center justify-between text-[10px] font-semibold text-textSecondary">
          <span className="truncate">{helper}</span>
          <span className="flex items-center gap-1 text-[#0A7075] bg-[#0A7075]/10 px-1.5 py-0.5 rounded">
            <TrendingUp className="h-2.5 w-2.5" />
            <span>+12%</span>
          </span>
        </div>
      )}
    </div>
  );
}
