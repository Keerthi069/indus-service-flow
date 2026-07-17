import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FolderTree,
  Search,
  Plus,
  Download,
  Filter,
  ChevronDown,
  LayoutGrid,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/lib/auth";
import { db, useDb, uid, type ServiceCategory } from "@/lib/mock/db";

export const Route = createFileRoute("/org-admin/service-categories")({
  component: ServiceCategoriesPage,
});

type StatusFilter = "All" | "Active" | "Inactive";

function ServiceCategoriesPage() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [open, setOpen] = useState(false);

  // Live, org-scoped read from the shared mock DB (persists in localStorage).
  const rows = useDb(() =>
    db.all("service_categories").filter((category) => category.organization_id === orgId)
  );

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesFilter = filter === "All" ? true : item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  // Stat cards mirror the pattern used on Organizations / Categories pages.
  const totalCategories = rows.length;
  const activeCategories = rows.filter((r) => r.status === "Active").length;
  const inactiveCategories = rows.length - activeCategories;

  function createCategory() {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (!orgId) {
      toast.error("No organization found for this account");
      return;
    }

    const newRow: ServiceCategory = {
      id: uid("svccat"),
      organization_id: orgId,
      name: form.name,
      description: form.description,
      service_count: 0,
      status: form.status as "Active" | "Inactive",
      created_at: new Date().toISOString(),
    };

    db.insert("service_categories", newRow);

    setForm({ name: "", description: "", status: "Active" });
    setOpen(false);

    toast.success("Category created successfully");
  }

  function toggleStatus(category: ServiceCategory) {
    db.update("service_categories", category.id, {
      status: category.status === "Active" ? "Inactive" : "Active",
    });

    toast.success("Status updated");
  }

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    const csv = [
      ["ID", "Name", "Description", "Services", "Status"].join(","),
      ...filtered.map((r) => [r.id, r.name, r.description, r.service_count, r.status].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "service-categories.csv";
    link.click();

    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportExcel = () => {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        ID: r.id,
        Name: r.name,
        Description: r.description,
        Services: r.service_count,
        Status: r.status,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
    XLSX.writeFile(workbook, "service-categories.xlsx");

    toast.success("Excel exported");
  };

  const exportPdf = () => {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Service Categories", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["ID", "Name", "Description", "Services", "Status"]],
      body: filtered.map((r) => [r.id, r.name, r.description ?? "", r.service_count.toString(), r.status]),
    });

    doc.save("service-categories.pdf");
    toast.success("PDF exported");
  };

  return (
    <>
      <PageHeader
        title="Service Categories"
        subtitle="Organize services into logical business categories."
        actions={
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* STATUS FILTER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <Filter className="mr-2 h-4 w-4" />
                  {filter === "All" ? "All statuses" : filter}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("All")}>All statuses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("Inactive")}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* EXPORT */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={exportCsv} className="gap-2">
                  <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                  CSV
                </DropdownMenuItem>

                <DropdownMenuItem onClick={exportExcel} className="gap-2">
                  <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                  Excel
                </DropdownMenuItem>

                <DropdownMenuItem onClick={exportPdf} className="gap-2">
                  <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* NEW CATEGORY */}
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
        }
      />

      {/* STAT CARDS — same visual pattern as Organizations / Categories pages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <div className="text-sm text-muted-foreground">Total categories</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{activeCategories}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{inactiveCategories}</div>
            <div className="text-sm text-muted-foreground">Inactive</div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="rounded-2xl border bg-card p-5 mt-4">
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((category) => (
              <Card key={category.id} className="rounded-xl transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <FolderTree className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{category.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold">{category.service_count}</div>
                      <div className="text-xs text-muted-foreground">Services</div>
                    </div>

                    <button
                      onClick={() => toggleStatus(category)}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                        category.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      {category.status}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No service categories found for your organization.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <Button className="w-full" onClick={createCategory}>
              Save Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}