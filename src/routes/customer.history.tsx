import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/customer/history")({ component: History });

function History() {
  const { user } = useAuth();
  const rows = useDb(() => db.all("appointments").filter(a => a.customer_email === user?.email));
  return (
    <div>
      <PageHeader title="Appointment history" subtitle="All your past and current appointments." />
      <DataTable data={rows} exportName="my-history"
        columns={[
          { key: "appointment_no", header: "No.", sortable: true },
          { key: "service_name", header: "Service" },
          { key: "date", header: "Date", sortable: true },
          { key: "time", header: "Time" },
          { key: "status", header: "Status", render: r => <Badge variant="secondary" className="capitalize">{r.status.replace("_", " ")}</Badge> },
        ]} />
    </div>
  );
}
