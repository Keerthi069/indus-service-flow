import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Play, RefreshCw, ArrowRight } from "lucide-react";
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

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";

export const Route = createFileRoute("/org-admin/simulations")({ component: Page });

// ─── Types ────────────────────────────────────────────────────────────────────

type HourlyPoint = {
  h: number; avgWait: number; maxQueue: number; utilization: number; idle: number;
};
type SimRecord = { id: number; date: string };
type Kpis = {
  total: number; served: number; avgWait: number; maxWait: number;
  queue: number; util: number; idle: number; abandoned: number;
};

const DEFAULT_RUNS = 200;
const DEFAULT_ARR_PROB = 0.7;
const DEFAULT_SRV_PROB = 0.85;
const DEFAULT_HORIZON = "8";

// ─── Simulation engine ────────────────────────────────────────────────────────
//
// A real (if simplified) queueing model instead of unrelated random numbers,
// so the control panel sliders actually drive the results, and the KPI cards
// are aggregated straight from the same hourly series the charts render —
// meaning the two can never disagree with each other.
//
// utilization (rho) = arrival rate / service rate (classic M/M/1 ratio)
// avg queue length  = rho^2 / (1 - rho)                      (M/M/1 Lq)
// avg wait time     = queue length / arrival rate             (Little's Law)

// Deterministic pseudo-random noise in [-spread, +spread], so re-running the
// same inputs is reproducible but a fresh `seedOffset` (bumped every time the
// user clicks "Run simulation") still gives natural run-to-run variation,
// the way repeated Monte Carlo trials would.
function seededNoise(seed: number, spread: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * 2 * spread;
}

function simulate(
  runs: number,
  arrProb: number,
  srvProb: number,
  horizon: number,
  seedOffset = 0
): { hourly: HourlyPoint[]; kpis: Kpis } {
  const safeArr = Math.min(0.98, Math.max(0.02, arrProb));
  const safeSrv = Math.min(0.98, Math.max(0.02, srvProb));
  const rho = Math.min(0.96, safeArr / safeSrv);

  const baseArrivalsPerHour = runs / horizon;
  // Capacity sized so that, at steady arrivals, utilization lands on rho —
  // consistent with how the slider ratio is meant to read.
  const serviceCapacityPerHour = Math.max(1, Math.round(baseArrivalsPerHour / rho));

  // Customers only abandon (balk/renege) once the system is genuinely
  // overloaded (rho > 0.5); below that, everyone who doesn't get served
  // this hour simply stays in the queue for the next one — nobody
  // disappears unaccounted for.
  const abandonFraction = Math.max(0, (rho - 0.5) * 0.18);

  let carryQueue = 0;
  let totalArrivals = 0;
  let totalServed = 0;
  let totalAbandoned = 0;

  const hourly: HourlyPoint[] = [];

  for (let i = 0; i < horizon; i++) {
    const noise = seededNoise(i * 7 + seedOffset, Math.max(1, baseArrivalsPerHour * 0.15));
    const arrivals = Math.max(0, Math.round(baseArrivalsPerHour + noise));
    totalArrivals += arrivals;

    const available = carryQueue + arrivals; // everyone waiting to be handled this hour
    const servedThisHour = Math.min(available, serviceCapacityPerHour);
    const afterService = available - servedThisHour;
    const abandonedThisHour = Math.round(afterService * abandonFraction);
    const nextQueue = afterService - abandonedThisHour;

    totalServed += servedThisHour;
    totalAbandoned += abandonedThisHour;

    const utilization = +Math.min(100, (servedThisHour / serviceCapacityPerHour) * 100).toFixed(1);
    // Little's Law: avg wait ≈ avg customers in system this hour / throughput.
    const avgWait = +Math.max(2, ((carryQueue + nextQueue) / 2 / serviceCapacityPerHour) * 60).toFixed(1);

    hourly.push({
      h: i + 1,
      avgWait,
      maxQueue: available,
      utilization,
      idle: +(100 - utilization).toFixed(1),
    });

    carryQueue = nextQueue;
  }

  const avgWait = +(hourly.reduce((s, p) => s + p.avgWait, 0) / hourly.length).toFixed(1);
  const maxWait = +Math.max(...hourly.map((p) => p.avgWait)).toFixed(1);
  const util = Math.round(hourly.reduce((s, p) => s + p.utilization, 0) / hourly.length);
  const idle = 100 - util;

  // By construction: totalArrivals === totalServed + carryQueue + totalAbandoned.
  return {
    hourly,
    kpis: {
      total: totalArrivals,
      served: totalServed,
      queue: carryQueue,
      abandoned: totalAbandoned,
      avgWait,
      maxWait,
      util,
      idle,
    },
  };
}

