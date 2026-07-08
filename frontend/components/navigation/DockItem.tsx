"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NavItemConfig } from "./NavigationConfig";
import Tooltip from "./Tooltip";
import NotificationBadge from "./NotificationBadge";

interface DockItemProps {
  item: NavItemConfig;
  activeTab: string;
  activeProjectId: string | null;
}

const itemBadges: Record<string, number> = {
  reports: 3,
  executions: 1,
  analytics: 0,
  settings: 2,
};

function DockItem({ item, activeTab, activeProjectId }: DockItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (() => {
    if (item.key === "dashboard") {
      return pathname === "/dashboard";
    }
    if (item.key === "startups") {
      return pathname === "/startups" || pathname.startsWith("/project/");
    }
    if (item.key === "studio") {
      return pathname === "/studio";
    }
    if (item.key === "reports") {
      return pathname === "/reports";
    }
    if (item.key === "analytics") {
      return pathname === "/analytics";
    }
    if (item.key === "settings") {
      return pathname === "/profile" || pathname === "/settings";
    }
    if (item.tabKey && activeProjectId) {
      return activeTab === item.tabKey || (pathname.startsWith(`/project/${activeProjectId}`) && pathname.includes(`tab=${item.tabKey}`));
    }
    return false;
  })();

  const handleClick = () => {
    if (item.tabKey) {
      if (activeProjectId) {
        // Dispatch custom event to notify project page to change its tab
        window.dispatchEvent(new CustomEvent("setActiveTab", { detail: item.tabKey }));
        router.push(`/project/${activeProjectId}?tab=${item.tabKey}`);
      } else {
        alert("Please select or forge a startup concept from the dashboard first to view this workspace detail.");
        router.push("/dashboard");
      }
    } else {
      router.push(item.path);
    }
  };

  const Icon = item.icon;
  const count = itemBadges[item.key] || 0;

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip content={item.label} isVisible={isHovered} />

      <motion.button
        type="button"
        onClick={handleClick}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className="relative flex h-10 w-10 items-center justify-center bg-transparent outline-none"
        whileHover={{
          scale: 1.08,
        }}
        whileTap={{
          scale: 0.96,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <Icon
          className="h-[22px] w-[22px] transition-all duration-200"
          style={{
            stroke: isActive 
              ? "url(#blueTealGradient)" 
              : isHovered 
                ? "#0A7075" 
                : "#274D60",
          }}
          strokeWidth={isActive ? 2.25 : 1.75}
        />

        {isActive && (
          <motion.span
            layoutId="dockActiveUnderline"
            className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 h-[2px] w-4 rounded-full bg-gradient-to-r from-[#2F6BFF] to-[#0C969C]"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}

        <NotificationBadge count={count} />
      </motion.button>
    </div>
  );
}

export default React.memo(DockItem);
