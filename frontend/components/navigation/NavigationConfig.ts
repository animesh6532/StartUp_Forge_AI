import { 
  LayoutDashboard, 
  FolderKanban, 
  Cpu, 
  FileText, 
  Globe, 
  Wallet, 
  Presentation, 
  Rocket, 
  ChartColumn, 
  Settings2,
  LucideIcon 
} from "lucide-react";

export interface NavItemConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  tabKey?: string; // For tab-based workspace navigation
  hasBadge?: boolean;
}

export const navItems: NavItemConfig[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    key: "startups",
    label: "Startups",
    icon: FolderKanban,
    path: "/startups",
  },
  {
    key: "studio",
    label: "Venture Studio",
    icon: Cpu,
    path: "/studio",
  },
  {
    key: "reports",
    label: "Reports",
    icon: FileText,
    path: "/reports",
    hasBadge: true,
  },
  {
    key: "market",
    label: "Market Research",
    icon: Globe,
    path: "/market-research",
    tabKey: "market",
  },
  {
    key: "finance",
    label: "Financial Models",
    icon: Wallet,
    path: "/financial-models",
    tabKey: "finance",
  },
  {
    key: "pitchdeck",
    label: "Pitch Decks",
    icon: Presentation,
    path: "/pitch-decks",
    tabKey: "pitchdeck",
  },
  {
    key: "executions",
    label: "Executions",
    icon: Rocket,
    path: "/executions",
    tabKey: "timeline",
    hasBadge: true,
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: ChartColumn,
    path: "/analytics",
    hasBadge: true,
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings2,
    path: "/settings",
    hasBadge: true,
  },
];
