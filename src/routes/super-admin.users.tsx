import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Power, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/users")({ component: UsersPage });

function UsersPage() {
  const users = useDb(() => db.all("users"));
  const orgs = useDb(() => db.all("organizations"));
  return (
    <div>
      <PageHeader title="Users" subtitle="All platform users across roles." />
      <DataTable
        data={users}
        exportName="users"
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "email", header: "Email" },
          { key: "mobile", header: "Mobile" },
          { key: "role", header: "Role", render: r => <Badge variant="outline" className="capitalize">{r.role.replace("_", " ")}</Badge> },
          { key: "organization_id", header: "Organization", render: r => orgs.find(o => o.id === r.organization_id)?.name || "—" },
          { key: "status", header: "Status", render: r => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge> },
        ]}
        rowActions={r => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => {
              db.update("users", r.id, { status: r.status === "active" ? "disabled" : "active" } as never);
              toast.success("Updated");
            }}><Power className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { db.remove("users", r.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
}
