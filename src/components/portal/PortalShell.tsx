import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  Bell,
  LogOut,
  Moon,
  Search,
  User as UserIcon,
  Waves,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useAuth, rolePortalPath } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { db, useDb, type Role } from "@/lib/mock/db";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  back?: boolean | string;
}) {
  const nav = useNavigate();

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        {back && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={() =>
              typeof back === "string"
                ? nav({ to: back })
                : window.history.back()
            }
          >
            ← Back
          </Button>
        )}

        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>

        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="mt-2 font-display text-2xl font-bold">
        {value}
      </div>

      {trend && (
        <div className="mt-1 text-xs text-green-600">
          {trend}
        </div>
      )}
    </div>
  );
}

export function PortalShell({
  role,
  brand,
  items,
  requireRole,
}: {
  role: Role;
  brand: string;
  items: NavItem[];
  requireRole?: Role;
}) {
  const { user, logout, isHydrated } = useAuth();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();

  const routerState = useRouterState();
  const path = routerState.location?.pathname ?? "";

  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      nav({ to: "/login", search: { redirect: path } as never });
      return;
    }

    if (requireRole && user.role !== requireRole) {
      nav({ to: rolePortalPath(user.role) });
    }
  }, [isHydrated, user, requireRole, nav, path]);

  const notifications = useDb(() =>
    db.all("notifications").filter((n) => {
      if (!user) return false;

      if (user.role === "super_admin") return n.role === "super_admin";

      if (user.role === "org_admin") {
        return (
          n.role === "org_admin" &&
          n.organization_id === user.organization_id
        );
      }

      if (user.role === "employee") {
        return n.role === "employee" && n.user_id === user.id;
      }

      return false;
    })
  );

  const unread = notifications.filter((n) => !n.read).length;

  const org = useDb(() => {
    if (!user?.organization_id) return undefined;
    return db.all("organizations").find((o) => o.id === user.organization_id);
  });

  if (!isHydrated || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar (UNCHANGED) */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Waves className="h-5 w-5" />
          </span>

          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold">
              Indus Service Flow
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {brand}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {items.map((item) => {
              const active =
                path === item.to ||
                (item.to !== rolePortalPath(role) &&
                  path.startsWith(item.to));

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* MAIN (UNCHANGED) */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b px-4">
          {org?.logo ? (
            <img
  src={org.logo}
  alt={org.name}
  className="h-8 w-8 rounded object-cover"
/>
          ) : org ? (
            <span className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary text-xs font-bold">
              {org.name?.slice(0, 1)}
            </span>
          ) : null}

          {org && (
            <div className="hidden md:block text-sm font-semibold">
              {org.name}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-64 pl-8" placeholder="Search..." />
            </div>

            <Button size="icon" variant="ghost" onClick={toggle}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="relative"
              onClick={() => setNotifOpen(true)}
            >
              <Bell />
              {unread > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-[10px]">
                  {unread}
                </Badge>
              )}
            </Button>

            {/* =====================================================
               PROFILE FIX ONLY (UPDATED)
            ===================================================== */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2">
                  {/* ONLY AVATAR (NO NAME / EMAIL TEXT) */}
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {user.name
  .replace(/^dr\.?\s*/i, "")
  .trim()[0]
  ?.toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
  onClick={() =>
    nav({
      to: `${rolePortalPath(user.role)}/profile` as never,
    })
  }
>
  <UserIcon className="mr-2 h-4 w-4" />
  Profile
</DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    nav({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* NOTIFICATIONS (UNCHANGED) */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="rounded border p-2">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">
                  {n.message}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}