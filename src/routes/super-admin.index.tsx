import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Building2, ShieldCheck, IndianRupee, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Area,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/")({
  component: Dashboard,
});

const CATEGORY_LABELS: Record<string, string> = {
  hospital: "Hospitals",
  clinic: "Clinics",
  bank: "Banks",
  retail: "Retail",
  support: "Support",
};

const PLAN_PRICES: Record<string, number> = {
  enterprise: 49999,
  growth: 24999,
  starter: 9999,
};

const PLAN_COLORS: Record<string, string> = {
  Enterprise: "#2a78d6",
  Growth: "#1baf7a",
  Starter: "#eda100",
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function fmtK(n: number): string {
  return n >= 1000 ? "$" + (n / 1000).toFixed(0) + "k" : "$" + n;
}

// Deterministic pseudo-random so charts don't jump around on every re-render.
function seededValue(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 999) * 10000;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min));
}

// ── Subscription-changes chart data (moved here from the Subscriptions
// page, which is now a plain report/table with no chart visualizations) ──
const SUBSCRIPTION_CHANGES = [
  { label: "Jan", new: 18, upgrades: 5, downgrades: 2, churned: 1, net: 20 },
  { label: "Feb", new: 22, upgrades: 7, downgrades: 3, churned: 2, net: 24 },
  { label: "Mar", new: 19, upgrades: 4, downgrades: 1, churned: 1, net: 21 },
  { label: "Apr", new: 31, upgrades: 9, downgrades: 4, churned: 3, net: 33 },
  { label: "May", new: 27, upgrades: 6, downgrades: 2, churned: 2, net: 29 },
  { label: "Jun", new: 34, upgrades: 11, downgrades: 3, churned: 1, net: 41 },
];

// ── MRR & tenant growth chart data (moved here from the Reports page,
// which is now a plain report/table with no chart visualizations) ──
const MRR_GROWTH = [
  { label: "W1", mrr: 108000, tenants: 298 },
  { label: "W2", mrr: 114000, tenants: 312 },
  { label: "W3", mrr: 121000, tenants: 328 },
  { label: "W4", mrr: 128400, tenants: 342 },
];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md min-w-[140px]">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-mono font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function Dashboard() {
  const orgs = useDb(() => db.all("organizations"));
  const reqs = useDb(() => db.all("org_requests"));

  const activeOrgs = orgs.filter((o) => o.status === "approved" || o.status === "active").length;
  const pending = reqs.filter((r) => r.status === "pending").length;
  const mrr = orgs.reduce((acc, o) => acc + (PLAN_PRICES[o.plan] ?? PLAN_PRICES.starter), 0);
  const activeRate = orgs.length ? Math.round((activeOrgs / orgs.length) * 100) : 0;

  const byCategory = useMemo(
    () =>
      Object.entries(CATEGORY_LABELS).map(([key, name]) => ({
        name,
        value: orgs.filter((o) => o.category === key).length,
      })),
    [orgs],
  );

  const growth = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        month: new Date(0, i).toLocaleString("en", { month: "short" }),
        orgs: 40 + i * 6 + seededValue(i + 1, -8, 8),
      })),
    [],
  );

  const planDistribution = useMemo(
    () => [
      { name: "Starter", value: orgs.filter((o) => o.plan !== "enterprise" && o.plan !== "professional").length },
      { name: "Growth", value: orgs.filter((o) => o.plan === "professional").length },
      { name: "Enterprise", value: orgs.filter((o) => o.plan === "enterprise").length },
    ],
    [orgs],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Overview" subtitle="Health of the multi-tenant platform across organizations." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Organizations" value={orgs.length} trend="Across all categories" icon={Building2} />
        <Kpi label="Active Organizations" value={activeOrgs} trend={`${activeRate}% of total`} icon={ShieldCheck} />
        <Kpi label="Pending Requests" value={pending} trend="Awaiting review" icon={TrendingUp} />
        <Kpi label="Monthly Revenue" value={inr.format(mrr)} trend="+8% MoM" icon={IndianRupee} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization growth</CardTitle>
          <CardDescription>New organizations onboarded, last 12 months</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <LineChart data={growth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <Tooltip cursor={{ opacity: 0.1 }} />
              <Line type="monotone" dataKey="orgs" name="Organizations" stroke="var(--secondary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* MRR & tenant growth — moved here from Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>MRR &amp; tenant growth</CardTitle>
              <CardDescription>Last 4 weeks, platform-wide</CardDescription>
            </div>
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
        <CardContent className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={MRR_GROWTH} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGradDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2a78d6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2a78d6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis yAxisId="mrr" tickLine={false} axisLine={false} tickFormatter={fmtK} width={48} />
              <YAxis yAxisId="tenants" orientation="right" tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                yAxisId="mrr"
                type="monotone"
                dataKey="mrr"
                name="MRR"
                stroke="#2a78d6"
                strokeWidth={2}
                fill="url(#mrrGradDash)"
                dot={{ r: 3, fill: "#2a78d6", strokeWidth: 2, stroke: "var(--background)" }}
              />
              <Line
                yAxisId="tenants"
                type="monotone"
                dataKey="tenants"
                name="Tenants"
                stroke="#1baf7a"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: "#1baf7a", strokeWidth: 2, stroke: "var(--background)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category mix</CardTitle>
            <CardDescription>Organizations by category</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} orgs`, name]} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, lineHeight: "1.6rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan distribution</CardTitle>
            <CardDescription>Organizations by subscription tier — drives monthly revenue above</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={planDistribution} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ opacity: 0.1 }} formatter={(value: number) => [`${value} orgs`, "Count"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {planDistribution.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscription changes — moved here from Subscriptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Subscription changes</CardTitle>
              <CardDescription>New signups, upgrades, downgrades — last 6 months</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: "#2a78d6" }} />
                New signups
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: "#1baf7a" }} />
                Upgraded plan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: "#eda100" }} />
                Downgraded plan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-4 border-t-2 border-dashed" style={{ borderColor: "#e34948" }} />
                Net change
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={SUBSCRIPTION_CHANGES} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="new" name="New signups" fill="#2a78d6" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="upgrades" name="Upgraded plan" fill="#1baf7a" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="downgrades" name="Downgraded plan" fill="#eda100" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Line
                type="monotone"
                dataKey="net"
                name="Net change"
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
    </div>
  );
}