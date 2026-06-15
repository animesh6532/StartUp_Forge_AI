"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useCurrency } from "./providers";
import ThemeToggle from "./ThemeToggle";
import { 
  LayoutDashboard, Layers, Cpu, FileText, Globe, 
  DollarSign, Presentation, Terminal, BarChart2, Settings, 
  LogOut
} from "lucide-react";

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();

  // Smart project ID detection from URL
  const match = pathname ? pathname.match(/^\/project\/([^/]+)/) : null;
  const activeProjectId = match ? match[1] : null;

  const handleNavClick = (tabKey: string) => {
    if (activeProjectId) {
      if (setActiveTab) {
        setActiveTab(tabKey);
      } else {
        router.push(`/project/${activeProjectId}?tab=${tabKey}`);
      }
    } else {
      alert("Please select or forge a startup concept from the dashboard first to view this workspace detail.");
      router.push("/dashboard");
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      label: "Startups",
      icon: Layers,
      active: pathname === "/dashboard" || pathname.startsWith("/project/"),
      onClick: () => router.push("/dashboard"),
    },
    {
      label: "Venture Studio",
      icon: Cpu,
      active: pathname === "/studio",
      onClick: () => router.push("/studio"),
    },
    {
      label: "Reports",
      icon: FileText,
      active: pathname === "/reports",
      onClick: () => router.push("/reports"),
    },
    {
      label: "Market Research",
      icon: Globe,
      active: activeProjectId ? (activeTab === "market" || pathname.includes("tab=market")) : false,
      onClick: () => handleNavClick("market"),
    },
    {
      label: "Financial Models",
      icon: DollarSign,
      active: activeProjectId ? (activeTab === "finance" || pathname.includes("tab=finance")) : false,
      onClick: () => handleNavClick("finance"),
    },
    {
      label: "Pitch Decks",
      icon: Presentation,
      active: activeProjectId ? (activeTab === "pitchdeck" || pathname.includes("tab=pitchdeck")) : false,
      onClick: () => handleNavClick("pitchdeck"),
    },
    {
      label: "Executions",
      icon: Terminal,
      active: activeProjectId ? (activeTab === "timeline" || pathname.includes("tab=timeline")) : false,
      onClick: () => handleNavClick("timeline"),
    },
    {
      label: "Analytics",
      icon: BarChart2,
      active: pathname === "/analytics",
      onClick: () => router.push("/analytics"),
    },
    {
      label: "Settings",
      icon: Settings,
      active: pathname === "/profile",
      onClick: () => router.push("/profile"),
    },
  ];

  if (!user) return null;
  const userName = user.full_name || user.email || "Founder";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-5 transition-all duration-300 lg:flex lg:flex-col lg:justify-between shadow-[1px_0_10px_rgba(0,0,0,0.01)]">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          
          <div>
            
            
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border border-transparent ${
                  item.active 
                    ? "bg-accent/5 text-accent border-accent/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" 
                    : "text-textSecondary hover:text-foreground hover:bg-card-secondary/60"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${item.active ? "text-accent" : "text-textSecondary group-hover:text-foreground"}`} strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        {/* Currency Selector */}
        <div className="flex items-center justify-between px-2 py-2 border-t border-border pt-4">
          <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-semibold text-textSecondary outline-none transition-all hover:text-foreground focus:border-accent"
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

        {/* Theme Toggle Button */}
        <div className="flex items-center justify-between px-2 py-2 border-t border-border pt-4">
          <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Theme Mode</span>
          <ThemeToggle compact />
        </div>

        {/* User profile card */}
        <div className="border-t border-border pt-4 flex flex-col gap-3">
          <div className="bg-card-secondary/40 border border-border p-2.5 rounded-xl flex items-center gap-2.5 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-accent text-white dark:text-[#0B1832] flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <h4 className="text-xs font-bold truncate text-foreground leading-tight">{userName}</h4>
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-bold uppercase tracking-wide inline-block mt-0.5">
                {user.role === "admin" ? "Admin" : "Premium"}
              </span>
            </div>
          </div>

          <button 
            onClick={logout} 
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-textSecondary hover:text-red-500 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} /> 
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
