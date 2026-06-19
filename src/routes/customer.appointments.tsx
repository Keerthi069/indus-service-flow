import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarX, Repeat } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/customer/appointments")({ component: MyAppts });

function MyAppts() {
  const { user } = useAuth();
  const rows = useDb(() => db.all("appointments").filter(a => a.customer_email === user?.email && a.status !== "completed" && a.status !== "cancelled"));
  return (
    <div>
      <PageHeader title="My appointments" subtitle="Manage your upcoming visits." />
      <DataTable data={rows} exportName="my-appointments"
        columns={[
          { key: "appointment_no", header: "No." },
          { key: "service_name", header: "Service" },
          { key: "date", header: "Date" },
          { key: "time", header: "Time" },
          { key: "status", header: "Status", render: r => <Badge variant="secondary" className="capitalize">{r.status.replace("_", " ")}</Badge> },
        ]}
        rowActions={r => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { db.update("appointments", r.id, { status: "rescheduled" } as never); toast.success("Reschedule requested"); }}><Repeat className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { db.update("appointments", r.id, { status: "cancelled" } as never); toast.success("Cancelled"); }}><CalendarX className="h-4 w-4" /></Button>
          </div>
        )} />
    </div>
  );
}
