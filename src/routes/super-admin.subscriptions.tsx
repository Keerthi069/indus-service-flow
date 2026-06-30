import { createFileRoute } from "@tanstack/react-router";
import { JSX, useState, ComponentType } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from "recharts";
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
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/subscriptions")({
  component: SubscriptionsPage,
});

// ── Data ─────────────────────────────────────────────────────────────────────

const CHART_DATA = [
  { label: "Jan", new: 18, upgrades: 5, downgrades: 2, churned: 1, net: 20 },
  { label: "Feb", new: 22, upgrades: 7, downgrades: 3, churned: 2, net: 24 },
  { label: "Mar", new: 19, upgrades: 4, downgrades: 1, churned: 1, net: 21 },
  { label: "Apr", new: 31, upgrades: 9, downgrades: 4, churned: 3, net: 33 },
  { label: "May", new: 27, upgrades: 6, downgrades: 2, churned: 2, net: 29 },
  { label: "Jun", new: 34, upgrades: 11, downgrades: 3, churned: 1, net: 41 },
];

const SUBSCRIPTIONS: {
  org: string;
  plan: string;
  seats: number;
  amount: number;
  billing: string;
  status: 'active' | 'trial' | 'expiring' | 'paused' | 'cancelled';
  nextBilling: string;
  since: string;
}[] = [
  { org: "Meridian Health",    plan: "Enterprise", seats: 84, amount: 9800,  billing: "annual",  status: "active",   nextBilling: "2027-01-15", since: "2023-01-15" },
  { org: "Apex Ventures",      plan: "Enterprise", seats: 61, amount: 7200,  billing: "annual",  status: "active",   nextBilling: "2026-09-02", since: "2022-09-02" },
  { org: "Stellaris Corp",     plan: "Growth",     seats: 32, amount: 3600,  billing: "monthly", status: "active",   nextBilling: "2026-07-21", since: "2026-06-21" },
  { org: "NovaBuild Inc.",     plan: "Growth",     seats: 28, amount: 3100,  billing: "monthly", status: "active",   nextBilling: "2026-07-14", since: "2025-04-14" },
  { org: "Clearwave Media",    plan: "Growth",     seats: 19, amount: 2200,  billing: "monthly", status: "trial",    nextBilling: "2026-07-01", since: "2026-06-01" },
  { org: "Ironclad Systems",   plan: "Enterprise", seats: 55, amount: 6400,  billing: "annual",  status: "active",   nextBilling: "2026-11-08", since: "2023-11-08" },
  { org: "PulseWorks",         plan: "Starter",    seats: 12, amount: 840,   billing: "monthly", status: "active",   nextBilling: "2026-07-03", since: "2025-12-03" },
  { org: "Quantum Labs",       plan: "Starter",    seats: 7,  amount: 490,   billing: "monthly", status: "paused",   nextBilling: "—",          since: "2025-06-20" },
  { org: "Drift Analytics",    plan: "Growth",     seats: 21, amount: 2400,  billing: "annual",  status: "active",   nextBilling: "2026-12-19", since: "2024-12-19" },
  { org: "Harlow Clinic",      plan: "Enterprise", seats: 38, amount: 4500,  billing: "annual",  status: "active",   nextBilling: "2027-02-01", since: "2024-02-01" },
  { org: "Nexbridge Partners", plan: "Growth",     seats: 15, amount: 1700,  billing: "monthly", status: "expiring", nextBilling: "2026-07-05", since: "2025-07-05" },
  { org: "Vault Finance",      plan: "Starter",    seats: 5,  amount: 350,   billing: "monthly", status: "cancelled",nextBilling: "—",          since: "2025-01-10" },
];

