import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarCheck2, CircleCheck, Download,
  TrendingUp, Users, ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

export const Route = createFileRoute("/org-admin/reports")({ component: OrgReportsPage });

// ---------------------------------------------------------------------------
// Constants & lookups
// ---------------------------------------------------------------------------

// Maps real AppointmentStatus values to a display label + dot color, so the
// status breakdown table reflects statuses that actually exist on this
// org's appointments instead of an invented bucket the data model has no
// field for.
const STATUS_META: Record<string, { label: string; color: string }> = {
  completed: { label: "Completed", color: "#1baf7a" },
  confirmed: { label: "Confirmed", color: "#2a78d6" },
  in_progress: { label: "In Progress", color: "#eda100" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  rescheduled: { label: "Rescheduled", color: "#94a3b8" },
};

// 2-hour buckets spanning a normal service-business day. Appointment times
// are "HH:MM" 24h strings (see Appointment.time), so we just need the hour.
const HOUR_BUCKETS = [
  { label: "6-8 AM", startHour: 6 },
  { label: "8-10 AM", startHour: 8 },
  { label: "10-12 PM", startHour: 10 },
  { label: "12-2 PM", startHour: 12 },
  { label: "2-4 PM", startHour: 14 },
  { label: "4-6 PM", startHour: 16 },
  { label: "6-8 PM", startHour: 18 },
  { label: "8-10 PM", startHour: 20 },
];

// Hard ceiling on how many days a single report can span. Prevents an
// accidental multi-year range from silently rendering (or exporting)
// thousands of rows.
const MAX_RANGE_DAYS = 31;

// ---------------------------------------------------------------------------
// Small date helpers
// ---------------------------------------------------------------------------

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function todayMinus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Inclusive day count between two ISO date strings. Not clamped here —
// clamping/validation is handled separately so we can surface a warning
// instead of silently truncating.
function rawDaysBetween(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function formatDayLabel(from: string, offset: number) {
  const d = addDays(from, offset);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// CSV/TSV field escaping — wraps a field in quotes (doubling any embedded
// quotes) whenever it contains the delimiter, a quote, or a newline. Real
// service/staff names can contain commas ("Smith, Jane") so naive
// `join(",")` export would silently corrupt those rows.
function escapeDelimited(value: string | number, delimiter: string) {
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toDelimited(rows: (string | number)[][], delimiter: string) {
  return rows.map((row) => row.map((cell) => escapeDelimited(cell, delimiter)).join(delimiter)).join("\n");
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sorting helpers
// ---------------------------------------------------------------------------

type SortDir = "asc" | "desc";
type SortState<K extends string> = { key: K; dir: SortDir } | null;

function sortRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  getValue: (row: T, key: K) => string | number
) {
  if (!sort) return rows;
  const { key, dir } = sort;
  const copy = [...rows];
  copy.sort((a, b) => {
    const va = getValue(a, key);
    const vb = getValue(b, key);
    if (typeof va === "number" && typeof vb === "number") return dir === "asc" ? va - vb : vb - va;
    return dir === "asc"
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });
  return copy;
}

function SortableHead<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort?.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground font-medium" : ""}`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tint: "teal" | "emerald" | "blue" | "purple";
}) {
  const tints: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <span className={`rounded-full p-2.5 ${tints[tint]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-2xl font-semibold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-20 text-center text-sm text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function OrgReportsPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;
  const apts = useDb(() => db.all("appointments").filter((a) => a.organization_id === orgId));
  const employees = useDb(() => db.all("employees").filter((e) => e.organization_id === orgId));

  // ---- Date range + validation --------------------------------------------
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const rangeError = useMemo(() => {
    if (fromDate && !toDate) return "Pick an end date to apply this range.";
    if (!fromDate && toDate) return "Pick a start date to apply this range.";
    if (fromDate && toDate && fromDate > toDate) return "Start date must be on or before the end date.";
    if (toDate && toDate > todayStr()) return "End date can't be in the future.";
    return null;
  }, [fromDate, toDate]);

  const hasValidRange = !!fromDate && !!toDate && !rangeError;
  const effectiveFrom = hasValidRange ? fromDate : todayMinus(6);
  const effectiveTo = hasValidRange ? toDate : todayMinus(0);

  const rawRangeDays = hasValidRange ? rawDaysBetween(effectiveFrom, effectiveTo) : 7;
  const pointCount = Math.min(Math.max(rawRangeDays, 1), MAX_RANGE_DAYS);
  const rangeWasCapped = rawRangeDays > MAX_RANGE_DAYS;

  // ---- Derived data -----------------------------------------------------
  const aptsInRange = useMemo(
    () => apts.filter((a) => a.date >= effectiveFrom && a.date <= effectiveTo),
    [apts, effectiveFrom, effectiveTo]
  );

  const data = useMemo(() => {
    return Array.from({ length: pointCount }).map((_, i) => {
      const key = dateKey(addDays(effectiveFrom, i));
      const dayApts = apts.filter((a) => a.date === key);
      const completed = dayApts.filter((a) => a.status === "completed").length;
      return {
        label: formatDayLabel(effectiveFrom, i),
        date: key,
        appointments: dayApts.length,
        completed,
        completionRate: dayApts.length > 0 ? Math.round((completed / dayApts.length) * 100) : null,
      };
    });
  }, [apts, effectiveFrom, pointCount]);

  const totals = useMemo(
    () => ({
      appointments: aptsInRange.length,
      completed: aptsInRange.filter((a) => a.status === "completed").length,
    }),
    [aptsInRange]
  );
  const completionRate = totals.appointments ? Math.round((totals.completed / totals.appointments) * 100) : 0;

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of aptsInRange) counts[a.status] = (counts[a.status] ?? 0) + 1;
    return Object.entries(counts)
      .map(([status, value]) => ({
        name: STATUS_META[status]?.label ?? status,
        value,
        color: STATUS_META[status]?.color ?? "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [aptsInRange]);

  const staffData = useMemo(() => {
    return employees
      .filter((e) => e.status === "active")
      .map((e) => ({
        name: e.name,
        appointments: aptsInRange.filter((a) => a.employee_id === e.id).length,
        rating: e.rating,
      }));
  }, [employees, aptsInRange]);

  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of aptsInRange) counts[a.service_name] = (counts[a.service_name] ?? 0) + 1;
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [aptsInRange]);

  const peakHoursData = useMemo(() => {
    const counts = new Array(HOUR_BUCKETS.length).fill(0);
    for (const a of aptsInRange) {
      const hour = Number(a.time.split(":")[0]);
      let idx = HOUR_BUCKETS.findIndex(
        (b, i) => hour >= b.startHour && (i === HOUR_BUCKETS.length - 1 || hour < HOUR_BUCKETS[i + 1].startHour)
      );
      if (idx === -1) idx = HOUR_BUCKETS.length - 1;
      counts[idx]++;
    }
    return HOUR_BUCKETS.map((b, i) => ({ hour: b.label, bookings: counts[i] }));
  }, [aptsInRange]);

  // ---- Table sort state -----------------------------------------
  const [dailySort, setDailySort] = useState<SortState<"date" | "appointments" | "completed" | "completionRate">>(null);
  const sortedDaily = useMemo(
    () =>
      sortRows(data, dailySort, (row, key) =>
        key === "completionRate" ? row.completionRate ?? -1 : (row as any)[key]
      ),
    [data, dailySort]
  );

  const [staffSort, setStaffSort] = useState<SortState<"name" | "appointments" | "rating">>({
    key: "appointments",
    dir: "desc",
  });
  const sortedStaff = useMemo(
    () => sortRows(staffData, staffSort, (row, key) => (row as any)[key]),
    [staffData, staffSort]
  );

  const [serviceSort, setServiceSort] = useState<SortState<"name" | "count">>({ key: "count", dir: "desc" });
  const sortedServices = useMemo(
    () => sortRows(serviceData, serviceSort, (row, key) => (row as any)[key]),
    [serviceData, serviceSort]
  );

  function makeSortHandler<K extends string>(
    sort: SortState<K>,
    setSort: (s: SortState<K>) => void,
    defaultDir: SortDir = "desc"
  ) {
    return (key: K) => {
      if (sort?.key === key) {
        setSort({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
      } else {
        setSort({ key, dir: defaultDir });
      }
    };
  }

  const totalStatus = statusData.reduce((s, d) => s + d.value, 0);
  const totalServiceBookings = serviceData.reduce((s, d) => s + d.count, 0);

  // ---- Export --------------------------------------------------------------
  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Date", "Appointments", "Completed", "Completion Rate"],
      ...sortedDaily.map((d) => [d.label, d.appointments, d.completed, d.completionRate ?? ""]),
    ];
    downloadBlob(toDelimited(rows, ","), "text/csv", `org-report-${effectiveFrom}_to_${effectiveTo}.csv`);
  }

  function exportExcel() {
    // Tab-separated values open cleanly in Excel; swap for a real xlsx
    // writer (e.g. SheetJS) if a byte-for-byte .xlsx is ever required.
    const rows: (string | number)[][] = [
      ["Date", "Appointments", "Completed", "Completion Rate"],
      ...sortedDaily.map((d) => [d.label, d.appointments, d.completed, d.completionRate ?? ""]),
    ];
    downloadBlob(toDelimited(rows, "\t"), "application/vnd.ms-excel", `org-report-${effectiveFrom}_to_${effectiveTo}.xls`);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle="Operational reports for your organization."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="from" className="sr-only">From</Label>
              <Input
                id="from"
                type="date"
                value={fromDate}
                max={toDate || todayStr()}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                id="to"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                max={todayStr()}
                onChange={(e) => setToDate(e.target.value)}
                className="w-36"
              />
              {(fromDate || toDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Reset
                </Button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv} className="gap-2.5">
                  <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportExcel} className="gap-2.5">
                  <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPdf} className="gap-2.5">
                  <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {rangeError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {rangeError} Showing the trailing 7 days instead.
        </div>
      )}
      {!rangeError && rangeWasCapped && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Reports are limited to {MAX_RANGE_DAYS} days at a time — showing the first {MAX_RANGE_DAYS} days of the
          selected range.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Appointments (selected period)" value={totals.appointments} icon={CalendarCheck2} tint="teal" />
        <StatCard label="Completed (selected period)" value={totals.completed} icon={CircleCheck} tint="emerald" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={TrendingUp} tint="blue" />
        <StatCard label="Active Staff" value={employees.filter((e) => e.status === "active").length} icon={Users} tint="purple" />
      </div>

      <Card className="border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Daily Appointments — {totals.appointments} in selected period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Date" sortKey="date" sort={dailySort} onSort={makeSortHandler(dailySort, setDailySort, "asc")} />
                <SortableHead label="Appointments" sortKey="appointments" sort={dailySort} onSort={makeSortHandler(dailySort, setDailySort)} align="right" />
                <SortableHead label="Completed" sortKey="completed" sort={dailySort} onSort={makeSortHandler(dailySort, setDailySort)} align="right" />
                <SortableHead label="Completion Rate" sortKey="completionRate" sort={dailySort} onSort={makeSortHandler(dailySort, setDailySort)} align="right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDaily.length === 0 ? (
                <EmptyRow colSpan={4} label="No appointments in this period" />
              ) : (
                sortedDaily.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell className="font-medium">{d.label}</TableCell>
                    <TableCell className="text-right">{d.appointments}</TableCell>
                    <TableCell className="text-right">{d.completed}</TableCell>
                    <TableCell className="text-right">{d.completionRate === null ? "—" : `${d.completionRate}%`}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusData.length === 0 ? (
                  <EmptyRow colSpan={3} label="No appointments in this period" />
                ) : (
                  statusData.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                          {s.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{s.value}</TableCell>
                      <TableCell className="text-right">{totalStatus ? Math.round((s.value / totalStatus) * 100) : 0}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Peak Booking Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hour Range</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peakHoursData.every((p) => p.bookings === 0) ? (
                  <EmptyRow colSpan={2} label="No appointments in this period" />
                ) : (
                  peakHoursData.map((p) => (
                    <TableRow key={p.hour}>
                      <TableCell className="font-medium">{p.hour}</TableCell>
                      <TableCell className="text-right">{p.bookings}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Staff" sortKey="name" sort={staffSort} onSort={makeSortHandler(staffSort, setStaffSort, "asc")} />
                  <SortableHead label="Appointments" sortKey="appointments" sort={staffSort} onSort={makeSortHandler(staffSort, setStaffSort)} align="right" />
                  <SortableHead label="Rating" sortKey="rating" sort={staffSort} onSort={makeSortHandler(staffSort, setStaffSort)} align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStaff.length === 0 ? (
                  <EmptyRow colSpan={3} label="No active staff" />
                ) : (
                  sortedStaff.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.appointments}</TableCell>
                      <TableCell className="text-right">★ {s.rating}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Service Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Service" sortKey="name" sort={serviceSort} onSort={makeSortHandler(serviceSort, setServiceSort, "asc")} />
                  <SortableHead label="Bookings" sortKey="count" sort={serviceSort} onSort={makeSortHandler(serviceSort, setServiceSort)} align="right" />
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedServices.length === 0 ? (
                  <EmptyRow colSpan={3} label="No appointments in this period" />
                ) : (
                  sortedServices.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-right">
                        {totalServiceBookings ? Math.round((s.count / totalServiceBookings) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}