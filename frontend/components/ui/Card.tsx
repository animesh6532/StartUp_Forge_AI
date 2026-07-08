"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "button" | "a";
  interactive?: boolean;
}

export default function Card({
  as = "div",
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const Component = as as any;
  return (
    <Component
      className={`premium-card ${interactive ? "cursor-pointer" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
