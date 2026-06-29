import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Funnel, Download } from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/org-admin/analytics")({
  component: AnalyticsPage,
});

const peak = Array.from({ length: 12 }, (_, i) => ({
  date: new Date(2026, 0, i + 1),
  hr: `${(9 + i).toString().padStart(2, "0")}`,
  customers: 6 + Math.round(Math.sin(i) * 10 + 12),
}));

const bottleneck = [
  "Reception",
  "Cardiology",
  "Billing",
  "Diagnostics",
  "Pharmacy",
].map((s, i) => ({
  stage: s,
  wait: 5 + i * 4 + Math.round(Math.random() * 6),
}));

const staffing = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(2026, 0, i + 1),
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  required: 8 + Math.round(Math.random() * 6),
  available: 7 + Math.round(Math.random() * 4),
}));

const wait = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(2026, 0, i + 1),
  day: `D${i + 1}`,
  avg: 8 + Math.round(Math.sin(i / 2) * 5 + Math.random() * 4),
}));

const capacity = Array.from({ length: 12 }, (_, i) => ({
  date: new Date(2026, i, 1),
  month: new Date(0, i).toLocaleString("en", { month: "short" }),
  demand: 100 + i * 15,
  capacity: 130 + i * 8,
}));

function inRange(
  date: Date,
  start: Date | null,
  end: Date | null
) {
  if (!start || !end) return true;
  return date >= start && date <= end;
}
function AnalyticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const peakF = useMemo(
    () => peak.filter((d) => inRange(d.date, start, end)),
    [startDate, endDate]
  );

  const staffingF = useMemo(
    () => staffing.filter((d) => inRange(d.date, start, end)),
    [startDate, endDate]
  );

  const waitF = useMemo(
    () => wait.filter((d) => inRange(d.date, start, end)),
    [startDate, endDate]
  );

  const capacityF = useMemo(
    () => capacity.filter((d) => inRange(d.date, start, end)),
    [startDate, endDate]
  );

  const exportData = [
    ...peakF.map((r) => ({
      section: "Peak",
      label: r.hr,
      value: r.customers,
    })),
    ...staffingF.map((r) => ({
      section: "Staffing",
      label: r.day,
      value: r.required,
    })),
    ...waitF.map((r) => ({
      section: "Wait",
      label: r.day,
      value: r.avg,
    })),
    ...capacityF.map((r) => ({
      section: "Capacity",
      label: r.month,
      value: r.demand,
    })),
  ];

  function exportCSV() {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(exportData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Analytics"
    );

    XLSX.writeFile(
      wb,
      "analytics.xlsx"
    );
  }

  function exportPDF() {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["Section", "Label", "Value"]],
      body: exportData.map((r) => [
        r.section,
        r.label,
        r.value,
      ]),
    });

    doc.save("analytics.pdf");
  }

  return (
    <div className="space-y-6">
            <PageHeader
        title="Analytics"
        subtitle="Operational insights dashboard"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border bg-background px-5 text-sm font-medium shadow-sm hover:bg-muted"
            >
              <Funnel className="h-4 w-4" />
              Filter
            </button>

            <div className="relative">
              <button
                onClick={() => setExportOpen((v) => !v)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border bg-background px-5 text-sm font-medium shadow-sm hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Export
              </button>

              {exportOpen && (
                <div className="absolute right-0 top-12 z-50 w-44 rounded-xl border bg-card shadow-xl">
                  <button
                    onClick={exportCSV}
                    className="block w-full px-4 py-3 text-left hover:bg-muted"
                  >
                    CSV
                  </button>

                  <button
                    onClick={exportExcel}
                    className="block w-full px-4 py-3 text-left hover:bg-muted"
                  >
                    Excel
                  </button>

                  <button
                    onClick={exportPDF}
                    className="block w-full px-4 py-3 text-left hover:bg-muted"
                  >
                    PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {showFilters && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 font-semibold">Filters</div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-xs">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="rounded-lg border px-3 py-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="rounded-lg border px-4 py-2 hover:bg-muted"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Chart title="Peak Hours">
          <BarChart data={peakF}>
            <CartesianGrid />
            <XAxis dataKey="hr" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="customers"
              fill="var(--primary)"
            />
          </BarChart>
        </Chart>

        <Chart title="Queue Bottleneck">
          <BarChart data={bottleneck}>
            <CartesianGrid />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="wait"
              fill="var(--secondary)"
            />
          </BarChart>
        </Chart>

        <Chart title="Staffing">
          <BarChart data={staffingF}>
            <CartesianGrid />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="required"
              fill="var(--primary)"
            />
            <Bar
              dataKey="available"
              fill="var(--secondary)"
            />
          </BarChart>
        </Chart>

        <Chart title="Staff Efficiency">
          <LineChart data={staffingF}>
            <CartesianGrid />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              dataKey="required"
              stroke="var(--primary)"
            />
            <Line
              dataKey="available"
              stroke="var(--secondary)"
            />
          </LineChart>
        </Chart>

        <Chart title="Wait Trend">
          <AreaChart data={waitF}>
            <CartesianGrid />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="avg"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </Chart>

        <Chart title="Capacity Planning">
          <LineChart data={capacityF}>
            <CartesianGrid />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              dataKey="demand"
              stroke="var(--primary)"
            />
            <Line
              dataKey="capacity"
              stroke="var(--secondary)"
            />
          </LineChart>
        </Chart>
      </div>
    </div>
  );
}

function Chart({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-2 font-semibold">
        {title}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}