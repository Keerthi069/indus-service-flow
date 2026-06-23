import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Power, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const users = useDb(() =>
    db
      .all("users")
      .filter(
        (u) =>
          u.role === "organization_admin" ||
          u.role === "org_admin"
      )
  );

  const orgs = useDb(() => db.all("organizations"));

  return (
    <div>
      <PageHeader
        title="Organization Admins"
        subtitle="Manage organization administrator accounts."
      />

      <DataTable
        data={users}
        exportName="organization-admins"
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
          },
          {
            key: "email",
            header: "Email",
          },
          {
            key: "mobile",
            header: "Mobile",
          },
          {
            key: "organization_id",
            header: "Organization",
            render: (r) =>
              orgs.find(
                (o) => o.id === r.organization_id
              )?.name || "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Badge
                variant={
                  r.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {r.status}
              </Badge>
            ),
          },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                db.update(
                  "users",
                  r.id,
                  {
                    status:
                      r.status === "active"
                        ? "disabled"
                        : "active",
                  } as never
                );

                toast.success(
                  "Status updated"
                );
              }}
            >
              <Power className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                db.remove("users", r.id);

                toast.success("Deleted");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}