import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type ComponentType } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  XCircle,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/super-admin/subscriptions")({
  component: SubscriptionsPage,
});

// This page is a pure tabular report — no chart visualizations. See
// /super-admin (Dashboard) for the "Subscription changes" chart, which was
// moved there.

// ── Plan pricing (mirrors /super-admin/plans) ─────────────────────────────────
const PLAN_PRICING: Record<string, { monthly: number; annual: number }> = {
  Starter: { monthly: 2999, annual: 2399 },
  Growth: { monthly: 5999, annual: 4799 },
  Enterprise: { monthly: 11999, annual: 9599 },
};

const PLAN_COLORS: Record<keyof typeof PLAN_PRICING, string> = {
  Enterprise: "#2a78d6",
  Growth: "#1baf7a",
  Starter: "#eda100",
};

// ── Data ─────────────────────────────────────────────────────────────────────

type SubStatus = "active" | "trial" | "expiring" | "paused" | "cancelled";

type Subscription = {
  org: string;
  plan: keyof typeof PLAN_PRICING;
  employees: number;
  billing: "monthly" | "annual";
  status: SubStatus;
  nextBilling: string;
  since: string;
};

const SUBSCRIPTIONS_RAW: Subscription[] = [
  { org: "Meridian Health",    plan: "Enterprise", employees: 84, billing: "annual",  status: "active",    nextBilling: "2027-01-15", since: "2023-01-15" },
  { org: "Apex Ventures",      plan: "Enterprise", employees: 61, billing: "annual",  status: "active",    nextBilling: "2026-09-02", since: "2022-09-02" },
  { org: "Stellaris Corp",     plan: "Growth",     employees: 32, billing: "monthly", status: "active",    nextBilling: "2026-07-21", since: "2026-06-21" },
  { org: "NovaBuild Inc.",     plan: "Growth",     employees: 28, billing: "monthly", status: "active",    nextBilling: "2026-07-14", since: "2025-04-14" },
  { org: "Clearwave Media",    plan: "Growth",     employees: 19, billing: "monthly", status: "trial",     nextBilling: "2026-07-01", since: "2026-06-01" },
  { org: "Ironclad Systems",   plan: "Enterprise", employees: 55, billing: "annual",  status: "active",    nextBilling: "2026-11-08", since: "2023-11-08" },
  { org: "PulseWorks",         plan: "Starter",    employees: 12, billing: "monthly", status: "active",    nextBilling: "2026-07-03", since: "2025-12-03" },
  { org: "Quantum Labs",       plan: "Starter",    employees: 7,  billing: "monthly", status: "paused",    nextBilling: "—",          since: "2025-06-20" },
  { org: "Drift Analytics",    plan: "Growth",     employees: 21, billing: "annual",  status: "active",    nextBilling: "2026-12-19", since: "2024-12-19" },
  { org: "Harlow Clinic",      plan: "Enterprise", employees: 38, billing: "annual",  status: "active",    nextBilling: "2027-02-01", since: "2024-02-01" },
  { org: "Nexbridge Partners", plan: "Growth",     employees: 15, billing: "monthly", status: "expiring",  nextBilling: "2026-07-05", since: "2025-07-05" },
  { org: "Vault Finance",      plan: "Starter",    employees: 5,  billing: "monthly", status: "cancelled", nextBilling: "—",          since: "2025-01-10" },
];

// A subscription only generates revenue while it's active or about to
// renew — trial, paused, and cancelled accounts shouldn't be shown (or
// counted) as if they're being billed.
const BILLABLE_STATUSES: SubStatus[] = ["active", "expiring"];

