import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/reports")({ component: OrgReportsPage });
const RANGES = ["daily", "weekly", "monthly", "quarterly", "half-yearly", "annual"];

function OrgReportsPage() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === orgId));
  const [range, setRange] = useState("monthly");

  const data = Array.from({ length: range === "daily" ? 7 : range === "weekly" ? 8 : 12 }).map((_, i) => ({
    label: `${range[0].toUpperCase()}${i + 1}`,
    appointments: 10 + Math.floor(Math.random() * 80),
    completed: 8 + Math.floor(Math.random() * 70),
  }));

  function exportCsv() {
    const rows = ["label,appointments,completed", ...data.map(d => `${d.label},${d.appointments},${d.completed}`)].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `org-report-${range}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Operational reports for your organization."
        actions={<>
          <Select value={range} onValueChange={setRange}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => window.print()}><Download className="mr-1 h-4 w-4" /> PDF</Button>
        </>} />
      <Card><CardHeader><CardTitle>Appointments — {apts.length} total</CardTitle></CardHeader>
        <CardContent className="h-96"><ResponsiveContainer><BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="label" /><YAxis /><Tooltip />
          <Bar dataKey="appointments" fill="var(--primary)" /><Bar dataKey="completed" fill="var(--secondary)" />
        </BarChart></ResponsiveContainer></CardContent></Card>
    </div>
  );
}
