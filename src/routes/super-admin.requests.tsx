import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
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

import { db, useDb, type OrgRequest } from "@/lib/mock/db";

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
}

function exportData(type: "csv" | "xls" | "pdf", data: OrgRequest[]) {
  const base = data
    .map(r => `${r.name},${r.category},${r.contact_person},${r.email},${r.status}`)
    .join("\n");

  if (type === "csv") {
    download("requests.csv", "text/csv", "Name,Category,Contact,Email,Status\n" + base);
  }

  if (type === "xls") {
    download("requests.xls", "application/vnd.ms-excel", base);
  }

  if (type === "pdf") {
    download("requests.pdf", "application/pdf", base);
  }

  toast.success(`Exported ${type.toUpperCase()}`);
}

/* ---------------- PAGE ---------------- */

function RequestsPage() {
  const reqs = useDb(() => db.all("org_requests"));

  const [page, setPage] = useState(1);
  const [filter, setFilter] =
    useState<"all" | "pending" | "approved" | "rejected">("all");

  const pageSize = 5;

  const filtered = useMemo(() => {
    if (filter === "all") return reqs;
    return reqs.filter(r => r.status === filter);
  }, [reqs, filter]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  /* ---------------- UNIFIED BUTTON STYLE ---------------- */
  const iconBtn =
    "h-8 w-8 p-0 flex items-center justify-center border rounded-md hover:bg-muted";

  return (
    <div>
      <PageHeader
        title="Organization Requests"
        subtitle="Manage onboarding approvals"
        actions={
          <div className="flex gap-2 items-center">

            {/* FILTER */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>

              <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-md shadow-md w-36 z-10">
                {["all", "pending", "approved", "rejected"].map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f as any);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm hover:bg-muted text-left capitalize"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* EXPORT */}
            <div className="relative group">
              <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>

              <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-md shadow-md w-36 z-10">
                <button
                  className="w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={() => exportData("csv", filtered)}
                >
                  CSV
                </button>
                <button
                  className="w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={() => exportData("xls", filtered)}
                >
                  XLS
                </button>
                <button
                  className="w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={() => exportData("pdf", filtered)}
                >
                  PDF
                </button>
              </div>
            </div>

          </div>
        }
      />

      {/* TABLE */}
      <div className="mt-3 border rounded-lg bg-card overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-6 px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
          <div>Organization</div>
          <div>Category</div>
          <div>Contact</div>
          <div>Email</div>
          <div className="text-center">View</div>
          <div className="text-right">Actions</div>
        </div>

        {/* ROWS */}
        {paginated.map(r => (
          <div
            key={r.id}
            className="grid grid-cols-6 px-3 py-2 items-center border-b hover:bg-muted/20"
          >
            <div className="font-medium pr-2 truncate">{r.name}</div>

            <div className="pr-2">
              <Badge variant="secondary" className="text-xs">
                {r.category}
              </Badge>
            </div>

            <div className="pr-2 text-sm truncate">{r.contact_person}</div>

            <div className="pr-2 text-sm text-muted-foreground truncate">
              {r.email}
            </div>

            {/* VIEW */}
            <div className="flex justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <button className={iconBtn}>
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

            {/* ACTIONS */}
            <div className="flex justify-end gap-1 items-center">

              {r.status !== "pending" ? (
                <Badge className="text-xs px-2">
                  {r.status}
                </Badge>
              ) : (
                <>
                  <button
                    onClick={() => approve(r)}
                    className={iconBtn + " text-green-600"}
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => reject(r)}
                    className={iconBtn + " text-red-600"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}

            </div>
          </div>
        ))}

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-3 py-2 border-t text-xs">
          <div>
            Page {page} / {totalPages || 1}
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------- INFO ---------------- */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase">
        {label}
      </div>
      <div className="font-medium text-sm">{value || "-"}</div>
    </div>
  );
}