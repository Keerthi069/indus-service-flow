import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  UserMinus,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/reports")({
  component: ReportsPage,
});

// ── Data ─────────────────────────────────────────────────────────────────────

const RANGES = {
  "7d": {
    label: "7 days",
    data: [
      { label: "Mon", mrr: 118200, tenants: 325 },
      { label: "Tue", mrr: 120100, tenants: 327 },
      { label: "Wed", mrr: 121500, tenants: 330 },
      { label: "Thu", mrr: 122800, tenants: 333 },
      { label: "Fri", mrr: 124300, tenants: 336 },
      { label: "Sat", mrr: 126100, tenants: 339 },
      { label: "Sun", mrr: 128400, tenants: 342 },
    ],
  },
  "30d": {
    label: "30 days",
    data: [
      { label: "W1", mrr: 108000, tenants: 298 },
      { label: "W2", mrr: 114000, tenants: 312 },
      { label: "W3", mrr: 121000, tenants: 328 },
      { label: "W4", mrr: 128400, tenants: 342 },
    ],
  },
  "90d": {
    label: "90 days",
    data: [
      { label: "Jun", mrr: 94000, tenants: 265 },
      { label: "Jul", mrr: 111000, tenants: 300 },
      { label: "Aug", mrr: 128400, tenants: 342 },
    ],
  },
  "1y": {
    label: "1 year",
    data: [
      { label: "Q1 '25", mrr: 62000, tenants: 180 },
      { label: "Q2 '25", mrr: 78000, tenants: 210 },
      { label: "Q3 '25", mrr: 95000, tenants: 255 },
      { label: "Q4 '25", mrr: 108000, tenants: 290 },
      { label: "Q1 '26", mrr: 116000, tenants: 318 },
      { label: "Q2 '26", mrr: 128400, tenants: 342 },
    ],
  },
};

const TOP_TENANTS = [
  { name: "Meridian Health", plan: "Enterprise", seats: 84, mrr: 9800, status: "active" },
  { name: "Apex Ventures", plan: "Enterprise", seats: 61, mrr: 7200, status: "active" },
  { name: "NovaBuild Inc.", plan: "Growth", seats: 28, mrr: 3100, status: "active" },
  { name: "Clearwave Media", plan: "Growth", seats: 19, mrr: 2200, status: "trial" },
  { name: "Quantum Labs", plan: "Starter", seats: 7, mrr: 490, status: "paused" },
];

const EVENTS = [
  { type: "upgrade", Icon: ArrowUpCircle, label: "Meridian Health upgraded to Enterprise Plus", time: "2 min ago" },
  { type: "new", Icon: Building2, label: "New org onboarded — Stellaris Corp (32 seats)", time: "14 min ago" },
  { type: "warn", Icon: AlertTriangle, label: "Clearwave Media trial expires in 3 days", time: "1 hr ago" },
  { type: "down", Icon: UserMinus, label: "Quantum Labs downgraded — seats reduced 14 → 7", time: "3 hr ago" },
  { type: "success", Icon: CheckCircle, label: "SLA compliance report generated for May 2026", time: "5 hr ago" },
];

