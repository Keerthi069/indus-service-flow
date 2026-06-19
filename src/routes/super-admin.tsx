import { createFileRoute } from "@tanstack/react-router";
import { Activity, Building2, FileBarChart, FolderTree, LayoutDashboard, MessageSquare, Settings, ShieldCheck, Users } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

const items: NavItem[] = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super-admin/categories", label: "Categories", icon: FolderTree },
  { to: "/super-admin/requests", label: "Organization Requests", icon: ShieldCheck },
  { to: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { to: "/super-admin/users", label: "Users", icon: Users },
  { to: "/super-admin/contact", label: "Contact Messages", icon: MessageSquare },
  { to: "/super-admin/audit", label: "Audit Logs", icon: Activity },
  { to: "/super-admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/super-admin/settings", label: "Settings", icon: Settings },
];

export const Route = createFileRoute("/super-admin")({
  component: () => <PortalShell role="super_admin" requireRole="super_admin" brand="Super Admin Portal" items={items} />,
});
