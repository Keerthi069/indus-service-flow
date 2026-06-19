import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Play } from "lucide-react";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/org-admin/simulations")({ component: SimulationsPage });

function runMonteCarlo(arrivalRate: number, serviceRate: number, servers: number, iters = 1000) {
  let totalWait = 0, totalQueue = 0;
  for (let it = 0; it < iters; it++) {
    let t = 0; let queue = 0; let lastArrival = 0;
    const serversFree = Array.from({ length: servers }).fill(0) as number[];
    let waits: number[] = [];
    let arrivals = 0;
    while (t < 480) {
      const dt = -Math.log(Math.random()) / arrivalRate;
      t += dt; if (t >= 480) break;
      arrivals++;
      const idx = serversFree.findIndex(s => s <= t);
      if (idx >= 0) {
        const dur = -Math.log(Math.random()) / serviceRate;
        serversFree[idx] = t + dur;
        waits.push(0);
      } else {
        const nextFree = Math.min(...serversFree);
        const wait = nextFree - t;
        waits.push(wait); queue++;
        const dur = -Math.log(Math.random()) / serviceRate;
        const slot = serversFree.indexOf(nextFree);
        serversFree[slot] = nextFree + dur;
      }
    }
    totalWait += waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0;
    totalQueue += queue;
  }
  return { avgWait: totalWait / iters, avgQueue: totalQueue / iters };
}

function SimulationsPage() {
  const [arr, setArr] = useState(0.4); // per minute
  const [svc, setSvc] = useState(0.25); // per minute per server
  const [servers, setServers] = useState(3);
  const [result, setResult] = useState<{ avgWait: number; avgQueue: number } | null>(null);

  function run() { setResult(runMonteCarlo(arr, svc, servers, 500)); }

  const forecast = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    hr: `${(9 + i).toString().padStart(2, "0")}:00`,
    predicted_queue: 3 + Math.round(Math.sin(i / 2) * 4 + Math.random() * 6),
    capacity: servers * 4,
  })), [servers]);

  return (
    <div>
      <PageHeader title="Queue Simulations" subtitle="Monte Carlo simulation for capacity planning." />
      <Card>
        <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="grid gap-1.5"><Label>Arrival rate (cust/min)</Label><Input type="number" step="0.1" value={arr} onChange={e => setArr(+e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Service rate (cust/min/server)</Label><Input type="number" step="0.05" value={svc} onChange={e => setSvc(+e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Servers</Label><Input type="number" value={servers} onChange={e => setServers(+e.target.value)} /></div>
          <Button onClick={run} className="self-end"><Play className="mr-1 h-4 w-4" /> Run simulation</Button>
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Kpi label="Predicted wait time" value={result ? `${result.avgWait.toFixed(1)} m` : "—"} />
        <Kpi label="Predicted queue length" value={result ? result.avgQueue.toFixed(1) : "—"} />
        <Kpi label="Capacity requirement" value={`${(arr / svc).toFixed(1)} svr`} />
        <Kpi label="Staff requirement" value={Math.ceil(arr / svc)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Queue forecast</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><LineChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="hr" /><YAxis /><Tooltip />
            <Line type="monotone" dataKey="predicted_queue" stroke="var(--primary)" strokeWidth={2} />
          </LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Capacity vs demand</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer><BarChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="hr" /><YAxis /><Tooltip />
            <Bar dataKey="predicted_queue" fill="var(--primary)" />
            <Bar dataKey="capacity" fill="var(--secondary)" />
          </BarChart></ResponsiveContainer></CardContent></Card>
      </div>
    </div>
  );
}
