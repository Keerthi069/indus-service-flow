import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/portal/CrudPage";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/service-categories")({ component: SC });

function SC() {
  const { user } = useAuth(); const orgId = user!.organization_id!;
  const rows = useDb(() => db.all("service_categories").filter(r => r.organization_id === orgId));
  return <CrudPage title="Service Categories" subtitle="Group your services for easier discovery." exportName="service-categories"
    table="service_categories" data={rows} orgId={orgId}
    columns={[{ key: "name", header: "Name", sortable: true }, { key: "description", header: "Description" }]}
    fields={[{ key: "name", label: "Name" }, { key: "description", label: "Description" }]} />;
}
