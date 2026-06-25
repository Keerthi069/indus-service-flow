import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/portal/CrudPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const services = useDb(() =>
    db.all("services").filter(
      (service) => service.organization_id === orgId
    )
  );

  const categories = useDb(() =>
    db.all("service_categories").filter(
      (category) => category.organization_id === orgId
    )
  );

  // 🔥 TOGGLE STATUS FUNCTION
  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    db.update("services", id, {
      status: newStatus,
    });
  };

  const rows = services.map((service) => ({
    ...service,
    categoryName:
      categories.find(
        (category) => category.id === service.category_id
      )?.name || "Unknown",
  }));

  return (
    <CrudPage
      title="Services"
      subtitle="Catalogue of services your customers can book."
      exportName="services"
      table="services"
      data={rows}
      orgId={orgId}
      defaults={{
        status: "active",
        category_id: "",
      }}
      columns={[
        {
          key: "name",
          header: "Service Name",
          sortable: true,
        },
        {
          key: "categoryName",
          header: "Category",
          sortable: true,
        },
        {
          key: "duration_min",
          header: "Duration",
          sortable: true,
          render: (row: any) => `${row.duration_min} min`,
        },
        {
          key: "fee",
          header: "Fee",
          sortable: true,
          render: (row: any) =>
            row.fee > 0
              ? `₹${Number(row.fee).toLocaleString("en-IN")}`
              : "Free",
        },
        {
          key: "status",
          header: "Status",
          sortable: true,
          render: (row: any) => (
            <Badge
              onClick={() => toggleStatus(row.id, row.status)}
              className={`cursor-pointer transition-colors ${
                row.status === "active"
                  ? "bg-green-100 text-green-700 border-green-400 hover:bg-green-200"
                  : "bg-red-100 text-red-700 border-red-400 hover:bg-red-200"
              }`}
            >
              {row.status}
            </Badge>
          ),
        },
      ]}
      fields={[
        {
          key: "category_id",
          label: "Service Category",
          type: "select",
          options: categories.map((category) => ({
            label: category.name,
            value: category.id,
          })),
        },
        {
          key: "name",
          label: "Service Name",
        },
        {
          key: "duration_min",
          label: "Duration (Minutes)",
          type: "number",
        },
        {
          key: "fee",
          label: "Fee (₹)",
          type: "number",
        },
      ]}
    />
  );
}