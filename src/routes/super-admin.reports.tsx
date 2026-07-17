import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import {
  Download,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  BarChart3,
  UserMinus,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  Eye,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/super-admin/reports")({
  component: ReportsPage,
});

// ── Data ─────────────────────────────────────────────────────────────────────
// This page is a pure tabular report — no chart visualizations. See
// /super-admin (Dashboard) for the MRR/tenant-growth and subscription-changes
// charts, which were moved there.

const RANGES = {
  "7d": {
    label: "7 days",
    data: [
      { label: "Mon", mrr: 118200, tenants: 325 },
      { label: "Tue", mrr: 120100, tenants: 327 },
      { label: "Wed", mrr: 121500, tenants: 330 },
      { label: "Thu", mrr: 122800, tenants: 333 },
      { label: "Fri", mrr: 124300, tenants: 336 },
      { label: "Sat", mrr: 126100, tenants: 339 },
      { label: "Sun", mrr: 128400, tenants: 342 },
    ],
  },
  "30d": {
    label: "30 days",
    data: [
      { label: "W1", mrr: 108000, tenants: 298 },
      { label: "W2", mrr: 114000, tenants: 312 },
      { label: "W3", mrr: 121000, tenants: 328 },
      { label: "W4", mrr: 128400, tenants: 342 },
    ],
  },
  "90d": {
    label: "90 days",
    data: [
      { label: "Jun", mrr: 94000, tenants: 265 },
      { label: "Jul", mrr: 111000, tenants: 300 },
      { label: "Aug", mrr: 128400, tenants: 342 },
    ],
  },
  "1y": {
    label: "1 year",
    data: [
      { label: "Q1 '25", mrr: 62000, tenants: 180 },
      { label: "Q2 '25", mrr: 78000, tenants: 210 },
      { label: "Q3 '25", mrr: 95000, tenants: 255 },
      { label: "Q4 '25", mrr: 108000, tenants: 290 },
      { label: "Q1 '26", mrr: 116000, tenants: 318 },
      { label: "Q2 '26", mrr: 128400, tenants: 342 },
    ],
  },
};

const TOP_TENANTS = [
  { name: "Meridian Health", plan: "Enterprise", seats: 84, mrr: 9800, status: "active" },
  { name: "Apex Ventures", plan: "Enterprise", seats: 61, mrr: 7200, status: "active" },
  { name: "NovaBuild Inc.", plan: "Growth", seats: 28, mrr: 3100, status: "active" },
  { name: "Clearwave Media", plan: "Growth", seats: 19, mrr: 2200, status: "trial" },
  { name: "Quantum Labs", plan: "Starter", seats: 7, mrr: 490, status: "paused" },
];

const EVENTS: { type: 'upgrade' | 'new' | 'warn' | 'down' | 'success'; Icon: React.ComponentType<{ className: string }>; label: string; time: string }[] = [
  { type: "upgrade", Icon: ArrowUpCircle, label: "Meridian Health upgraded to Enterprise Plus", time: "2 min ago" },
  { type: "new", Icon: Building2, label: "New org onboarded — Stellaris Corp (32 seats)", time: "14 min ago" },
  { type: "warn", Icon: AlertTriangle, label: "Clearwave Media trial expires in 3 days", time: "1 hr ago" },
  { type: "down", Icon: UserMinus, label: "Quantum Labs downgraded — seats reduced 14 → 7", time: "3 hr ago" },
  { type: "success", Icon: CheckCircle, label: "SLA compliance report generated for May 2026", time: "5 hr ago" },
];

const PLAN_DIST = [
  { label: "Enterprise", pct: 42, color: "#2a78d6" },
  { label: "Growth", pct: 35, color: "#1baf7a" },
  { label: "Starter", pct: 23, color: "#eda100" },
];

// ── Currency helpers (INR) ──────────────────────────────────────────────────

/** Headline/KPI formatting — abbreviates to Lakh / Crore. */
function fmtINR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return "₹" + (n / 1_00_00_000).toFixed(2) + " Cr";
  if (abs >= 1_00_000) return "₹" + (n / 1_00_000).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Table/exact formatting — full rupee amount, Indian digit grouping. */
