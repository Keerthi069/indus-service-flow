import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { db, useDb, uid, type Employee, type Organization } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

// NOTE: adjust this import path if your seed module lives somewhere other
// than "@/lib/mock/seed" — this file is the one that exports SHIFT_KEYS /
// SHIFT_LABELS (see the seeds.ts you shared).
//
// CATEGORY_SHIFTS/DEFAULT_SHIFTS currently aren't exported from seed.ts —
// they're declared as plain `const` (not `export const`) right above
// `export const SHIFT_KEYS`. Add the `export` keyword to both of those two
// declarations in seed.ts for this import to resolve.
import { SHIFT_KEYS, SHIFT_LABELS, CATEGORY_SHIFTS, DEFAULT_SHIFTS } from "@/lib/mock/seed";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png"

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Filter,
  Download,
  Search,
  Users,
  BadgeCheck,
  CircleSlash,
  PauseCircle,
  PlayCircle,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  Phone,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Clock,
  CalendarClock,
  LogIn,
  LogOut,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/org-admin/employees")({
  component: EmpPage,
});

const PAGE_SIZE = 8;

// ── Shift types ──────────────────────────────────────────────────────────────

type ShiftIcon = typeof Sunrise;

// Icon/color styling per shift key. Kept separate from the label/time text
// (which comes straight from seed.ts's SHIFT_LABELS) so this page owns only
// presentation, never the actual set of valid shift values.
const SHIFT_DISPLAY: Record<string, { label: string; icon: ShiftIcon; color: string }> = {
  morning: { label: "Morning", icon: Sunrise, color: "#eda100" },
  afternoon: { label: "Afternoon", icon: Sun, color: "#2a78d6" },
  evening: { label: "Evening", icon: Sunset, color: "#e2621b" },
  night: { label: "Night", icon: Moon, color: "#6d5ce8" },
  general: { label: "General", icon: Clock, color: "#0ea5e9" },
  full_day: { label: "Full Day", icon: CalendarClock, color: "#16a34a" },
  opening: { label: "Opening", icon: LogIn, color: "#059669" },
  mid: { label: "Mid-Day", icon: Sun, color: "#ca8a04" },
  closing: { label: "Closing", icon: LogOut, color: "#b91c1c" },
};

// Built directly off seed.ts's SHIFT_KEYS / SHIFT_LABELS so this list can
// never drift from what orgs are actually seeded with. Previously this was
// a hardcoded 4-value array (morning/afternoon/evening/night) with its own
// made-up time ranges — banks ("general"), clinics ("full_day"), and retail
// ("opening"/"mid"/"closing") employees didn't match any entry, so
// shiftMeta() silently fell back to "Morning, 6 AM – 2 PM" for all of them,
// and even the 4 shared keys had times that didn't match seed.ts (e.g.
// "evening" here was "4 PM – 12 AM" vs. seed.ts's "2:00 PM – 10:00 PM").
const SHIFTS = SHIFT_KEYS.map((value) => ({
  value,
  label: SHIFT_DISPLAY[value]?.label ?? value,
  time: SHIFT_LABELS[value] ?? "",
  icon: SHIFT_DISPLAY[value]?.icon ?? Clock,
  color: SHIFT_DISPLAY[value]?.color ?? "#6b7280",
}));

function shiftMeta(value: string) {
  return (
    SHIFTS.find((s) => s.value === value) ?? {
      value,
      label: value || "Not set",
      time: "",
      icon: Clock,
      color: "#6b7280",
    }
  );
}

function ShiftBadge({ value }: { value: string }) {
  const shift = shiftMeta(value);
  const Icon = shift.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ background: `${shift.color}14`, borderColor: `${shift.color}33`, color: shift.color }}
      title={shift.time}
    >
      <Icon className="h-3.5 w-3.5" />
      {shift.label}
    </span>
  );
}

/**
 * `Employee.status` in db.ts is typed as "active" | "inactive" only — it
 * doesn't know about "hold". Rather than editing the shared db.ts type
 * (which every other page that reads `employees` also depends on), "hold"
 * is layered on locally via this type, the same way the organizations page
 * layered `deleted` on top of `Organization`. Writes that set "hold" are
 * cast `as never`, matching that same pattern.
 */
type EmpStatus = "active" | "inactive" | "hold";
type EmpRow = Omit<Employee, "status"> & { status: EmpStatus };

