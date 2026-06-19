import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/portal/CrudPage";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/services")({ component: ServicesPage });

function ServicesPage() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const rows = useDb(() => db.all("services").filter(r => r.organization_id === orgId));
  return <CrudPage title="Services" subtitle="Catalogue of services your customers can book." exportName="services"
    table="services" data={rows} orgId={orgId} defaults={{ status: "active", category_id: "" }}
    columns={[
      { key: "name", header: "Service", sortable: true },
      { key: "duration_min", header: "Duration", render: r => `${r.duration_min} min` },
      { key: "fee", header: "Fee", render: r => r.fee > 0 ? `₹${r.fee.toLocaleString("en-IN")}` : "Free" },
      { key: "status", header: "Status", render: r => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge> },
    ]}
    fields={[
      { key: "name", label: "Service name" },
      { key: "duration_min", label: "Duration (minutes)", type: "number" },
      { key: "fee", label: "Fee (₹)", type: "number" },
    ]} />;
}
