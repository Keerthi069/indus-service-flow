import { createFileRoute } from "@tanstack/react-router";
import {  Activity, BarChart3, Briefcase, CalendarCheck, FileBarChart, FolderTree, LayoutDashboard, Settings, Sparkles, TimerReset, Users, Wrench } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

const items: NavItem[] = [
  { to: "/org-admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/org-admin/service-categories", label: "Service Categories", icon: FolderTree },
  { to: "/org-admin/services", label: "Services", icon: Wrench },
  { to: "/org-admin/employees", label: "Employees", icon: Briefcase },
  { to: "/org-admin/customers", label: "Customers", icon: Users },
  { to: "/org-admin/queues", label: "Queues", icon: TimerReset },
  { to: "/org-admin/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/org-admin/simulations", label: "Simulations", icon: Sparkles },
  { to: "/org-admin/analytics", label: "Analytics", icon: BarChart3 },
  {  to: "/org-admin/audit", label: "Audit Logs", icon: Activity },
  { to: "/org-admin/reports", label: "Reports", icon: FileBarChart },
];

export const Route = createFileRoute("/org-admin")({
  component: () => <PortalShell role="org_admin" requireRole="org_admin" brand="Organization Portal" items={items} />,
});
