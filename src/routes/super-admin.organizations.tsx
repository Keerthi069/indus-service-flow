import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png";

import { ORG_SEED } from "@/lib/mock/seed"; // adjust this path to wherever seed.ts actually lives in your project
import { db, useDb, type OrgRequest } from "@/lib/mock/db";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  Filter,
  Download,
  Eye,
  X,
  Check,
  Search,
  Building2,
  Hospital,
  Stethoscope,
  Landmark,
  Store,
  Headphones,
  Mail,
  Phone,
  MapPin,
  Hash,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react";

/* =========================================================================
   SHARED TYPES + HELPERS
   ========================================================================= */

// Every field collected on the register-organization form:
// org name, category, org email/mobile, contact person + their
// email/mobile, address, city, state, pincode, country. Both live
// organizations and pending requests carry the full set (OrgRequest
// extends Organization), so this page shows the same fields for both
// instead of treating requests as a lesser-detail row.
type Org = {
  id: string;
  name: string;
  category: string;
  contact_person: string;
  email: string;
  mobile: string;
  // The organization's OWN official contact — a general helpline/front-desk
  // number and a role-based inbox (info@/contact@/helpdesk@) — distinct
  // from `email`/`mobile` above, which belong to the individual contact
  // person. Sourced from Organization.org_email / Organization.org_mobile.
  org_email: string;
  org_mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  status: "active" | "inactive";
  deleted: boolean;
};

// Real organizations from the seed data, mapped into the shape this page's
// table/dialog expect.
//
// Notes on the mapping:
// - Organization.status is "approved" / (presumably pending/rejected live
//   in OrgRequest, not here) — this page only distinguishes active vs
//   inactive, so anything that isn't "approved" is treated as inactive.
// - Organization's `logo` and `plan` fields aren't used by this page's
//   table/view dialog, so they're dropped here.
const initialOrgData: Org[] = ORG_SEED.map((o) => ({
  id: o.id,
  name: o.name,
  category: o.category,
  contact_person: o.contact_person,
  email: o.email,
  mobile: o.mobile,
  org_email: o.org_email,
  org_mobile: o.org_mobile,
  address: o.address,
  city: o.city,
  state: o.state,
  pincode: o.pincode,
  country: o.country,
  status: o.status === "approved" ? "active" : "inactive",
  deleted: false,
}));

const CATEGORY_META: Record<string, { label: string; icon: typeof Hospital; color: string }> = {
  hospital: { label: "Hospital", icon: Hospital, color: "#dc2626" },
  clinic: { label: "Clinic", icon: Stethoscope, color: "#0891b2" },
  bank: { label: "Bank", icon: Landmark, color: "#2a78d6" },
  retail: { label: "Retail", icon: Store, color: "#1baf7a" },
  support: { label: "Support center", icon: Headphones, color: "#7c5cff" },
};

function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? { label: category || "Other", icon: Building2, color: "#71717a" };
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Covers every status a row can have: "active"/"inactive" for live
// organizations, "pending"/"approved"/"rejected" for onboarding requests.
const STATUS_META = {
  pending: { label: "Pending", icon: Clock, color: "#eda100" },
  approved: { label: "Approved", icon: CheckCircle2, color: "#1baf7a" },
  rejected: { label: "Rejected", icon: XCircle, color: "#dc2626" },
  active: { label: "Active", icon: CheckCircle2, color: "#1baf7a" },
  inactive: { label: "Inactive", icon: XCircle, color: "#dc2626" },
} as const;

type StatusKey = keyof typeof STATUS_META;

// Default sort order when no single status is selected: surfaces the most
// actionable rows (pending requests) first, then rejected, approved, and
// finally live organizations.
const STATUS_SORT_ORDER: Record<StatusKey, number> = {
  pending: 0,
  rejected: 1,
  approved: 2,
  active: 3,
  inactive: 4,
};

