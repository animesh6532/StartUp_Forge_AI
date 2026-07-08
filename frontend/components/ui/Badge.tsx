"use client";

import React from "react";

type BadgeTone = "neutral" | "success" | "warning" | "error" | "accent";

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  pulse?: boolean;
  className?: string;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: "",
  success: "!bg-success/10 !text-success !border-success/20",
  warning: "!bg-warning/10 !text-warning !border-warning/20",
  error: "!bg-error/10 !text-error !border-error/20",
  accent: "!bg-accent/10 !text-accent !border-accent/20",
};

export default function Badge({ children, tone = "neutral", pulse = false, className = "" }: BadgeProps) {
  return (
    <span className={`badge-status capitalize ${toneClass[tone]} ${pulse ? "animate-pulse" : ""} ${className}`}>
      {children}
    </span>
  );
}

/** Maps common lifecycle status strings to a badge tone, kept in one place
 *  so status colors stay consistent across the dashboard, workspace, and
 *  execution timeline. */
export function toneForStatus(status?: string): BadgeTone {
  switch (status) {
    case "completed":
      return "success";
    case "processing":
      return "accent";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
}
