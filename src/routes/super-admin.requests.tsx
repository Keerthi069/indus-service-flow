import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Eye, X } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db, uid, useDb, type OrgRequest } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/requests")({ component: RequestsPage });

function approve(r: OrgRequest) {
  db.insert("organizations", { ...r, status: "approved", plan: r.plan || "professional" });
  db.update("org_requests", r.id, { status: "approved" } as never);
  db.insert("users", {
    id: uid("user"), name: r.contact_person, email: r.email, password: "Org@1234",
    role: "org_admin", organization_id: r.id, mobile: r.mobile, status: "active", created_at: new Date().toISOString(),
  } as never);
  db.insert("audit_logs", { id: uid("log"), user_name: "Super Admin", action: "STATUS_CHANGE", entity: "Organization", details: `Approved ${r.name}`, created_at: new Date().toISOString() } as never);
  toast.success(`Approved ${r.name}. Default credentials: ${r.email} / Org@1234`);
}
function reject(r: OrgRequest) {
  db.update("org_requests", r.id, { status: "rejected" } as never);
  toast.success(`Rejected ${r.name}`);
}

function RequestsPage() {
  const reqs = useDb(() => db.all("org_requests"));
  return (
    <div>
      <PageHeader title="Organization Requests" subtitle="Approve or reject incoming organization sign-ups." />
      <DataTable
        data={reqs}
        exportName="organization-requests"
        columns={[
          { key: "name", header: "Organization", sortable: true },
          { key: "category", header: "Category", render: r => <Badge variant="secondary" className="capitalize">{r.category}</Badge> },
          { key: "contact_person", header: "Contact" },
          { key: "email", header: "Email" },
          { key: "city", header: "City" },
          { key: "status", header: "Status", render: r => <StatusBadge s={r.status} /> },
        ]}
        rowActions={r => (
          <div className="flex justify-end gap-1">
            <Dialog>
              <DialogTrigger asChild><Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{r.name}</DialogTitle></DialogHeader>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {(["category", "contact_person", "email", "mobile", "address", "city", "state", "country", "plan", "status"] as const).map(k => (
                    <div key={k}><dt className="text-xs uppercase text-muted-foreground">{k.replace("_", " ")}</dt><dd className="font-medium">{(r as any)[k]}</dd></div>
                  ))}
                </dl>
              </DialogContent>
            </Dialog>
            {r.status === "pending" && <>
              <Button size="icon" variant="ghost" className="text-success" onClick={() => approve(r)}><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => reject(r)}><X className="h-4 w-4" /></Button>
            </>}
          </div>
        )}
      />
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = { pending: "bg-warning/15 text-warning border-warning/30", approved: "bg-success/15 text-success border-success/30", rejected: "bg-destructive/15 text-destructive border-destructive/30" };
  return <Badge className={`border ${map[s] || ""}`} variant="outline">{s}</Badge>;
}
