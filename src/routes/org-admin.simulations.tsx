import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Play, RefreshCw, Plus, ArrowRight,FileSpreadsheet, FileText, File } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/portal/PortalShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";

export const Route = createFileRoute("/org-admin/simulations")({ component: Page });

// ─── Types ────────────────────────────────────────────────────────────────────

type HourlyPoint = {
  idle: number; h: number; avgWait: number; maxQueue: number; utilization: number ;
};
type SimRecord   = { id: number; date: string };
type Kpis        = { total: number; served: number; avgWait: number; maxWait: number; queue: number; util: number ;  idle: number;
};

// ─── Simulation engine ────────────────────────────────────────────────────────

function genHourlyData(horizon: number): HourlyPoint[] {
  return Array.from({ length: horizon }, (_, i) => {
    const utilization = +(35 + Math.random() * 45).toFixed(1);

    return {
      h: i + 1,
      avgWait: +(30 + Math.random() * 45).toFixed(1),
      maxQueue: +(4 + Math.random() * 22).toFixed(1),
      utilization,
      idle: +(100 - utilization).toFixed(1),
    };
  });
}

function randomKpis(): Kpis {
  const total = Math.round(900 + Math.random() * 500);

  const util = Math.round(55 + Math.random() * 35);
  const idle = 100 - util;

  return {
    total,
    served: Math.round(total * (0.82 + Math.random() * 0.12)),
    avgWait: +(10 + Math.random() * 18).toFixed(1),
    maxWait: +(50 + Math.random() * 50).toFixed(1),
    queue: Math.round(8 + Math.random() * 20),
    util,
    idle,
  };
}


function nowLabel(): string {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = d.getHours() % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} ${d.getHours() >= 12 ? "PM" : "AM"}`;
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

function KpiCard({ label, value, delta, up }: { label: string; value: React.ReactNode; delta: string; up: boolean }) {
  return (
    <div className="glass rounded-xl p-4 min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 truncate font-medium">{label}</p>
      <p className="text-2xl font-semibold leading-tight truncate">{value}</p>
      <p className={`text-xs mt-1.5 font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>{delta}</p>
    </div>
  );
}

function UtilRing({ pct }: { pct: number }) {
  const r = 17, circ = 2 * Math.PI * r;
  const color = pct >= 80 ? "#e07c2b" : pct >= 60 ? "#eda100" : "#1baf7a";
  return (
    <svg width={48} height={48} viewBox="0 0 44 44" aria-label={`Utilization ${pct}%`}>
      <circle cx={22} cy={22} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={4} />
      <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={`${circ.toFixed(1)} ${circ.toFixed(1)}`}
        strokeDashoffset={(circ * (1 - pct / 100)).toFixed(1)}
        transform="rotate(-90 22 22)" />
    </svg>
  );
}

