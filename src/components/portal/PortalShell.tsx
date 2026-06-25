import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Moon, Search, Settings, Sun, User as UserIcon, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useAuth, rolePortalPath } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { db, useDb, type Role } from "@/lib/mock/db";

export interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }> }

export function PortalShell({ role, brand, items, requireRole }: { role: Role; brand: string; items: NavItem[]; requireRole?: Role }) {
  const { user, logout, isHydrated } = useAuth();
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const path = useRouterState({ select: s => s.location.pathname });
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { nav({ to: "/login", search: { redirect: path } as never }); return; }
    if (requireRole && user.role !== requireRole) { nav({ to: rolePortalPath(user.role) }); }
  }, [isHydrated, user, requireRole, nav, path]);

  const notifications = useDb(() => db.all("notifications").filter(n => {
    if (!user) return false;
    if (user.role === "super_admin") return n.role === "super_admin";
    if (user.role === "org_admin") return n.role === "org_admin" && n.organization_id === user.organization_id;
    if (user.role === "employee") return n.role === "employee" && n.user_id === user.id;
    return n.role === "customer" && n.user_id === user.id;
  }));
  const unread = notifications.filter(n => !n.read).length;
  const org = useDb(() => {
    if (!user) return undefined;
    if (user.organization_id) return db.all("organizations").find(o => o.id === user.organization_id);
    if (user.role === "customer") {
      const appts = db.all("appointments").filter(a => a.customer_email === user.email);
      if (!appts.length) return undefined;
      const latest = appts.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
      return db.all("organizations").find(o => o.id === latest.organization_id);
    }
    return undefined;
  });

  if (!isHydrated || !user) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Waves className="h-5 w-5" /></span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold">Indus Service Flow</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{brand}</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {items.map(item => {
              const active = path === item.to || (item.to !== rolePortalPath(role) && path.startsWith(item.to));
              return (
                <li key={item.to}>
                  <Link to={item.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground"}`}>
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground">
          v1.0 · Multi-tenant
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
          {org?.logo ? <img src={org.logo} alt={org.name} className="h-8 w-8 rounded" /> : org ? <span className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary text-xs font-bold">{org.name.slice(0, 1)}</span> : null}
          {org && <div className="hidden md:block"><div className="text-sm font-semibold leading-none">{org.name}</div><div className="text-[11px] text-muted-foreground">{brand}</div></div>}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="w-64 pl-8" placeholder="Search appointments, customers..." />
            </div>
            <Button size="icon" variant="ghost" onClick={toggle}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost" className="relative" onClick={() => setNotifOpen(true)}>
              <Bell className="h-4 w-4" />
              {unread > 0 && <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-[10px]">{unread}</Badge>}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><span className="hidden text-sm md:inline">{user.name.split(" ")[0]}</span></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="grid"><span>{user.name}</span><span className="text-xs font-normal text-muted-foreground">{user.email}</span></DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role !== "employee" && (
                  <>
                    <DropdownMenuItem><UserIcon className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                    <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {user.role === "employee" && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => { logout(); nav({ to: "/" }); }}><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8"><Outlet /></main>
      </div>
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent className="w-[400px] sm:max-w-md">
          <SheetHeader><SheetTitle>Notifications</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">You're all caught up.</div>}
            {notifications.map(n => (
              <div key={n.id} className={`rounded-lg border p-3 ${n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
                <div className="flex items-center justify-between"><div className="text-sm font-semibold">{n.title}</div>{!n.read && <Badge variant="secondary">New</Badge>}</div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
            {notifications.some(n => !n.read) && (
              <Button variant="outline" className="w-full" onClick={() => {
                notifications.filter(n => !n.read).forEach(n => db.update("notifications", n.id, { read: true } as never));
              }}>Mark all as read</Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: string; actions?: ReactNode; back?: boolean | string }) {
  const nav = useNavigate();
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        {back && (
          <Button variant="outline" size="sm" className="mt-1" onClick={() => typeof back === "string" ? nav({ to: back }) : window.history.back()}>
            ← Back
          </Button>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, trend, icon: Icon }: { label: string; value: string | number; trend?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      {trend && <div className="mt-1 text-xs text-success">{trend}</div>}
    </div>
  );
}
