import { createFileRoute } from "@tanstack/react-router";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/employee/performance")({ component: PerfPage });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const served = [240, 255, 248, 260, 245, 250, 247, 258, 252, 263, 195, 180];
const ratings = [4.3, 4.6, 4.4, 4.3, 4.5, 4.3, 4.3, 4.3, 4.5, 4.3, 4.6, 4.5];

const servedData = MONTHS.map((m, i) => ({ m, served: served[i] }));
const ratingData = MONTHS.map((m, i) => ({ m, rating: ratings[i] }));
const perfData = MONTHS.map((m, i) => ({ m, served: served[i] }));

const GOAL = 300;
const DONE = 234;
const pct = Math.round((DONE / GOAL) * 100);
const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;
const dash = (pct / 100) * CIRC;

function PerfPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Performance" subtitle="Your service trends over the last 12 months." />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly goal donut */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Monthly goal</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="relative">
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth={14} />
                <circle
                  cx={70} cy={70} r={RADIUS} fill="none"
                  stroke="var(--primary)" strokeWidth={14}
                  strokeDasharray={`${dash} ${CIRC}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <div className="text-3xl font-bold">{pct}%</div>
                <div className="text-xs text-muted-foreground">Of {GOAL} patients</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance over time */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Performance over time</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 300]} />
                <Tooltip formatter={(v: any) => [`served : ${v}`, ""]} />
                <Line type="monotone" dataKey="served" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patients served bar */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Patients served</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={servedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 280]} />
                <Tooltip />
                <Bar dataKey="served" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ratings trend */}
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Ratings trend</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <LineChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[3.5, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(217, 91%, 60%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
