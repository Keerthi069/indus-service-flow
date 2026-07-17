import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/portal/PortalShell";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  HeartPulse,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Headset,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronDown,
  Search,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { uid } from "@/lib/mock/db";
import { ORG_SEED, SERVICE_CATEGORY_DEFS } from "@/lib/mock/seed";

// Default Categories are PLATFORM-WIDE TEMPLATES, one set per business
// type — they are not organization-scoped rows, so (unlike everything
// else on the super-admin side) they intentionally do NOT live in the
// shared mock multi-tenant `db` (src/lib/mock/db.ts). They start from the
// same SERVICE_CATEGORY_DEFS definitions every seeded organization's own
// service categories were derived from (see seed.ts), and any Add / Edit /
// Delete / Status change the super admin makes here is persisted to its
// own small localStorage-backed store below.
type DefaultServiceCategory = {
  id: string;
  category: string; // business type slug, e.g. "hospital"
  name: string;
  description: string;
  status: "Active" | "Inactive";
  created_at: string;
};

type ExportKind = "csv" | "xls" | "pdf";

export const Route = createFileRoute("/super-admin/service-categories")({
  component: DefaultCategoriesPage,
});

// Same business-type list and icon set as the Categories page
// (super-admin.categories.tsx), so the two pages read as one system
// instead of inventing a second taxonomy.
const BUSINESS_TYPES: { slug: string; label: string; icon: typeof Building2; description: string }[] = [
  { slug: "hospital", label: "Hospitals", icon: HeartPulse, description: "Multi-specialty hospitals and medical centers" },
  { slug: "clinic", label: "Clinics", icon: Stethoscope, description: "Outpatient clinics and diagnostic centers" },
  { slug: "bank", label: "Banks", icon: Landmark, description: "Bank branches and financial services" },
  { slug: "retail", label: "Retail Stores", icon: ShoppingBag, description: "Retail outlets and showrooms" },
  { slug: "support", label: "Customer Support Centers", icon: Headset, description: "Customer service and support centers" },
];

// One accent color per business type, carried through the sidebar tile,
// the "starter kit" chips, and each category card's icon — a visual
// shorthand for "what kind of org is this" that doesn't need a label.
const ACCENTS: Record<string, { tile: string; soft: string; chip: string; border: string; bgTint: string }> = {
  hospital: {
    tile: "bg-rose-500 text-white",
    soft: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
    border: "border-l-rose-500",
    bgTint: "bg-rose-50/60 dark:bg-rose-950/10",
  },
  clinic: {
    tile: "bg-teal-500 text-white",
    soft: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
    chip: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800",
    border: "border-l-teal-500",
    bgTint: "bg-teal-50/60 dark:bg-teal-950/10",
  },
  bank: {
    tile: "bg-indigo-500 text-white",
    soft: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800",
    border: "border-l-indigo-500",
    bgTint: "bg-indigo-50/60 dark:bg-indigo-950/10",
  },
  retail: {
    tile: "bg-amber-500 text-white",
    soft: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    border: "border-l-amber-500",
    bgTint: "bg-amber-50/60 dark:bg-amber-950/10",
  },
  support: {
    tile: "bg-violet-500 text-white",
    soft: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    chip: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
    border: "border-l-violet-500",
    bgTint: "bg-violet-50/60 dark:bg-violet-950/10",
  },
};
// ── Default-category store (localStorage, NOT the shared mock db) ─────────

const DEFAULTS_STORAGE_KEY = "isf_default_categories_v1";

