
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download, Filter } from "lucide-react";

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




export function DataTable<T extends { id: string }>({
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

  const rows = useMemo(() => {
    let result = [...data];

    if (sortKey) {
      const column = columns.find(
        (c) => String(c.key) === sortKey
      );

      const getValue =
        column?.sortValue ||
        ((row: T) =>
          String((row as any)[sortKey] ?? ""));

      result.sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);

        if (av < bv)
          return sortDir === "asc" ? -1 : 1;

        if (av > bv)
          return sortDir === "asc" ? 1 : -1;

        return 0;
      });
    }

    return result;
  }, [data, columns, sortKey, sortDir]);

  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const headerRow = columns.map(
      (c) => c.header
    );

    const csv = [
      headerRow.join(","),
      ...rows.map((row) =>
        columns
          .map((column) => {
            const value =
              (column.sortValue
                ? column.sortValue(row)
                : (row as any)[column.key]) ?? "";

            const escaped = String(value).replace(
              /"/g,
              '""'
            );

            return /[,"\n]/.test(escaped)
              ? `"${escaped}"`
              : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = `${exportName}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                >
                  {column.sortable ? (
                    <button
                      onClick={() =>
                        toggleSort(
                          String(column.key)
                        )
                      }
                      className="inline-flex items-center gap-1"
                    >
                      {column.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    column.header
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
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                    >
                      {column.render
                        ? column.render(row)
                        : String(
                            (row as any)[
                              column.key
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
      <div className="flex items-center justify-between border-t px-3 py-2">
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