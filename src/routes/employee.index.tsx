import { createFileRoute } from "@tanstack/react-router";
import { Clock, Star, Timer, Users } from "lucide-react";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/")({ component: EmpDash });

function EmpDash() {
  const { user } = useAuth();
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === user?.organization_id));
  const today = new Date().toISOString().slice(0, 10);
  const todays = apts.filter(a => a.date === today);
  const served = todays.filter(a => a.status === "completed").length;
  const waiting = todays.filter(a => a.status === "confirmed").length;

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name.split(" ")[0]}`} subtitle="Your service desk at a glance." />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Customers served today" value={served} icon={Users} />
        <Kpi label="Average handle time" value="14m" icon={Timer} />
        <Kpi label="Customers waiting" value={waiting} icon={Clock} />
        <Kpi label="Customer rating" value="4.7 / 5" icon={Star} />
      </div>
      <Card className="mt-6"><CardHeader><CardTitle>Today's queue</CardTitle></CardHeader>
        <CardContent>
          {todays.length === 0 && <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No appointments yet for today.</div>}
          <ul className="grid gap-2">
            {todays.slice(0, 8).map(a => (
              <li key={a.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                <span className="font-medium">{a.token} · {a.customer_name}</span>
                <span className="text-muted-foreground">{a.service_name} · {a.time}</span>
              </li>
            ))}
          </ul>
        </CardContent></Card>
    </div>
  );
}