// Flattens SERVICE_CATEGORY_DEFS (seed.ts) into one row per business type /
// category, mirroring the "last one starts Inactive" convention used
// everywhere else in the seed data.
function buildInitialDefaults(): DefaultServiceCategory[] {
  const out: DefaultServiceCategory[] = [];
  let idx = 0;
  for (const bizType of Object.keys(SERVICE_CATEGORY_DEFS) as Array<keyof typeof SERVICE_CATEGORY_DEFS & string>) {
    const defs = SERVICE_CATEGORY_DEFS[bizType] as Array<{ name: string; description: string }>;
    defs.forEach((d, i) => {
      out.push({
        id: `svccat_default_${++idx}`,
        category: bizType,
        name: d.name,
        description: d.description,
        status: i === defs.length - 1 ? "Inactive" : "Active",
        created_at: new Date().toISOString(),
      });
    });
  }
  return out;
}

function loadDefaults(): DefaultServiceCategory[] {
  if (typeof window === "undefined") return buildInitialDefaults();
  try {
    const raw = localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialDefaults();
      localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as DefaultServiceCategory[];
  } catch {
    return buildInitialDefaults();
  }
}

function saveDefaults(rows: DefaultServiceCategory[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(rows));
  }
}

// ── Export helpers ──────────────────────────────────────────────────────────

function typeLabelFor(slug: string): string {
  return BUSINESS_TYPES.find((t) => t.slug === slug)?.label ?? slug;
}

function toExportRows(cats: DefaultServiceCategory[]): Record<string, string>[] {
  return cats.map((d) => ({
    Category: d.name,
    Description: d.description ?? "",
    "Business type": typeLabelFor(d.category),
    Status: d.status,
  }));
}

