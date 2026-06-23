
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  rowActions,
  filters,
  pageSize = 10,
  exportName = "export",
}: {
  data: T[];
  columns: Column<T>[];
  rowActions?: (row: T) => ReactNode;
  filters?: ReactNode;
  pageSize?: number;
  exportName?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];

    if (sortKey) {
      const col = columns.find(
        (c) => String(c.key) === sortKey
      );

      const get =
        col?.sortValue ||
        ((r: T) =>
          String((r as any)[sortKey] ?? ""));

      rows.sort((a, b) => {
        const av = get(a);
        const bv = get(b);

        if (av < bv)
          return sortDir === "asc" ? -1 : 1;

        if (av > bv)
          return sortDir === "asc" ? 1 : -1;

        return 0;
      });
    }

    return rows;
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function exportCsv() {
    const headerRow = columns.map(
      (c) => c.header
    );

    const rows = [
      headerRow.join(","),
      ...filtered.map((r) =>
        columns
          .map((c) => {
            const value =
              (c.sortValue
                ? c.sortValue(r)
                : (r as any)[c.key]) ?? "";

            const escaped = String(
              value
            ).replace(/"/g, '""');

            return /[,"\n]/.test(escaped)
              ? `"${escaped}"`
              : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([rows], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) =>
        d === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Toolbar */}
<div className="flex items-center justify-end border-b border-border p-3">
  <div className="flex items-center gap-2">

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
        >
          Filter
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>All</DropdownMenuItem>
        <DropdownMenuItem>Active</DropdownMenuItem>
        <DropdownMenuItem>Inactive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCsv}>
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCsv}>
          Export Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}>
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  </div>
</div>
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead
                  key={String(c.key)}
                >
                  {c.sortable ? (
                    <button
                      onClick={() =>
                        toggleSort(
                          String(c.key)
                        )
                      }
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

              {rowActions && (
                <TableHead className="text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (rowActions ? 1 : 0)
                  }
                  className="py-12 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell
                      key={String(c.key)}
                    >
                      {c.render
                        ? c.render(row)
                        : String(
                            (row as any)[
                              c.key
                            ] ?? ""
                          )}
                    </TableCell>
                  ))}

                  {rowActions && (
                    <TableCell className="text-right">
                      {rowActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Previous
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              setPage((p) => p + 1)
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}



