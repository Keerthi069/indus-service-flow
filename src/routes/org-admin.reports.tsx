import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarCheck2, CircleCheck, Clock, Download, FileSpreadsheet,
  FileText, Sheet, TrendingUp, Users,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line,
  LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/reports")({ component: OrgReportsPage });

const RANGES = ["daily", "weekly", "monthly", "quarterly", "half-yearly", "annual"];
const POINTS: Record<string, number> = { daily: 7, weekly: 8, monthly: 12, quarterly: 4, "half-yearly": 2, annual: 5 };
const STATUS_COLORS = ["var(--primary)", "var(--secondary)", "var(--muted-foreground)", "var(--destructive)"];
const STAFF_NAMES = ["Dr. Mehta", "Dr. Iyer", "Dr. Rao", "Dr. Khan", "Dr. Singh"];
const SERVICES = ["Consultation", "Follow-up", "Diagnostics", "Therapy", "Vaccination"];
const HOURS = ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"];

function todayMinus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function OrgReportsPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === orgId));

  const [range, setRange] = useState("monthly");
  const [fromDate, setFromDate] = useState(todayMinus(30));
  const [toDate, setToDate] = useState(todayMinus(0));

  const data = useMemo(() => Array.from({ length: POINTS[range] }).map((_, i) => ({
    label: `${range[0].toUpperCase()}${i + 1}`,
    appointments: 10 + Math.floor(Math.random() * 80),
    completed: 8 + Math.floor(Math.random() * 70),
  })), [range, fromDate, toDate]);

  const totals = useMemo(() => data.reduce((acc, d) => ({
    appointments: acc.appointments + d.appointments,
    completed: acc.completed + d.completed,
  }), { appointments: 0, completed: 0 }), [data]);
  const completionRate = totals.appointments ? Math.round((totals.completed / totals.appointments) * 100) : 0;

  const statusData = useMemo(() => [
    { name: "Completed", value: totals.completed },
    { name: "No-show", value: Math.round(totals.appointments * 0.08) },
    { name: "Cancelled", value: Math.round(totals.appointments * 0.05) },
    { name: "Pending", value: Math.max(totals.appointments - totals.completed - Math.round(totals.appointments * 0.13), 0) },
  ], [totals]);

  const staffData = useMemo(() => STAFF_NAMES.map(name => ({
    name,
    appointments: 20 + Math.floor(Math.random() * 60),
    rating: +(3.8 + Math.random() * 1.2).toFixed(1),
  })), [range, fromDate, toDate]);

  const serviceData = useMemo(() => SERVICES.map(name => ({
    name,
    count: 15 + Math.floor(Math.random() * 50),
  })), [range, fromDate, toDate]);

  const peakHoursData = useMemo(() => HOURS.map(hour => ({
    hour,
    bookings: 5 + Math.floor(Math.random() * 40),
  })), [range, fromDate, toDate]);

  function exportCsv() {
    const rows = ["label,appointments,completed", ...data.map(d => `${d.label},${d.appointments},${d.completed}`)].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `org-report-${range}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function exportExcel() {
    // Tab-separated values open cleanly in Excel; swap for a real xlsx writer if you add one (e.g. SheetJS) later.
    const header = "Label\tAppointments\tCompleted";
    const rows = [header, ...data.map(d => `${d.label}\t${d.appointments}\t${d.completed}`)].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "application/vnd.ms-excel" }));
    const a = document.createElement("a"); a.href = url; a.download = `org-report-${range}.xls`; a.click(); URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Operational reports for your organization."
        actions={<>
          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="sr-only">From</Label>
            <Input id="from" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input id="to" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="mr-1 h-4 w-4" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportCsv}><FileText className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={exportPdf}><Sheet className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>} />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-sm text-muted-foreground">Total Appointments</p><p className="text-2xl font-semibold">{apts.length}</p></div>
          <CalendarCheck2 className="h-8 w-8 text-muted-foreground" />
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-sm text-muted-foreground">Completed ({range})</p><p className="text-2xl font-semibold">{totals.completed}</p></div>
          <CircleCheck className="h-8 w-8 text-muted-foreground" />
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-sm text-muted-foreground">Completion Rate</p><p className="text-2xl font-semibold">{completionRate}%</p></div>
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-sm text-muted-foreground">Active Staff</p><p className="text-2xl font-semibold">{STAFF_NAMES.length}</p></div>
          <Users className="h-8 w-8 text-muted-foreground" />
        </CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Appointments — {apts.length} total</CardTitle></CardHeader>
          <CardContent className="h-80"><ResponsiveContainer><BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="label" /><YAxis /><Tooltip />
            <Bar dataKey="appointments" fill="var(--primary)" /><Bar dataKey="completed" fill="var(--secondary)" />
          </BarChart></ResponsiveContainer></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent className="h-80"><ResponsiveContainer><PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
            </Pie><Tooltip /><Legend />
          </PieChart></ResponsiveContainer></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Completion Trend</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="label" /><YAxis /><Tooltip />
            <Area type="monotone" dataKey="completed" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.2} />
          </AreaChart></ResponsiveContainer></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Peak Booking Hours</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><BarChart data={peakHoursData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="hour" /><YAxis /><Tooltip />
            <Bar dataKey="bookings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Staff Performance</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><BarChart data={staffData} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={90} /><Tooltip />
            <Bar dataKey="appointments" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Service Popularity</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><LineChart data={serviceData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" /><YAxis /><Tooltip />
            <Line type="monotone" dataKey="count" stroke="var(--secondary)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart></ResponsiveContainer></CardContent>
        </Card>
      </div>
    </div>
  );
}