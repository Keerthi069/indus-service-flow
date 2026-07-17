// Generic CRUD page helper for org-scoped tables

import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable, type Column, type DataTableHandle } from "@/components/portal/DataTable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db, uid } from "@/lib/mock/db";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "email" | "select";
  options?: {
    label: string;
    value: string;
  }[];
}

const STATUS_LABELS: Record<"all" | "active" | "inactive", string> = {
  all: "All statuses",
  active: "Active",
  inactive: "Inactive",
};

export function CrudPage<T extends { id: string; status?: string }>({
  title,
  subtitle,
  table,
  data,
  columns,
  fields,
  orgId,
  defaults = {},
  exportName,
  // Pages whose status values aren't "active"/"inactive" (e.g. Appointments
  // uses "confirmed"/"cancelled"/etc.) can opt out of the stat-card row and
  // the status filter, rather than showing a misleading Active/Inactive split.
  showStatusStats = true,
}: {
  title: string;
  subtitle?: string;
  table: any;
  data: T[];
  columns: Column<T>[];
  fields: FieldDef[];
  orgId?: string;
  defaults?: Record<string, any>;
  exportName: string;
  showStatusStats?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const tableRef = useRef<DataTableHandle>(null);

  // Total / Active / Inactive counts over the full (unfiltered) dataset —
  // same visual pattern as Organizations, Categories, and Service Categories.
  const { total, activeCount, inactiveCount } = useMemo(() => {
    const t = data.length;
    const a = data.filter((row) => String(row.status).toLowerCase() === "active").length;
    return { total: t, activeCount: a, inactiveCount: t - a };
  }, [data]);

  // Search + status filtering now lives here (header-driven), matching the
  // Employees page layout. DataTable receives already-filtered data and
  // only handles sorting/pagination/export.
  const filteredData = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      result = result.filter((row) =>
        Object.values(row).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (showStatusStats && statusFilter !== "all") {
      result = result.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }

    return result;
  }, [data, search, statusFilter, showStatusStats]);

  function openNew() {
    setEdit(null);
    setForm({ ...defaults });
    setOpen(true);
  }

  function openEdit(row: T) {
    setEdit(row);
    setForm({ ...row });
    setOpen(true);
  }

  function save() {
    for (const field of fields) {
      if (form[field.key] === undefined || form[field.key] === "") {
        toast.error(`Please fill ${field.label}`);
        return;
      }
    }

    if (edit) {
      db.update(table, edit.id, form as never);
      toast.success(`${title} updated`);
    } else {
      const row = {
        id: uid(table),
        organization_id: orgId,
        ...defaults,
        ...form,
        created_at: new Date().toISOString(),
      };

      db.insert(table, row as never);
      toast.success(`${title} added`);
    }

    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* STATUS FILTER */}
            {showStatusStats && (
              <div className="relative">
                <Button variant="outline" className="whitespace-nowrap" onClick={() => setFilterOpen((v) => !v)}>
                  <Filter className="mr-2 h-4 w-4" />
                  {STATUS_LABELS[statusFilter]}
                </Button>

                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-md z-50">
                    {(["all", "active", "inactive"] as const).map((f) => (
                      <button
                        key={f}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                        onClick={() => {
                          setStatusFilter(f);
                          setFilterOpen(false);
                        }}
                      >
                        {STATUS_LABELS[f]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EXPORT */}
            <div className="relative">
              <Button variant="outline" onClick={() => setExportOpen((v) => !v)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-white shadow-md z-50">
                  <button
                    onClick={() => { tableRef.current?.exportCSV(); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <img src={CsvLogo} alt="" className="h-4 w-4 object-contain" />
                    CSV
                  </button>
                  <button
                    onClick={() => { tableRef.current?.exportExcel(); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <img src={ExcelLogo} alt="" className="h-4 w-4 object-contain" />
                    Excel
                  </button>
                  <button
                    onClick={() => { tableRef.current?.exportPDF(); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <img src={PdfLogo} alt="" className="h-4 w-4 object-contain" />
                    PDF
                  </button>
                </div>
              )}
            </div>

            {/* ADD */}
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        }
      />

      {showStatusStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 mb-4">
          <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Total {title.toLowerCase()}</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{inactiveCount}</div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
          </div>
        </div>
      )}

      <DataTable
        ref={tableRef}
        data={filteredData}
        columns={columns}
        exportName={exportName}
        hideToolbar
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                db.remove(table, row.id);
                toast.success("Deleted");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            {fields.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <Label>{field.label}</Label>

                {field.type === "select" ? (
                  <Select
                    value={form[field.key] ?? ""}
                    onValueChange={(value) => setForm({ ...form, [field.key]: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>

                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type || "text"}
                    value={form[field.key] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}