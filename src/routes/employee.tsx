import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Gauge, LayoutDashboard, TimerReset } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

const items: NavItem[] = [
  { to: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employee/queue", label: "My Queue", icon: TimerReset },
  { to: "/employee/schedule", label: "My Schedule", icon: CalendarClock },
  { to: "/employee/performance", label: "Performance", icon: Gauge },
];

export const Route = createFileRoute("/employee")({
  component: () => <PortalShell role="employee" requireRole="employee" brand="Employee Portal" items={items} />,
});