const PLAN_COLORS = {
  Enterprise: "#2a78d6",
  Growth:     "#1baf7a",
  Starter:    "#eda100",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function fmtK(n: number) {
  return n >= 1000 ? "$" + (n / 1000).toFixed(0) + "k" : "$" + n;
}

function exportCsv(rows: {
  org: string;
  plan: string;
  seats: number;
  amount: number;
  billing: string;
  status: string;
  nextBilling: string;
  since: string;
}[]) {
  const headers = "organization,plan,seats,mrr,billing,status,next_billing,member_since";
  const lines = rows.map(
    (r) =>
      `"${r.org}",${r.plan},${r.seats},${r.amount},${r.billing},${r.status},${r.nextBilling},${r.since}`
  );
  const blob = new Blob([[headers, ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "subscriptions-export.csv";
  a.click();
}

// ── Shared primitives (mirrors ReportsPage) ───────────────────────────────────

function KpiCard({
  label,
  value,
  delta,
  positive,
  Icon,
}: {
  label: string;
  value: string | number;
  delta: string;
  positive: boolean;
  Icon: ComponentType<{ className?: string }>;
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
        <div className="text-2xl font-semibold font-mono tracking-tight">{value}</div>
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

function SubStatusBadge({ status }: { status: 'active' | 'trial' | 'expiring' | 'paused' | 'cancelled' }) {
  const map = {
    active:    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    trial:     "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    expiring:  "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
    paused:    "bg-muted text-muted-foreground border-border",
    cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? map.paused}`}
    >
      {status}
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md min-w-[140px]">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span className="capitalize text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium">{p.value}</span>
        </p>
      ))}
    </div>
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


  // Derived KPIs
  const activeSubs   = SUBSCRIPTIONS.filter((s) => s.status === "active");
  const totalMrr     = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const totalSeats   = activeSubs.reduce((sum, s) => sum + s.seats, 0);
  const trialCount   = SUBSCRIPTIONS.filter((s) => s.status === "trial").length;
  const expiringCount = SUBSCRIPTIONS.filter((s) => s.status === "expiring").length;

  // Filtering + sorting
  const plans    = ["All", "Enterprise", "Growth", "Starter"];
  const statuses = ["All", "active", "trial", "expiring", "paused", "cancelled"];

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
        case "seats":
          return (a.seats - b.seats) * mul;
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

  // Plan distribution for mini chart
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
          subtitle="Manage and monitor all tenant subscription plans."
        />
        <div className="flex items-center gap-2 flex-wrap">
          {expiringCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
              <AlertCircle className="h-3 w-3" />
              {expiringCount} expiring soon
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCsv(filtered)}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Total MRR"
          value={fmtUSD(totalMrr)}
          delta="+8.3% vs last month"
          positive
          Icon={DollarSign}
        />
        <KpiCard
          label="Active subscriptions"
          value={activeSubs.length}
          delta="+4 this month"
          positive
          Icon={CreditCard}
        />
        <KpiCard
          label="Total seats"
          value={totalSeats.toLocaleString()}
          delta="+63 this month"
          positive
          Icon={Users}
        />
        <KpiCard
          label="On trial"
          value={trialCount}
          delta="2 convert this week"
          positive
          Icon={RefreshCw}
        />
        <KpiCard
          label="Churn (30 d)"
          value="1.8%"
          delta="+0.2pp vs prior period"
          positive={false}
          Icon={TrendingDown}
        />
      </div>

      {/* ── Chart + plan breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Net new subscriptions bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Subscription movements — last 6 months
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: "#2a78d6" }} />
                  New
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: "#1baf7a" }} />
                  Upgrades
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: "#eda100" }} />
                  Downgrades
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-px w-4 border-t-2 border-dashed" style={{ borderColor: "#e34948" }} />
                  Net
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CHART_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <RTooltip content={<CustomTooltip />} />
                <Bar dataKey="new"        fill="#2a78d6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="upgrades"   fill="#1baf7a" radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="downgrades" fill="#eda100" radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#e34948"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: "#e34948", strokeWidth: 2, stroke: "var(--background)" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan breakdown */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Active by plan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {planCounts.map(({ label, count, color }) => {
              const pct = totalActive ? Math.round((count / totalActive) * 100) : 0;
              const planMrr = SUBSCRIPTIONS
                .filter((s) => s.plan === label && s.status === "active")
                .reduce((sum, s) => sum + s.amount, 0);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-foreground font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{count} orgs</span>
                      <span className="font-mono font-medium text-foreground">{fmtUSD(planMrr)}/mo</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-muted-foreground">{pct}%</p>
                </div>
              );
            })}

            <div className="pt-1 border-t space-y-1.5">
              {[
                { label: "New this month",    val: "+34", Icon: ArrowUpCircle,   cls: "text-green-600 dark:text-green-400" },
                { label: "Churned this month",val: "−3",  Icon: ArrowDownCircle, cls: "text-red-500 dark:text-red-400" },
                { label: "Cancelled YTD",     val: "−8",  Icon: XCircle,         cls: "text-red-500 dark:text-red-400" },
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
      </div>

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
                  placeholder="Search org or plan…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-8 pl-7 text-xs w-44"
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
                  { key: "org",         label: "Organization",  align: "left"  },
                  { key: "plan",        label: "Plan",          align: "left"  },
                  { key: "status",      label: "Status",        align: "left"  },
                  { key: "billing",     label: "Billing",       align: "left"  },
                  { key: "seats",       label: "Seats",         align: "right" },
                  { key: "amount",      label: "MRR",           align: "right" },
                  { key: "nextBilling", label: "Next billing",  align: "right" },
                  { key: "since",       label: "Member since",  align: "right" },
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
                          style={{ background: PLAN_COLORS[s.plan as keyof typeof PLAN_COLORS] }}
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
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{s.seats}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">
                      {fmtUSD(s.amount)}
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
                    {filtered.reduce((sum, s) => sum + s.seats, 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs font-semibold text-foreground">
                    {fmtUSD(filtered.reduce((sum, s) => sum + s.amount, 0))}
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
        </CardContent>
      </Card>
    </div>
  );
}
