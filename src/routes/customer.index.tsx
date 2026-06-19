import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Clock, MapPin, TimerReset } from "lucide-react";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/customer/")({ component: CustDash });

function CustDash() {
  const { user } = useAuth();
  const apts = useDb(() => db.all("appointments").filter(a => a.customer_email === user?.email));
  const upcoming = apts.filter(a => a.status === "confirmed");
  const completed = apts.filter(a => a.status === "completed");

  return (
    <div>
      <PageHeader title={`Hi, ${user?.name.split(" ")[0]}`} subtitle="Your appointments and queue status at a glance."
        actions={<Button asChild><Link to="/book-appointment">Book new appointment</Link></Button>} />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Upcoming appointments" value={upcoming.length} icon={CalendarCheck} />
        <Kpi label="Queue position" value={upcoming[0] ? "#3" : "—"} icon={TimerReset} />
        <Kpi label="Estimated wait" value={upcoming[0] ? "11m" : "—"} icon={Clock} />
        <Kpi label="Completed services" value={completed.length} icon={CalendarCheck} />
      </div>
      <Card className="mt-6"><CardHeader><CardTitle>Upcoming</CardTitle></CardHeader><CardContent>
        {upcoming.length === 0 && <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No upcoming appointments. <Link to="/book-appointment" className="text-primary hover:underline">Book one now</Link>.</div>}
        <ul className="grid gap-2">
          {upcoming.map(a => (
            <li key={a.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-3 text-sm">
              <div><div className="font-semibold">{a.service_name}</div><div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{a.date} · {a.time}</div></div>
              <Badge variant="outline">{a.token}</Badge>
            </li>
          ))}
        </ul>
      </CardContent></Card>
    </div>
  );
}
