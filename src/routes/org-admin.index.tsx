import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Clock, Gauge, TimerReset, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/")({ component: OrgDashboard });

function OrgDashboard() {
  const { user } = useAuth();
  const orgId = user?.organization_id;
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === orgId));
  const emps = useDb(() => db.all("employees").filter(e => e.organization_id === orgId));
  const services = useDb(() => db.all("services").filter(s => s.organization_id === orgId));

  const today = new Date().toISOString().slice(0, 10);
  const todaysAppts = apts.filter(a => a.date === today);
  const served = apts.filter(a => a.status === "completed").length;
  const active = apts.filter(a => a.status === "confirmed" || a.status === "in_progress").length;
  const avgWait = 11 + Math.round((apts.length % 9));
  const maxWait = avgWait + 18;

  const queueTrend = Array.from({ length: 12 }).map((_, i) => ({ t: `${(9 + i).toString().padStart(2, "0")}:00`, queue: 3 + Math.round(Math.sin(i / 2) * 4 + Math.random() * 5), wait: 8 + Math.round(Math.cos(i / 3) * 6 + Math.random() * 5) }));
  const empUtil = emps.slice(0, 8).map((e, i) => ({ name: e.name.split(" ")[0], util: 50 + ((i * 11) % 45) }));
  const peakHours = Array.from({ length: 12 }).map((_, i) => ({ hr: `${(9 + i).toString().padStart(2, "0")}`, customers: 5 + Math.round(Math.sin((i - 3) / 2) * 12 + 15) }));
  const serviceDist = services.slice(0, 6).map(s => ({ name: s.name, value: apts.filter(a => a.service_id === s.id).length }));

  return (
    <div>
      <PageHeader title="Organization dashboard" subtitle="Live operational view of your branch." />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Customers Today" value={todaysAppts.length} icon={Users} />
        <Kpi label="Customers Served" value={served} icon={CalendarCheck} />
        <Kpi label="Active Queue" value={active} icon={TimerReset} />
        <Kpi label="Avg Wait Time" value={`${avgWait}m`} icon={Clock} />
        <Kpi label="Max Wait Time" value={`${maxWait}m`} icon={Clock} />
        <Kpi label="Queue Length" value={active} icon={TimerReset} />
        <Kpi label="Employee Utilization" value={`${emps.length ? Math.round(empUtil.reduce((a, b) => a + b.util, 0) / empUtil.length) : 0}%`} icon={Gauge} />
        <Kpi label="Peak Hour" value="12:00 - 14:00" icon={Clock} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Queue length trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><AreaChart data={queueTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="t" /><YAxis /><Tooltip />
              <Area type="monotone" dataKey="queue" stroke="var(--primary)" fill="color-mix(in oklab, var(--primary) 25%, transparent)" />
            </AreaChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Wait time trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><AreaChart data={queueTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="t" /><YAxis /><Tooltip />
              <Area type="monotone" dataKey="wait" stroke="var(--secondary)" fill="color-mix(in oklab, var(--secondary) 25%, transparent)" />
            </AreaChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Employee utilization</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={empUtil}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" /><YAxis unit="%" /><Tooltip />
              <Bar dataKey="util" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Peak hour analysis</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="hr" /><YAxis /><Tooltip />
              <Bar dataKey="customers" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Service distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><PieChart>
              <Pie data={serviceDist} dataKey="value" nameKey="name" outerRadius={100} label>
                {serviceDist.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
              </Pie><Tooltip />
            </PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