function RecentItem({ id, date }: SimRecord) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">Simulation run #{id}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 font-medium">
        Completed
      </span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs border border-border shadow-md">
      <p className="text-muted-foreground font-medium mb-1.5">Hour {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke }} className="my-1">
          <span className="text-muted-foreground">{p.name}: </span>
          {(+p.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Page() {
  const [runs,    setRuns]    = useState([200]);
  const [arrProb, setArrProb] = useState([0.70]);
  const [srvProb, setSrvProb] = useState([0.85]);
  const [horizon, setHorizon] = useState("8");

  const [hourly,  setHourly]  = useState<HourlyPoint[]>(() => genHourlyData(8));
  const [kpis,    setKpis]    = useState<Kpis>({ total:1248, served:1078, avgWait:18.6, maxWait:82.4, queue:22, util:72 , idle: 28 });
  const [history, setHistory] = useState<SimRecord[]>([
    { id: 200, date: "27 Jun 2026, 11:45 AM" },
    { id: 199, date: "27 Jun 2026, 10:30 AM" },
    { id: 198, date: "26 Jun 2026, 05:15 PM" },
  ]);

  function handleRun() {
    const h = Math.max(1, parseInt(horizon) || 8);
    setHourly(genHourlyData(h));
    const k = randomKpis();
    setKpis(k);
    setHistory((prev) => [{ id: prev[0].id + 1, date: nowLabel() }, ...prev]);
    toast.success("Simulation complete");
  }

  function handleReset() {
    setRuns([200]); setArrProb([0.70]); setSrvProb([0.85]); setHorizon("8");
    setHourly(genHourlyData(8)); setKpis({ total:1248, served:1078, avgWait:18.6, maxWait:82.4, queue:22, util:72, idle: 28 });
  }

  const utilColor = kpis.util >= 80 ? "text-orange-500" : kpis.util >= 60 ? "text-yellow-500" : "text-teal-500";
  const utilLabel = kpis.util >= 80 ? "High" : kpis.util >= 60 ? "Medium" : "Low";

const exportCSV = () => {
  const data = hourly.map((item) => ({
    Hour: item.h,
    "Avg Wait": item.avgWait,
    "Max Queue": item.maxQueue,
    Utilization: item.utilization,
    idle: item.idle,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "simulation-results.csv";
  link.click();
};

const exportExcel = () => {
  const data = hourly.map((item) => ({
    Hour: item.h,
    "Avg Wait": item.avgWait,
    "Max Queue": item.maxQueue,
    Utilization: item.utilization,
    idle: item.idle,  
  }));

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Simulation");

  XLSX.writeFile(workbook, "simulation-results.xlsx");
};

const exportPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Monte Carlo Simulation Report", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Hour", "Avg Wait", "Max Queue","idle" ,"Utilization"]],
    body: hourly.map((item) => [
      item.h,
      item.avgWait,
      item.maxQueue,
      `${item.idle}%`,
      `${item.utilization}%`,
    ]),
  });

  doc.save("simulation-report.pdf");
};

  // Bigger axis text
  const axisProps = {
    tick: { fontSize: 12, fill: "#94a3b8" },
    axisLine: false as const,
    tickLine: false as const,
  };

  return (
    <div className="space-y-4">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-sm text-muted-foreground font-medium">Last simulation results</span>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-sm text-muted-foreground">
            📅 27 Jun 2026, 11:45 AM
          </div>
          <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="text-sm h-9 gap-2 px-4"
    >
      <Download className="h-4 w-4" />
      Export
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-44">
    <DropdownMenuItem onClick={exportCSV}>
      <File className="mr-2 h-4 w-4" />
      CSV
    </DropdownMenuItem>

    <DropdownMenuItem onClick={exportExcel}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Excel
    </DropdownMenuItem>

    <DropdownMenuItem onClick={exportPDF}>
      <FileText className="mr-2 h-4 w-4" />
      PDF
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
        </div>
      </div>

      {/* ── 6-col KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 10 }}>
        <KpiCard label="Total customers"  value={kpis.total.toLocaleString()} delta="↑ 12.5% vs last run" up />
        <KpiCard label="Customers served" value={kpis.served.toLocaleString()} delta="↑ 10.8% vs last run" up />
        <KpiCard label="Avg waiting time" value={<>{kpis.avgWait} <span className="text-base font-normal">min</span></>} delta="↓ 5.2% vs last run" up={false} />
        <KpiCard label="Max waiting time" value={<>{kpis.maxWait} <span className="text-base font-normal">min</span></>} delta="↓ 8.7% vs last run" up={false} />
        <KpiCard label="Current queue"    value={kpis.queue} delta="↑ 15.8% vs last run" up />
        <KpiCard
  label="Idle Time"
  value={
    <>
      {kpis.idle}
      <span className="text-base font-normal">%</span>
    </>
  }
  delta="↓ 8.3% vs last run"
  up={false}
/>
        {/* Utilization — ring card */}
        <div className="glass rounded-xl p-4 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Utilization</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={`text-xl font-semibold ${utilColor}`}>{utilLabel}</p>
              <p className="text-xs text-emerald-600 mt-1.5 font-medium">↑ 8.3% vs last run</p>
            </div>
            <div className="relative flex-shrink-0">
              <UtilRing pct={kpis.util} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{kpis.util}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main: control panel + charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", gap: 14 }}>

        {/* Control panel */}
        <div className="glass rounded-xl p-5 space-y-4 self-start">
          <h3 className="text-base font-semibold text-blue-600">Simulation control</h3>

          <Field label={`Arrival probability: ${arrProb[0].toFixed(2)}`}>
            <Slider value={arrProb} onValueChange={setArrProb} min={0} max={1} step={0.05} />
          </Field>
          <Field label={`Service probability: ${srvProb[0].toFixed(2)}`}>
            <Slider value={srvProb} onValueChange={setSrvProb} min={0} max={1} step={0.05} />
          </Field>
          <Field label={`Simulation runs: ${runs[0]}`}>
            <Slider value={runs} onValueChange={setRuns} min={50} max={1000} step={50} />
          </Field>
          <Field label="Time horizon (hours)">
            <input
              type="number" value={horizon} min={1} max={24}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
            />
          </Field>

          <Button onClick={handleRun} className="w-full h-10 text-sm bg-teal-500 hover:bg-teal-600 text-white gap-2 rounded-xl font-medium">
            <Play className="h-4 w-4" /> Run simulation
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full h-9 text-sm gap-2">
            <RefreshCw className="h-4 w-4" /> Reset
          </Button>

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-semibold text-blue-600 mb-3">Recent simulations</p>
            {history.slice(0, 3).map((s) => <RecentItem key={s.id} {...s} />)}
            <button className="flex items-center gap-1.5 text-xs text-blue-600 mt-3 font-medium">
              View all simulations <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Charts column */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Overview trend */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-base font-semibold">Overview trend</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex gap-4">
                  {[
                    ["#2a78d6", "Avg waiting time (min)"],
                    ["#1baf7a", "Max queue length"],
                    ["#9085e9", "Utilization (%)"],
                  ].map(([c, l]) => (
                    <span key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block", flexShrink: 0 }} />
                      {l}
                    </span>
                  ))}
                </div>
                <select className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-background text-muted-foreground">
                  <option>Last run</option>
                  <option>All runs</option>
                </select>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourly} margin={{ top: 4, right: 8, bottom: 16, left: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.13)" vertical={false} />
                  <XAxis
                    dataKey="h"
                    {...axisProps}
                    label={{ value: "Time interval", position: "insideBottom", offset: -4, fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis {...axisProps} domain={[0, 100]} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="avgWait"     name="Avg wait"    stroke="#2a78d6" strokeWidth={2.5} dot={{ r: 4, fill: "#2a78d6",  stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="maxQueue"    name="Max queue"   stroke="#1baf7a" strokeWidth={2.5} dot={{ r: 4, fill: "#1baf7a",  stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="utilization" name="Utilization" stroke="#9085e9" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 4, fill: "#9085e9", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast area */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Forecast: queue evolution</h3>
              <select className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-background text-muted-foreground">
                <option>Max queue length</option>
                <option>Avg wait</option>
              </select>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly} margin={{ top: 4, right: 8, bottom: 16, left: 0 }}>
                  <defs>
                    <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#1baf7a" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1baf7a" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.13)" vertical={false} />
                  <XAxis
                    dataKey="h"
                    {...axisProps}
                    label={{ value: "Time interval (hours)", position: "insideBottom", offset: -4, fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    {...axisProps}
                    width={36}
                    label={{ value: "Queue length", angle: -90, position: "insideLeft", offset: 14, fontSize: 12, fill: "#94a3b8" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="maxQueue" name="Max queue" stroke="#1baf7a" strokeWidth={2.5} fill="url(#qGrad)" dot={{ r: 4, fill: "#1baf7a", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}