function downloadCsv(rows: Record<string, string>[], filenameBase: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadXlsx(rows: Record<string, string>[], filenameBase: string, sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filenameBase}.xlsx`);
}

function downloadPdf(rows: Record<string, string>[], filenameBase: string, title: string) {
  const pdf = new jsPDF();
  pdf.setFontSize(14);
  pdf.text(title, 14, 15);
  autoTable(pdf, {
    startY: 20,
    head: [Object.keys(rows[0])],
    body: rows.map((r) => Object.values(r)),
  });
  pdf.save(`${filenameBase}.pdf`);
}

function DefaultCategoriesPage() {
  const [activeType, setActiveType] = useState(BUSINESS_TYPES[0].slug);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DefaultServiceCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DefaultServiceCategory | null>(null);

  // Platform-wide templates, loaded once from the dedicated localStorage
  // store above (seeded from SERVICE_CATEGORY_DEFS the first time it's
  // ever read). Every CRUD action below updates this state and re-persists
  // it — there's no shared mock-db table backing this page.
  const [allDefaults, setAllDefaults] = useState<DefaultServiceCategory[]>(loadDefaults);

  const [form, setForm] = useState({ name: "", description: "", active: true });

  const type = BUSINESS_TYPES.find((t) => t.slug === activeType)!;
  const accent = ACCENTS[activeType];

  const rowsForType = useMemo(
    () => allDefaults.filter((d) => d.category === activeType),
    [allDefaults, activeType]
  );

  const filtered = useMemo(() => {
    return rowsForType.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.description ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [rowsForType, search]);

  const totalForType = rowsForType.length;
  const activeForType = rowsForType.filter((d) => d.status === "Active").length;
  const inactiveForType = totalForType - activeForType;

  // How many already-approved organizations belong to each business type —
  // shown so the super admin knows the blast radius of this list, even
  // though editing it never touches orgs that already have the category.
  const orgCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const org of ORG_SEED) counts[org.category] = (counts[org.category] ?? 0) + 1;
    return counts;
  }, []);

  function persist(rows: DefaultServiceCategory[]) {
    setAllDefaults(rows);
    saveDefaults(rows);
  }

  function selectType(slug: string) {
    setActiveType(slug);
    setSearch(""); // switching tabs used to leave a stale filter hiding everything
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", description: "", active: true });
    setOpen(true);
  }

  function openEdit(row: DefaultServiceCategory) {
    setEditing(row);
    setForm({ name: row.name, description: row.description ?? "", active: row.status === "Active" });
    setOpen(true);
  }

  function save() {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (editing) {
      persist(
        allDefaults.map((d) =>
          d.id === editing.id
            ? {
                ...d,
                name: form.name,
                description: form.description,
                status: form.active ? ("Active" as const) : ("Inactive" as const),
              }
            : d
        )
      );
      toast.success("Default category updated");
    } else {
      const row: DefaultServiceCategory = {
        id: uid("svccat_default"),
        category: activeType,
        name: form.name,
        description: form.description,
        status: form.active ? "Active" : "Inactive",
        created_at: new Date().toISOString(),
      };
      persist([...allDefaults, row]);
      toast.success(`Added to ${type.label} defaults`);
    }

    setOpen(false);
  }

  function toggleStatus(row: DefaultServiceCategory) {
    persist(
      allDefaults.map((d) =>
        d.id === row.id
          ? { ...d, status: d.status === "Active" ? ("Inactive" as const) : ("Active" as const) }
          : d
      )
    );
    toast.success("Status updated");
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    persist(allDefaults.filter((d) => d.id !== deleteTarget.id));
    toast.success(`Removed ${deleteTarget.name}`);
    setDeleteTarget(null);
  }

  // ── Export — current business type only ─────────────────────────────────

  function exportType(kind: ExportKind) {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }
    const rows = toExportRows(filtered);
    const base = `${type.slug}-default-categories`;
    if (kind === "csv") downloadCsv(rows, base);
    if (kind === "xls") downloadXlsx(rows, base, type.label);
    if (kind === "pdf") downloadPdf(rows, base, `${type.label} — Default Service Categories`);
    toast.success(`Exported ${kind.toUpperCase()}`);
  }

  return (
    <>
      <PageHeader
        title="Default Categories"
        subtitle="Set the service categories every organization starts with, based on its business type."
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: "260px 1fr" }}>
        {/* business type list */}
        <div className="rounded-2xl border bg-card overflow-hidden self-start">
          {BUSINESS_TYPES.map((t) => {
            const Icon = t.icon;
            const a = ACCENTS[t.slug];
            const count = allDefaults.filter((d) => d.category === t.slug && d.status === "Active").length;
            const selected = t.slug === activeType;
            return (
              <button
                key={t.slug}
                onClick={() => selectType(t.slug)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b last:border-b-0 border-l-4 transition-colors ${
                  selected ? `${a.bgTint} ${a.border}` : "border-l-transparent hover:bg-muted/50"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? a.tile : a.soft}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{t.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {count} active · {orgCountByType[t.slug] ?? 0} orgs
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* right panel */}
        <div>
          <PageHeader
            title={type.label}
            subtitle={type.description}
            actions={
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>

                {/* Export this business type — CSV/Excel/PDF */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => exportType("csv")} className="gap-3">
                      <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportType("xls")} className="gap-3">
                      <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportType("pdf")} className="gap-3">
                      <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </div>
            }
          />

          {/* stat cards, scoped to the selected business type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accent.soft}`}>
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalForType}</div>
                <div className="text-sm text-muted-foreground">Total categories</div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeForType}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inactiveForType}</div>
                <div className="text-sm text-muted-foreground">Inactive</div>
              </div>
            </div>
          </div>

          {/* category cards */}
          <div className="rounded-2xl border bg-card p-5">
            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((cat) => (
                  <Card key={cat.id} className="rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <CardContent className="p-5">
                      <div className="flex gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.tile}`}>
                          <type.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{cat.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(cat)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <button
                          onClick={() => toggleStatus(cat)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                            cat.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800"
                          }`}
                        >
                          {cat.status}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No default categories for {type.label} yet — add one so new organizations of this type don't start empty.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* add / edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Default Category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground -mt-2">For {type.label}</p>

            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Diagnostics"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What falls under this category?"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="cursor-pointer">Active for new organizations</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add category"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove "{deleteTarget?.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Organizations that already have this category keep it. New {type.label.toLowerCase()} organizations
            will no longer receive it by default.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}