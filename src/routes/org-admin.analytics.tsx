import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/org-admin/analytics")({ component: AnalyticsPage });

const peak = Array.from({ length: 12 }).map((_, i) => ({ hr: `${(9 + i).toString().padStart(2, "0")}`, customers: 6 + Math.round(Math.sin((i - 3) / 2) * 14 + 15) }));
const bottleneck = ["Reception", "Cardiology", "Billing", "Diagnostic", "Pharmacy"].map((s, i) => ({ stage: s, wait: 5 + i * 4 + Math.round(Math.random() * 6) }));
const staffing = Array.from({ length: 7 }).map((_, i) => ({ day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], required: 8 + Math.round(Math.random() * 6), available: 7 + Math.round(Math.random() * 4) }));
const wait = Array.from({ length: 14 }).map((_, i) => ({ day: `D${i + 1}`, avg: 8 + Math.round(Math.sin(i / 2) * 5 + Math.random() * 4) }));
const capacity = Array.from({ length: 12 }).map((_, i) => ({ month: new Date(0, i).toLocaleString("en", { month: "short" }), demand: 100 + i * 15, capacity: 130 + i * 8 }));

function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Operational analytics: peaks, bottlenecks, capacity and staffing." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Peak hour analysis</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><BarChart data={peak}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="hr" /><YAxis /><Tooltip /><Bar dataKey="customers" fill="var(--primary)" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Queue bottleneck analysis</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><BarChart layout="vertical" data={bottleneck}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis type="number" /><YAxis dataKey="stage" type="category" width={80} /><Tooltip /><Bar dataKey="wait" fill="var(--secondary)" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Resource allocation</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><BarChart data={staffing}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="required" fill="var(--primary)" /><Bar dataKey="available" fill="var(--secondary)" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Staffing efficiency</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><LineChart data={staffing}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line dataKey="required" stroke="var(--primary)" /><Line dataKey="available" stroke="var(--secondary)" /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Wait time trend</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><AreaChart data={wait}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="day" /><YAxis /><Tooltip /><Area type="monotone" dataKey="avg" stroke="var(--primary)" fill="color-mix(in oklab, var(--primary) 25%, transparent)" /></AreaChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Capacity planning</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><LineChart data={capacity}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line dataKey="demand" stroke="var(--primary)" strokeWidth={2} /><Line dataKey="capacity" stroke="var(--secondary)" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
      </div>
    </div>
  );
}
