"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="premium-card flex min-h-72 flex-col items-center justify-center p-10 text-center">
      <div className="mb-3 rounded-xl border border-border bg-card-secondary p-3">
        <Icon className="h-6 w-6 text-textSecondary" strokeWidth={1.5} />
      </div>
      <h3 className="text-title text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-textSecondary">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
