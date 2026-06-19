import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb, TrendingUp, Users, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/ai")({ component: AIPage });

function AIPage() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === orgId));
  const emps = useDb(() => db.all("employees").filter(e => e.organization_id === orgId));
  const services = useDb(() => db.all("services").filter(s => s.organization_id === orgId));

  // Derive recommendations dynamically
  const byHour: Record<string, number> = {};
  apts.forEach(a => { const h = a.time.slice(0, 2); byHour[h] = (byHour[h] || 0) + 1; });
  const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1]).slice(0, 1)[0];
  const totalEmps = emps.filter(e => e.status === "active").length;
  const completion = apts.filter(a => a.status === "completed").length / Math.max(apts.length, 1);

  const recs = [
    {
      icon: Users,
      title: peak ? `Hire additional staff between ${peak[0]}:00 and ${(+peak[0] + 1).toString().padStart(2, "0")}:00` : "Increase staffing during midday peak",
      tag: "Staffing",
      detail: `Current utilization peaks at this window with ~${peak?.[1] || 0} customers. Adding one counter-staff could reduce wait times by an estimated 18%.`,
    },
    {
      icon: TrendingUp,
      title: `Add ${Math.max(2, Math.round(services.length * 0.3))} more service counters on Fridays`,
      tag: "Capacity",
      detail: `Friday demand consistently runs 22% above weekly average. Pre-allocating counters mitigates afternoon congestion.`,
    },
    {
      icon: CalendarClock,
      title: `Open additional appointment slots between 10:00 and 13:00`,
      tag: "Scheduling",
      detail: `${apts.length} appointments observed in the last 30 days with high conversion in the morning window — add 6 slots/day to capture overflow.`,
    },
    {
      icon: Lightbulb,
      title: `Cross-train ${Math.min(totalEmps, 3)} employees on top services`,
      tag: "Workforce",
      detail: `Completion rate is currently ${Math.round(completion * 100)}%. Cross-training shortens handover times during peak hours.`,
    },
  ];

  return (
    <div>
      <PageHeader title="AI Recommendations" subtitle="Insights generated from your live analytics and simulation outputs." />
      <div className="grid gap-4 md:grid-cols-2">
        {recs.map((r, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><r.icon className="h-5 w-5" /></span>
                <Badge variant="outline">{r.tag}</Badge>
              </div>
              <CardTitle className="mt-2 text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{r.detail}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
