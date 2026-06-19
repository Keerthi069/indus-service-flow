// Generic CRUD page helper for org-scoped tables
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable, type Column } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, uid } from "@/lib/mock/db";

export interface FieldDef { key: string; label: string; type?: "text" | "number" | "email"; }

export function CrudPage<T extends { id: string }>({
  title, subtitle, table, data, columns, fields, orgId, defaults = {}, exportName,
}: {
  title: string; subtitle?: string;
  table: any; data: T[]; columns: Column<T>[]; fields: FieldDef[];
  orgId?: string; defaults?: Record<string, any>; exportName: string;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  function openNew() { setEdit(null); setForm({ ...defaults }); setOpen(true); }
  function openEdit(r: T) { setEdit(r); setForm({ ...r }); setOpen(true); }
  function save() {
    for (const f of fields) if (form[f.key] === undefined || form[f.key] === "") { toast.error(`Please fill ${f.label}`); return; }
    if (edit) { db.update(table, edit.id, form as never); toast.success(`${title} updated`); }
    else {
      const row = { id: uid(table), organization_id: orgId, ...defaults, ...form, created_at: new Date().toISOString() };
      db.insert(table, row as never); toast.success(`${title} added`);
    }
    setOpen(false);
  }

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>} />
      <DataTable data={data} columns={columns} exportName={exportName} rowActions={r => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { db.remove(table, r.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? `Edit ${title}` : `New ${title}`}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {fields.map(f => (
              <div key={f.key} className="grid gap-1.5">
                <Label>{f.label}</Label>
                <Input type={f.type || "text"} value={form[f.key] ?? ""} onChange={e => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
