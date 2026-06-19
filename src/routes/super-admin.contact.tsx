import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Reply, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/contact")({ component: ContactPage });

function ContactPage() {
  const msgs = useDb(() => db.all("contact_messages"));
  return (
    <div>
      <PageHeader title="Contact Messages" subtitle="Public contact form submissions." />
      <DataTable
        data={msgs}
        exportName="contact-messages"
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "email", header: "Email" },
          { key: "subject", header: "Subject" },
          { key: "message", header: "Message", render: r => <span className="text-muted-foreground">{r.message.slice(0, 80)}{r.message.length > 80 ? "…" : ""}</span> },
          { key: "created_at", header: "Date", render: r => new Date(r.created_at).toLocaleDateString() },
          { key: "status", header: "Status", render: r => <Badge variant={r.status === "new" ? "default" : "secondary"}>{r.status}</Badge> },
        ]}
        rowActions={r => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { db.update("contact_messages", r.id, { status: "replied" } as never); toast.success("Marked as replied"); }}><Reply className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { db.remove("contact_messages", r.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
    </div>
  );
}
