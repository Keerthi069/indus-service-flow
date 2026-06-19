import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pause, Play, Phone, Repeat, Check } from "lucide-react";
import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/queues")({ component: QueuePage });

function QueuePage() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const today = new Date().toISOString().slice(0, 10);
  const apts = useDb(() => db.all("appointments").filter(a => a.organization_id === orgId && (a.date === today || a.status === "in_progress" || a.status === "confirmed")));

  const serving = apts.find(a => a.status === "in_progress");
  const waiting = apts.filter(a => a.status === "confirmed").sort((a, b) => a.time.localeCompare(b.time));
  const avgWait = 9 + (apts.length % 8);

  function callNext() {
    if (serving) { toast.error("Complete the current appointment first"); return; }
    const next = waiting[0];
    if (!next) { toast.error("Queue is empty"); return; }
    db.update("appointments", next.id, { status: "in_progress" } as never);
    toast.success(`Now serving ${next.token}`);
  }
  function setStatus(id: string, status: any) { db.update("appointments", id, { status } as never); toast.success("Updated"); }

  return (
    <div>
      <PageHeader title="Queue management" subtitle="Live queue for today." />
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Current customer" value={serving?.customer_name || "—"} />
        <Kpi label="Current token" value={serving?.token || "—"} />
        <Kpi label="Customers waiting" value={waiting.length} />
        <Kpi label="Avg wait time" value={`${avgWait}m`} />
      </div>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Actions</CardTitle>
          <div className="flex gap-2">
            <Button onClick={callNext}><Phone className="mr-1 h-4 w-4" /> Call next</Button>
            {serving && <>
              <Button variant="outline" onClick={() => setStatus(serving.id, "confirmed")}><Pause className="mr-1 h-4 w-4" /> Pause</Button>
              <Button variant="outline" onClick={() => setStatus(serving.id, "in_progress")}><Play className="mr-1 h-4 w-4" /> Resume</Button>
              <Button variant="outline" onClick={() => setStatus(serving.id, "rescheduled")}><Repeat className="mr-1 h-4 w-4" /> Transfer</Button>
              <Button onClick={() => setStatus(serving.id, "completed")}><Check className="mr-1 h-4 w-4" /> Complete</Button>
            </>}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={waiting}
            exportName="live-queue"
            columns={[
              { key: "token", header: "Token", render: r => <Badge variant="outline">{r.token}</Badge> },
              { key: "customer_name", header: "Customer" },
              { key: "service_name", header: "Service" },
              { key: "time", header: "Slot" },
              { key: "status", header: "Status", render: r => <Badge variant="secondary" className="capitalize">{r.status.replace("_", " ")}</Badge> },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
