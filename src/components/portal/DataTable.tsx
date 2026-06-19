import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends { id: string }>({
  data, columns, search = (r, q) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()),
  rowActions, filters, pageSize = 10, exportName = "export",
}: {
  data: T[]; columns: Column<T>[]; search?: (row: T, q: string) => boolean;
  rowActions?: (row: T) => ReactNode; filters?: ReactNode; pageSize?: number; exportName?: string;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = q ? data.filter(r => search(r, q)) : data;
    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      const get = col?.sortValue || ((r: T) => String((r as any)[sortKey] ?? ""));
      rows = [...rows].sort((a, b) => {
        const av = get(a), bv = get(b);
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, q, sortKey, sortDir, columns, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  function exportData(format: "csv" | "json") {
    const headerRow = columns.map(c => c.header);
    let blob: Blob;
    if (format === "csv") {
      const rows = [headerRow.join(","), ...filtered.map(r => columns.map(c => {
        const v = (c.sortValue ? c.sortValue(r) : (r as any)[c.key]) ?? "";
        const s = String(v).replace(/"/g, '""');
        return /[,\n"]/.test(s) ? `"${s}"` : s;
      }).join(","))].join("\n");
      blob = new Blob([rows], { type: "text/csv;charset=utf-8" });
    } else {
      blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    }
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${exportName}.${format}`; a.click(); URL.revokeObjectURL(url);
  }

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="w-72 pl-8" placeholder="Search..." />
        </div>
        {filters}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} rows</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Export</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportData("csv")}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("csv")}>Export Excel (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>Print / PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("json")}>Export JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(c => (
                <TableHead key={String(c.key)}>
                  {c.sortable ? (
                    <button onClick={() => toggleSort(String(c.key))} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.header} <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : c.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="py-12 text-center text-sm text-muted-foreground">No records found.</TableCell></TableRow>
            )}
            {slice.map(r => (
              <TableRow key={r.id}>
                {columns.map(c => (
                  <TableCell key={String(c.key)}>{c.render ? c.render(r) : String((r as any)[c.key] ?? "")}</TableCell>
                ))}
                {rowActions && <TableCell className="text-right">{rowActions(r)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm">
        <div className="text-muted-foreground">Page {cur} of {totalPages}</div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={cur === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button size="sm" variant="outline" disabled={cur === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
