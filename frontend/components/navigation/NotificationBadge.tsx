"use client";

import React from "react";

interface NotificationBadgeProps {
  count: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="absolute top-0.5 right-0.5 flex h-1.5 w-1.5 pointer-events-none">
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-error" />
    </span>
  );
}
