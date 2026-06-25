import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  Download,
  Search,
  Funnel,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export function DataTable<T extends { id: string; status?: string }>({
  data,
  columns,
  rowActions,
  pageSize = 10,
  exportName = "export",
}: {
  data: T[];
  columns: Column<T>[];
  rowActions?: (row: T) => ReactNode;
  pageSize?: number;
  exportName?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // FILTER
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [filterOpen, setFilterOpen] = useState(false);

  // EXPORT
  const [exportOpen, setExportOpen] = useState(false);

  const rows = useMemo(() => {
    let result = [...data];

    // SEARCH
    if (search.trim()) {
      result = result.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // FILTER
    if (statusFilter !== "all") {
      result = result.filter(
        (row: any) => row.status === statusFilter
      );
    }

    // SORT
    if (sortKey) {
      const column = columns.find(
        (c) => String(c.key) === sortKey
      );

      const getValue =
        column?.sortValue ||
        ((row: T) => String((row as any)[sortKey] ?? ""));

      result.sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);

        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, columns, sortKey, sortDir, search, statusFilter]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // ---------- EXPORT HELPERS ----------

  function getExportRows() {
    return rows.map((row) => {
      const obj: any = {};
      columns.forEach((col) => {
        obj[col.header] = col.sortValue
          ? col.sortValue(row)
          : (row as any)[col.key];
      });
      return obj;
    });
  }

  function exportCSV() {
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
    const ws = XLSX.utils.json_to_sheet(getExportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, `${exportName}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF();

    const headers = columns.map((c) => c.header);
    const dataRows = rows.map((row) =>
      columns.map((col) =>
        col.sortValue
          ? col.sortValue(row)
          : (row as any)[col.key]
      )
    );

    autoTable(doc, {
      head: [headers],
      body: dataRows,
    });

    doc.save(`${exportName}.pdf`);
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">

        {/* SEARCH */}
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2 relative">

          <div className="text-sm text-muted-foreground">
            {rows.length} records
          </div>

          {/* FILTER BUTTON */}
          <div className="relative">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 py-2"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <Funnel className="h-4 w-4" />
              Filter
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-md z-50">
                {["all", "active", "inactive"].map((f) => (
                  <button
                    key={f}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                      f === "active"
                        ? "text-green-600"
                        : f === "inactive"
                        ? "text-red-600"
                        : ""
                    }`}
                    onClick={() => {
                      setStatusFilter(f as any);
                      setFilterOpen(false);
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EXPORT DROPDOWN */}
          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm shadow-sm hover:bg-accent"
              onClick={() => setExportOpen((v) => !v)}
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-md z-50">
                <button
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  onClick={exportCSV}
                >
                  CSV
                </button>

                <button
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  onClick={exportExcel}
                >
                  Excel
                </button>

                <button
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  onClick={exportPDF}
                >
                  PDF
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={String(c.key)}>
                  {c.sortable ? (
                    <button
                      onClick={() => toggleSort(String(c.key))}
                      className="inline-flex items-center gap-1"
                    >
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
            {paginatedRows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((c) => (
                  <TableCell key={String(c.key)}>
                    {c.render
                      ? c.render(row)
                      : String((row as any)[c.key] ?? "")}
                  </TableCell>
                ))}
                {rowActions && (
                  <TableCell className="text-right">
                    {rowActions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}