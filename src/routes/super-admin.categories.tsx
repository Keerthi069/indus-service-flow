import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db, uid, useDb, type Category } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/categories")({ component: CategoriesPage });

function CategoriesPage() {
  const cats = useDb(() => db.all("categories"));
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "Tag", description: "" });

  function openNew() { setEdit(null); setForm({ name: "", slug: "", icon: "Tag", description: "" }); setOpen(true); }
  function openEdit(c: Category) { setEdit(c); setForm({ name: c.name, slug: c.slug, icon: c.icon, description: c.description }); setOpen(true); }
  function save() {
    if (!form.name || !form.slug) { toast.error("Name and slug are required"); return; }
    if (edit) { db.update("categories", edit.id, form as never); toast.success("Category updated"); }
    else { db.insert("categories", { id: uid("cat"), ...form }); toast.success("Category added"); }
    setOpen(false);
  }

  return (
    <div>
      <PageHeader title="Categories" subtitle="Approved business categories supported by the platform."
        actions={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add category</Button>} />
      <DataTable
        data={cats}
        exportName="categories"
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "slug", header: "Slug" },
          { key: "description", header: "Description" },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { db.remove("categories", r.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Icon (Lucide name)</Label><Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
