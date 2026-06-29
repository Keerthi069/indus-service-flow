import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Filter, Download } from "lucide-react";

import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const logs = useDb(() =>
    db
      .all("audit_logs")
      .filter((l) => l.organization_id === orgId)
  );

  const [actionFilter, setActionFilter] =
    useState<string>("all");

  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;

  const filteredLogs = useMemo(() => {
    if (actionFilter === "all") {
      return logs;
    }

    return logs.filter(
      (log) => log.action === actionFilter
    );
  }, [logs, actionFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / PAGE_SIZE)
  );

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const actions = [
    "all",
    ...new Set(logs.map((l) => l.action)),
  ];

  function exportCsv() {
    const headers = [
      "When",
      "User",
      "Action",
      "Entity",
      "Details",
    ];

    const csv = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          log.created_at,
          log.user_name,
          log.action,
          log.entity,
          log.details,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "org-audit-logs.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all actions performed within your organization."
      />

      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-end gap-2 border-b p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action}
                  onClick={() => {
                    setActionFilter(action);
                    setPage(1);
                  }}
                >
                  {action === "all"
                    ? "All Actions"
                    : action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={exportCsv}
              >
                Export CSV
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={exportCsv}
              >
                Export Excel
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => window.print()}
              >
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-5 border-b bg-muted/50 p-3 text-sm font-semibold">
          <div>When</div>
          <div>User</div>
          <div>Action</div>
          <div>Entity</div>
          <div>Details</div>
        </div>

        {paginatedLogs.map((log) => (
          <div
            key={log.id}
            className="grid grid-cols-5 items-center border-b p-3 text-sm"
          >
            <div>
              {new Date(
                log.created_at
              ).toLocaleString()}
            </div>

            <div>{log.user_name}</div>

            <div>
              <Badge variant="outline">
                {log.action}
              </Badge>
            </div>

            <div>{log.entity}</div>

            <div>{log.details}</div>
          </div>
        ))}

        {paginatedLogs.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No audit logs found
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() =>
              setPage((p) => p - 1)
            }
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
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