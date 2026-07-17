import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Filter,
  Download,
  Search,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute(
  "/super-admin/users"
)({
  component: UsersPage,
});

const STATUS_LABELS: Record<"all" | "active" | "disabled", string> = {
  all: "All statuses",
  active: "Active",
  disabled: "Disabled",
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function UsersPage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const users = useDb(() =>
    db
      .all("users")
      .filter(
        (u: any) =>
          u.role === "org_admin" ||
          u.role === "organization_admin"
      )
  );

  const orgs = useDb(() =>
    db.all("organizations")
  );

  const orgName = (orgId: any) =>
    orgs.find((o: any) => o.id === orgId)?.name ?? "—";

  const filteredUsers = useMemo(() => {
    let result = users;

    if (statusFilter !== "all") {
      result = result.filter((u: any) => u.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.mobile?.toLowerCase?.().includes(q) ||
          orgName(u.organization_id).toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, statusFilter, search, orgs]);

  // Reset to first page whenever the filters/search/page size change
  // the underlying result set.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, pageSize]);

  const totalCount = users.length;
  const activeCount = users.filter((u: any) => u.status === "active").length;
  const disabledCount = users.filter((u: any) => u.status === "disabled").length;

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalFiltered);

  function exportCsv() {
    if (!filteredUsers.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Mobile",
      "Organization",
      "Status",
    ];

    const csv = [
      headers.join(","),
      ...filteredUsers.map((user: any) =>
        [
          user.name,
          user.email,
          user.mobile,
          orgName(user.organization_id),
          user.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "organization-admins.csv";
    a.click();

    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  return (
    <div>
      <PageHeader
        title="Organization Admins"
        subtitle="Manage organization administrator accounts."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admins..."
                className="h-9 w-64 pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  {STATUS_LABELS[statusFilter]}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                  Active
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setStatusFilter("disabled")}>
                  Disabled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={exportCsv} className="gap-2">
                  <img
                    src={CsvLogo}
                    alt="CSV"
                    className="h-5 w-5 object-contain"
                  />
                  CSV
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => toast.error("Excel export not implemented")}
                  className="gap-2"
                >
                  <img
                    src={ExcelLogo}
                    alt="Excel"
                    className="h-5 w-5 object-contain"
                  />
                  Excel
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => toast.error("PDF export not implemented")}
                  className="gap-2"
                >
                  <img
                    src={PdfLogo}
                    alt="PDF"
                    className="h-5 w-5 object-contain"
                  />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* ── Summary strip ── */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{totalCount}</p>
            <p className="text-sm text-muted-foreground">Total admins</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{disabledCount}</p>
            <p className="text-sm text-muted-foreground">Disabled</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-5 border-b bg-muted/50 p-3 text-sm font-semibold">
          <div>Name</div>
          <div>Email</div>
          <div>Mobile</div>
          <div>Organization</div>
          <div>Status</div>
        </div>

        {paginatedUsers.map((user: any) => (
          <div
            key={user.id}
            className="grid grid-cols-5 items-center border-b p-3 text-sm last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                {initials(user.name || "?")}
              </div>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="text-muted-foreground">{user.email}</div>
            <div className="text-muted-foreground">{user.mobile}</div>

            <div className="text-muted-foreground">
              {orgName(user.organization_id)}
            </div>

            <div>
              <button
                onClick={() => {
                  db.update(
                    "users",
                    user.id,
                    {
                      status:
                        user.status ===
                        "active"
                          ? "disabled"
                          : "active",
                    } as never
                  );

                  toast.success(
                    "Status updated"
                  );
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  user.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {user.status === "active" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {user.status === "active"
                  ? "Active"
                  : "Disabled"}
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No organization admins match your filters.
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="flex flex-col gap-3 border-t bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing {rangeStart}–{rangeEnd} of {totalFiltered}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                    {pageSize} / page
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-28">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => setPageSize(size)}
                    >
                      {size} / page
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <span className="px-2 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}