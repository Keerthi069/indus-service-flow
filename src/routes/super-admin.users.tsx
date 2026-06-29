import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Filter, Download } from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";

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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");

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

  const filteredUsers = useMemo(() => {
    if (statusFilter === "all") {
      return users;
    }

    return users.filter(
      (u: any) => u.status === statusFilter
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
      ...filteredUsers.map((user: any) =>
        [
          user.name,
          user.email,
          user.mobile,
          orgs.find(
            (o: any) =>
              o.id === user.organization_id
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
                setStatusFilter("disabled")
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

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-5 border-b bg-muted/50 p-3 text-sm font-semibold">
          <div>Name</div>
          <div>Email</div>
          <div>Mobile</div>
          <div>Organization</div>
          <div>Status</div>
        </div>

        {filteredUsers.map((user: any) => (
          <div
            key={user.id}
            className="grid grid-cols-5 items-center border-b p-3 text-sm"
          >
            <div>{user.name}</div>
            <div>{user.email}</div>
            <div>{user.mobile}</div>

            <div>
              {orgs.find(
                (o: any) =>
                  o.id === user.organization_id
              )?.name || "—"}
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
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  user.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.status === "active"
                  ? "Active"
                  : "Disabled"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}