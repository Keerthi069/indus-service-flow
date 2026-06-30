import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Search,
  Download,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { db, useDb, type AppointmentStatus } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const COLORS: Record<AppointmentStatus, string> = {
  confirmed:
    "bg-secondary/15 text-secondary border-secondary/30",

  completed:
    "bg-success/15 text-success border-success/30",

  cancelled:
    "bg-destructive/15 text-destructive border-destructive/30",

  rescheduled:
    "bg-warning/15 text-warning border-warning/30",

  in_progress:
    "bg-primary/15 text-primary border-primary/30",
};

export const Route = createFileRoute(
  "/org-admin/appointments"
)({
  component: ApptPage,
});

function ApptPage() {
  const { user } = useAuth();

  const orgId = user!.organization_id!;

  const rows = useDb(() =>
    db
      .all("appointments")
      .filter(
        (a) => a.organization_id === orgId
      )
  );

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      | "all"
      | "confirmed"
      | "completed"
      | "cancelled"
      | "rescheduled"
    >("all");

  const [page, setPage] = useState(1);

  const PAGE_SIZE = 5;

  const [sortKey, setSortKey] =
    useState<string>("date");

  const [sortDir, setSortDir] = useState<
    "asc" | "desc"
  >("asc");

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((p) =>
        p === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let data = [...rows];

    if (search.trim()) {
      data = data.filter((r) =>
        Object.values(r)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(
        (r) => r.status === statusFilter
      );
    }

    data.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (av < bv)
        return sortDir === "asc" ? -1 : 1;

      if (av > bv)
        return sortDir === "asc" ? 1 : -1;

      return 0;
    });

    return data;
  }, [
    rows,
    search,
    statusFilter,
    sortKey,
    sortDir,
  ]);

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  );

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function exportRows() {
    return filtered.map((r: any) => ({
      Token: r.token,
      Customer: r.customer_name,
      Service: r.service_name,
      Employee: r.employee_name,
      Date: r.date,
      Time: r.time,
      Status: r.status,
    }));
  }

  function exportCSV() {
    const ws = XLSX.utils.json_to_sheet(
      exportRows()
    );

    const csv =
      XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = "appointments.csv";

    a.click();

    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(
      exportRows()
    );

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Appointments"
    );

    XLSX.writeFile(
      wb,
      "appointments.xlsx"
    );
  }

  function exportPDF() {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [[
        "Token",
        "Customer",
        "Service",
        "Employee",
        "Date",
        "Time",
        "Status",
      ]],

      body: exportRows().map(
        Object.values
      ),
    });

    doc.save("appointments.pdf");
  }

  return (
      <div className="space-y-4">

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <Input
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />

          <div className="flex items-center gap-2">

            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

             <DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
    All
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>
    <span className="text-secondary">Confirmed</span>
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
    <span className="text-success">Completed</span>
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => setStatusFilter("rescheduled")}>
    <span className="text-warning">Rescheduled</span>
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
    <span className="text-destructive">Cancelled</span>
  </DropdownMenuItem>
</DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <DropdownMenu>
<DropdownMenuTrigger asChild>
  <Button variant="outline">
    <Download className="mr-2 h-4 w-4" />
    Export
    <ChevronDown className="ml-2 h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCSV}>
                  CSV
                </DropdownMenuItem>

                <DropdownMenuItem onClick={exportExcel}>
                  Excel
                </DropdownMenuItem>

                <DropdownMenuItem onClick={exportPDF}>
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

        </div>

        <div className="rounded-lg border">

          <Table>

            <TableHeader>

              <TableRow>

                {[
                  ["token", "Token"],
                  ["customer_name", "Customer"],
                  ["service_name", "Service"],
                  ["employee_name", "Employee"],
                  ["date", "Date"],
                  ["time", "Time"],
                ].map(([key, label]) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer"
                    onClick={() => toggleSort(key)}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                ))}

                <TableHead>Status</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {paginated.map((row: any) => (

                <TableRow key={row.id}>

                  <TableCell>{row.token}</TableCell>

                  <TableCell>{row.customer_name}</TableCell>

                  <TableCell>{row.service_name}</TableCell>

                  <TableCell>
                    {row.employee_name || "—"}
                  </TableCell>

                  <TableCell>{row.date}</TableCell>

                  <TableCell>{row.time}</TableCell>

                  <TableCell>

                    <DropdownMenu>

                      <DropdownMenuTrigger asChild>

                        <Badge
                          variant="outline"
                          className={`cursor-pointer capitalize ${COLORS[row.status as AppointmentStatus]}`}
                          onClick={(e) => {
                            if (row.status === "confirmed") {
                              e.preventDefault();

                              db.update(
                                "appointments",
                                row.id,
                                {
                                  status: "completed",
                                } as never
                              );

                              toast.success(
                                "Marked as completed"
                              );
                            }
                          }}
                        >
                          {row.status.replace("_", " ")}
                        </Badge>

                      </DropdownMenuTrigger>

                     <DropdownMenuContent align="end">
  <DropdownMenuItem
    onClick={() => {
      db.update(
        "appointments",
        row.id,
        { status: "completed" } as never
      );
      toast.success("Marked as completed");
    }}
  >
    Mark as Completed
  </DropdownMenuItem>

  <DropdownMenuItem
    onClick={() => {
      db.update(
        "appointments",
        row.id,
        { status: "rescheduled" } as never
      );
      toast.success("Marked as rescheduled");
    }}
  >
    Mark as Rescheduled
  </DropdownMenuItem>

  <DropdownMenuItem
    onClick={() => {
      db.update(
        "appointments",
        row.id,
        { status: "cancelled" } as never
      );
      toast.success("Marked as cancelled");
    }}
  >
    Mark as Cancelled
  </DropdownMenuItem>
</DropdownMenuContent>
                    </DropdownMenu>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">

          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {filtered.length === 0
              ? 0
              : (page - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(
              page * PAGE_SIZE,
              filtered.length
            )}
            {" of "}
            {filtered.length}
          </div>

          <div className="flex items-center gap-2">

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

            <span className="text-sm font-medium">
              {page} / {Math.max(totalPages, 1)}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={
                page >= Math.max(totalPages, 1)
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
