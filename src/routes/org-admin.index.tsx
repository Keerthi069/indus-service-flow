import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  CalendarCheck,
  RefreshCw,
  Clock,
  Timer,
  ListOrdered,
  Gauge,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  db,
  useDb,
  useHydrated,
  normalizeCategoryKey,
  computeEmployeeUtilizationPct,
  fmt12,
  CATEGORY_LABELS,
  type Appointment,
  type Employee,
} from "@/lib/mock/db";

export const Route = createFileRoute("/org-admin/")({
  component: OrgAdminDashboard,
});

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  fontSize: 12,
};

// Rotating palette for however many distinct services an org happens to
// have today — services aren't a fixed enum like appointment status, so
// colors are assigned by position rather than a lookup table.
const SERVICE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Cap how many individual slices render — beyond this, a donut of 8+ thin
// slivers becomes unreadable regardless of labeling. Anything past the top
// 5 services (by today's volume) rolls up into a single "Other" slice.
const MAX_SERVICE_SLICES = 5;

// 2-hour buckets spanning a normal service-business day. Shared by the
// Customer Flow chart below so "booked" and "served" line up on the same
// x-axis as the rest of the day-shaped charts.
const HOUR_BUCKETS = [
  { label: "6-8 AM", startHour: 6 },
  { label: "8-10 AM", startHour: 8 },
  { label: "10-12 PM", startHour: 10 },
  { label: "12-2 PM", startHour: 12 },
  { label: "2-4 PM", startHour: 14 },
  { label: "4-6 PM", startHour: 16 },
  { label: "6-8 PM", startHour: 18 },
  { label: "8-10 PM", startHour: 20 },
];

function bucketIndexForHour(hour: number) {
  let idx = HOUR_BUCKETS.findIndex(
    (b, i) => hour >= b.startHour && (i === HOUR_BUCKETS.length - 1 || hour < HOUR_BUCKETS[i + 1].startHour)
  );
  return idx === -1 ? HOUR_BUCKETS.length - 1 : idx;
}

// Fixed wait-time histogram buckets (minutes). Distinct from the "Avg Wait
// Time" trend line — this shows the *shape* of today's wait times (how many
// people waited how long) rather than an hour-by-hour average, which is
// exactly what backs the "Max Wait Time" KPI.
const WAIT_BUCKETS = [
  { label: "0-5m", min: 0, max: 5 },
  { label: "5-10m", min: 5, max: 10 },
  { label: "10-15m", min: 10, max: 15 },
  { label: "15-20m", min: 15, max: 20 },
  { label: "20-30m", min: 20, max: 30 },
  { label: "30m+", min: 30, max: Infinity },
];

// Queue-entry status → label/color, mirrors the pattern used for
// appointment statuses elsewhere in the portal so an unrecognized status
// still renders sensibly instead of crashing.
const QUEUE_STATUS_META: Record<string, { label: string; color: string }> = {
  waiting: { label: "Waiting", color: "var(--chart-3)" },
  serving: { label: "Serving", color: "var(--primary)" },
  completed: { label: "Completed", color: "var(--chart-4)" },
  cancelled: { label: "Cancelled", color: "var(--destructive)" },
  no_show: { label: "No Show", color: "var(--muted-foreground)" },
};

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="mt-2 text-2xl font-bold">{value}</h3>
      </CardContent>
    </Card>
  );
}

// Renders outside the donut, connected by a thin line, in a theme-aware
// color (Recharts' default label fill is black, invisible on a dark card).
function ServiceDistributionLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, value } = props;
  if (!value) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fill="hsl(var(--foreground))"
      fontSize={11}
      fontWeight={500}
    >
      {value} · {Math.round(percent * 100)}%
    </text>
  );
}