// Same hex-pill status language used on Queues/Appointments/Customers.
const STATUS_META = {
  active: { label: "Active", icon: BadgeCheck, color: "#1baf7a" },
  inactive: { label: "Inactive", icon: CircleSlash, color: "#dc2626" },
  hold: { label: "On Hold", icon: PauseCircle, color: "#eda100" },
} as const;

const FILTERS: Array<{ value: "all" | EmpStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "hold", label: "On Hold" },
];

function StatusBadge({ status }: { status: EmpStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.inactive;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function initials(name: string) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

const iconBtn =
  "h-8 w-8 p-0 flex items-center justify-center border rounded-md hover:bg-muted disabled:hover:bg-transparent transition-colors";

/* =========================================================================
   ADD / EDIT FORM
   ========================================================================= */

type EmployeeFormState = {
  name: string;
  designation: string;
  mobile: string;
  email: string;
  shift: string;
  status: EmpStatus;
};

const EMPTY_FORM: EmployeeFormState = {
  name: "",
  designation: "",
  mobile: "",
  email: "",
  shift: "", // filled in per-org when the dialog is opened, see openAddForm
  status: "active",
};

function EmployeeFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  shiftOptions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "add" | "edit";
  initial: EmployeeFormState;
  onSubmit: (values: EmployeeFormState) => void;
  // Shifts valid for the logged-in org's category (e.g. banks only ever
  // show "General") — falls back to the full SHIFTS list if not provided.
  shiftOptions?: typeof SHIFTS;
}) {
  const availableShifts = shiftOptions && shiftOptions.length ? shiftOptions : SHIFTS;
  const [form, setForm] = useState<EmployeeFormState>(initial);

  // Reset local form state to `initial` whenever the dialog opens fresh
  // (new "add", or a different row's "edit") rather than reusing whatever
  // was left over from the last time it was open.
  useMemo(() => {
    if (open) setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial.name, initial.designation, initial.mobile, initial.email, initial.shift, initial.status]);

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Name is required.");
    if (!form.mobile.trim()) return toast.error("Mobile number is required.");
    if (!form.email.trim()) return toast.error("Email is required.");
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add employee" : "Edit employee"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Add a new staff member to your organization." : "Update this employee's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Section 1: who they are */}
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="emp-name">Full name</Label>
                <Input
                  id="emp-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Aishwarya Menon"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="emp-designation">Designation</Label>
                <Input
                  id="emp-designation"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Nurse, Cashier"
                />
              </div>
            </div>
          </div>

          {/* Section 2: how to reach them */}
          <div className="grid gap-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="emp-mobile">Mobile</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="emp-mobile"
                    value={form.mobile}
                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                    placeholder="+91 98xxx xxxxx"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="emp-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="emp-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@company.in"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: where/when they work */}
          <div className="grid gap-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Shift</Label>
                <Select value={form.shift} onValueChange={(v) => setForm((f) => ({ ...f, shift: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShifts.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label} ({s.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as EmpStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{mode === "add" ? "Add employee" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   DELETE CONFIRMATION
   ========================================================================= */

function DeleteConfirmDialog({
  open,
  onOpenChange,
  employeeName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeName: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete employee?</DialogTitle>
          <DialogDescription>
            This will remove <span className="font-medium text-foreground">{employeeName}</span> from your
            organization. You can undo this immediately after, but not later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   PAGE
   ========================================================================= */

function EmpPage() {
  const { user } = useAuth();
  const orgId = user!.organization_id!;

  const rows = useDb(() =>
    db.all("employees").filter((r) => r.organization_id === orgId)
  ) as EmpRow[];

  // The logged-in org admin's own organization, so the shift picker can be
  // scoped to shifts that actually apply to this business type (a bank
  // should only ever offer "General", not "Night" or "Opening").
  const organization = useMemo<Organization | undefined>(
    () => db.all("organizations").find((o) => o.id === orgId),
    [orgId]
  );

  // Shifts valid for this org's category, in the order seed.ts defines
  // them (e.g. CATEGORY_SHIFTS.bank = ["general"]). Falls back to
  // DEFAULT_SHIFTS for any category not covered there.
  const orgShifts = useMemo(() => {
    const values = organization ? CATEGORY_SHIFTS[organization.category] ?? DEFAULT_SHIFTS : DEFAULT_SHIFTS;
    const resolved = values.map((v) => SHIFTS.find((s) => s.value === v)).filter((s): s is (typeof SHIFTS)[number] => !!s);
    return resolved.length ? resolved : SHIFTS;
  }, [organization]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EmpStatus>("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<EmployeeFormState>(EMPTY_FORM);
  // The shift options passed to the dialog for the row currently being
  // added/edited — org-scoped, plus the row's own current shift if it
  // happens to fall outside that scope (so editing never silently drops
  // a legacy value the Select can't otherwise render).
  const [formShiftOptions, setFormShiftOptions] = useState<typeof SHIFTS>(orgShifts);

  const [deleteTarget, setDeleteTarget] = useState<EmpRow | null>(null);

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
          r.designation?.toLowerCase().includes(q) ||
          r.mobile?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q)
      );
    }

    return data;
  }, [rows, statusFilter, search]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      inactive: rows.filter((r) => r.status === "inactive").length,
      hold: rows.filter((r) => r.status === "hold").length,
    }),
    [rows]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginated = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Badge click keeps its original simple job: toggle active <-> inactive.
  // "Hold" is a deliberate action (the dedicated pause button below), not
  // something a stray badge click should be able to land on or clear.
  function toggleStatus(id: string, current: EmpStatus) {
    db.update("employees", id, {
      status: current === "active" ? "inactive" : "active",
    } as never);
  }

  // Dedicated hold/resume action. Holding always remembers "active" as the
  // resume target (rather than restoring whatever it was before, e.g.
  // "inactive") since putting an inactive employee on hold and resuming
  // them to inactive again would be a no-op the button shouldn't offer.
  function toggleHold(row: EmpRow) {
    if (row.status === "hold") {
      db.update("employees", row.id, { status: "active" } as never);
      toast.success(`${row.name} resumed`);
    } else {
      db.update("employees", row.id, { status: "hold" } as never);
      toast.success(`${row.name} put on hold`);
    }
  }

  // ── Add / Edit ────────────────────────────────────────────────────────

  function openAddForm() {
    setFormMode("add");
    setEditingId(null);
    setFormInitial({ ...EMPTY_FORM, shift: orgShifts[0]?.value ?? "" });
    setFormShiftOptions(orgShifts);
    setFormOpen(true);
  }

  function openEditForm(row: EmpRow) {
    setFormMode("edit");
    setEditingId(row.id);
    setFormInitial({
      name: row.name,
      designation: row.designation,
      mobile: row.mobile,
      email: row.email,
      shift: row.shift,
      status: row.status,
    });
    // Include the row's existing shift even if it's outside the org's
    // normal set, so an older/mismatched record doesn't get silently
    // cleared just by opening the edit dialog.
    const hasCurrent = orgShifts.some((s) => s.value === row.shift);
    const currentShift = SHIFTS.find((s) => s.value === row.shift);
    setFormShiftOptions(hasCurrent || !currentShift ? orgShifts : [...orgShifts, currentShift]);
    setFormOpen(true);
  }

  function handleFormSubmit(values: EmployeeFormState) {
    if (formMode === "add") {
      const newEmployee: EmpRow = {
        id: uid("emp"),
        organization_id: orgId,
        name: values.name.trim(),
        designation: values.designation.trim(),
        mobile: values.mobile.trim(),
        email: values.email.trim(),
        shift: values.shift,
        status: values.status,
        rating: 4.0,
        created_at: new Date().toISOString(),
      };
      db.insert("employees", newEmployee as never);
      toast.success(`${newEmployee.name} added`);
    } else if (editingId) {
      db.update("employees", editingId, {
        name: values.name.trim(),
        designation: values.designation.trim(),
        mobile: values.mobile.trim(),
        email: values.email.trim(),
        shift: values.shift,
        status: values.status,
      } as never);
      toast.success("Employee updated");
    }
    setFormOpen(false);
  }

  // ── Delete (hard delete, with a brief undo window) ───────────────────

  function confirmDelete() {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    db.remove("employees", removed.id);
    toast.success(`${removed.name} deleted`, {
      action: {
        label: "Undo",
        onClick: () => db.insert("employees", removed as never),
      },
    });
    setDeleteTarget(null);
  }

  // ── Export ─────────────────────────────────────────────────────────────

  function exportExcel() {
    if (!filteredRows.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees.xlsx");
  }

  function exportCSV() {
    if (!filteredRows.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (!filteredRows.length) return;
    const pdf = new jsPDF();
    autoTable(pdf, {
      head: [["Name", "Designation", "Mobile", "Email", "Shift", "Status"]],
      body: filteredRows.map((r) => [
        r.name ?? "",
        r.designation ?? "",
        r.mobile ?? "",
        r.email ?? "",
        shiftMeta(r.shift).label,
        STATUS_META[r.status]?.label ?? r.status ?? "",
      ]),
    });
    pdf.save("employees.pdf");
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Employees" subtitle="Manage staff, designations and shifts." />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>

          {/* FILTER */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter === "all" ? "All statuses" : STATUS_META[statusFilter].label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {FILTERS.map((f) => (
                <DropdownMenuItem
                  key={f.value}
                  onClick={() => {
                    setStatusFilter(f.value);
                    setPage(1);
                  }}
                >
                  {f.value !== "all" ? (
                    <span style={{ color: STATUS_META[f.value].color }}>{f.label}</span>
                  ) : (
                    f.label
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* EXPORT */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-3">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={exportCSV} className="gap-2">
                <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>

              <DropdownMenuItem onClick={exportExcel} className="gap-2">
                <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>

              <DropdownMenuItem onClick={exportPDF} className="gap-2">
                <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ADD EMPLOYEE */}
          <Button size="sm" className="h-9 gap-1.5" onClick={openAddForm}>
            <Plus className="h-3.5 w-3.5" />
            Add employee
          </Button>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.total}</div>
              <div className="text-xs text-muted-foreground">Total employees</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <BadgeCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <PauseCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{counts.hold}</div>
              <div className="text-xs text-muted-foreground">On hold</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <CircleSlash className="h-4.5 w-4.5" />
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
            <div className="grid grid-cols-[1.3fr_1fr_0.9fr_1.3fr_0.9fr_0.9fr_0.9fr] gap-2 border-b bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <div>Name</div>
              <div>Designation</div>
              <div>Mobile</div>
              <div>Email</div>
              <div>Shift</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {paginated.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No employees found</p>
                <p className="text-xs text-muted-foreground">
                  {search || statusFilter !== "all" ? "Try adjusting your search or filter." : "New employees will show up here."}
                </p>
                {!search && statusFilter === "all" && (
                  <Button variant="outline" size="sm" className="mt-1 gap-1.5" onClick={openAddForm}>
                    <Plus className="h-3.5 w-3.5" />
                    Add your first employee
                  </Button>
                )}
              </div>
            ) : (
              paginated.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[1.3fr_1fr_0.9fr_1.3fr_0.9fr_0.9fr_0.9fr] items-center gap-2 border-b px-4 py-3 text-sm transition hover:bg-muted/20 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(r.name)}
                    </div>
                    <span className="truncate font-medium text-foreground">{r.name}</span>
                  </div>

                  <div className="truncate text-muted-foreground">{r.designation || "—"}</div>

                  <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    {r.mobile || "—"}
                  </div>

                  <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    {r.email || "—"}
                  </div>

                  <div>
                    <ShiftBadge value={r.shift} />
                  </div>

                  <div>
                    <button onClick={() => toggleStatus(r.id, r.status)} title="Click to toggle active/inactive">
                      <StatusBadge status={r.status} />
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <button
                      className={iconBtn}
                      title={r.status === "hold" ? "Resume" : "Put on hold"}
                      aria-label={r.status === "hold" ? `Resume ${r.name}` : `Hold ${r.name}`}
                      onClick={() => toggleHold(r)}
                    >
                      {r.status === "hold" ? (
                        <PlayCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <PauseCircle className="h-4 w-4 text-amber-600" />
                      )}
                    </button>
                    <button
                      className={iconBtn}
                      title="Edit"
                      aria-label={`Edit ${r.name}`}
                      onClick={() => openEditForm(r)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      className={`${iconBtn} text-red-600 hover:bg-red-50 dark:hover:bg-red-950`}
                      title="Delete"
                      aria-label={`Delete ${r.name}`}
                      onClick={() => setDeleteTarget(r)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAGINATION */}
        {filteredRows.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs font-medium text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={formInitial}
        onSubmit={handleFormSubmit}
        shiftOptions={formShiftOptions}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        employeeName={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
      />
    </div>
  );
}