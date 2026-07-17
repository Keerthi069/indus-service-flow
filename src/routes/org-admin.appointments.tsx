import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Search,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  Footprints,
  Inbox,
  LogOut,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png"; 

import { db, useDb, type AppointmentStatus, type Appointment } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Explicit hex-based status language (matches Requests/Categories/Organizations
// pages) rather than theme tokens like `--success`/`--warning`, which this
// project's Tailwind config doesn't actually define.
//
// NOTE: "left_queue" must also be added to the `AppointmentStatus` union in
// @/lib/mock/db.ts — this file alone can't widen a type imported from
// elsewhere. Without that, TS will flag every place below that assigns or
// compares this literal.
const STATUS_META: Record<AppointmentStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  confirmed: { label: "Confirmed", icon: CalendarDays, color: "#2a78d6" },
  in_progress: { label: "In progress", icon: Loader2, color: "#7c5cff" },
  completed: { label: "Completed", icon: CheckCircle2, color: "#1baf7a" },
  rescheduled: { label: "Rescheduled", icon: CalendarClock, color: "#eda100" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "#dc2626" },
  left_queue: { label: "Left Queue", icon: LogOut, color: "#6b7280" },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize"
      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

/**
 * `Appointment` in db.ts has no field distinguishing a booking made ahead
 * of time from a same-day walk-in — this is layered on locally, same
 * pattern as `deleted`/`hold` on the other rebuilt pages, and writes are
 * cast `as never`.
 *
 * DEFAULT (for existing rows that have never had a type set): seed.ts's
 * buildTodayAppointmentsForEmployees() generates same-day queue-filler
 * rows with ids prefixed "apt_today_" specifically to guarantee every
 * employee has today appointments — those are treated as walk-ins.
 * Every other seeded row ("apt_1", "apt_2", ...) was booked for a specific
 * future/past date ahead of time, so it defaults to "scheduled". Once a
 * row's type is set explicitly (via the dropdown below), that stored
 * value always wins over this default.
 */
type AppointmentType = "scheduled" | "walk_in";
type ApptRow = Appointment & { type: AppointmentType };

const TYPE_META: Record<AppointmentType, { label: string; icon: typeof CalendarDays; color: string }> = {
  scheduled: { label: "Scheduled", icon: CalendarDays, color: "#2a78d6" },
  walk_in: { label: "Walk-in", icon: Footprints, color: "#e2621b" },
};

function deriveAppointmentType(row: Appointment & { type?: AppointmentType }): AppointmentType {
  if (row.type) return row.type;
  return row.id.startsWith("apt_today_") ? "walk_in" : "scheduled";
}

function TypeBadge({ type, onChange }: { type: AppointmentType; onChange: (t: AppointmentType) => void }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onChange("scheduled")}>Mark as Scheduled</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("walk_in")}>Mark as Walk-in</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initials(name: string) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

const FILTERS: Array<{ value: "all" | AppointmentStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "left_queue", label: "Left Queue" },
];

const TYPE_FILTERS: Array<{ value: "all" | AppointmentType; label: string }> = [
  { value: "all", label: "All types" },
  { value: "scheduled", label: "Scheduled" },
  { value: "walk_in", label: "Walk-in" },
];

export const Route = createFileRoute("/org-admin/appointments")({
  component: ApptPage,
});

function ApptPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const rows: ApptRow[] = useDb(() =>
    db
      .all("appointments")
      .filter((a) => a.organization_id === orgId)
      .map((a) => ({ ...a, type: deriveAppointmentType(a as Appointment & { type?: AppointmentType }) }))
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | AppointmentType>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let data = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((r) => Object.values(r).join(" ").toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (typeFilter !== "all") {
      data = data.filter((r) => r.type === typeFilter);
    }

    data.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [rows, search, statusFilter, typeFilter, sortKey, sortDir]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      completed: rows.filter((r) => r.status === "completed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
      leftQueue: rows.filter((r) => r.status === "left_queue").length,
      scheduled: rows.filter((r) => r.type === "scheduled").length,
      walkIn: rows.filter((r) => r.type === "walk_in").length,
    }),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateStatus(id: string, status: AppointmentStatus, message: string) {
    db.update("appointments", id, { status } as never);
    toast.success(message);
  }

  function updateType(id: string, type: AppointmentType, name: string) {
    db.update("appointments", id, { type } as never);
    toast.success(`${name} marked as ${TYPE_META[type].label}`);
  }

  function exportRows() {
    return filtered.map((r) => ({
      Token: r.token,
      Customer: r.customer_name,
      Service: r.service_name,
      Employee: r.employee_name,
      Type: TYPE_META[r.type].label,
      Date: r.date,
      Time: r.time,
      Status: STATUS_META[r.status].label,
    }));
  }

  function exportCSV() {
    if (!filtered.length) return toast.error("Nothing to export");
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "appointments.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  function exportExcel() {
    if (!filtered.length) return toast.error("Nothing to export");
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appointments");
    XLSX.writeFile(wb, "appointments.xlsx");
    toast.success("Exported Excel");
  }

  function exportPDF() {
    if (!filtered.length) return toast.error("Nothing to export");
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Token", "Customer", "Service", "Employee", "Type", "Date", "Time", "Status"]],
      body: exportRows().map(Object.values),
    });
    doc.save("appointments.pdf");
    toast.success("Exported PDF");
  }

  const sortableColumns: Array<[string, string]> = [
    ["token", "Token"],
    ["customer_name", "Customer"],
    ["service_name", "Service"],
    ["employee_name", "Employee"],
    ["type", "Type"],
    ["date", "Date"],
    ["time", "Time"],
  ];

  return (
    <div className="space-y-5">
      {/* HEADER — search, filter, export moved up here to match Employees/Services */}
      <PageHeader
        title="Appointments"
        subtitle="Track, update and export every booking for your organization."
        actions={
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 w-64"
              />
            </div>

            {/* TYPE FILTER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  {typeFilter === "all" ? "All types" : TYPE_META[typeFilter].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TYPE_FILTERS.map((f) => (
                  <DropdownMenuItem
                    key={f.value}
                    onClick={() => {
                      setTypeFilter(f.value);
                      setPage(1);
                    }}
                  >
                    {f.value !== "all" ? (
                      <span className="flex items-center gap-1.5" style={{ color: TYPE_META[f.value].color }}>
                        {f.label}
                      </span>
                    ) : (
                      f.label
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* STATUS FILTER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  {statusFilter === "all" ? "All statuses" : STATUS_META[statusFilter].label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {FILTERS.map((f) => (
                  <DropdownMenuItem
                    key={f.value}
                    onClick={() => {
                      setStatusFilter(f.value);
                      setPage(1);
                    }}
                  >
                    {f.value !== "all" ? (
                      <span className="flex items-center gap-1.5" style={{ color: STATUS_META[f.value].color }}>
                        {f.label}
                      </span>
                    ) : (
                      f.label
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* EXPORT */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV}>
                  <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={exportExcel}><img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF}><img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* STAT CARDS — restyled to match Employees/Services (rounded-2xl, colored icon square) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.total}</div>
            <div className="text-sm text-muted-foreground">Total appointments</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.scheduled}</div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Footprints className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.walkIn}</div>
            <div className="text-sm text-muted-foreground">Walk-in</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.cancelled}</div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{counts.leftQueue}</div>
            <div className="text-sm text-muted-foreground">Left Queue</div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              {sortableColumns.map(([key, label]) => (
                <TableHead
                  key={key}
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort(key)}
                >
                  <div className="flex items-center gap-1.5">
                    {label}
                    {sortKey === key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">No appointments found</p>
                    <p className="text-xs">Try adjusting your search or filter.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">{row.token}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {initials(row.customer_name)}
                      </div>
                      <span className="truncate">{row.customer_name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{row.service_name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.employee_name || "Auto-assigned"}</TableCell>

                  <TableCell>
                    <TypeBadge type={row.type} onChange={(t) => updateType(row.id, t, row.customer_name)} />
                  </TableCell>

                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.time}</TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button>
                          <StatusBadge status={row.status} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => updateStatus(row.id, "completed", "Marked as completed")}
                        >
                          Mark as completed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus(row.id, "rescheduled", "Marked as rescheduled")}
                        >
                          Mark as rescheduled
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus(row.id, "left_queue", "Marked as left queue")}
                        >
                          Mark as left queue
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus(row.id, "cancelled", "Marked as cancelled")}
                        >
                          Mark as cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 text-xs font-medium text-muted-foreground">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
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