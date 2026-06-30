import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Check,
  Eye,
  X,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  db,
  useDb,
  type OrgRequest,
} from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/requests")({
  component: RequestsPage,
});

/* ---------------- ACTIONS ---------------- */

function approve(r: OrgRequest) {
  db.update("org_requests", r.id, { status: "approved" } as never);
  toast.success(`Approved ${r.name}`);
}

function reject(r: OrgRequest) {
  db.update("org_requests", r.id, { status: "rejected" } as never);
  toast.success(`Rejected ${r.name}`);
}

/* ---------------- EXPORT ---------------- */

function download(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(data: OrgRequest[]) {
  const header = "Name,Category,Contact,Email,Status";
  const rows = data.map((r) =>
    [r.name, r.category, r.contact_person, r.email, r.status]
      .map(escapeCsv)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

// XLS export uses an HTML table wrapped in an Excel-readable shell — this is
// the standard lightweight way to produce a real, openable .xls without a
// heavy spreadsheet library, rather than mislabeling plain CSV text as XLS.
function toXlsHtml(data: OrgRequest[]) {
  const rows = data
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.category}</td>
        <td>${r.contact_person}</td>
        <td>${r.email}</td>
        <td>${r.status}</td>
      </tr>`,
    )
    .join("");
  return `<html><head><meta charset="utf-8"></head><body>
    <table border="1">
      <tr><th>Name</th><th>Category</th><th>Contact</th><th>Email</th><th>Status</th></tr>
      ${rows}
    </table>
  </body></html>`;
}

function exportData(type: "csv" | "xls", data: OrgRequest[]) {
  if (data.length === 0) {
    toast.error("Nothing to export for the current filter.");
    return;
  }

  if (type === "csv") {
    download("requests.csv", "text/csv;charset=utf-8", toCsv(data));
  }

  if (type === "xls") {
    download("requests.xls", "application/vnd.ms-excel", toXlsHtml(data));
  }

  toast.success(`Exported ${type.toUpperCase()}`);
}

/* ---------------- PAGE ---------------- */

const FILTERS = ["all", "pending", "approved", "rejected"] as const;
type FilterValue = (typeof FILTERS)[number];

function RequestsPage() {
  const reqs = useDb(() => db.all("org_requests"));

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterValue>("all");

  const pageSize = 5;

  const filtered = useMemo(() => {
    if (filter === "all") return reqs;
    return reqs.filter((r) => r.status === filter);
  }, [reqs, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Keep page in range whenever the filtered set shrinks (e.g. switching
  // filters, or an item getting approved/rejected off the current page).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const iconBtn =
    "h-8 w-8 p-0 flex items-center justify-center border rounded-md hover:bg-muted disabled:hover:bg-transparent";

  return (
    <div>
      <PageHeader
        title="Organization Requests"
        subtitle="Manage onboarding approvals"
        actions={
          <div className="flex items-center gap-2">
            {/* FILTER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                  <Filter className="h-4 w-4" />
                  Filter
                  {filter !== "all" && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] capitalize">
                      {filter}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {FILTERS.map((f) => (
                  <DropdownMenuItem
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    className="justify-between capitalize"
                  >
                    {f}
                    {filter === f && <Check className="h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* EXPORT */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => exportData("csv", filtered)}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData("xls", filtered)}>
                  Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* TABLE */}
      <div className="mt-3 overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[840px]">
            {/* HEADER */}
            <div className="grid grid-cols-7 gap-2 border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
              <div className="col-span-1">Organization</div>
              <div className="col-span-1">Category</div>
              <div className="col-span-1">Contact</div>
              <div className="col-span-1">Email</div>
              <div className="col-span-1 text-center">View</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* EMPTY STATE */}
            {paginated.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">
                  {filter === "all"
                    ? "No organization requests yet."
                    : `No ${filter} requests.`}
                </p>
                {filter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
                    Clear filter
                  </Button>
                )}
              </div>
            )}

            {/* ROWS */}
            {paginated.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-7 items-center gap-2 border-b px-3 py-2 hover:bg-muted/20"
              >
                <div className="truncate pr-2 font-medium">{r.name}</div>

                <div className="pr-2">
                  <Badge variant="secondary" className="text-xs">
                    {r.category}
                  </Badge>
                </div>

                <div className="truncate pr-2 text-sm">{r.contact_person}</div>

                <div className="truncate pr-2 text-sm text-muted-foreground">
                  {r.email}
                </div>

                {/* VIEW */}
                <div className="flex justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className={iconBtn} aria-label={`View ${r.name}`}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{r.name}</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <Info label="Category" value={r.category} />
                        <Info label="Contact" value={r.contact_person} />
                        <Info label="Email" value={r.email} />
                        <Info label="Mobile" value={r.mobile} />
                        <Info label="City" value={r.city} />
                        <Info label="Status" value={r.status} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* STATUS */}
                <div className="flex justify-center">
                  {r.status === "approved" && (
                    <Badge className="w-24 justify-center" variant="default">
                      Approved
                    </Badge>
                  )}

                  {r.status === "rejected" && (
                    <Badge className="w-24 justify-center" variant="destructive">
                      Rejected
                    </Badge>
                  )}

                  {r.status === "pending" && (
                    <Badge className="w-24 justify-center bg-yellow-500 text-white hover:bg-yellow-500">
                      Pending
                    </Badge>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    disabled={r.status === "approved"}
                    onClick={() => approve(r)}
                    aria-label={`Approve ${r.name}`}
                    className={`${iconBtn} ${
                      r.status === "approved"
                        ? "cursor-not-allowed text-green-600 opacity-40"
                        : "text-green-600"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  <button
                    disabled={r.status === "rejected"}
                    onClick={() => reject(r)}
                    aria-label={`Reject ${r.name}`}
                    className={`${iconBtn} ${
                      r.status === "rejected"
                        ? "cursor-not-allowed text-red-600 opacity-40"
                        : "text-red-600"
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="text-sm text-muted-foreground">
            {filtered.length === 0
              ? "No results"
              : `Page ${page} of ${totalPages} · ${filtered.length} total`}
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}