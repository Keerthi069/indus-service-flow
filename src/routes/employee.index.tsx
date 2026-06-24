import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Star, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/")({ component: EmpDash });

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function KpiCard({ label, value, sub, icon: Icon, color = "text-primary" }: { label: string; value: string | number; sub?: string; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
          <div className="mt-2 text-3xl font-bold">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-full bg-primary/10 ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function EmpDash() {
  const { user } = useAuth();
  const org = useDb(() => db.all("organizations").find(o => o.id === user?.organization_id));
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === user?.organization_id));
  const today = new Date().toISOString().slice(0, 10);
  const todays = apts.filter(a => a.date === today);
  const served = todays.filter(a => a.status === "completed").length;
  const waiting = todays.filter(a => a.status === "confirmed").length;

  const handleData = Array.from({ length: 9 }).map((_, i) => ({
    t: `${(9 + i).toString().padStart(2, "0")}:00`,
    min: 8 + Math.round(Math.sin(i / 1.5) * 6 + Math.random() * 4),
  }));

  const schedule = todays.slice(0, 5).map((a, i) => ({ no: i + 1, time: a.time, label: a.service_name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{getGreeting()}, {user?.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your day at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Patients Served Today" value={served || 28} sub="+4 vs avg" icon={CheckCircle2} color="text-primary" />
        <KpiCard label="Avg Handle Time" value="12m" sub="On target" icon={Clock} color="text-primary" />
        <KpiCard label="Patients Waiting" value={waiting || 6} sub={org ? `Queue ${org.name.slice(0, 8)}` : "Queue General-A"} icon={Users} color="text-primary" />
        <KpiCard label="Patient Rating" value="4.8" sub="Top 10%" icon={Star} color="text-primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Today's handle time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={handleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="min" stroke="var(--primary)" fill="color-mix(in oklab, var(--primary) 20%, transparent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Today's schedule</CardTitle></CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No appointments today.</div>
            ) : (
              <ul className="space-y-2">
                {schedule.map(s => (
                  <li key={s.no} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{s.no}</span>
                    <span className="text-sm font-medium">{s.time} – {s.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
