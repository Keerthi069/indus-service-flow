import { forwardRef, useImperativeHandle, useMemo, useState, type ReactNode, type Ref } from "react";
import {
  ArrowUpDown,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

const STATUS_LABELS: Record<"all" | "active" | "inactive", string> = {
  all: "All statuses",
  active: "Active",
  inactive: "Inactive",
};

export interface DataTableHandle {
  exportCSV: () => void;
  exportExcel: () => void;
  exportPDF: () => void;
}

interface DataTableProps<T extends { id: string; status?: string }> {
  data: T[];
  columns: Column<T>[];
  rowActions?: (row: T) => ReactNode;
  pageSize?: number;
  exportName?: string;
  // When true, the built-in search/filter/export toolbar row is not
  // rendered — the parent (e.g. CrudPage) owns that UI in the page header
  // instead, and `data` passed in is expected to already be filtered.
  hideToolbar?: boolean;
}

function DataTableInner<T extends { id: string; status?: string }>(
  { data, columns, rowActions, pageSize = 10, exportName = "export", hideToolbar = false }: DataTableProps<T>,
  ref: Ref<DataTableHandle>
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Only used when this component owns its own toolbar. When hideToolbar
  // is true, `data` is assumed to already be search/status-filtered by
  // the parent, so these stay unused.
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const rows = useMemo(() => {
    let result = [...data];

    if (!hideToolbar) {
      if (search.trim()) {
        result = result.filter((row) =>
          Object.values(row).some((value) => String(value).toLowerCase().includes(search.toLowerCase()))
        );
      }
      if (statusFilter !== "all") {
        result = result.filter((row: any) => row.status === statusFilter);
      }
    }

    if (sortKey) {
      const column = columns.find((c) => String(c.key) === sortKey);
      const getValue = column?.sortValue || ((row: T) => String((row as any)[sortKey] ?? ""));

      result.sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, statusFilter, sortKey, sortDir, columns, hideToolbar]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize]
  );

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getExportRows() {
    return rows.map((row) => {
      const obj: any = {};
      columns.forEach((col) => {
        obj[col.header] = col.sortValue ? col.sortValue(row) : (row as any)[col.key];
      });
      return obj;
    });
  }

  function exportCSV() {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(getExportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(getExportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${exportName}.xlsx`);
  }

  function exportPDF() {
    if (!rows.length) return;
    const doc = new jsPDF();
    const headers = columns.map((c) => c.header);
    const dataRows = rows.map((row) =>
      columns.map((col) => (col.sortValue ? col.sortValue(row) : (row as any)[col.key]))
    );
    autoTable(doc, { head: [headers], body: dataRows });
    doc.save(`${exportName}.pdf`);
  }

  useImperativeHandle(ref, () => ({ exportCSV, exportExcel, exportPDF }));

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {!hideToolbar && (
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2 relative">
            <div className="text-sm text-muted-foreground whitespace-nowrap">{rows.length} records</div>

            <div className="relative">
              <Button variant="outline" onClick={() => setFilterOpen((v) => !v)}>
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
                        setPage(1);
                      }}
                    >
                      {STATUS_LABELS[f]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button variant="outline" onClick={() => setExportOpen((v) => !v)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              {exportOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-white shadow-md z-50">
                  <button
                    onClick={() => { exportCSV(); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <img src={CsvLogo} alt="" className="h-4 w-4 object-contain" />
                    CSV
                  </button>
                  <button
                    onClick={() => { exportExcel(); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <img src={ExcelLogo} alt="" className="h-4 w-4 object-contain" />
                    Excel
                  </button>
                  <button
                    onClick={() => { exportPDF(); setExportOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <img src={PdfLogo} alt="" className="h-4 w-4 object-contain" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={String(c.key)}>
                  {c.sortable ? (
                    <button onClick={() => toggleSort(String(c.key))} className="inline-flex items-center gap-1">
                      {c.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagedRows.length ? (
              pagedRows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={String(c.key)}>
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                    </TableCell>
                  ))}
                  {rowActions && <TableCell className="text-right">{rowActions(row)}</TableCell>}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const DataTable = forwardRef(DataTableInner) as <T extends { id: string; status?: string }>(
  props: DataTableProps<T> & { ref?: Ref<DataTableHandle> }
) => ReturnType<typeof DataTableInner>;