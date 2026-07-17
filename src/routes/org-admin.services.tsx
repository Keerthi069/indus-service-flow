import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/portal/CrudPage";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";
import { Clock, IndianRupee, BadgeCheck, CircleSlash, Tag } from "lucide-react";


export const Route = createFileRoute("/org-admin/services")({
  component: ServicesPage,
});

// Same hex-pill status language used on Employees, Queues, Appointments,
// Customers and Organizations.
const STATUS_META = {
  active: { label: "Active", icon: BadgeCheck, color: "#1baf7a" },
  inactive: { label: "Inactive", icon: CircleSlash, color: "#dc2626" },
} as const;

function StatusBadge({ value }: { value: string }) {
  const meta = STATUS_META[value as keyof typeof STATUS_META] ?? STATUS_META.inactive;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

// A small rotating palette so every category gets a distinct, consistent
// color (keyed by category id, so it doesn't shuffle on re-render) — same
// approach used for category pills on the Organizations/Categories pages.
const CATEGORY_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#e2621b", "#6d5ce8", "#d6336c"];

function colorForCategory(id: string) {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

function CategoryBadge({ id, name }: { id: string; name: string }) {
  const color = colorForCategory(id);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ background: `${color}14`, borderColor: `${color}33`, color }}
    >
      <Tag className="h-3 w-3" />
      {name}
    </span>
  );
}

function ServicesPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const services = useDb(() =>
    db.all("services").filter((service) => service.organization_id === orgId)
  );

  const categories = useDb(() =>
    db.all("service_categories").filter((category) => category.organization_id === orgId)
  );

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    db.update("services", id, { status: newStatus });
  };

  const rows = services.map((service) => ({
    ...service,
    categoryName:
      categories.find((category) => category.id === service.category_id)?.name || "Unknown",
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
        category_id: categories[0]?.id ?? "",
      }}
      columns={[
        {
          key: "name",
          header: "Service Name",
          sortable: true,
        },
        {
          key: "categoryName",
          header: " Service Type",
          sortable: true,
          render: (row: any) => <CategoryBadge id={row.category_id} name={row.categoryName} />,
        },
        {
          key: "duration_min",
          header: "Duration",
          sortable: true,
          render: (row: any) => (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {row.duration_min} min
            </span>
          ),
        },
        {
          key: "fee",
          header: "Fee",
          sortable: true,
          render: (row: any) =>
            row.fee > 0 ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <IndianRupee className="h-3.5 w-3.5" />
                {Number(row.fee).toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-muted-foreground">Free</span>
            ),
        },
        {
          key: "status",
          header: "Status",
          sortable: true,
          render: (row: any) => (
            <button onClick={() => toggleStatus(row.id, row.status)} title="Click to toggle status">
              <StatusBadge value={row.status} />
            </button>
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