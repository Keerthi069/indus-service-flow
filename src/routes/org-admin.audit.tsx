import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Check,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  History,
  LogIn,
  LogOut,
  RefreshCcw,
  UserCheck,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/org-admin/audit")({
  component: OrgAdminAuditPage,
});

// The mock db's audit_logs table stores entries shaped like:
// { id, organization_id, user_id, user_name, action, entity, details, created_at, role }
// (see seed.ts — ORG_ADMIN_AUDIT_SEED, which already merges an org's own
// ORG_ADMIN_ACTIONS_SEED with that org's EMPLOYEE_ACTIONS_SEED). This page
// shows BOTH: every action the signed-in Org Admin has taken themselves,
// PLUS every action any of their Employees have taken — across every
// module/entity (Appointment, Customer, Employee, Service, Queue,
// Feedback, User, Session, ...), not just Login/Logout. There is no
// separate employee-facing audit log; this page is the only place
// employee activity is ever exposed.
type RawAuditLog = {
  id: string;
  organization_id?: string;
  user_id: string;
  user_name: string;
  action: string;
  entity?: string;
  module_name?: string;
  details?: string;
  description?: string;
  created_at?: string;
  action_date?: string;
  role?: string;
};

type AuditRow = {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  module_name: string;
  action: string;
  description: string;
  action_date: string;
};

/* ---------------- ACTION META ---------------- */

const ACTION_META: Record<string, { icon: typeof PlusCircle; color: string; label: string }> = {
  LOGIN: { icon: LogIn, color: "#1baf7a", label: "Login" },
  LOGOUT: { icon: LogOut, color: "#71717a", label: "Logout" },
  CREATE: { icon: PlusCircle, color: "#1baf7a", label: "Create" },
  UPDATE: { icon: Pencil, color: "#2a78d6", label: "Update" },
  DELETE: { icon: Trash2, color: "#dc2626", label: "Delete" },
  EXPORT: { icon: Download, color: "#7c5cff", label: "Export" },
  STATUS_CHANGE: { icon: RefreshCcw, color: "#eda100", label: "Status change" },
  ASSIGN: { icon: UserCheck, color: "#4f46e5", label: "Assign" },
  APPROVE: { icon: CheckCircle2, color: "#059669", label: "Approve" },
  REJECT: { icon: XCircle, color: "#e11d48", label: "Reject" },
};

function actionMeta(action: string) {
  return ACTION_META[action] ?? { icon: History, color: "#71717a", label: action };
}

