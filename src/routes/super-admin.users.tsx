import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Power,
  Trash2,
  Filter,
  Download,
} from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function UsersPage() {
  const [statusFilter, setStatusFilter] =
    useState<
      "all" | "active" | "disabled"
    >("all");

  const users = useDb(() =>
    db
      .all("users")
      .filter(
        (u) =>
          u.role ===
            "organization_admin" ||
          u.role === "org_admin"
      )
  );

  const orgs = useDb(() =>
    db.all("organizations")
  );

  const filteredUsers = useMemo(() => {
    if (statusFilter === "all") {
      return users;
    }

    return users.filter(
      (u) => u.status === statusFilter
    );
  }, [users, statusFilter]);

  function exportCsv() {
    const headers = [
      "Name",
      "Email",
      "Mobile",
      "Organization",
      "Status",
    ];

    const csv = [
      headers.join(","),
      ...filteredUsers.map((user) =>
        [
          user.name,
          user.email,
          user.mobile,
          orgs.find(
            (o) =>
              o.id ===
              user.organization_id
          )?.name ?? "",
          user.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download =
      "organization-admins.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Organization Admins"
        subtitle="Manage organization administrator accounts."
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
            <DropdownMenuItem
              onClick={() =>
                setStatusFilter("all")
              }
            >
              All
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                setStatusFilter("active")
              }
            >
              Active
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                setStatusFilter(
                  "disabled"
                )
              }
            >
              Disabled
            </DropdownMenuItem>
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
        data={filteredUsers}
        exportName="organization-admins"
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
          },
          {
            key: "email",
            header: "Email",
          },
          {
            key: "mobile",
            header: "Mobile",
          },
          {
            key: "organization_id",
            header: "Organization",
            render: (r) =>
              orgs.find(
                (o) =>
                  o.id ===
                  r.organization_id
              )?.name || "—",
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <Badge
                variant={
                  r.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {r.status}
              </Badge>
            ),
          },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                db.update(
                  "users",
                  r.id,
                  {
                    status:
                      r.status ===
                      "active"
                        ? "disabled"
                        : "active",
                  } as never
                );

                toast.success(
                  "Status updated"
                );
              }}
            >
              <Power className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                db.remove(
                  "users",
                  r.id
                );

                toast.success(
                  "Deleted"
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}