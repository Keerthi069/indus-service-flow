import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/portal/PortalShell";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  Building2,
  HeartPulse,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Headset,
  Plus,
  Download,
  ChevronDown,
  Search,
  LayoutGrid,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/super-admin/categories")({
  component: CategoriesPage,
});

type Item = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
};

type Category = {
  id: string;
  label: string;
  status: "Active" | "Inactive";
  items: Item[];
};

const CATEGORY_ICONS: Record<string, typeof Building2> = {
  hospitals: HeartPulse,
  clinics: Stethoscope,
  banks: Landmark,
  retail: ShoppingBag,
  support: Headset,
};

function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [form, setForm] = useState({
    categoryName: "",
  });

  const [categories, setCategories] = useState<Category[]>([
    {
      id: "hospitals",
      label: "Hospitals",
      status: "Active",
      items: [
        { id: "h1", name: "Apollo Hospitals", city: "Chennai", state: "TN", status: "Active" },
      ],
    },
    {
      id: "clinics",
      label: "Clinics",
      status: "Active",
      items: [
        { id: "c1", name: "Care Clinic", city: "Hyderabad", state: "TG", status: "Active" },
      ],
    },
    {
      id: "banks",
      label: "Banks",
      status: "Active",
      items: [
        { id: "b1", name: "State Bank of India", city: "Mumbai", state: "MH", status: "Active" },
      ],
    },
    {
      id: "retail",
      label: "Retail",
      status: "Active",
      items: [
        { id: "r1", name: "Reliance Retail", city: "Mumbai", state: "MH", status: "Active" },
      ],
    },
    {
      id: "support",
      label: "Customer Support",
      status: "Active",
      items: [
        { id: "s1", name: "Customer Care Center", city: "Bengaluru", state: "KA", status: "Active" },
      ],
    },
  ]);

  // Only category-level info is shown now — filter by category name.
  const filtered = useMemo(() => {
    return categories.filter((cat) =>
      cat.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.status === "Active").length;
  const inactiveCategories = totalCategories - activeCategories;

  function addNewCategory() {
    if (!form.categoryName) {
      toast.error("Category name required");
      return;
    }

    const id = form.categoryName.toLowerCase().replace(/\s+/g, "-");

    if (categories.find((c) => c.id === id)) {
      toast.error("Category already exists");
      return;
    }

    const newCat: Category = {
      id,
      label: form.categoryName,
      status: "Active",
      items: [],
    };

    setCategories((prev) => [...prev, newCat]);

    toast.success("Category added");

    setForm({ categoryName: "" });
    setOpen(false);
  }

  // Toggle a category's own status (mirrors service-categories toggleStatus).
  function toggleCategoryStatus(id: string) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id
          ? { ...cat, status: cat.status === "Active" ? "Inactive" : "Active" }
          : cat
      )
    );

    toast.success("Status updated");
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function csvCell(value: string) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  // Export now reflects categories + their organization counts, not
  // individual organizations.
  function exportData(type: "csv" | "xls" | "pdf") {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    const baseName = "categories";

    if (type === "csv") {
      const rows = [
        ["Category", "Organizations", "Status"],
        ...filtered.map((c) => [c.label, String(c.items.length), c.status]),
      ];
      const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${baseName}.csv`);
    }

    if (type === "xls") {
      const ws = XLSX.utils.json_to_sheet(
        filtered.map((c) => ({
          Category: c.label,
          Organizations: c.items.length,
          Status: c.status,
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Categories");
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    }

    if (type === "pdf") {
      const pdf = new jsPDF();
      pdf.setFontSize(14);
      pdf.text("Categories", 14, 15);
      autoTable(pdf, {
        startY: 20,
        head: [["Category", "Organizations", "Status"]],
        body: filtered.map((c) => [c.label, String(c.items.length), c.status]),
      });
      pdf.save(`${baseName}.pdf`);
    }

    toast.success(`Exported ${type.toUpperCase()}`);
  }

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Manage dynamic organization categories across the platform."
        actions={
          <div className="flex items-center gap-3">
            {/* SEARCH — now searches category names only */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* EXPORT DROPDOWN */}
            <div className="relative">
              <Button variant="outline" onClick={() => setExportOpen((p) => !p)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-lg border bg-white shadow-md z-50">
                  <button
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      exportData("csv");
                      setExportOpen(false);
                    }}
                  >
                    <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain mr-2" />
                    <span>CSV</span>
                  </button>

                  <button
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    onClick={() => {
                      exportData("xls");
                      setExportOpen(false);
                    }}
                  >
                    <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain mr-2" />
                    <span>Excel</span>
                  </button>

                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm flex items-center"
                    onClick={() => {
                      exportData("pdf");
                      setExportOpen(false);
                    }}
                  >
                    <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain mr-2" />
                    PDF
                  </button>
                </div>
              )}
            </div>

            {/* NEW CATEGORY */}
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
        }
      />

      {/* STAT CARDS */}
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

      {/* CATEGORY CARDS — shows only categories, each with org count + status toggle */}
      <div className="rounded-2xl border bg-card p-5 mt-4">
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? Building2;

              return (
                <Card key={cat.id} className="rounded-xl transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{cat.label}</h3>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold">{cat.items.length}</div>
                        <div className="text-xs text-muted-foreground">Organizations</div>
                      </div>

                      <button
                        onClick={() => toggleCategoryStatus(cat.id)}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                          cat.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {cat.status}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No categories found.
          </p>
        )}
      </div>

      {/* DIALOG — now only adds a category */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={form.categoryName}
                onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={addNewCategory}>
              Save Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}