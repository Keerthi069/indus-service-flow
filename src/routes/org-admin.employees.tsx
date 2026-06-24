import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable, type Column } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, uid, useDb, type Employee } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/employees")({ component: EmpPage });

const CATEGORY_LABELS: Record<string, string> = {
  hospital: "Hospital",
  clinic: "Clinic",
  bank: "Bank",
  retail: "Retail Store",
  support: "Customer Support",
};

const columns: Column<Employee>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "designation", header: "Designation" },
  { key: "mobile", header: "Mobile" },
  { key: "email", header: "Email" },
  { key: "shift", header: "Shift" },
  {
    key: "status", header: "Status",
    render: r => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
  },
];

function EmpPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;
  const org = useDb(() => db.all("organizations").find(o => o.id === orgId));
  const allOrgs = useDb(() => db.all("organizations"));
  const allEmps = useDb(() => db.all("employees"));

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Employee | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  // Filter employees: if category is "all" show org's own employees, else filter by category across orgs
  const rows = (() => {
    if (categoryFilter === "all") {
      return allEmps.filter(e => e.organization_id === orgId);
    }
    const orgIds = allOrgs.filter(o => o.category === categoryFilter).map(o => o.id);
    return allEmps.filter(e => orgIds.includes(e.organization_id));
  })();

  const orgCategory = org?.category || "hospital";

  function openNew() {
    setEdit(null);
    setForm({ status: "active", rating: 4.5 });
    setOpen(true);
  }
  function openEdit(r: Employee) {
    setEdit(r);
    setForm({ ...r });
    setOpen(true);
  }
  function save() {
    const required = ["name", "designation", "mobile", "email", "shift"];
    for (const k of required) {
      if (!form[k]) { toast.error(`Please fill ${k}`); return; }
    }
    if (edit) {
      db.update("employees", edit.id, form as never);
      toast.success("Employee updated");
    } else {
      db.insert("employees", {
        id: uid("emp"), organization_id: orgId,
        ...form, created_at: new Date().toISOString(),
      } as never);
      toast.success("Employee added");
    }
    setOpen(false);
  }

  const categories = [...new Set(allOrgs.map(o => o.category))];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage staff, designations and shifts."
        actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>}
      />

      {/* Category filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${categoryFilter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
        >
          My Organization
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition capitalize ${categoryFilter === cat ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        exportName="employees"
        rowActions={r => r.organization_id === orgId ? (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { db.remove("employees", r.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ) : null}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Edit Employee" : "New Employee"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {[
              { key: "name", label: "Name" },
              { key: "designation", label: "Designation" },
              { key: "mobile", label: "Mobile" },
              { key: "email", label: "Email" },
              { key: "shift", label: "Shift (e.g. 09:00 - 17:00)" },
            ].map(f => (
              <div key={f.key} className="grid gap-1.5">
                <Label>{f.label}</Label>
                <Input value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