function OrgAdminDashboard() {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const today = new Date().toISOString().slice(0, 10);

  const org = useDb(() => db.all("organizations").find((o: any) => o.id === user?.organization_id));

  const employees = useDb(() =>
    db.all("employees").filter((e: Employee) => e.organization_id === user?.organization_id)
  );

  const services = useDb(() => db.all("services").filter((s: any) => s.organization_id === user?.organization_id));

  // Every appointment ever booked for this org — used for the all-time
  // Peak Hour Analysis, which reads as a genuine historical pattern rather
  // than a single day's thin sample.
  const allAppointments = useDb(() =>
    db.all("appointments").filter((a: Appointment) => a.organization_id === user?.organization_id)
  );

  const queueEntries = useDb(() =>
    db.all("queue").filter((q: any) => q.organization_id === user?.organization_id)
  );

  const queueStatsToday = useDb(() =>
    db
      .all("queue_stats")
      .filter((q: any) => q.organization_id === user?.organization_id && q.date === today)
  );

  const appointmentsToday = allAppointments.filter((a) => a.date === today);

  const categoryKey = normalizeCategoryKey((org as any)?.category);
  const labels = CATEGORY_LABELS[categoryKey] ?? CATEGORY_LABELS.default;

  // ---- KPI row 1 ----
  const uniqueCustomersToday = new Set(appointmentsToday.map((a) => a.customer_id)).size;
  const servedToday = appointmentsToday.filter((a) => a.status === "completed").length;
  const activeQueueCount = queueEntries.filter((q: any) => q.status === "waiting" || q.status === "serving").length;

  const waitMinutesToday = queueEntries.map((q: any) => q.wait_minutes as number);
  const avgWaitMinutes = waitMinutesToday.length
    ? Math.round(waitMinutesToday.reduce((s, v) => s + v, 0) / waitMinutesToday.length)
    : 0;

  // ---- KPI row 2 ----
  const maxWaitMinutes = waitMinutesToday.length ? Math.max(...waitMinutesToday) : 0;
  const queueLength = queueEntries.filter((q: any) => q.status === "waiting").length;

  const utilizationByEmployee = employees
    .filter((e) => e.status === "active")
    .map((e) => {
      const empApptsToday = appointmentsToday.filter((a) => a.employee_id === e.id);
      const pct = computeEmployeeUtilizationPct(e, empApptsToday, services, org as any);
      return { name: e.name.split(" ")[0], util: pct ?? 0 };
    });

  const avgUtilization = utilizationByEmployee.length
    ? Math.round(utilizationByEmployee.reduce((s, e) => s + e.util, 0) / utilizationByEmployee.length)
    : 0;

  // Peak hour across the org's entire appointment history, not just today —
  // a genuine recurring pattern rather than one day's thin sample.
  const hourCounts = new Map<number, number>();
  allAppointments.forEach((a) => {
    const hour = Number(a.time.split(":")[0]);
    if (!Number.isNaN(hour)) hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  });
  let peakHour = 12;
  let peakCount = -1;
  hourCounts.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  });
  const peakHourLabel = fmt12(peakHour * 60).replace(":00", "");

  const stats = [
    { title: `${labels.entityPlural} Today`, value: uniqueCustomersToday, icon: Users },
    { title: `${labels.entityPlural} Served`, value: servedToday, icon: CalendarCheck },
    { title: "Active Queue", value: activeQueueCount, icon: RefreshCw },
    { title: "Avg Wait Time", value: `${avgWaitMinutes}m`, icon: Clock },
    { title: "Max Wait Time", value: `${maxWaitMinutes}m`, icon: Timer },
    { title: "Queue Length", value: queueLength, icon: ListOrdered },
    { title: "Employee Utilization", value: `${avgUtilization}%`, icon: Gauge },
    { title: "Peak Hour", value: peakHourLabel, icon: TrendingUp },
  ];

  // ---- Chart data ----
  const trendData = [...queueStatsToday]
    .sort((a: any, b: any) => a.hour - b.hour)
    .map((q: any) => ({
      hour: `${q.hour.toString().padStart(2, "0")}:00`,
      queueLength: q.queue_length,
      waitMinutes: q.avg_wait_minutes,
    }));

  // Distribution of TODAY's appointments across the org's actual services
  // (e.g. "Cardiology Consult", "Loan Counselling") — not by appointment
  // status. Counts are grouped by `service_name`, sorted highest-first, and
  // capped at MAX_SERVICE_SLICES so an org with many services doesn't end
  // up with a dozen unreadable slivers; anything past the top slice count
  // rolls into a single "Other" bucket.
  const serviceCounts = new Map<string, number>();
  appointmentsToday.forEach((a) => {
    const name = a.service_name || "Unspecified";
    serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
  });

  const sortedServiceCounts = Array.from(serviceCounts.entries()).sort((a, b) => b[1] - a[1]);

  const topServiceCounts = sortedServiceCounts.slice(0, MAX_SERVICE_SLICES);
  const otherTotal = sortedServiceCounts
    .slice(MAX_SERVICE_SLICES)
    .reduce((sum, [, count]) => sum + count, 0);

  const serviceDistribution = [
    ...topServiceCounts.map(([name, value], i) => ({
      name,
      value,
      color: SERVICE_CHART_COLORS[i % SERVICE_CHART_COLORS.length],
    })),
    ...(otherTotal > 0
      ? [{ name: "Other", value: otherTotal, color: "var(--muted-foreground)" }]
      : []),
  ];

  const peakHourChartData = Array.from(hourCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({ hour: hour.toString().padStart(2, "0"), count }));
  const peakHourChartMax = peakHourChartData.length
    ? Math.max(...peakHourChartData.map((p) => p.count))
    : 0;

  // Customer Flow by Hour — backs the "{Entity}s Today" and "{Entity}s
  // Served" KPIs together: how many appointments were booked vs. actually
  // completed within each 2-hour window today. Distinct from Peak Hour
  // Analysis (all-time, single series) and from the queue trend charts
  // (which track queue *state*, not appointment volume).
  const customerFlowData = HOUR_BUCKETS.map((b) => ({ hour: b.label, booked: 0, served: 0 }));
  appointmentsToday.forEach((a) => {
    const hour = Number(a.time.split(":")[0]);
    if (Number.isNaN(hour)) return;
    const idx = bucketIndexForHour(hour);
    customerFlowData[idx].booked += 1;
    if (a.status === "completed") customerFlowData[idx].served += 1;
  });

  // Wait Time Distribution — backs "Max Wait Time". A histogram shows the
  // shape of today's waits (a handful of long outliers vs. a uniformly
  // slow queue look identical on an average-only trend line, but very
  // different here).
  const waitDistributionData = WAIT_BUCKETS.map((b) => ({
    label: b.label,
    count: waitMinutesToday.filter((m) => m >= b.min && m < b.max).length,
    isMaxBucket: maxWaitMinutes >= b.min && maxWaitMinutes < b.max,
  }));

  // Queue Status Breakdown — backs "Active Queue" and "Queue Length" with
  // a categorical snapshot (how the queue is composed right now) rather
  // than a time trend. Rendered as a single horizontal stacked bar so it
  // reads distinctly from the donut (Service Distribution) and the two
  // area trend charts elsewhere on this page.
  const queueStatusCounts = new Map<string, number>();
  queueEntries.forEach((q: any) => {
    queueStatusCounts.set(q.status, (queueStatusCounts.get(q.status) ?? 0) + 1);
  });
  const queueStatusKeys = Array.from(queueStatusCounts.keys());
  const queueStatusRow = [
    {
      name: "Queue",
      ...Object.fromEntries(queueStatusKeys.map((k) => [k, queueStatusCounts.get(k) ?? 0])),
    },
  ];
  const queueTotal = queueEntries.length;

  if (!hydrated) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Organization Dashboard"
        subtitle="Live customer flow and operational insights"
      />

      {!org && (
        <p className="mb-4 text-xs text-red-700 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          No organization record found for this account — stats below are showing empty/default
          values.
        </p>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.slice(0, 4).map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.slice(4).map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Queue Length Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="queueLengthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="60%" stopColor="var(--primary)" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "In queue"]} cursor={{ stroke: "var(--primary)", strokeOpacity: 0.15, strokeWidth: 24 }} />
                <Area
                  type="natural"
                  dataKey="queueLength"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#queueLengthGradient)"
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--primary)" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Distribution</CardTitle>
            <CardDescription>Today's appointments by service</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {serviceDistribution.length ? (
              <ResponsiveContainer>
                <PieChart margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                  <Pie
                    data={serviceDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    cornerRadius={4}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                    label={ServiceDistributionLabel}
                    labelLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  >
                    {serviceDistribution.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v} appts`, n]} />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No appointments scheduled today
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wait Time Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="waitTimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.4} />
                    <stop offset="60%" stopColor="var(--secondary)" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}m`, "Avg wait"]} cursor={{ stroke: "var(--secondary)", strokeOpacity: 0.15, strokeWidth: 24 }} />
                <Area
                  type="natural"
                  dataKey="waitMinutes"
                  stroke="var(--secondary)"
                  strokeWidth={2.5}
                  fill="url(#waitTimeGradient)"
                  dot={{ r: 3, strokeWidth: 0, fill: "var(--secondary)" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {utilizationByEmployee.length ? (
              <ResponsiveContainer>
                <BarChart data={utilizationByEmployee} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} width={28} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Utilization"]} cursor={{ fill: "var(--primary)", fillOpacity: 0.06 }} />
                  {avgUtilization > 0 && (
                    <ReferenceLine
                      y={avgUtilization}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{ value: `avg ${avgUtilization}%`, position: "right", fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                  )}
                  <Bar dataKey="util" radius={[6, 6, 0, 0]} barSize={36}>
                    {utilizationByEmployee.map((e, i) => (
                      <Cell
                        key={i}
                        fill={e.util >= 85 ? "var(--chart-4)" : e.util >= 50 ? "var(--primary)" : "var(--chart-3)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No active staff to report on
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hour Analysis</CardTitle>
            <CardDescription>All-time appointment volume by hour</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={peakHourChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} appts`, "Volume"]} cursor={{ fill: "var(--chart-2)", fillOpacity: 0.08 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {peakHourChartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill="var(--chart-2)"
                      fillOpacity={d.count === peakHourChartMax && peakHourChartMax > 0 ? 1 : 0.45}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Customer Flow by Hour</CardTitle>
            <CardDescription>Booked vs. served today</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {appointmentsToday.length ? (
              <ResponsiveContainer>
                <BarChart data={customerFlowData} barGap={4} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis dataKey="hour" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    verticalAlign="top"
                    height={24}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>{value}</span>
                    )}
                  />
                  <Bar dataKey="booked" name="Booked" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="served" name="Served" fill="var(--chart-4)" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No appointments scheduled today
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wait Time Distribution</CardTitle>
            <CardDescription>How long people are actually waiting</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {waitMinutesToday.length ? (
              <ResponsiveContainer>
                <BarChart data={waitDistributionData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} people`, "Count"]} cursor={{ fill: "var(--chart-5)", fillOpacity: 0.08 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                    {waitDistributionData.map((d, i) => (
                      <Cell key={i} fill="var(--chart-5)" fillOpacity={d.isMaxBucket ? 1 : 0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No queue activity to report on
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue Status Breakdown</CardTitle>
            <CardDescription>Current composition of the queue</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {queueTotal ? (
              <div className="flex h-full flex-col justify-center gap-4">
                <ResponsiveContainer height={64}>
                  <BarChart
                    data={queueStatusRow}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide domain={[0, queueTotal]} />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip contentStyle={tooltipStyle} />
                    {queueStatusKeys.map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={QUEUE_STATUS_META[key]?.label ?? key}
                        stackId="queue"
                        fill={QUEUE_STATUS_META[key]?.color ?? "var(--muted-foreground)"}
                        radius={0}
                        barSize={40}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  {queueStatusKeys.map((key) => {
                    const count = queueStatusCounts.get(key) ?? 0;
                    return (
                      <span key={key} className="flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: QUEUE_STATUS_META[key]?.color ?? "var(--muted-foreground)" }}
                        />
                        {QUEUE_STATUS_META[key]?.label ?? key}
                        <span className="font-medium text-foreground">
                          {count} ({queueTotal ? Math.round((count / queueTotal) * 100) : 0}%)
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Queue is empty
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}