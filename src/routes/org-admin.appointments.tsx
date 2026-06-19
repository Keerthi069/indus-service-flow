import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { db, useDb, type AppointmentStatus } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

const COLORS: Record<AppointmentStatus, string> = {
  confirmed: "bg-secondary/15 text-secondary border-secondary/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  rescheduled: "bg-warning/15 text-warning border-warning/30",
};

export const Route = createFileRoute("/org-admin/appointments")({ component: ApptPage });

function ApptPage() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const rows = useDb(() => db.all("appointments").filter(a => a.organization_id === orgId));
  return (
    <div>
      <PageHeader title="Appointments" subtitle="All appointments across statuses for your organization." />
      <DataTable
        data={rows}
        exportName="appointments"
        columns={[
          { key: "token", header: "Token", render: r => <Badge variant="outline">{r.token}</Badge> },
          { key: "appointment_no", header: "No.", sortable: true },
          { key: "customer_name", header: "Customer" },
          { key: "service_name", header: "Service" },
          { key: "employee_name", header: "Employee", render: r => r.employee_name || "—" },
          { key: "date", header: "Date", sortable: true },
          { key: "time", header: "Time" },
          { key: "status", header: "Status", render: r => <Badge variant="outline" className={`border capitalize ${COLORS[r.status]}`}>{r.status.replace("_", " ")}</Badge> },
        ]}
        rowActions={r => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["confirmed", "in_progress", "completed", "cancelled", "rescheduled"] as AppointmentStatus[]).map(s => (
                <DropdownMenuItem key={s} onClick={() => { db.update("appointments", r.id, { status: s } as never); toast.success(`Marked ${s}`); }}>Mark as {s.replace("_", " ")}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </div>
  );
}
