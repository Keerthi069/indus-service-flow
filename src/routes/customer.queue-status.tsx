import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/customer/queue-status")({ component: QStatus });

function QStatus() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 5000); return () => clearInterval(t); }, []);

  const apts = useDb(() => db.all("appointments").filter(a => a.customer_email === user?.email && a.status === "confirmed"));
  const apt = apts[0];
  const orgQueue = useDb(() => apt ? db.all("appointments").filter(a => a.organization_id === apt.organization_id && a.date === apt.date && a.status === "confirmed").sort((a, b) => a.time.localeCompare(b.time)) : []);
  const pos = apt ? orgQueue.findIndex(a => a.id === apt.id) + 1 : 0;
  const eta = pos > 0 ? Math.max(1, pos * 4 - (tick % 5)) : 0;
  const currentlyServing = useDb(() => apt ? db.all("appointments").find(a => a.organization_id === apt.organization_id && a.status === "in_progress") : undefined);

  if (!apt) return <div><PageHeader title="Queue status" /><Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No active appointment in queue.</CardContent></Card></div>;

  return (
    <div>
      <PageHeader title="Live queue status" subtitle="Auto-refreshing every 5 seconds." back />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Your token" value={apt.token} />
        <Kpi label="Current position" value={`#${pos}`} />
        <Kpi label="Estimated wait" value={`${eta}m`} />
        <Kpi label="Now serving" value={currentlyServing?.token || "—"} />
      </div>
      <Card className="mt-6"><CardHeader><CardTitle>Queue ahead of you</CardTitle></CardHeader><CardContent>
        <ul className="grid gap-2">
          {orgQueue.slice(0, pos + 3).map((q, i) => (
            <li key={q.id} className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${q.id === apt.id ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="font-medium">{q.token}</span>
              <span className="text-muted-foreground">{q.service_name}</span>
              <Badge variant="outline">#{i + 1}</Badge>
            </li>
          ))}
        </ul>
      </CardContent></Card>
    </div>
  );
}
