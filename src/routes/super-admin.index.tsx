import { createFileRoute } from "@tanstack/react-router";
import { Building2, ShieldCheck, IndianRupee } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/")({
  component: Dashboard,
});

function Dashboard() {
  const orgs = useDb(() => db.all("organizations"));
  const reqs = useDb(() => db.all("org_requests"));
  const audit = useDb(() => db.all("audit_logs"));

  const activeOrgs = orgs.filter(o => o.status === "approved" || o.status === "active").length;
  const pending = reqs.filter(r => r.status === "pending").length;
  const mrr = orgs.reduce((acc, o) => acc + (o.plan === "enterprise" ? 49999 : o.plan === "professional" ? 24999 : 9999), 0);

  const byCategory = ["hospital", "clinic", "bank", "retail", "support"].map(c => ({ name: c, value: orgs.filter(o => o.category === c).length }));
  const growth = Array.from({ length: 12 }).map((_, i) => ({
    month: new Date(0, i).toLocaleString("en", { month: "short" }),
    orgs: Math.floor(40 + i * 6 + Math.sin(i) * 8),
  }));
  const activity = Array.from({ length: 7 }).map((_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    appts: 80 + Math.floor(Math.random() * 60),
  }));

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="Health of the multi-tenant platform across organizations." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Organizations" value={orgs.length} trend={`+${pending} pending`} icon={Building2} />
        <Kpi label="Pending Requests" value={pending} icon={ShieldCheck} />
        <Kpi label="Active Organizations" value={activeOrgs} icon={Building2} />
        <Kpi label="Monthly Revenue" value={`₹${(mrr / 100000).toFixed(1)}L`} trend="+8% MoM" icon={IndianRupee} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Platform activity (last 7 days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><BarChart data={activity}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="day" /><YAxis /><Tooltip />
              <Bar dataKey="appts" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Category distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer><PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                {byCategory.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
              </Pie><Tooltip />
            </PieChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Organization growth (last 12 months)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer><LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="month" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="orgs" stroke="var(--secondary)" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activities</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {audit.slice(0, 6).map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1"><div className="font-medium">{a.action} · {a.entity}</div><div className="text-xs text-muted-foreground">{a.user_name} · {new Date(a.created_at).toLocaleString()}</div></div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
