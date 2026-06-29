import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

import {
  Funnel,
  Download,
  FileSpreadsheet,
  FileText,
  File,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/org-admin/customers")({
  component: CustPage,
});

function CustPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const rows = useDb(() =>
    db.all("customers").filter((r) => r.organization_id === orgId)
  );

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "waiting" | "in_service" | "served"
  >("all");

  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const filteredRows = useMemo(() => {
    let data = rows;

    if (statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      data = data.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.mobile?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.service?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [rows, statusFilter, search]);

  // =========================
  // EXPORT FUNCTIONS
  // =========================

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    XLSX.writeFile(wb, "customers.xlsx");
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "customers.csv";
    link.click();
  };

  const exportPDF = () => {
    const pdf = new jsPDF();

    autoTable(pdf, {
      head: [["Name", "Mobile", "Email", "Service", "Status"]],
      body: filteredRows.map((r) => [
        r.name,
        r.mobile,
        r.email,
        r.service,
        r.status,
      ]),
    });

    pdf.save("customers.pdf");
  };

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-muted-foreground">
          Customer records associated with your organization.
        </p>
      </div>

 
      {/* TABLE */}
      <div className="rounded-lg border overflow-hidden">

             {/* TOOLBAR */}
     <div className="flex flex-col gap-3 border-b bg-background p-4 md:flex-row md:items-center md:justify-between">
<Input
  placeholder="Search customers..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="w-full md:max-w-sm"
/>
<div className="flex items-center gap-2 shrink-0">

  <div className="text-sm font-medium text-muted-foreground">
    {filteredRows.length} Rows
  </div>

          {/* FILTER */}
         <div className="relative z-50">

           <Button
  variant="outline"
  onClick={() => {
    setFilterOpen(!filterOpen);
    setExportOpen(false);
  }}
>
  <Funnel className="mr-2 h-4 w-4" />
  Filter
</Button>
            {filterOpen && (
  <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-md z-50">

    <button
      className="w-full px-3 py-2 text-left hover:bg-accent"
      onClick={() => {
        setStatusFilter("all");
        setFilterOpen(false);
      }}
    >
      All
    </button>

    <button
      className="w-full px-3 py-2 text-left text-yellow-600 font-medium hover:bg-yellow-50"
      onClick={() => {
        setStatusFilter("waiting");
        setFilterOpen(false);
      }}
    >
      Waiting
    </button>

    <button
      className="w-full px-3 py-2 text-left text-orange-600 font-medium hover:bg-orange-50"
      onClick={() => {
        setStatusFilter("in_service");
        setFilterOpen(false);
      }}
    >
      In Service
    </button>

    <button
      className="w-full px-3 py-2 text-left text-green-600 font-medium hover:bg-green-50"
      onClick={() => {
        setStatusFilter("served");
        setFilterOpen(false);
      }}
    >
      Served
    </button>

  </div>
)}
          </div>

          {/* EXPORT */}
          <div className="relative z-50">

            <Button
              variant="outline"
              onClick={() => {
                setExportOpen(!exportOpen);
                setFilterOpen(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-md z-50">

                <button
                  onClick={() => {
                    exportExcel();
                    setExportOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </button>

                <button
                  onClick={() => {
                    exportCSV();
                    setExportOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </button>

                <button
                  onClick={() => {
                    exportPDF();
                    setExportOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-accent"
                >
                  <File className="h-4 w-4" />
                  PDF
                </button>

              </div>
            )}
          </div>

        </div>
      </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Mobile</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Gender</th>
              <th className="text-left p-3">Service</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="border-t">

                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.mobile}</td>
                <td className="p-3">{r.email}</td>

                <td className="p-3 capitalize">
                  {r.gender}
                </td>

                <td className="p-3">{r.service}</td>

                <td className="p-3">
                  <Badge
                    onClick={() => {
                      let nextStatus = r.status;

                      if (r.status === "waiting") {
                        nextStatus = "in_service";
                      } else if (r.status === "in_service") {
                        nextStatus = "served";
                      } else {
                        nextStatus = "waiting";
                      }

                      db.update("customers", r.id, {
                        status: nextStatus,
                      });
                    }}
                    className={`cursor-pointer text-white ${
                      r.status === "waiting"
                        ? "bg-yellow-500"
                        : r.status === "in_service"
                        ? "bg-orange-500"
                        : "bg-green-600"
                    }`}
                  >
                    {r.status === "waiting"
                      ? "Waiting"
                      : r.status === "in_service"
                      ? "In Service"
                      : "Served"}
                  </Badge>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}