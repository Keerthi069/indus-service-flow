import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/employee/performance")({ component: PerfPage });

const rating = Array.from({ length: 12 }).map((_, i) => ({ w: `W${i + 1}`, r: +(4 + Math.sin(i / 2) * 0.4).toFixed(2) }));
const service = Array.from({ length: 12 }).map((_, i) => ({ w: `W${i + 1}`, n: 30 + Math.floor(Math.random() * 25) }));
const volume = Array.from({ length: 12 }).map((_, i) => ({ w: `W${i + 1}`, c: 40 + Math.floor(Math.random() * 30) }));

function PerfPage() {
  return (
    <div>
      <PageHeader title="Performance" subtitle="Your service trends over the last 12 weeks." />
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi label="Avg rating" value="4.6 / 5" />
        <Kpi label="Customers served" value="412" />
        <Kpi label="On-time %" value="92%" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Rating trend</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer><LineChart data={rating}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="w" /><YAxis domain={[3, 5]} /><Tooltip /><Line dataKey="r" stroke="var(--primary)" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Service trend</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer><LineChart data={service}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="w" /><YAxis /><Tooltip /><Line dataKey="n" stroke="var(--secondary)" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Customer volume</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer><LineChart data={volume}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="w" /><YAxis /><Tooltip /><Line dataKey="c" stroke="var(--chart-3)" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
      </div>
    </div>
  );
}
