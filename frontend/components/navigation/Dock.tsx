"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navItems } from "./NavigationConfig";
import DockItem from "./DockItem";
import styles from "./FloatingDock.module.css";

export default function Dock() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDockVisible, setIsDockVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const lastScrollY = useRef(0);

  // Detect active project ID from url path
  const match = pathname ? pathname.match(/^\/project\/([^/]+)/) : null;
  const activeProjectId = match ? match[1] : null;

  // Listen to the custom event for active tab changes (e.g. from the page or dock items)
  useEffect(() => {
    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("setActiveTab", handleSetTab);
    return () => window.removeEventListener("setActiveTab", handleSetTab);
  }, []);

  // Update active tab on initial mount or when query changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, [pathname]);

  // Smart Dock hide/show based on scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 15) {
        setIsDockVisible(true);
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        // Scrolling down -> hide
        setIsDockVisible(false);
      } else {
        // Scrolling up -> show
        setIsDockVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mount detection for React Portal safety in Next.js SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <motion.nav 
      aria-label="Floating Navigation Bar"
      className={styles.dockWrapper}
      variants={{
        visible: { y: 0, opacity: 1, scale: 1 },
        hidden: { y: 110, opacity: 0, scale: 0.95 }
      }}
      animate={isDockVisible ? "visible" : "hidden"}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <linearGradient id="blueTealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F6BFF" />
            <stop offset="100%" stopColor="#0C969C" />
          </linearGradient>
        </defs>
      </svg>

      <div className={styles.dockContainer}>
        {navItems.map((item) => {
          return (
            <div key={item.key} className={styles.dockItemWrapper}>
              <DockItem
                item={item}
                activeTab={activeTab}
                activeProjectId={activeProjectId}
              />
            </div>
          );
        })}
      </div>
    </motion.nav>,
    document.body
  );
}
