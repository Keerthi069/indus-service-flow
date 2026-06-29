import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/portal/CrudPage";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/employees")({
  component: EmpPage,
});

function EmpPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const rows = useDb(() =>
    db.all("employees").filter((r) => r.organization_id === orgId)
  );

  return (
    <CrudPage
      title="Employees"
      subtitle="Manage staff, designations and shifts."
      exportName="employees"
      table="employees"
      data={rows}
      orgId={orgId}
      defaults={{
        status: "active",
        rating: 4.5,
      }}
      columns={[
        {
          key: "name",
          header: "Name",
          sortable: true,
        },
        {
          key: "designation",
          header: "Designation",
        },
        {
          key: "mobile",
          header: "Mobile",
        },
        {
          key: "email",
          header: "Email",
        },
        {
          key: "shift",
          header: "Shift",
        },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <Badge
              onClick={() => {
                db.update("employees", r.id, {
                  status:
                    r.status === "active"
                      ? "inactive"
                      : "active",
                });
              }}
              className={`cursor-pointer border ${
                r.status === "active"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {r.status}
            </Badge>
          ),
        },
      ]}
      fields={[
        {
          key: "name",
          label: "Name",
        },
        {
          key: "designation",
          label: "Designation",
        },
        {
          key: "mobile",
          label: "Mobile",
        },
        {
          key: "email",
          label: "Email",
          type: "email",
        },
        {
          key: "shift",
          label: "Shift",
        },
      ]}
    />
  );
}