function StatusBadge({ status, onClick }: { status: StatusKey; onClick?: () => void }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      onClick={onClick}
      className={`inline-flex w-[104px] items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

/* =========================================================================
   SHARED EXPORT HELPERS (CSV / XLS / PDF)
   ========================================================================= */

type ExportableRow = {
  name: string;
  category: string;
  contact_person: string;
  email: string;
  mobile: string;
  org_email: string;
  org_mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  status: string;
};

// The anchor must be attached to the DOM before .click() — Firefox (and
// some other browsers) silently no-op the click on a detached element, so
// nothing downloads even though no error is thrown.
function download(name: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoking immediately can race the browser's own async read of the blob
  // for the download — give it a beat before freeing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(data: ExportableRow[]) {
  const header = "Name,Category,Contact,Contact Email,Contact Mobile,Org Email,Org Mobile,Address,City,State,Pincode,Country,Status";
  const rows = data.map((r) =>
    [
      r.name,
      r.category,
      r.contact_person,
      r.email,
      r.mobile,
      r.org_email,
      r.org_mobile,
      r.address,
      r.city,
      r.state,
      r.pincode,
      r.country,
      r.status,
    ].map(escapeCsv).join(","),
  );
  return [header, ...rows].join("\n");
}

// XLS export uses an HTML table wrapped in an Excel-readable shell — this is
// the standard lightweight way to produce a real, openable .xls without a
// heavy spreadsheet library, rather than mislabeling plain CSV text as XLS.
function toXlsHtml(data: ExportableRow[]) {
  const rows = data
    .map(
      (r) => `<tr>
        <td>${r.name}</td>
        <td>${r.category}</td>
        <td>${r.contact_person}</td>
        <td>${r.email}</td>
        <td>${r.mobile}</td>
        <td>${r.org_email}</td>
        <td>${r.org_mobile}</td>
        <td>${r.address}</td>
        <td>${r.city}</td>
        <td>${r.state}</td>
        <td>${r.pincode}</td>
        <td>${r.country}</td>
        <td>${r.status}</td>
      </tr>`,
    )
    .join("");
  return `<html><head><meta charset="utf-8"></head><body>
    <table border="1">
      <tr>
        <th>Name</th><th>Category</th><th>Contact</th><th>Contact Email</th><th>Contact Mobile</th>
        <th>Org Email</th><th>Org Mobile</th><th>Address</th><th>City</th><th>State</th>
        <th>Pincode</th><th>Country</th><th>Status</th>
      </tr>
      ${rows}
    </table>
  </body></html>`;
}

// PDF export draws a simple ruled table directly with jsPDF (no autotable
// dependency): a header row, one line per record, and automatic page
// breaks once the cursor runs past the bottom margin.
function toPdf(title: string, data: ExportableRow[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const columns = [
    { label: "Organization", key: "name" as const, width: 110 },
    { label: "Category", key: "category" as const, width: 65 },
    { label: "Contact", key: "contact_person" as const, width: 90 },
    { label: "Contact Email", key: "email" as const, width: 110 },
    { label: "Org Email", key: "org_email" as const, width: 110 },
    { label: "Org Mobile", key: "org_mobile" as const, width: 85 },
    { label: "City", key: "city" as const, width: 70 },
    { label: "State", key: "state" as const, width: 80 },
    { label: "Pincode", key: "pincode" as const, width: 55 },
    { label: "Status", key: "status" as const, width: 70 },
  ];
  const rowHeight = 22;
  let y = margin;

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");

    let x = margin + 6;
    columns.forEach((col) => {
      doc.text(col.label, x, y + rowHeight / 2 + 3);
      x += col.width;
    });
    y += rowHeight;
    doc.setFont("helvetica", "normal");
  };

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 26;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Exported ${new Date().toLocaleString()} · ${data.length} record${data.length === 1 ? "" : "s"}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 18;

  drawHeader();

  data.forEach((r, i) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }

    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
    }

    doc.setFontSize(8.5);
    let x = margin + 6;
    columns.forEach((col) => {
      const raw = String(r[col.key] ?? "");
      const text = doc.splitTextToSize(raw, col.width - 10)[0] ?? "";
      doc.text(text, x, y + rowHeight / 2 + 3);
      x += col.width;
    });

    y += rowHeight;
  });

  return doc;
}

function exportData(type: "csv" | "xls" | "pdf", filenamePrefix: string, pdfTitle: string, data: ExportableRow[]) {
  if (data.length === 0) {
    toast.error("Nothing to export for the current filter.");
    return;
  }

  if (type === "csv") download(`${filenamePrefix}.csv`, "text/csv;charset=utf-8", toCsv(data));
  if (type === "xls") download(`${filenamePrefix}.xls`, "application/vnd.ms-excel", toXlsHtml(data));
  if (type === "pdf") toPdf(pdfTitle, data).save(`${filenamePrefix}.pdf`);

  toast.success(`Exported ${type.toUpperCase()}`);
}

/* =========================================================================
   SHARED SMALL UI BITS
   ========================================================================= */

function DetailField({
  label, value, full, capitalize, icon: Icon,
}: {
  label: string; value: string; full?: boolean; capitalize?: boolean; icon?: typeof Mail;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={`mt-0.5 text-sm ${capitalize ? "capitalize" : ""}`}>{value || "—"}</p>
    </div>
  );
}

const iconBtn =
  "h-8 w-8 p-0 flex items-center justify-center border rounded-md hover:bg-muted disabled:hover:bg-transparent transition-colors";

/* =========================================================================
   REQUEST ACTIONS (approve / reject / soft delete / restore)
   NOTE: soft delete assumes `OrgRequest` (in @/lib/mock/db) gets an optional
   `deleted?: boolean` field. Until you add that to the real type, this casts
   through `as never` the same way the original approve/reject actions did
   for `status`.
   ========================================================================= */

function approveRequest(r: OrgRequest) {
  db.update("org_requests", r.id, { status: "approved" } as never);
  toast.success(`Approved ${r.name}`);
}

function rejectRequest(r: OrgRequest) {
  db.update("org_requests", r.id, { status: "rejected" } as never);
  toast.success(`Rejected ${r.name}`);
}

function softDeleteRequest(r: OrgRequest) {
  db.update("org_requests", r.id, { deleted: true } as never);
  toast.success(`${r.name} moved to trash`, {
    action: { label: "Undo", onClick: () => restoreRequest(r.id) },
  });
}

function restoreRequest(id: string) {
  db.update("org_requests", id, { deleted: false } as never);
}

/* =========================================================================
   ROUTE + UNIFIED PAGE
   ========================================================================= */

export const Route = createFileRoute("/super-admin/organizations")({
  component: Page,
});

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "active", "inactive"] as const;
type StatusFilterValue = (typeof STATUS_FILTERS)[number];

const TYPE_FILTERS = ["all", "organization", "request"] as const;
type TypeFilterValue = (typeof TYPE_FILTERS)[number];

const TYPE_META: Record<Exclude<TypeFilterValue, "all">, { label: string; icon: typeof Building2 }> = {
  organization: { label: "Organization", icon: Building2 },
  request: { label: "Request", icon: ClipboardList },
};

// Every field the register-organization form collects, carried uniformly
// for BOTH organizations and requests — OrgRequest extends Organization, so
// address/state/pincode/country/org_email/org_mobile are always present on
// a request too, not just on live organizations.
type UnifiedRow = {
  id: string;
  kind: "organization" | "request";
  name: string;
  category: string;
  contact_person: string;
  email: string;
  mobile: string;
  org_email: string;
  org_mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  status: StatusKey;
  org?: Org;
  request?: OrgRequest & { deleted?: boolean };
};

function Page() {
  const reqs = useDb(() => db.all("org_requests")) as (OrgRequest & { deleted?: boolean })[];
  const [orgRows, setOrgRows] = useState<Org[]>(initialOrgData);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [viewRow, setViewRow] = useState<UnifiedRow | null>(null);

  /* ---- build one combined list out of orgs + requests ---- */
  const unified: UnifiedRow[] = useMemo(() => {
    const orgItems: UnifiedRow[] = orgRows
      .filter((o) => !o.deleted)
      .map((o) => ({
        id: `org-${o.id}`,
        kind: "organization",
        name: o.name,
        category: o.category,
        contact_person: o.contact_person,
        email: o.email,
        mobile: o.mobile,
        org_email: o.org_email,
        org_mobile: o.org_mobile,
        address: o.address,
        city: o.city,
        state: o.state,
        pincode: o.pincode,
        country: o.country,
        status: o.status,
        org: o,
      }));

    const reqItems: UnifiedRow[] = reqs
      .filter((r) => !r.deleted)
      .map((r) => ({
        id: `req-${r.id}`,
        kind: "request",
        name: r.name,
        category: r.category,
        contact_person: r.contact_person,
        email: r.email,
        mobile: r.mobile,
        org_email: r.org_email,
        org_mobile: r.org_mobile,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        country: r.country,
        status: r.status as StatusKey,
        request: r,
      }));

    return [...orgItems, ...reqItems];
  }, [orgRows, reqs]);

  const filtered = useMemo(() => {
    let list = unified;
    if (typeFilter !== "all") list = list.filter((r) => r.kind === typeFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter((r) => r.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.org_email.toLowerCase().includes(q) ||
          r.contact_person.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.pincode.includes(q)
      );
    }
    // When no single status is picked, group by status so pending requests
    // surface first, then rejected, approved, active, inactive.
    if (statusFilter === "all") {
      list = [...list].sort((a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]);
    }
    return list;
  }, [unified, typeFilter, statusFilter, categoryFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  const counts = useMemo(() => {
    const liveOrgs = orgRows.filter((r) => !r.deleted);
    const liveReqs = reqs.filter((r) => !r.deleted);
    return {
      total: liveOrgs.length + liveReqs.length,
      active: liveOrgs.filter((r) => r.status === "active").length,
      inactive: liveOrgs.filter((r) => r.status === "inactive").length,
      pending: liveReqs.filter((r) => r.status === "pending").length,
      approved: liveReqs.filter((r) => r.status === "approved").length,
      rejected: liveReqs.filter((r) => r.status === "rejected").length,
    };
  }, [orgRows, reqs]);

  const toggleOrgStatus = (id: string) => {
    setOrgRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r))
    );
    toast.success("Status updated");
  };

  const softDeleteOrg = (org: Org) => {
    setOrgRows((prev) => prev.map((r) => (r.id === org.id ? { ...r, deleted: true } : r)));
    toast.success(`${org.name} moved to trash`, {
      action: { label: "Undo", onClick: () => restoreOrg(org.id) },
    });
  };

  const restoreOrg = (id: string) => {
    setOrgRows((prev) => prev.map((r) => (r.id === id ? { ...r, deleted: false } : r)));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Organizations" subtitle="Manage organizations and onboarding requests in one place." />

      {/* TOOLBAR */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations & requests..."
              className="h-9 w-64 pl-8 text-sm"
            />
          </div>

          {/* TYPE FILTER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Layers className="h-3.5 w-3.5" />
                {typeFilter === "all" ? "All types" : TYPE_META[typeFilter].label + "s"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTypeFilter("all")}>All types</DropdownMenuItem>
              {TYPE_FILTERS.filter((t) => t !== "all").map((t) => {
                const meta = TYPE_META[t as Exclude<TypeFilterValue, "all">];
                return (
                  <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)} className="gap-2">
                    <meta.icon className="h-3.5 w-3.5" />
                    {meta.label}s
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* STATUS FILTER — covers the full lifecycle: pending, approved,
              rejected (requests) and active, inactive (organizations) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter === "all" ? "All statuses" : STATUS_META[statusFilter].label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All statuses</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Requests</DropdownMenuLabel>
              {(["pending", "approved", "rejected"] as const).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    {meta.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Organizations</DropdownMenuLabel>
              {(["active", "inactive"] as const).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                return (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)} className="gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    {meta.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CATEGORY FILTER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Building2 className="h-3.5 w-3.5" />
                {categoryFilter === "all" ? "All categories" : categoryMeta(categoryFilter).label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Filter by category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCategoryFilter("all")}>All categories</DropdownMenuItem>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <DropdownMenuItem key={key} onClick={() => setCategoryFilter(key)} className="gap-2">
                  <meta.icon className="h-3.5 w-3.5" />
                  {meta.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => exportData("csv", "organizations", "Organizations & requests", filtered)} className="gap-3">
                <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("xls", "organizations", "Organizations & requests", filtered)} className="gap-3">
                <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("pdf", "organizations", "Organizations & requests", filtered)} className="gap-3">
                <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <XCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <XCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.inactive}</div>
              <div className="text-xs text-muted-foreground">Inactive</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[1.5fr_0.9fr_1fr_1.3fr_0.9fr_0.9fr_1.2fr] gap-2 border-b bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <div>Organization</div>
              <div>Category</div>
              <div>Contact</div>
              <div>Email</div>
              <div>Type</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No records found</p>
                <p className="text-xs text-muted-foreground">
                  {search || statusFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "Organizations and requests will appear here."}
                </p>
                {(search || statusFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              paginated.map((row) => {
                const cat = categoryMeta(row.category);
                const CatIcon = cat.icon;
                const typeMeta = TYPE_META[row.kind];
                const TypeIcon = typeMeta.icon;

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.5fr_0.9fr_1fr_1.3fr_0.9fr_0.9fr_1.2fr] items-center gap-2 border-b px-4 py-3 text-sm transition hover:bg-muted/20 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(row.name) || <Building2 className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{row.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[row.city, row.state, row.pincode].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                        style={{ background: `${cat.color}14`, borderColor: `${cat.color}33`, color: cat.color }}
                      >
                        <CatIcon className="h-3.5 w-3.5" />
                        {cat.label}
                      </span>
                    </div>

                    <div className="truncate text-muted-foreground">{row.contact_person || "—"}</div>
                    <div className="truncate text-muted-foreground">{row.email}</div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeMeta.label}
                    </div>

                    <div>
                      <StatusBadge
                        status={row.status}
                        onClick={row.kind === "organization" ? () => toggleOrgStatus(row.org!.id) : undefined}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <button className={iconBtn} aria-label={`View ${row.name}`} onClick={() => setViewRow(row)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>

                      {row.kind === "request" && (
                        <>
                          <button
                            disabled={row.status === "approved"}
                            onClick={() => approveRequest(row.request!)}
                            aria-label={`Approve ${row.name}`}
                            className={`${iconBtn} ${
                              row.status === "approved"
                                ? "cursor-not-allowed text-green-600 opacity-40"
                                : "text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            disabled={row.status === "rejected"}
                            onClick={() => rejectRequest(row.request!)}
                            aria-label={`Reject ${row.name}`}
                            className={`${iconBtn} ${
                              row.status === "rejected"
                                ? "cursor-not-allowed text-red-600 opacity-40"
                                : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            }`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      <button
                        aria-label={`Delete ${row.name}`}
                        onClick={() => (row.kind === "organization" ? softDeleteOrg(row.org!) : softDeleteRequest(row.request!))}
                        className={`${iconBtn} text-red-600 hover:bg-red-50 dark:hover:bg-red-950`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PAGINATION */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
            <div className="text-xs text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {filtered.length}
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              <span className="px-2 text-xs font-medium text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={safePage === totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* VIEW DETAILS DIALOG — every field the register-organization form
          collects, shown the same way regardless of whether this is a live
          organization or a pending request. */}
      <Dialog open={!!viewRow} onOpenChange={(v) => !v && setViewRow(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewRow && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(viewRow.name)}
                  </div>
                  <div>
                    <DialogTitle>{viewRow.name}</DialogTitle>
                    <DialogDescription className="capitalize">
                      {categoryMeta(viewRow.category).label} · {TYPE_META[viewRow.kind].label}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-2">
                <DetailField label="Contact person" value={viewRow.contact_person} />
                <DetailField label="Status" value={STATUS_META[viewRow.status].label} />

                <DetailField icon={Mail} label="Contact email" value={viewRow.email} />
                <DetailField icon={Phone} label="Contact mobile" value={viewRow.mobile} />

                <DetailField icon={Mail} label="Organisation email" value={viewRow.org_email} />
                <DetailField icon={Phone} label="Organisation mobile" value={viewRow.org_mobile} />

                <DetailField icon={MapPin} label="Address" value={viewRow.address} full />
                <DetailField label="City" value={viewRow.city} />
                <DetailField label="State" value={viewRow.state} />
                <DetailField icon={Hash} label="Pincode" value={viewRow.pincode} />
                <DetailField icon={Globe} label="Country" value={viewRow.country} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewRow(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}