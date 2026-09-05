import type { LucideIcon } from "lucide-react";
import { Building2, Clock, LayoutDashboard, XCircle } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "pending";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Pending Approval", href: "/pending", icon: Clock, badgeKey: "pending" },
  { label: "Sites", href: "/sites", icon: Building2 },
  { label: "Inactive / Deleted", href: "/inactive", icon: XCircle },
];