const PLAN_DIST = [
  { label: "Enterprise", pct: 42, color: "#2a78d6" },
  { label: "Growth", pct: 35, color: "#1baf7a" },
  { label: "Starter", pct: 23, color: "#eda100" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  return n >= 1_000_000
    ? "$" + (n / 1_000_000).toFixed(2) + "M"
    : "$" + n.toLocaleString("en-US");
}

function fmtK(n) {
  return n >= 1000 ? "$" + (n / 1000).toFixed(0) + "k" : "$" + n;
}

function exportCsv(range, data) {
  const rows = ["period,mrr,tenants", ...data.map((r) => `${r.label},${r.mrr},${r.tenants}`)];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `platform-report-${range}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function KpiCard({ label, value, delta, positive, Icon }) {
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
            positive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          <DeltaIcon className="h-3 w-3" />
          {delta}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    trial: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
    paused: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function EventIcon({ type, Icon }) {
  const map = {
    upgrade: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    new: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    warn: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    down: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  };
  return (
    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${map[type]}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

// Custom tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "mrr" ? `MRR: ${fmt(p.value)}` : `Tenants: ${p.value}`}
        </p>
      ))}
    </div>
  );
}

// Simple SVG donut
function DonutChart() {
  const size = 88;
  const r = 32;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = PLAN_DIST.map(({ pct, color, label }) => {
    const dash = (pct / 100) * circ;
    const gap = circ - dash;
    const el = (
      <circle
        key={label}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
    );
    offset += dash;
    return el;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-muted/20" />
      {slices}
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ReportsPage() {
  const [range, setRange] = useState("7d");
  const [liveMrr, setLiveMrr] = useState(128400);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const appointments = useDb(() => db.all("appointments"));
  const organizations = useDb(() => db.all("organizations"));

  const chartData = RANGES[range].data;

  // Live jitter every 5 s
  useEffect(() => {
    const id = setInterval(() => {
      setLiveMrr((v) => v + Math.round((Math.random() - 0.45) * 300));
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const activeOrgs = organizations.filter(
    (o) => o.status !== "inactive" && o.status !== "rejected"
  ).length;

  const alertCount = EVENTS.filter((e) => e.type === "warn" || e.type === "down").length;

  function handleExport(format) {
    if (format === "csv" || format === "excel") exportCsv(range, chartData);
    if (format === "pdf") window.print();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <PageHeader
            title="Reports"
            subtitle="Platform-wide analytics for all tenants."
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LivePill />

          {/* Range tabs */}
          <div className="flex rounded-md border bg-muted/40 p-0.5 gap-0.5">
            {Object.entries(RANGES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  range === key
                    ? "bg-background shadow-sm text-foreground border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="MRR (live)" value={fmt(liveMrr)} delta="+8.3% vs prior period" positive Icon={DollarSign} />
        <KpiCard label="ARR" value={"$" + (liveMrr * 12 / 1_000_000).toFixed(2) + "M"} delta="+8.3% vs prior period" positive Icon={BarChart3} />
        <KpiCard label="Active tenants" value={activeOrgs || 342} delta="+12 this period" positive Icon={Building2} />
        <KpiCard label="Churn rate" value="1.8%" delta="+0.2pp vs prior period" positive={false} Icon={TrendingDown} />
      </div>

      {/* Chart + right col */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                MRR &amp; tenant growth — {RANGES[range].label}
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm inline-block" style={{ background: "#2a78d6" }} />
                  MRR
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-px w-4 inline-block border-t-2 border-dashed" style={{ borderColor: "#1baf7a" }} />
                  Tenants
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2a78d6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2a78d6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis
                  yAxisId="mrr"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fmtK}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="tenants"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#1baf7a" }}
                  tickLine={false}
                  axisLine={false}
                />
                <RTooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="mrr"
                  type="monotone"
                  dataKey="mrr"
                  stroke="#2a78d6"
                  strokeWidth={2}
                  fill="url(#mrrGrad)"
                  dot={{ r: 3, fill: "#2a78d6", strokeWidth: 2, stroke: "var(--background)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="tenants"
                  type="monotone"
                  dataKey="tenants"
                  stroke="#1baf7a"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: "#1baf7a", strokeWidth: 2, stroke: "var(--background)" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Plan distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <DonutChart />
              <div className="flex flex-col gap-2">
                {PLAN_DIST.map(({ label, pct, color }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                    <span className="text-muted-foreground">{label}</span>
                    <span className="ml-auto font-mono font-medium text-foreground">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {PLAN_DIST.map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="w-8 text-right text-xs font-mono text-muted-foreground">{pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top tenants */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Top tenants by MRR
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Organization</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Seats</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">MRR</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {TOP_TENANTS.map((t, i) => (
                  <tr key={t.name} className={i < TOP_TENANTS.length - 1 ? "border-b" : ""}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{t.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.plan}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{t.seats}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">${t.mrr.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Platform events */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Platform events
              </CardTitle>
              {alertCount > 0 && (
                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                  {alertCount} alerts
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0">
            {EVENTS.map((e, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 py-2.5 ${i < EVENTS.length - 1 ? "border-b" : ""}`}
              >
                <EventIcon type={e.type} Icon={e.Icon} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground leading-snug">{e.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.time}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-right mt-2 font-mono">
              Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
