
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
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

export const Route = createFileRoute("/super-admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const logs = useDb(() => db.all("audit_logs"));

  const [actionFilter, setActionFilter] =
    useState<string>("all");

  const filteredLogs = useMemo(() => {
    if (actionFilter === "all") {
      return logs;
    }

    return logs.filter(
      (log) => log.action === actionFilter
    );
  }, [logs, actionFilter]);

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

    const a =
      document.createElement("a");

    a.href = url;
    a.download = "audit-logs.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track every meaningful action on the platform."
      />

      <div className="mb-4 flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action}
                onClick={() =>
                  setActionFilter(action)
                }
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
              className="h-9 gap-2"
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
              onClick={() =>
                window.print()
              }
            >
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        data={filteredLogs}
        exportName="audit-logs"
        columns={[
          {
            key: "created_at",
            header: "When",
            sortable: true,
            render: (r) =>
              new Date(
                r.created_at
              ).toLocaleString(),
          },
          {
            key: "user_name",
            header: "User",
            sortable: true,
          },
          {
            key: "action",
            header: "Action",
            render: (r) => (
              <Badge variant="outline">
                {r.action}
              </Badge>
            ),
          },
          {
            key: "entity",
            header: "Entity",
            sortable: true,
          },
          {
            key: "details",
            header: "Details",
          },
        ]}
      />
    </div>
  );
}



