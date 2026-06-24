import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, Star, Users, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/")({ component: EmpDash });

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const STATUS_STYLE: Record<string, string> = {
  confirmed:   "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  in_progress: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  completed:   "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  cancelled:   "bg-red-50 text-red-500 border-red-200 dark:bg-red-950 dark:text-red-300",
  rescheduled: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Upcoming", in_progress: "In Service",
  completed: "Completed", cancelled: "Cancelled", rescheduled: "Rescheduled",
};

function KpiCard({ label, value, sub, trend, icon: Icon, gradient }: {
  label: string; value: string | number; sub?: string;
  trend?: "up" | "down" | "neutral"; icon: any; gradient: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <CardContent className="relative p-5 flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          {sub && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
              {sub}
            </div>
          )}
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-xl ${gradient} text-white shadow-sm`}>
          <Icon className="h-6 w-6" />
        </span>
      </CardContent>
    </Card>
  );
}

const handleFilters = ["Today", "Week", "Month"];

const handleDataMap: Record<string, { t: string; min: number }[]> = {
  Today: Array.from({ length: 9 }, (_, i) => ({
    t: `${(9 + i).toString().padStart(2, "0")}:00`,
    min: 8 + Math.round(Math.sin(i / 1.5) * 6 + (i % 3)),
  })),
  Week: Array.from({ length: 7 }, (_, i) => ({
    t: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    min: 10 + Math.round(Math.sin(i) * 5 + (i % 4)),
  })),
  Month: Array.from({ length: 4 }, (_, i) => ({
    t: `Week ${i + 1}`,
    min: 11 + Math.round(Math.sin(i) * 3 + (i % 2)),
  })),
};

function EmpDash() {
  const { user } = useAuth();
  const org = useDb(() => db.all("organizations").find(o => o.id === user?.organization_id));
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === user?.organization_id));
  const today = new Date().toISOString().slice(0, 10);
  const todays = apts.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const served = todays.filter(a => a.status === "completed").length || 28;
  const waiting = todays.filter(a => a.status === "confirmed").length || 6;

  const [handleFilter, setHandleFilter] = useState("Today");
  const [schedDate, setSchedDate] = useState(today);
  const schedApts = apts.filter(a => a.date === schedDate).sort((a, b) => a.time.localeCompare(b.time));

  const firstName = user?.name.includes("Dr.")
    ? user.name.split(" ").slice(0, 2).join(" ")
    : user?.name.split(" ")[0] ?? "Doctor";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{getGreeting()}, {firstName} 👋</h1>
            <p className="mt-1 text-sm text-primary-foreground/80">Here's your day at a glance</p>
            {org && <p className="mt-0.5 text-xs text-primary-foreground/60">{org.name} · {org.city}</p>}
          </div>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Patients Served Today" value={served} sub="+4 vs yesterday" trend="up" icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <KpiCard label="Avg Handle Time" value="12m" sub="On target · Goal 15m" trend="up" icon={Clock} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
        <KpiCard label="Patients Waiting" value={waiting} sub={org ? `Queue · ${org.name.slice(0, 10)}` : "Queue General-A"} trend="neutral" icon={Users} gradient="bg-gradient-to-br from-amber-500 to-amber-600" />
        <KpiCard label="Patient Rating" value="4.8 / 5" sub="Top 10% this month" trend="up" icon={Star} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Handle Time Chart */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Today's Handle Time</CardTitle>
            <div className="flex gap-1">
              {handleFilters.map(f => (
                <Button
                  key={f} size="sm" variant={handleFilter === f ? "default" : "ghost"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setHandleFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <AreaChart data={handleDataMap[handleFilter]}>
                <defs>
                  <linearGradient id="handleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" m" />
                <Tooltip formatter={(v: any) => [`${v} min`, "Handle Time"]} />
                <Area type="monotone" dataKey="min" stroke="var(--primary)" fill="url(#handleGrad)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Today's Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="date"
                value={schedDate}
                onChange={e => setSchedDate(e.target.value)}
                className="h-7 rounded-md border border-border bg-background px-2 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {schedApts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No appointments for this date.
              </div>
            ) : schedApts.slice(0, 8).map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{a.time} · {a.service_name}</div>
                </div>
                <Badge variant="outline" className={`text-[10px] border shrink-0 ${STATUS_STYLE[a.status] || ""}`}>
                  {STATUS_LABEL[a.status] || a.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completed", value: todays.filter(a => a.status === "completed").length || 28, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
          { label: "Pending", value: todays.filter(a => a.status === "confirmed").length || 6, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
          { label: "Cancelled", value: todays.filter(a => a.status === "cancelled").length || 2, color: "text-red-500 bg-red-50 dark:bg-red-950" },
          { label: "Avg Consultation", value: "14 min", color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className={`p-4 rounded-xl ${s.color}`}>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-70">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div> */}
    </div>
  );
}
