import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, Pencil, Power, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/organizations")({ component: OrgsPage });

function OrgsPage() {
  const orgs = useDb(() => db.all("organizations"));
  return (
    <div>
      <PageHeader title="Organizations" subtitle="Manage all approved organizations." />
      <DataTable
        data={orgs}
        exportName="organizations"
        columns={[
          { key: "name", header: "Name", sortable: true, render: r => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></div> },
          { key: "category", header: "Category", render: r => <Badge variant="secondary" className="capitalize">{r.category}</Badge> },
          { key: "contact_person", header: "Contact" },
          { key: "mobile", header: "Mobile" },
          { key: "city", header: "City" },
          { key: "plan", header: "Plan", render: r => <Badge className="capitalize" variant="outline">{r.plan}</Badge> },
          { key: "status", header: "Status", render: r => <Badge variant={r.status === "approved" || r.status === "active" ? "default" : "secondary"} className="capitalize">{r.status}</Badge> },
        ]}
        rowActions={r => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => {
              const next = r.status === "active" || r.status === "approved" ? "inactive" : "active";
              db.update("organizations", r.id, { status: next } as never);
              toast.success(`Organization ${next}`);
            }}><Power className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { db.remove("organizations", r.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
}
