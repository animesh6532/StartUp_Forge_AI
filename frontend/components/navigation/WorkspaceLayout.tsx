"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Dock from "./Dock";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const pathname = usePathname();

  // Hide dock on authentication and public landing pages
  const hideLayout = !pathname || ["/login", "/register", "/forgot-password", "/reset-password", "/"].includes(pathname);

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      {/* Main Content Area with Bottom Padding for Floating Dock */}
      <div className="relative flex flex-1 flex-col pb-20 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Compact floating navigation dock */}
      <Dock />
    </div>
  );
}