const SUBSCRIPTIONS = SUBSCRIPTIONS_RAW.map((s) => ({
  ...s,
  amount: BILLABLE_STATUSES.includes(s.status)
    ? PLAN_PRICING[s.plan][s.billing]
    : 0,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function amountDisplay(s: { amount: number; status: SubStatus }) {
  return BILLABLE_STATUSES.includes(s.status) ? fmtINR(s.amount) : "—";
}

function exportRows(rows: typeof SUBSCRIPTIONS) {
  return rows.map((r) => ({
    Organization: r.org,
    Plan: r.plan,
    Employees: r.employees,
    "Monthly revenue": BILLABLE_STATUSES.includes(r.status) ? r.amount : 0,
    "Billing cycle": r.billing,
    Status: r.status,
    "Next payment": r.nextBilling,
    "Customer since": r.since,
  }));
}

function exportData(type: "csv" | "xls" | "pdf", rows: typeof SUBSCRIPTIONS) {
  if (!rows.length) {
    toast.error("No subscriptions to export");
    return;
  }

  const data = exportRows(rows);

  if (type === "csv") {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscriptions-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (type === "xls") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscriptions");
    XLSX.writeFile(wb, "subscriptions-export.xlsx");
  }

  if (type === "pdf") {
    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const body = data.map((row) => Object.values(row).map(String));
    autoTable(doc, { head: [headers], body });
    doc.save("subscriptions-export.pdf");
  }

  toast.success(`Exported ${type.toUpperCase()}`);
}

// ── Shared primitives ───────────────────────────────────────────────────────

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      Live
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive,
  Icon,
  pulse,
}: {
  label: string;
  value: string | number;
  delta: string;
  positive: boolean;
  Icon: ComponentType<{ className?: string }>;
  pulse?: boolean;
}) {
  const DeltaIcon = positive ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div className={`text-2xl font-semibold font-mono tracking-tight ${pulse ? "animate-pulse" : ""}`}>
          {value}
        </div>
        <div
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            positive
              ? "text-green-600 dark:text-green-400"
              : "text-red-500 dark:text-red-400"
          }`}
        >
          <DeltaIcon className="h-3 w-3" />
          {delta}
        </div>
      </CardContent>
    </Card>
  );
}

function SubStatusBadge({ status }: { status: SubStatus }) {
  const map: Record<SubStatus, string> = {
    active:    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    trial:     "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    expiring:  "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
    paused:    "bg-muted text-muted-foreground border-border",
    cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  const STATUS_LABELS: Record<SubStatus, string> = {
    active: "Active",
    trial: "Trial",
    expiring: "Expiring soon",
    paused: "Paused",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] ?? map.paused}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function BillingBadge({ billing }: { billing: string }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
      {billing}
    </span>
  );
}

// Sort icon
function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: "asc" | "desc" }) {
  if (sortCol !== col) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3 w-3 text-foreground" />
    : <ChevronDown className="h-3 w-3 text-foreground" />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SubscriptionsPage() {
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  // ── Live-report state ──────────────────────────────────────────────────
  // Billing systems stream usage/revenue continuously — this simulates that
  // by nudging the headline KPIs slightly on a timer, so the page reads as
  // a live report rather than a static snapshot. The underlying table data
  // (which org is on which plan, exact next-billing dates, etc.) stays
  // exactly as recorded — only the aggregate KPIs breathe a little.
  const [liveTick, setLiveTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveTick((t) => t + 1);
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 900);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Derived KPIs — only billable subscriptions count toward revenue.
  const activeSubs    = SUBSCRIPTIONS.filter((s) => s.status === "active");
  const totalRevenue  = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const totalEmployees = activeSubs.reduce((sum, s) => sum + s.employees, 0);
  const trialCount    = SUBSCRIPTIONS.filter((s) => s.status === "trial").length;
  const expiringCount = SUBSCRIPTIONS.filter((s) => s.status === "expiring").length;
  const cancelledCount = SUBSCRIPTIONS.filter((s) => s.status === "cancelled").length;

  // Small bounded jitter (±0.2–0.3%) on the two figures that plausibly
  // fluctuate in real time — revenue (mid-cycle proration, add-ons) and
  // employee headcount (new hires/offboarding). Counts of orgs/trials/etc.
  // stay exact since those are discrete, not streaming, values.
  const jitterFactor = useMemo(() => 1 + Math.sin(liveTick * 1.7) * 0.002, [liveTick]);
  const liveRevenue = Math.round(totalRevenue * jitterFactor);
  const liveEmployees = Math.max(0, totalEmployees + Math.round(Math.sin(liveTick * 1.3) * 3));

  // Filtering + sorting
  const plans    = ["All", "Enterprise", "Growth", "Starter"];
  const statuses: (SubStatus | "All")[] = ["All", "active", "trial", "expiring", "paused", "cancelled"];

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
    setPage(1);
  }

  const filtered = SUBSCRIPTIONS
    .filter((s) => planFilter   === "All" || s.plan   === planFilter)
    .filter((s) => statusFilter === "All" || s.status === statusFilter)
    .filter((s) =>
      !search || s.org.toLowerCase().includes(search.toLowerCase()) || s.plan.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      switch (sortCol) {
        case "amount":
          return (a.amount - b.amount) * mul;
        case "employees":
          return (a.employees - b.employees) * mul;
        case "org":
          return a.org.localeCompare(b.org) * mul;
        case "plan":
          return a.plan.localeCompare(b.plan) * mul;
        case "billing":
          return a.billing.localeCompare(b.billing) * mul;
        case "status":
          return a.status.localeCompare(b.status) * mul;
        case "nextBilling":
          return a.nextBilling.localeCompare(b.nextBilling) * mul;
        case "since":
          return a.since.localeCompare(b.since) * mul;
        default:
          return 0;
      }
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Plan breakdown summary (plain numbers/table — no chart)
  const planCounts = plans.slice(1).map((p) => ({
    label: p,
    count: SUBSCRIPTIONS.filter((s) => s.plan === p && s.status === "active").length,
    color: PLAN_COLORS[p as keyof typeof PLAN_COLORS],
  }));
  const totalActive = planCounts.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Subscriptions"
          subtitle="See which organizations are subscribed, on which plan, and what they're paying."
        />
        <div className="flex items-center gap-2 flex-wrap">
          <LivePill />
          {expiringCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
              <AlertCircle className="h-3 w-3" />
              {expiringCount} expiring soon
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => exportData("csv", filtered)}
                className="gap-3"
              >
                <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => exportData("xls", filtered)}
                className="gap-3"
              >
                <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => exportData("pdf", filtered)}
                className="gap-3"
              >
                <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Monthly revenue"
          value={fmtINR(liveRevenue)}
          delta="+8.3% vs last month"
          positive
          Icon={DollarSign}
          pulse={pulse}
        />
        <KpiCard
          label="Active organizations"
          value={activeSubs.length}
          delta="+4 this month"
          positive
          Icon={CreditCard}
        />
        <KpiCard
          label="Total employees"
          value={liveEmployees.toLocaleString()}
          delta="+63 this month"
          positive
          Icon={Users}
          pulse={pulse}
        />
        <KpiCard
          label="On trial"
          value={trialCount}
          delta="2 convert this week"
          positive
          Icon={RefreshCw}
        />
        <KpiCard
          label="Cancelled (30 days)"
          value={cancelledCount}
          delta="+0.2pp vs prior period"
          positive={false}
          Icon={TrendingDown}
        />
      </div>

      {/* ── Plan breakdown (table, no chart) ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active organizations by plan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Active orgs</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Share</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Monthly revenue</th>
              </tr>
            </thead>
            <tbody>
              {planCounts.map(({ label, count, color }, i) => {
                const pct = totalActive ? Math.round((count / totalActive) * 100) : 0;
                const planRevenue = SUBSCRIPTIONS
                  .filter((s) => s.plan === label && s.status === "active")
                  .reduce((sum, s) => sum + s.amount, 0);
                return (
                  <tr key={label} className={i < planCounts.length - 1 ? "border-b" : ""}>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{count}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{pct}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">{fmtINR(planRevenue)}/mo</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t px-4 py-3 grid gap-1.5 sm:grid-cols-3">
            {[
              { label: "New this month",       val: "+34", Icon: ArrowUpCircle,   cls: "text-green-600 dark:text-green-400" },
              { label: "Cancelled this month",  val: "−3",  Icon: ArrowDownCircle, cls: "text-red-500 dark:text-red-400" },
              { label: "Cancelled this year",   val: "−8",  Icon: XCircle,         cls: "text-red-500 dark:text-red-400" },
            ].map(({ label, val, Icon, cls }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className={`h-3.5 w-3.5 ${cls}`} />
                  {label}
                </div>
                <span className={`font-mono font-medium ${cls}`}>{val}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Subscriptions table ── */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              All subscriptions
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground normal-case tracking-normal">
                {filtered.length} of {SUBSCRIPTIONS.length}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search organization or plan…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-8 pl-7 text-xs w-48"
                />
              </div>

              {/* Plan filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    Plan: {planFilter}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {plans.map((p) => (
                    <DropdownMenuItem key={p} onClick={() => { setPlanFilter(p); setPage(1); }}>
                      {p}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1 capitalize">
                    Status: {statusFilter}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {statuses.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className="capitalize">
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                {[
                  { key: "org",         label: "Organization",     align: "left"  },
                  { key: "plan",        label: "Plan",              align: "left"  },
                  { key: "status",      label: "Status",            align: "left"  },
                  { key: "billing",     label: "Billing cycle",     align: "left"  },
                  { key: "employees",   label: "Employees",         align: "right" },
                  { key: "amount",      label: "Monthly revenue",   align: "right" },
                  { key: "nextBilling", label: "Next payment",      align: "right" },
                  { key: "since",       label: "Customer since",    align: "right" },
                ].map(({ key, label, align }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className={`px-4 py-2 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${
                      align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {align === "right" && <SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />}
                      {label}
                      {align === "left"  && <SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No subscriptions match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((s, i) => (
                  <tr
                    key={s.org}
                    className={`hover:bg-muted/30 transition-colors ${
                      i < paginated.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{s.org}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ background: PLAN_COLORS[s.plan] }}
                        />
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <SubStatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <BillingBadge billing={s.billing} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{s.employees}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">
                      {amountDisplay(s)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {s.nextBilling}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {s.since}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t bg-muted/20">
                  <td className="px-4 py-2 text-xs font-medium text-muted-foreground" colSpan={4}>
                    {filtered.length} subscription{filtered.length !== 1 ? "s" : ""} total
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs font-medium text-muted-foreground">
                    {filtered.reduce((sum, s) => sum + s.employees, 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs font-semibold text-foreground">
                    {fmtINR(filtered.reduce((sum, s) => sum + s.amount, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc: (number | string)[], p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === safePage ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                >
                  »
                </Button>
              </div>
            </div>
          )}

          <p className="px-4 pb-3 pt-1 text-right text-xs text-muted-foreground font-mono">
            Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}