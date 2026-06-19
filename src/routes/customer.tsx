import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, CalendarPlus, History, LayoutDashboard, MessageSquareHeart, TimerReset, User } from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

const items: NavItem[] = [
  { to: "/customer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/book-appointment", label: "Book Appointment", icon: CalendarPlus },
  { to: "/customer/appointments", label: "My Appointments", icon: CalendarCheck },
  { to: "/customer/queue-status", label: "Queue Status", icon: TimerReset },
  { to: "/customer/history", label: "Appointment History", icon: History },
  { to: "/customer/feedback", label: "Feedback", icon: MessageSquareHeart },
  { to: "/customer/profile", label: "Profile", icon: User },
];

export const Route = createFileRoute("/customer")({
  component: () => <PortalShell role="customer" requireRole="customer" brand="Customer Portal" items={items} />,
});
