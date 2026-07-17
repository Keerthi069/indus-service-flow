import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderTree,
  Layers3,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  CreditCard,
  Package,
} from "lucide-react";

import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

const items: NavItem[] = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super-admin/categories", label: "Categories", icon: FolderTree },
  { to: "/super-admin/service-categories", label: "Service Categories", icon: Layers3 },
  { to: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { to: "/super-admin/users", label: "Users", icon: Users },
  { to: "/super-admin/audit", label: "Audit Logs", icon: ClipboardList },
  { to: "/super-admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/super-admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/super-admin/plans", label: "Plans", icon: Package },
];

export const Route = createFileRoute("/super-admin")({
  component: () => (
    <PortalShell
      role="super_admin"
      requireRole="super_admin"
      brand="Super Admin Portal"
      items={items}
    />
  ),
});