import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/audit")({ component: AuditPage });

function AuditPage() {
  const logs = useDb(() => db.all("audit_logs"));
  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Track every meaningful action on the platform." />
      <DataTable
        data={logs}
        exportName="audit-logs"
        columns={[
          { key: "created_at", header: "When", sortable: true, render: r => new Date(r.created_at).toLocaleString() },
          { key: "user_name", header: "Actor" },
          { key: "action", header: "Action", render: r => <Badge variant="outline">{r.action}</Badge> },
          { key: "entity", header: "Entity" },
          { key: "details", header: "Details" },
        ]}
      />
    </div>
  );
}