function initials(name: string) {
  return name
    .replace(/\b(dr|mr|mrs|ms|prof)\.?\s*/gi, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/* ---------------- EXPORT ---------------- */

function exportData(format: "csv" | "xls" | "pdf", logs: AuditRow[]) {
  const headers = ["When", "User", "Role", "Module", "Action", "Description"];

  const content = [
    headers.join(","),
    ...logs.map((log) =>
      [
        log.action_date,
        log.user_name,
        log.role,
        log.module_name,
        log.action,
        log.description,
      ]
        .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const type =
    format === "xls"
      ? "application/vnd.ms-excel;charset=utf-8"
      : format === "pdf"
      ? "application/pdf"
      : "text/csv;charset=utf-8";

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `org-audit-logs.${format}`;
  a.click();

  URL.revokeObjectURL(url);
}

/* ---------------- PAGE ---------------- */

const PAGE_SIZE = 5;

function OrgAdminAuditPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const rawLogs = useDb(() => db.all("audit_logs")) as RawAuditLog[];

  const [actionFilter, setActionFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Every log tagged with this org — the signed-in Org Admin's own
  // actions AND every one of their Employees' actions, already merged
  // and sorted most-recent-first at the seed level. Nothing here is
  // narrowed to Login/Logout; every module/entity an org can generate
  // (Appointment, Customer, Employee, Service, Queue, Feedback, User,
  // Session, ...) shows up.
  const logs: AuditRow[] = useMemo(() => {
    return rawLogs
      .filter((l) => l.organization_id === orgId)
      .map((l) => ({
        id: l.id,
        user_id: l.user_id,
        user_name: l.user_name,
        role: l.role ?? "Employee",
        module_name: l.module_name ?? l.entity ?? "—",
        action: l.action,
        description: l.description ?? l.details ?? "—",
        action_date: l.action_date ?? l.created_at ?? "",
      }))
      .sort((a, b) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime());
  }, [rawLogs, orgId]);

  const actions = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((l) => l.action)))],
    [logs]
  );

  const modules = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((l) => l.module_name)))],
    [logs]
  );

  const filteredLogs = useMemo(() => {
    let list = logs;

    if (actionFilter !== "all") list = list.filter((l) => l.action === actionFilter);
    if (moduleFilter !== "all") list = list.filter((l) => l.module_name === moduleFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.user_name?.toLowerCase().includes(q) ||
          l.module_name?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.role?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [logs, actionFilter, moduleFilter, search]);

  const counts = useMemo(
    () => ({
      total: logs.length,
      creates: logs.filter((l) => l.action === "CREATE").length,
      updates: logs.filter((l) => l.action === "UPDATE").length,
      deletes: logs.filter((l) => l.action === "DELETE").length,
    }),
    [logs]
  );

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, page]);

  const hasActiveFilters = actionFilter !== "all" || moduleFilter !== "all" || !!search;

  function clearFilters() {
    setActionFilter("all");
    setModuleFilter("all");
    setSearch("");
  }

  return (
    <div className="space-y-5">
      {/* HEADER — fixed row: title stays put, search/filters/export never wrap or reflow */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background py-2 flex-nowrap">
        <PageHeader
          title="Audit log"
          subtitle="Every action taken in your organization — your own, and your employees'."
        />

        <div className="flex items-center gap-2 flex-nowrap">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search logs..."
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>

          {/* MODULE FILTER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <ClipboardList className="h-3.5 w-3.5" />
                {moduleFilter === "all" ? "All modules" : moduleFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Filter by module</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {modules.map((m) => (
                <DropdownMenuItem
                  key={m}
                  onClick={() => {
                    setModuleFilter(m);
                    setPage(1);
                  }}
                  className="justify-between"
                >
                  {m === "all" ? "All modules" : m}
                  {moduleFilter === m && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ACTION FILTER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <Filter className="h-3.5 w-3.5" />
                {actionFilter === "all" ? "All actions" : actionMeta(actionFilter).label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Filter by action</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action}
                  onClick={() => {
                    setActionFilter(action);
                    setPage(1);
                  }}
                  className="justify-between"
                >
                  {action === "all" ? "All actions" : actionMeta(action).label}
                  {actionFilter === action && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* EXPORT */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => exportData("csv", filteredLogs)} className="gap-3">
                <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => exportData("xls", filteredLogs)} className="gap-3">
                <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => exportData("pdf", filteredLogs)} className="gap-3">
                <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{counts.total}</p>
            <p className="text-sm text-muted-foreground">Total logs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{counts.creates}</p>
            <p className="text-sm text-muted-foreground">Creates</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Pencil className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{counts.updates}</p>
            <p className="text-sm text-muted-foreground">Updates</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{counts.deletes}</p>
            <p className="text-sm text-muted-foreground">Deletes</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* HEADER */}
            <div className="grid grid-cols-[1.1fr_1.5fr_1fr_1fr_2fr] gap-2 border-b bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <div>When</div>
              <div>User</div>
              <div>Module</div>
              <div>Action</div>
              <div>Description</div>
            </div>

            {/* EMPTY STATE */}
            {paginatedLogs.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
                <ScrollText className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters ? "No logs match your filters" : "No activity yet in your organization"}
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* ROWS */}
            {paginatedLogs.map((log) => {
              const meta = actionMeta(log.action);
              const ActionIcon = meta.icon;
              const parsedDate = log.action_date ? new Date(log.action_date) : null;
              const whenLabel =
                parsedDate && !Number.isNaN(parsedDate.getTime())
                  ? parsedDate.toLocaleString()
                  : "—";

              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[1.1fr_1.5fr_1fr_1fr_2fr] items-center gap-2 border-b px-4 py-3 text-sm transition hover:bg-muted/20 last:border-b-0"
                >
                  <div className="text-muted-foreground">{whenLabel}</div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={
                        "grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-semibold " +
                        (log.role === "Org Admin"
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                          : "bg-primary/10 text-primary")
                      }
                    >
                      {initials(log.user_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{log.user_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{log.role}</div>
                    </div>
                  </div>

                  <div className="truncate text-muted-foreground">{log.module_name}</div>

                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
                    >
                      <ActionIcon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="truncate text-muted-foreground">{log.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <div className="text-xs text-muted-foreground">
            {filteredLogs.length === 0
              ? "No results"
              : `Page ${page} of ${totalPages} · ${filteredLogs.length} total`}
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}