const INITIAL_SIM = simulate(DEFAULT_RUNS, DEFAULT_ARR_PROB, DEFAULT_SRV_PROB, 8, 0);

function nowLabel(): string {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = d.getHours() % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} ${d.getHours() >= 12 ? "PM" : "AM"}`;
}

// Compares the current value against the previous run's value for the same
// metric and returns a real, computed delta — replacing the old hardcoded
// "↑ 12.5% vs last run" strings that never actually changed.
// `lowerIsBetter` controls whether a decrease should render green (good) or
// red (bad) — e.g. a drop in wait time is good, but a drop in customers
// served is bad.
function computeDelta(curr: number, prev: number | null, lowerIsBetter: boolean): { text: string; up: boolean } {
  if (prev == null || prev === 0) return { text: "Baseline run", up: true };
  const changePct = ((curr - prev) / prev) * 100;
  const increased = changePct >= 0;
  const isGood = lowerIsBetter ? !increased : increased;
  const arrow = increased ? "↑" : "↓";
  return { text: `${arrow} ${Math.abs(changePct).toFixed(1)}% vs last run`, up: isGood };
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
  const [runs,    setRuns]    = useState([DEFAULT_RUNS]);
  const [arrProb, setArrProb] = useState([DEFAULT_ARR_PROB]);
  const [srvProb, setSrvProb] = useState([DEFAULT_SRV_PROB]);
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON);

  const [hourly,   setHourly]   = useState<HourlyPoint[]>(INITIAL_SIM.hourly);
  const [kpis,     setKpis]     = useState<Kpis>(INITIAL_SIM.kpis);
  const [prevKpis, setPrevKpis] = useState<Kpis | null>(null);
  const [runSeed,  setRunSeed]  = useState(0);

  const [history, setHistory] = useState<SimRecord[]>([
    { id: 200, date: "27 Jun 2026, 11:45 AM" },
    { id: 199, date: "27 Jun 2026, 10:30 AM" },
    { id: 198, date: "26 Jun 2026, 05:15 PM" },
  ]);

  // Live clock for the "last simulation results" timestamp in the top bar
  const [nowDisplay, setNowDisplay] = useState<string>(() => nowLabel());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowDisplay(nowLabel());
    }, 30_000); // refresh every 30s, label itself is minute-precision
    return () => clearInterval(interval);
  }, []);

  function handleRun() {
    const h = Math.max(1, Math.min(24, parseInt(horizon) || 8));
    const nextSeed = runSeed + 1;
    const { hourly: newHourly, kpis: newKpis } = simulate(runs[0], arrProb[0], srvProb[0], h, nextSeed);

    setPrevKpis(kpis);
    setHourly(newHourly);
    setKpis(newKpis);
    setRunSeed(nextSeed);
    setHistory((prev) => [{ id: prev[0].id + 1, date: nowLabel() }, ...prev]);
    toast.success("Simulation complete");
  }

  function handleReset() {
    setRuns([DEFAULT_RUNS]);
    setArrProb([DEFAULT_ARR_PROB]);
    setSrvProb([DEFAULT_SRV_PROB]);
    setHorizon(DEFAULT_HORIZON);
    setPrevKpis(null);
    setRunSeed(0);
    setHourly(INITIAL_SIM.hourly);
    setKpis(INITIAL_SIM.kpis);
  }

  const utilColor = kpis.util >= 80 ? "text-orange-500" : kpis.util >= 60 ? "text-yellow-500" : "text-teal-500";
  const utilLabel = kpis.util >= 80 ? "High" : kpis.util >= 60 ? "Medium" : "Low";

  // Deltas computed against the actual previous run instead of hardcoded strings.
  const totalDelta   = computeDelta(kpis.total, prevKpis?.total ?? null, false);
  const servedDelta  = computeDelta(kpis.served, prevKpis?.served ?? null, false);
  const avgWaitDelta = computeDelta(kpis.avgWait, prevKpis?.avgWait ?? null, true);
  const maxWaitDelta = computeDelta(kpis.maxWait, prevKpis?.maxWait ?? null, true);
  const queueDelta   = computeDelta(kpis.queue, prevKpis?.queue ?? null, true);
  const idleDelta    = computeDelta(kpis.idle, prevKpis?.idle ?? null, true);
  const utilDelta    = computeDelta(kpis.util, prevKpis?.util ?? null, false);
  const abandonedDelta = computeDelta(kpis.abandoned, prevKpis?.abandoned ?? null, true);

  const exportCsv = () => {
    const data = hourly.map((item) => ({
      Hour: item.h,
      "Avg Wait": item.avgWait,
      "Max Queue": item.maxQueue,
      Utilization: item.utilization,
      idle: item.idle,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "simulation-results.csv";
    link.click();
    URL.revokeObjectURL(url);
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
      head: [["Hour", "Avg Wait", "Max Queue", "idle", "Utilization"]],
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

      <PageHeader
        title="Simulations"
        subtitle="Run Monte Carlo simulations to forecast queue load and staffing needs."
        actions={
          <>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-sm text-muted-foreground whitespace-nowrap">
              📅 {nowDisplay}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={exportCsv} className="gap-2">
                  <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                  CSV
                </DropdownMenuItem>

                <DropdownMenuItem onClick={exportExcel} className="gap-2">
                  <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                  Excel
                </DropdownMenuItem>

                <DropdownMenuItem onClick={exportPDF} className="gap-2">
                  <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard label="Total customers"  value={kpis.total.toLocaleString()} delta={totalDelta.text} up={totalDelta.up} />
        <KpiCard label="Customers served" value={kpis.served.toLocaleString()} delta={servedDelta.text} up={servedDelta.up} />
        <KpiCard label="Currently waiting" value={kpis.queue.toLocaleString()} delta={queueDelta.text} up={queueDelta.up} />
        <KpiCard label="Left without service" value={kpis.abandoned.toLocaleString()} delta={abandonedDelta.text} up={abandonedDelta.up} />
        <KpiCard label="Avg waiting time" value={<>{kpis.avgWait} <span className="text-base font-normal">min</span></>} delta={avgWaitDelta.text} up={avgWaitDelta.up} />
        <KpiCard label="Max waiting time" value={<>{kpis.maxWait} <span className="text-base font-normal">min</span></>} delta={maxWaitDelta.text} up={maxWaitDelta.up} />
        <KpiCard
          label="Idle Time"
          value={<>{kpis.idle}<span className="text-base font-normal">%</span></>}
          delta={idleDelta.text}
          up={idleDelta.up}
        />
        {/* Utilization — ring card */}
        <div className="glass rounded-xl p-4 min-w-0 col-span-2 sm:col-span-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Utilization</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={`text-xl font-semibold ${utilColor}`}>{utilLabel}</p>
              <p className={`text-xs mt-1.5 font-medium ${utilDelta.up ? "text-emerald-600" : "text-red-500"}`}>{utilDelta.text}</p>
            </div>
            <div className="relative flex-shrink-0">
              <UtilRing pct={kpis.util} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{kpis.util}%</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground px-1">
        Total customers ({kpis.total.toLocaleString()}) = served ({kpis.served.toLocaleString()}) + currently waiting ({kpis.queue.toLocaleString()}) + left without service ({kpis.abandoned.toLocaleString()}).
        "Currently waiting" carries into the next simulated period; "left without service" reflects customers who gave up after a long wait rather than being lost with no explanation.
      </p>

      {/* ── Main: control panel + charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-3.5">

        {/* Control panel */}
        <div className="glass rounded-xl p-5 space-y-4 self-start lg:sticky lg:top-4">
          <h3 className="text-base font-semibold text-blue-600">Simulation control</h3>

          <Field label={`Arrival probability: ${arrProb[0].toFixed(2)}`}>
            <Slider value={arrProb} onValueChange={setArrProb} min={0} max={1} step={0.05} />
          </Field>
          <Field label={`Service probability: ${srvProb[0].toFixed(2)}`}>
            <Slider value={srvProb} onValueChange={setSrvProb} min={0} max={1} step={0.05} />
          </Field>
          <Field label={`Simulated arrivals: ${runs[0]}`}>
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
        <div className="flex flex-col gap-3.5 min-w-0">

          {/* Overview trend */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-base font-semibold">Overview trend</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-3 flex-wrap">
                  {[
                    ["#2a78d6", "Avg waiting time (min)"],
                    ["#1baf7a", "Max queue length"],
                    ["#9085e9", "Utilization (%)"],
                  ].map(([c, l]) => (
                    <span key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
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
            <div className="h-64 sm:h-72">
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-base font-semibold">Forecast: queue evolution</h3>
              <select className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-background text-muted-foreground">
                <option>Max queue length</option>
                <option>Avg wait</option>
              </select>
            </div>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly} margin={{ top: 4, right: 8, bottom: 16, left: 12 }}>
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
                    width={44}
                    label={{ value: "Queue length", angle: -90, position: "insideLeft", offset: -6, fontSize: 12, fill: "#94a3b8" }}
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