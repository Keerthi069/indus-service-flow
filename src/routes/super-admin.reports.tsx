import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

import {
  Download,
  Filter,
} from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute(
  "/super-admin/reports"
)({
  component: ReportsPage,
});

const RANGES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "half-yearly",
  "annual",
];

function ReportsPage() {
  const [range, setRange] =
    useState("monthly");

  const appointments = useDb(() =>
    db.all("appointments")
  );

  const organizations = useDb(() =>
    db.all("organizations")
  );

  const chartData =
    range === "daily"
      ? [
          { label: "Mon", mrr: 12000, tenants: 10 },
          { label: "Tue", mrr: 15000, tenants: 12 },
          { label: "Wed", mrr: 18000, tenants: 15 },
          { label: "Thu", mrr: 17000, tenants: 14 },
          { label: "Fri", mrr: 22000, tenants: 18 },
          { label: "Sat", mrr: 25000, tenants: 20 },
          { label: "Sun", mrr: 21000, tenants: 17 },
        ]
      : [
          { label: "Jan", mrr: 12000, tenants: 12 },
          { label: "Feb", mrr: 15000, tenants: 15 },
          { label: "Mar", mrr: 18000, tenants: 18 },
          { label: "Apr", mrr: 22000, tenants: 22 },
          { label: "May", mrr: 27000, tenants: 27 },
          { label: "Jun", mrr: 32000, tenants: 32 },
        ];

  function exportCsv() {
    const csv = [
      "label,mrr,tenants",
      ...chartData.map(
        (r) =>
          `${r.label},${r.mrr},${r.tenants}`
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = `reports-${range}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Platform-wide reports and analytics."
      />

      {/* FILTER + EXPORT */}
      <div className="mb-4 flex items-center justify-end gap-2">
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
            {RANGES.map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() =>
                  setRange(r)
                }
                className="capitalize"
              >
                {r}
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

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>
              Total Appointments
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold">
              {appointments.length.toLocaleString(
                "en-IN"
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Active Organizations
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold">
              {
                organizations.filter(
                  (o) =>
                    o.status !==
                      "inactive" &&
                    o.status !==
                      "rejected"
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Current Range
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-3xl font-bold capitalize">
              {range}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRAPH + EXPORTS */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              MRR Trend
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[350px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.3}
                />

                <XAxis
                  dataKey="label"
                />

                <YAxis />

                <RTooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="var(--primary)"
                  strokeWidth={3}
                />

                <Line
                  type="monotone"
                  dataKey="tenants"
                  stroke="var(--secondary)"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Recent Exports
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {[
              {
                name:
                  "Monthly Revenue Report",
                date: "Jun 2026",
                size: "1.2 MB",
              },
              {
                name:
                  "Tenant Growth Report",
                date: "Q2 2026",
                size: "640 KB",
              },
              {
                name:
                  "Platform SLA Compliance",
                date: "May 2026",
                size: "420 KB",
              },
              {
                name:
                  "Churn & Retention Analysis",
                date: "Q2 2026",
                size: "1.8 MB",
              },
            ].map((report) => (
              <div
                key={report.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="font-medium">
                    {report.name}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {report.date} •{" "}
                    {report.size}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}