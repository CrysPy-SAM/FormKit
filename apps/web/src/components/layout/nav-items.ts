import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FileText, Settings } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Forms", href: "/forms", icon: FileText },
  { label: "Settings", href: "/settings/profile", icon: Settings },
];
