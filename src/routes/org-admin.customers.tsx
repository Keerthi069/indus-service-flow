import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/portal/CrudPage";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/customers")({ component: CustPage });

function CustPage() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const rows = useDb(() => db.all("customers").filter(r => r.organization_id === orgId));
  return <CrudPage title="Customers" subtitle="Customer records associated with your organization." exportName="customers"
    table="customers" data={rows} orgId={orgId} defaults={{ status: "active", gender: "other" }}
    columns={[
      { key: "name", header: "Name", sortable: true },
      { key: "mobile", header: "Mobile" },
      { key: "email", header: "Email" },
      { key: "gender", header: "Gender", render: r => <span className="capitalize">{r.gender}</span> },
      { key: "service", header: "Service" },
      { key: "status", header: "Status", render: r => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: "name", label: "Name" }, { key: "mobile", label: "Mobile" },
      { key: "email", label: "Email", type: "email" }, { key: "service", label: "Service" },
    ]} />;
}
