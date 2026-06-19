import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/reports")({ component: ReportsPage });

const RANGES = ["daily", "weekly", "monthly", "quarterly", "half-yearly", "annual"];

function ReportsPage() {
  const [range, setRange] = useState("monthly");
  const apts = useDb(() => db.all("appointments"));
  const orgs = useDb(() => db.all("organizations"));

  const buckets = range === "daily" ? 7 : range === "weekly" ? 8 : range === "monthly" ? 12 : range === "quarterly" ? 4 : range === "half-yearly" ? 2 : 5;
  const chartData = Array.from({ length: buckets }).map((_, i) => ({
    label: `${range[0].toUpperCase()}${i + 1}`,
    appointments: 40 + Math.floor(Math.random() * 200),
    organizations: 3 + Math.floor(Math.random() * 8),
  }));

  function exportCsv() {
    const rows = ["label,appointments,organizations", ...chartData.map(d => `${d.label},${d.appointments},${d.organizations}`)].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `report-${range}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Platform-wide reports across categories and time ranges."
        actions={<>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()}><Download className="mr-1 h-4 w-4" /> Export PDF</Button>
        </>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total appointments</CardTitle></CardHeader><CardContent><div className="font-display text-3xl font-bold">{apts.length.toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Active organizations</CardTitle></CardHeader><CardContent><div className="font-display text-3xl font-bold">{orgs.filter(o => o.status !== "rejected" && o.status !== "inactive").length}</div></CardContent></Card>
        <Card><CardHeader><CardTitle>Report range</CardTitle></CardHeader><CardContent><div className="font-display text-3xl font-bold capitalize">{range}</div></CardContent></Card>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Trend</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer><BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="label" /><YAxis /><Tooltip />
            <Bar dataKey="appointments" fill="var(--primary)" />
            <Bar dataKey="organizations" fill="var(--secondary)" />
          </BarChart></ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
