import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, Users, Clock, Target, Award } from "lucide-react";

export const Route = createFileRoute("/employee/performance")({ component: PerfPage });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKS  = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
const DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const data: Record<string, { label: string; served: number; rating: number; efficiency: number }[]> = {
  Monthly: MONTHS.map((m, i) => ({ label: m, served: 200 + Math.round(Math.sin(i / 2) * 40 + (i * 3)), rating: +(4.1 + Math.sin(i / 2) * 0.4).toFixed(1), efficiency: 75 + (i % 20) })),
  Weekly:  WEEKS.map((w, i)  => ({ label: w, served: 55  + Math.round(Math.sin(i) * 12 + (i * 2)),        rating: +(4.2 + Math.sin(i) * 0.3).toFixed(1),             efficiency: 78 + (i % 15) })),
  Daily:   DAYS.map((d, i)   => ({ label: d, served: 30  + Math.round(Math.sin(i) * 8 + (i * 1)),         rating: +(4.3 + Math.sin(i) * 0.2).toFixed(1),             efficiency: 80 + (i % 12) })),
};

const GOAL = 300;
const DONE = 234;
const pct  = Math.round((DONE / GOAL) * 100);
const R    = 54;
const CIRC = 2 * Math.PI * R;
const dash = (pct / 100) * CIRC;

const attendance = [
  { label: "Present",  value: 22, color: "bg-emerald-500" },
  { label: "Absent",   value: 2,  color: "bg-red-400"     },
  { label: "Half Day", value: 1,  color: "bg-amber-400"   },
  { label: "Leave",    value: 1,  color: "bg-blue-400"    },
];

const FILTERS = ["Monthly", "Weekly", "Daily"];

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color} text-white shadow-sm`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
          <div className="mt-0.5 text-2xl font-bold">{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function PerfPage() {
  const [filter, setFilter] = useState("Monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const d = data[filter];

  return (
    <div className="space-y-6">
      <PageHeader title="Performance" subtitle="Your service trends and analytics." />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="h-8" onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users}     label="Patients Served"       value="2,847"   sub="This year"        color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatCard icon={Clock}     label="Avg Consultation"      value="14 min"  sub="Goal: 15 min"     color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard icon={Star}      label="Avg Patient Rating"    value="4.8 / 5" sub="Top 10%"          color="bg-gradient-to-br from-purple-500 to-purple-600" />
        <StatCard icon={Target}    label="Monthly Goal"          value={`${pct}%`} sub={`${DONE} / ${GOAL}`} color="bg-gradient-to-br from-amber-500 to-amber-600" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly goal donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Monthly Goal Progress</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center py-4 gap-4">
            <div className="relative">
              <svg width={160} height={160} className="-rotate-90">
                <circle cx={80} cy={80} r={R} fill="none" stroke="var(--muted)" strokeWidth={16} />
                <circle cx={80} cy={80} r={R} fill="none" stroke="var(--primary)" strokeWidth={16}
                  strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">{pct}%</div>
                <div className="text-xs text-muted-foreground">{DONE} / {GOAL}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/30 border hover:bg-primary/10">Completed: {DONE}</Badge>
              <Badge variant="outline">Target: {GOAL}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance over time */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Performance Over Time</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <LineChart data={d}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="served" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Patients served bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Patients Served</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={d}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="served" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ratings trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Ratings Trend</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <LineChart data={d}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[3.5, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Queue Efficiency */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Queue Efficiency (%)</CardTitle></CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer>
            <BarChart data={d}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v: any) => [`${v}%`, "Efficiency"]} />
              <Bar dataKey="efficiency" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attendance + Shift */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Attendance Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {attendance.map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${a.color}`} />
                <span className="flex-1 text-sm">{a.label}</span>
                <span className="font-semibold">{a.value} days</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${a.color}`} style={{ width: `${(a.value / 26) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Shift Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Current Shift",   value: "Morning (09:00 – 17:00)" },
              { label: "Shift Type",      value: "Fixed" },
              { label: "Weekly Off",      value: "Sunday" },
              { label: "Break",           value: "13:00 – 13:30" },
              { label: "Avg Consultation",value: "14 min" },
              { label: "On-time Rate",    value: "94%" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
