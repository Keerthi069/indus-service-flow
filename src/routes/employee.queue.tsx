import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Pause, Play } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { db, useDb, type AppointmentStatus } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/queue")({ component: EmpQueue });

function EmpQueue() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const rows = useDb(() => db.all("appointments").filter(a => a.organization_id === user?.organization_id && a.date === today));
  function set(id: string, status: AppointmentStatus) { db.update("appointments", id, { status } as never); toast.success("Updated"); }
  return (
    <div>
      <PageHeader title="My queue" subtitle="Take action on customers assigned to you today." />
      <DataTable data={rows} exportName="my-queue"
        columns={[
          { key: "token", header: "Token", render: r => <Badge variant="outline">{r.token}</Badge> },
          { key: "customer_name", header: "Customer" },
          { key: "service_name", header: "Service" },
          { key: "time", header: "Time" },
          { key: "status", header: "Status", render: r => <Badge variant="secondary" className="capitalize">{r.status.replace("_", " ")}</Badge> },
        ]}
        rowActions={r => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => set(r.id, "in_progress")}><Play className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => set(r.id, "confirmed")}><Pause className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => set(r.id, "completed")}><Check className="h-4 w-4" /></Button>
          </div>
        )} />
    </div>
  );
}