function fmtINRExact(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ── Export helpers (CSV / Excel / print-to-PDF, per-section or combined) ───

type ExportRow = string[];

interface ExportSection {
  title: string;
  headers: string[];
  rows: ExportRow[];
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function toCsv(section: ExportSection): string {
  const lines = [section.headers.map(csvEscape).join(",")];
  section.rows.forEach((r) => lines.push(r.map(csvEscape).join(",")));
  return lines.join("\n");
}

function toCombinedCsv(sections: ExportSection[]): string {
  return sections.map((s) => `${s.title}\n${toCsv(s)}`).join("\n\n");
}

/** Simple HTML-table-as-.xls trick — opens cleanly formatted in Excel. */
function toXlsHtml(sections: ExportSection[]): string {
  const tableFor = (s: ExportSection) => `
    <table border="1">
      <tr><td colspan="${s.headers.length}"><b>${s.title}</b></td></tr>
      <tr>${s.headers.map((h) => `<th>${h}</th>`).join("")}</tr>
      ${s.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
    </table>`;
  return `<html><head><meta charset="UTF-8" /></head><body>${sections
    .map(tableFor)
    .join("<br/>")}</body></html>`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function printSections(title: string, sections: ExportSection[]) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const body = sections
    .map(
      (s) => `
    <h2>${s.title}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr>${s.headers
        .map(
          (h) =>
            `<th style="border:1px solid #ccc;padding:6px;text-align:left;background:#f5f5f5;">${h}</th>`
        )
        .join("")}</tr></thead>
      <tbody>${s.rows
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td style="border:1px solid #ccc;padding:6px;">${c}</td>`).join("")}</tr>`
        )
        .join("")}</tbody>
    </table>`
    )
    .join("<hr style='margin:24px 0;border:none;border-top:1px solid #ddd;' />");
  win.document.write(`
    <html>
      <head><title>${title}</title></head>
      <body style="font-family: system-ui, sans-serif; padding: 24px;">
        <h1 style="margin-bottom:4px;">${title}</h1>
        <p style="color:#666;margin-top:0;">Generated ${new Date().toLocaleString("en-IN")}</p>
        ${body}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      Live
    </span>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive,
  Icon,
  pulse,
}: {
  label: string;
  value: string | number;
  delta: string;
  positive: boolean;
  Icon: React.ComponentType<{ className: string }>;
  pulse?: boolean;
}) {
  const DeltaIcon = positive ? TrendingUp : TrendingDown;
  return (
    <Card className={pulse ? "transition-colors duration-700" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div
          className={`text-2xl font-semibold font-mono tracking-tight ${
            pulse ? "animate-pulse" : ""
          }`}
        >
          {value}
        </div>
        <div
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            positive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          <DeltaIcon className="h-3 w-3" />
          {delta}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: 'active' | 'trial' | 'paused' | string }) {
  const map: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    trial: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
    paused: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function EventIcon({ type, Icon }: { type: 'upgrade' | 'new' | 'warn' | 'down' | 'success'; Icon: React.ComponentType<{ className: string }> }) {
  const map = {
    upgrade: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    new: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    warn: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
    down: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    success: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  };
  return (
    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${map[type]}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

/** Preview dialog — shows the exact rows that will be exported. */
function PreviewDialog({
  open,
  onOpenChange,
  section,
  sections,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Single section preview, OR pass `sections` for a combined preview. */
  section?: ExportSection;
  sections?: ExportSection[];
}) {
  const list = sections ?? (section ? [section] : []);
  const title = sections ? "Full report preview" : section?.title ?? "Preview";
  const totalRows = list.reduce((acc, s) => acc + s.rows.length, 0);
  const filenameBase = slugify(sections ? "platform-report" : section?.title ?? "export");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {list.length > 1
              ? `${list.length} sections · ${totalRows} rows total — review before exporting`
              : `${totalRows} rows — review before exporting`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto flex-1 space-y-4 pr-1">
          {list.map((s) => (
            <div key={s.title} className="border rounded-md overflow-hidden">
              {list.length > 1 && (
                <div className="px-3 py-1.5 bg-muted/50 text-xs font-medium text-foreground border-b">
                  {s.title}
                </div>
              )}
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/60">
                  <tr>
                    {s.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground border-b">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {r.map((c, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t mt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              downloadBlob(
                list.length > 1 ? toCombinedCsv(list) : toCsv(list[0]),
                `${filenameBase}.csv`,
                "text/csv"
              )
            }
          >
            <img src={CsvLogo} alt="CSV" className="h-4 w-4 object-contain" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => downloadBlob(toXlsHtml(list), `${filenameBase}.xls`, "application/vnd.ms-excel")}
          >
            <img src={ExcelLogo} alt="Excel" className="h-4 w-4 object-contain" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => printSections(title, list)}
          >
            <img src={PdfLogo} alt="PDF" className="h-4 w-4 object-contain" />
            PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Compact per-section export control — sits in a Card header. */
function SectionExportMenu({ section }: { section: ExportSection }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const filenameBase = slugify(section.title);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setPreviewOpen(true)} className="gap-2">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadBlob(toCsv(section), `${filenameBase}.csv`, "text/csv")}
            className="gap-2"
          >
            <img src={CsvLogo} alt="CSV" className="h-4 w-4 object-contain" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadBlob(toXlsHtml([section]), `${filenameBase}.xls`, "application/vnd.ms-excel")}
            className="gap-2"
          >
            <img src={ExcelLogo} alt="Excel" className="h-4 w-4 object-contain" />
            Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => printSections(section.title, [section])} className="gap-2">
            <img src={PdfLogo} alt="PDF" className="h-4 w-4 object-contain" />
            PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} section={section} />
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ReportsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("7d");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [liveTick, setLiveTick] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [allPreviewOpen, setAllPreviewOpen] = useState(false);
  const organizations = useDb(() => db.all("organizations"));

  const rangeData = RANGES[range].data;
  const earliest = rangeData[0];
  const baseLatest = rangeData[rangeData.length - 1];

  // Simulated real-time jitter on the latest period's figures, so the page
  // visibly behaves like a live report rather than a static one. Bounded to
  // a small ±0.3% so it never disagrees meaningfully with the underlying data.
  const jitterFactor = useMemo(() => {
    const wobble = Math.sin(liveTick * 1.7) * 0.003;
    return 1 + wobble;
  }, [liveTick]);

  const liveMrr = Math.round(baseLatest.mrr * jitterFactor);
  const liveTenants = Math.max(
    0,
    Math.round(baseLatest.tenants + Math.round(Math.sin(liveTick * 1.3) * 2))
  );

  const mrrDeltaPct = earliest.mrr ? (((liveMrr - earliest.mrr) / earliest.mrr) * 100).toFixed(1) : "0.0";
  const tenantDelta = liveTenants - earliest.tenants;

  // Live tick — refreshes the "updated" timestamp and nudges the KPI jitter.
  useEffect(() => {
    const id = setInterval(() => {
      setLastUpdated(new Date());
      setLiveTick((t) => t + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 900);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const activeOrgs = organizations.filter(
    (o) => o.status !== "inactive" && o.status !== "rejected"
  ).length;

  const alertCount = EVENTS.filter((e) => e.type === "warn" || e.type === "down").length;

  // ── Export sections, built from live state ──────────────────────────────

  const periodSection: ExportSection = useMemo(
    () => ({
      title: `MRR & tenants by period — ${RANGES[range].label}`,
      headers: ["Period", "MRR", "Tenants", "MRR / tenant"],
      rows: rangeData.map((row) => [
        row.label,
        fmtINRExact(row.mrr),
        String(row.tenants),
        fmtINRExact(Math.round(row.mrr / row.tenants)),
      ]),
    }),
    [range, rangeData]
  );

  const planDistSection: ExportSection = useMemo(
    () => ({
      title: "Plan distribution",
      headers: ["Plan", "Share of tenants"],
      rows: PLAN_DIST.map((p) => [p.label, `${p.pct}%`]),
    }),
    []
  );

  const topTenantsSection: ExportSection = useMemo(
    () => ({
      title: "Top tenants by MRR",
      headers: ["Organization", "Plan", "Seats", "MRR", "Status"],
      rows: TOP_TENANTS.map((t) => [t.name, t.plan, String(t.seats), fmtINRExact(t.mrr), t.status]),
    }),
    []
  );

  const allSections = [periodSection, planDistSection, topTenantsSection];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <PageHeader
            title="Reports"
            subtitle="Platform-wide report data for all tenants."
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LivePill />

          {/* Range tabs — control which period the KPI/report rows below reflect */}
          <div className="flex rounded-md border bg-muted/40 p-0.5 gap-0.5">
            {Object.entries(RANGES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setRange(key as "7d" | "30d" | "90d" | "1y")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  range === key
                    ? "bg-background shadow-sm text-foreground border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export everything at once, with a full preview */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <Layers className="h-3.5 w-3.5" />
                Export all
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setAllPreviewOpen(true)} className="gap-3">
                <Eye className="h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => downloadBlob(toCombinedCsv(allSections), `platform-report-${range}.csv`, "text/csv")}
                className="gap-3"
              >
                <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  downloadBlob(toXlsHtml(allSections), `platform-report-${range}.xls`, "application/vnd.ms-excel")
                }
                className="gap-3"
              >
                <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printSections("Platform report", allSections)} className="gap-3">
                <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI row — reflects the selected range, with a subtle live pulse */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={`MRR (${RANGES[range].label})`}
          value={fmtINR(liveMrr)}
          delta={`${mrrDeltaPct}% vs start of period`}
          positive={Number(mrrDeltaPct) >= 0}
          Icon={DollarSign}
          pulse={pulse}
        />
        <KpiCard
          label="ARR (annualized)"
          value={fmtINR(liveMrr * 12)}
          delta={`${mrrDeltaPct}% vs start of period`}
          positive={Number(mrrDeltaPct) >= 0}
          Icon={BarChart3}
          pulse={pulse}
        />
        <KpiCard
          label="Active tenants"
          value={activeOrgs || liveTenants}
          delta={`${tenantDelta >= 0 ? "+" : ""}${tenantDelta} this period`}
          positive={tenantDelta >= 0}
          Icon={Building2}
          pulse={pulse}
        />
        <KpiCard label="Churn rate" value="1.8%" delta="+0.2pp vs prior period" positive={false} Icon={TrendingDown} />
      </div>

      {/* Period-by-period report table (replaces the growth chart) */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            MRR &amp; tenants by period — {RANGES[range].label}
          </CardTitle>
          <SectionExportMenu section={periodSection} />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">MRR</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Tenants</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">MRR / tenant</th>
              </tr>
            </thead>
            <tbody>
              {rangeData.map((row, i) => (
                <tr key={row.label} className={i < rangeData.length - 1 ? "border-b" : ""}>
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.label}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{fmtINR(row.mrr)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{row.tenants}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {fmtINR(Math.round(row.mrr / row.tenants))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Plan distribution as a plain table (no donut/visual chart) */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Plan distribution
          </CardTitle>
          <SectionExportMenu section={planDistSection} />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Share of tenants</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_DIST.map((p, i) => (
                <tr key={p.label} className={i < PLAN_DIST.length - 1 ? "border-b" : ""}>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      {p.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{p.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top tenants */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Top tenants by MRR
            </CardTitle>
            <SectionExportMenu section={topTenantsSection} />
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Organization</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Seats</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">MRR</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {TOP_TENANTS.map((t, i) => (
                  <tr key={t.name} className={i < TOP_TENANTS.length - 1 ? "border-b" : ""}>
                    <td className="px-4 py-2.5 font-medium text-foreground">{t.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.plan}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{t.seats}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">{fmtINRExact(t.mrr)}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Platform events */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Platform events
              </CardTitle>
              {alertCount > 0 && (
                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                  {alertCount} alerts
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-0">
            {EVENTS.map((e, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 py-2.5 ${i < EVENTS.length - 1 ? "border-b" : ""}`}
              >
                <EventIcon type={e.type} Icon={e.Icon} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground leading-snug">{e.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.time}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-right mt-2 font-mono">
              Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </CardContent>
        </Card>
      </div>

      <PreviewDialog open={allPreviewOpen} onOpenChange={setAllPreviewOpen} sections={allSections} />
    </div>
  );
}