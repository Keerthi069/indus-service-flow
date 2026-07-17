import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png"

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  Search,
  Users,
  Clock,
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Phone,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/org-admin/customers")({
  component: CustPage,
});

const PAGE_SIZE = 8;

// Same hex-pill status language used on Queues/Appointments — waiting is
// amber, in-service is blue, served is green, everywhere in the app.
const STATUS_META = {
  waiting: { label: "Waiting", icon: Clock, color: "#eda100" },
  in_service: { label: "In service", icon: Activity, color: "#2a78d6" },
  served: { label: "Served", icon: CheckCircle2, color: "#1baf7a" },
} as const;

const FILTERS: Array<{ value: "all" | keyof typeof STATUS_META; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "waiting", label: "Waiting" },
  { value: "in_service", label: "In service" },
  { value: "served", label: "Served" },
];

function StatusBadge({ status }: { status: keyof typeof STATUS_META }) {
  const meta = STATUS_META[status] ?? STATUS_META.waiting;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
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

function CustPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const rows = useDb(() =>
    db.all("customers").filter((r) => r.organization_id === orgId)
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | keyof typeof STATUS_META>("all");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    let data = rows;

    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.mobile?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.service?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [rows, statusFilter, search]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      waiting: rows.filter((r) => r.status === "waiting").length,
      in_service: rows.filter((r) => r.status === "in_service").length,
      served: rows.filter((r) => r.status === "served").length,
    }),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginated = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function cycleStatus(id: string, current: string) {
    const nextStatus =
      current === "waiting" ? "in_service" : current === "in_service" ? "served" : "waiting";
    db.update("customers", id, { status: nextStatus });
  }

  // ── Export ─────────────────────────────────────────────────────────────

  function exportExcel() {
    if (!filteredRows.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
  }

  function exportCSV() {
    if (!filteredRows.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (!filteredRows.length) return;
    const pdf = new jsPDF();
    autoTable(pdf, {
      head: [["Name", "Mobile", "Email", "Service", "Status"]],
      body: filteredRows.map((r) => [r.name ?? "", r.mobile ?? "", r.email ?? "", r.service ?? "", r.status ?? ""]),
    });
    pdf.save("customers.pdf");
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Customers" subtitle="Customer records associated with your organization." />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>

          {/* FILTER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
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
                    <span style={{ color: STATUS_META[f.value].color }}>{f.label}</span>
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
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">

              <DropdownMenuItem onClick={exportCSV}>
                 <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>

              <DropdownMenuItem onClick={exportExcel}>
                 <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>
             
              <DropdownMenuItem onClick={exportPDF}>
                 <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.total}</div>
              <div className="text-xs text-muted-foreground">Total customers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.waiting}</div>
              <div className="text-xs text-muted-foreground">Waiting</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.in_service}</div>
              <div className="text-xs text-muted-foreground">In service</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.served}</div>
              <div className="text-xs text-muted-foreground">Served</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1.1fr_1.4fr_0.8fr_1.1fr_1fr] gap-2 border-b bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
          <div>Name</div>
          <div>Mobile</div>
          <div>Email</div>
          <div>Gender</div>
          <div>Service</div>
          <div>Status</div>
        </div>

        {paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No customers found</p>
            <p className="text-xs text-muted-foreground">
              {search || statusFilter !== "all" ? "Try adjusting your search or filter." : "New customers will show up here."}
            </p>
          </div>
        ) : (
          paginated.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1.6fr_1.1fr_1.4fr_0.8fr_1.1fr_1fr] items-center gap-2 border-b px-4 py-3 text-sm transition hover:bg-muted/20 last:border-b-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(r.name)}
                </div>
                <span className="truncate font-medium text-foreground">{r.name}</span>
              </div>

              <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                {r.mobile || "—"}
              </div>

              <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                {r.email || "—"}
              </div>

              <div className="capitalize text-muted-foreground">{r.gender || "—"}</div>

              <div className="truncate text-muted-foreground">{r.service || "—"}</div>

              <div>
                <button onClick={() => cycleStatus(r.id, r.status)} title="Click to advance status">
                  <StatusBadge status={r.status as keyof typeof STATUS_META} />
                </button>
              </div>
            </div>
          ))
        )}

        {/* PAGINATION */}
        {filteredRows.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page <= 1}
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
        )}
      </Card>
    </div>
  );
}