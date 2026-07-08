"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string;
  isVisible: boolean;
}

export default function Tooltip({ content, isVisible }: TooltipProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, scale: 1.05, x: "-50%" }}
          exit={{ opacity: 0, scale: 0.95, x: "-50%" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ pointerEvents: "none" }}
          className="absolute bottom-full mb-2.5 left-1/2 z-50 whitespace-nowrap rounded-md bg-black px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg border border-white/10"
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
