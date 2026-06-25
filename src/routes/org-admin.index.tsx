import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck,
  Clock,
  Gauge,
  TimerReset,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/")({
  component: OrgDashboard,
});

function OrgDashboard() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const apts = useDb(() =>
    db.all("appointments").filter((a) => a.organization_id === orgId)
  );

  const emps = useDb(() =>
    db.all("employees").filter((e) => e.organization_id === orgId)
  );

  const services = useDb(() =>
    db.all("services").filter((s) => s.organization_id === orgId)
  );

  const today = new Date().toISOString().slice(0, 10);

  const todaysAppts = apts.filter((a) => a.date === today);

  const served = apts.filter((a) => a.status === "completed").length;

  const active = apts.filter(
    (a) => a.status === "confirmed" || a.status === "in_progress"
  ).length;

  const avgWait = 11 + Math.round(apts.length % 9);
  const maxWait = avgWait + 18;

  const queueTrend = Array.from({ length: 12 }).map((_, i) => ({
    t: `${(9 + i).toString().padStart(2, "0")}:00`,
    queue: 3 + Math.round(Math.sin(i / 2) * 4 + Math.random() * 5),
    wait: 8 + Math.round(Math.cos(i / 3) * 6 + Math.random() * 5),
  }));

  const empUtil = emps.slice(0, 8).map((e, i) => ({
    name: e.name.split(" ")[0],
    util: 50 + ((i * 11) % 45),
  }));

  const peakHours = Array.from({ length: 12 }).map((_, i) => ({
    hr: `${(9 + i).toString().padStart(2, "0")}`,
    customers: 5 + Math.round(Math.sin((i - 3) / 2) * 12 + 15),
  }));

  const serviceDist = services.slice(0, 6).map((s) => ({
    name: s.name,
    value: apts.filter((a) => a.service_id === s.id).length,
  }));

  const avgUtil =
    emps.length > 0
      ? Math.round(
          empUtil.reduce((sum, item) => sum + item.util, 0) /
            empUtil.length
        )
      : 0;

  return (
    <div>
      <PageHeader
        title="Organization Dashboard"
        subtitle="Live customer flow and operational insights"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi
          label="Customers Today"
          value={todaysAppts.length}
          icon={Users}
        />
        <Kpi
          label="Customers Served"
          value={served}
          icon={CalendarCheck}
        />
        <Kpi
          label="Active Queue"
          value={active}
          icon={TimerReset}
        />
        <Kpi
          label="Avg Wait Time"
          value={`${avgWait}m`}
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi
          label="Max Wait Time"
          value={`${maxWait}m`}
          icon={Clock}
        />
        <Kpi
          label="Queue Length"
          value={active}
          icon={TimerReset}
        />
        <Kpi
          label="Employee Utilization"
          value={`${avgUtil}%`}
          icon={Gauge}
        />
        <Kpi
          label="Peak Hour"
          value="12:00 PM"
          icon={Clock}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <DashboardCard title="Queue Length Trend">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={queueTrend}>
                <defs>
                  <linearGradient
                    id="queueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.3}
                />

                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="queue"
                  stroke="var(--primary)"
                  fill="url(#queueFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Service Distribution">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={serviceDist}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label
                >
                  {serviceDist.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`var(--chart-${(i % 5) + 1})`}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <DashboardCard title="Wait Time Trend">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={queueTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.3}
                />

                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="wait"
                  stroke="var(--primary)"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Employee Utilization">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={empUtil}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.3}
                />

                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="util"
                  fill="var(--primary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard title="Peak Hour Analysis">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={peakHours}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.3}
                />

                <XAxis dataKey="hr" />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="customers"
                  fill="var(--secondary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}