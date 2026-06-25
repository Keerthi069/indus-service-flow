import { createFileRoute } from "@tanstack/react-router";
import { Users, Clock, Star, Timer, Download } from "lucide-react";

import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/")({
  component: EmpDash,
});

function EmpDash() {
  const { user } = useAuth();

  const orgId = user?.organization_id;

  // Employee data
  const employees = useDb(() =>
    db
      .all("employees")
      .filter((e) => e.organization_id === orgId)
  );

  const activeCount = employees.filter(
    (e) => e.status === "active"
  ).length;

  const inactiveCount = employees.filter(
    (e) => e.status === "inactive"
  ).length;

  const toggleStatus = (
    id: string,
    current: "active" | "inactive"
  ) => {
    db.update("employees", id, {
      status:
        current === "active"
          ? "inactive"
          : "active",
    });
  };

  const exportCsv = () => {
    const header = [
      "Name",
      "Designation",
      "Email",
      "Mobile",
      "Shift",
      "Status",
    ];
   
  

    const rows = employees.map((e) => [
      e.name,
      e.designation,
      e.email,
      e.mobile,
      e.shift,
      e.status,
    ]);

   const toggleStatus = (
  id: string,
  current: "active" | "inactive"
) => {
  console.log("clicked", id, current);

  db.update("employees", id, {
    status: current === "active" ? "inactive" : "active",
  });
};

    const csv = [header, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] ?? "Employee"}`}
        subtitle="Employee management overview."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi
          label="Total Employees"
          value={employees.length}
          icon={Users}
        />

        <Kpi
          label="Active Employees"
          value={activeCount}
          icon={Star}
        />

        <Kpi
          label="Inactive Employees"
          value={inactiveCount}
          icon={Clock}
        />

        <Kpi
          label="Average Rating"
          value={
            employees.length
              ? (
                  employees.reduce(
                    (sum, e) => sum + e.rating,
                    0
                  ) / employees.length
                ).toFixed(1)
              : "0"
          }
          icon={Timer}
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Employees
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          className="inline-flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="mt-3">
        <CardContent className="p-4">
          {employees.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No employees found.
            </div>
          ) : (
            <ul className="grid gap-2">
              {employees.map((emp) => (
                <li
                  key={emp.id}
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-3"
                >
                  <div>
                    <div className="font-medium">
                      {emp.name}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {emp.designation}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {emp.email} • {emp.mobile}
                    </div>
                  </div>

             <button
  type="button"
  onClick={() => {
    console.log("clicked");
    toggleStatus(emp.id, emp.status);
  }}
  className={`px-3 py-1 rounded-md text-xs font-medium border cursor-pointer ${
    emp.status === "active"
      ? "border-green-400 bg-green-100 text-green-700"
      : "border-red-400 bg-red-100 text-red-700"
  }`}
>
  {emp.status}
</button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}