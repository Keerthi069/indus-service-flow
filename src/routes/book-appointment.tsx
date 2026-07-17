import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CheckCircle2, ArrowRight, ArrowLeft, Check, Home,
  User, Phone, Mail, Building2, Wrench, CalendarCheck, Clock, UserCog,
  Hospital, Stethoscope, Landmark, Store, Headphones, Download, Printer,
} from "lucide-react";

import {
  db,
  uid,
  useDb,
  resolveShift,
  isTimeInShiftRange,
  fmt12,
  type Service,
  type Employee,
  type Appointment,
} from "@/lib/mock/db";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/book-appointment")({
  component: BookAppointment,
});

// Same category color language used across the admin pages, so a category
// looks the same whether you're an admin or a customer booking a slot.
const CATEGORIES = [
  { id: "hospital", label: "Hospital", icon: Hospital, color: "#dc2626" },
  { id: "clinic", label: "Clinic", icon: Stethoscope, color: "#0891b2" },
  { id: "bank", label: "Bank", icon: Landmark, color: "#2a78d6" },
  { id: "retail", label: "Retail", icon: Store, color: "#1baf7a" },
  { id: "support", label: "Support", icon: Headphones, color: "#7c5cff" },
];

function categoryMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

const STEPS = [
  { n: 1, label: "Your details" },
  { n: 2, label: "Booking" },
  { n: 3, label: "Review" },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

// Same off-day convention as the employee Schedule page (OFF_DAY there).
// Kept in sync manually until per-employee off-days exist in the data model.
function isOffDay(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.getDay() === 0; // Sunday
}

// Local date string (YYYY-MM-DD) for "today", used as the min bookable date
// and to filter out past time slots.
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Converts a "HH:MM" 24h slot string to minutes-since-midnight, so it can
// be run through fmt12() for a 12-hour display label and compared against
// resolveShift()'s {startMin, endMin} output.
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// True if `employeeId` already has a non-cancelled appointment at this
// date+time — checked against both the legacy single `employee_id` field
// and the multi-service `employee_ids` array, so a double-booking can't
// slip through either shape.
function isSlotTaken(
  employeeId: string,
  date: string,
  time: string,
  appointments: Appointment[]
): boolean {
  return appointments.some(
    (a: any) =>
      a.date === date &&
      a.time === time &&
      a.status !== "cancelled" &&
      (a.employee_id === employeeId ||
        (Array.isArray(a.employee_ids) && a.employee_ids.includes(employeeId)))
  );
}

// serviceIds (plural) replaces the old single serviceId — a customer can now
// pick more than one service for the same appointment. employeeAssignments
// maps each selected service's id -> the employee assigned to perform it
// (a single employee often can't cover every service, so this replaces the
// old single employeeId field).
const emptyForm = {
  name: "",
  gender: "",
  mobile: "",
  email: "",
  category: "",
  orgId: "",
  serviceIds: [] as string[],
  employeeAssignments: {} as Record<string, string>,
  date: "",
  time: "",
};

// ── Step dots (plain numbered circles + connecting line, no text labels) ──

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              step > s.n
                ? "bg-teal-600 text-white"
                : step === s.n
                ? "bg-teal-600 text-white"
                : "border border-border bg-white text-muted-foreground"
            }`}
          >
            {step > s.n ? <Check className="h-4 w-4" /> : s.n}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-16 sm:w-24 transition-colors ${
                step > s.n ? "bg-teal-500" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Multi-select service picker (checkbox list + selected chips) ──────────
// shadcn's <Select> is single-value only, so a plain checkbox list is used
// here instead of trying to force multi-select semantics onto it.

function ServiceMultiSelect({
  services,
  selectedIds,
  onChange,
  disabled,
}: {
  services: Service[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div className={`rounded-md border border-border ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      {services.length === 0 ? (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {disabled ? "Choose an organization first" : "No services available for this organization"}
        </p>
      ) : (
        <div className="max-h-48 divide-y divide-border/60 overflow-y-auto">
          {services.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <label
                key={s.id}
                className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(s.id)}
                    className="h-4 w-4 rounded border-border accent-teal-600"
                  />
                  {s.name}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {s.duration_min} min{s.fee ? ` · ₹${s.fee}` : " · Free"}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-3 py-2">
          {selectedIds.map((id) => {
            const s = services.find((sv) => sv.id === id);
            if (!s) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700"
              >
                {s.name}
                <button
                  type="button"
                  aria-label={`Remove ${s.name}`}
                  onClick={() => toggle(id)}
                  className="text-teal-500 hover:text-teal-700"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookAppointment() {
  const orgs = useDb(() => db.all("organizations"));
  const services = useDb(() => db.all("services"));
  const employees = useDb(() => db.all("employees"));
  const appointments = useDb(() => db.all("appointments")) as Appointment[];

  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState<{ token: string } | null>(null);

  const [form, setForm] = useState(emptyForm);

  const orgsFiltered = orgs.filter((o) => o.category === form.category);
  const servicesFiltered = services.filter((s) => s.organization_id === form.orgId);
  const employeesFiltered = employees.filter((e) => e.organization_id === form.orgId);

  const summary = useMemo(() => {
    const org = orgs.find((o) => o.id === form.orgId);
    const selectedServices = services.filter((s) => form.serviceIds.includes(s.id));
    const assignments = selectedServices.map((s) => ({
      service: s,
      employee: employees.find((e) => e.id === form.employeeAssignments[s.id]),
    }));
    const totalFee = selectedServices.reduce((sum, s) => sum + (s.fee || 0), 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_min || 0), 0);
    // Deduped, in case the same staff member ends up assigned to more than
    // one of the selected services.
    const uniqueEmployees = Array.from(
      new Map(assignments.filter((a) => a.employee).map((a) => [a.employee!.id, a.employee!])).values()
    );
    return { org, services: selectedServices, assignments, totalFee, totalDuration, employees: uniqueEmployees };
  }, [form, orgs, services, employees]);

  // Per-service employee options: qualified for the service (designation →
  // service_ids mapping, same as before) AND actually available on the
  // chosen date:
  //   - shift string must resolve to a real range (unparseable shift ⇒ we
  //     can't confirm they're working, so they're excluded rather than
  //     silently offered),
  //   - the date must not be their off day,
  //   - they must have at least one still-open slot that day (not already
  //     fully booked out by someone else).
  // Without a date, availability can't be evaluated, so only the
  // capability filter applies.
  const employeeOptionsByService = useMemo(() => {
    const map: Record<string, { employee: Employee; rangeLabel: string }[]> = {};

    summary.services.forEach((s) => {
      const capable = employeesFiltered.filter((e) => {
        const ids = (e as any).service_ids as string[] | undefined;
        return Array.isArray(ids) && ids.includes(s.id);
      });

      map[s.id] = capable
        .map((e) => ({ employee: e, parsed: resolveShift((e as any).shift, summary.org) }))
        .filter(({ employee, parsed }) => {
          if (!parsed) return false; // shift didn't parse — can't confirm they're working
          if (!form.date) return true; // no date chosen yet, can't check further
          if (isOffDay(form.date)) return false;
          return TIME_SLOTS.some(
            (t) => isTimeInShiftRange(t, parsed) && !isSlotTaken(employee.id, form.date, t, appointments)
          );
        })
        .map(({ employee, parsed }) => ({
          employee,
          rangeLabel: parsed ? `${fmt12(parsed.startMin)} - ${fmt12(parsed.endMin)}` : "",
        }));
    });

    return map;
  }, [summary.services, summary.org, employeesFiltered, form.date, appointments]);

  // Customers can only book today or a future date, and — when the date is
  // today — only time slots that haven't already passed. On top of that,
  // once staff are assigned, slots are further narrowed to the
  // intersection of every assigned employee's shift range, minus any slot
  // where an assigned employee is already booked elsewhere. This is what
  // stops a 6am–2pm employee from ever being bookable at 5pm.
  const minDate = useMemo(() => todayStr(), []);

  const availableTimeSlots = useMemo(() => {
    let slots: string[] = TIME_SLOTS;

    if (form.date === minDate) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      slots = slots.filter((t) => timeToMin(t) > nowMinutes);
    }

    const assignedIds = Object.values(form.employeeAssignments).filter(Boolean);
    if (form.date && assignedIds.length > 0) {
      const parsedShifts = assignedIds
        .map((id) => employees.find((e) => e.id === id))
        .filter((e): e is Employee => Boolean(e))
        .map((e) => resolveShift((e as any).shift, summary.org));

      slots = slots.filter(
        (t) =>
          parsedShifts.every((p) => p && isTimeInShiftRange(t, p)) &&
          assignedIds.every((id) => !isSlotTaken(id, form.date, t, appointments))
      );
    }

    return slots;
  }, [form.date, form.employeeAssignments, minDate, employees, appointments, summary.org]);

  function next() {
    if (step === 1 && (!form.name || !form.gender || !form.mobile || !form.email || !form.category || !form.orgId)) {
      return toast.error("Fill all required fields");
    }
    if (step === 2) {
      const missingEmployee = form.serviceIds.some((sid) => !form.employeeAssignments[sid]);
      if (form.serviceIds.length === 0 || !form.date || missingEmployee || !form.time) {
        return toast.error("Select a date, an employee for each service, and a time");
      }
      // Belt-and-suspenders: reject if the chosen time somehow isn't in the
      // currently-valid slot list (e.g. someone else just took it).
      if (!availableTimeSlots.includes(form.time)) {
        return toast.error("That time is no longer available — please pick another slot");
      }
    }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  // Booking is only ever created here, when the person explicitly confirms on
  // the review step — the success screen only ever appears after this runs.
  function confirm() {
    const id = uid("apt");
    const token = `T-${Math.floor(1000 + Math.random() * 9000)}`;

    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const customer_id = uid("cus");
    const service_names = summary.services.map((s) => s.name).join(", ");

    const service_assignments = summary.assignments.map((a) => ({
      service_id: a.service.id,
      service_name: a.service.name,
      employee_id: a.employee?.id,
      employee_name: a.employee?.name,
    }));
    const primary = service_assignments[0];

    db.insert("appointments", {
      id,
      token,
      organization_id: form.orgId,
      customer_id,
      customer_name: form.name,
      customer_gender: form.gender,
      customer_email: form.email,
      customer_mobile: form.mobile,
      // service_id/service_name/employee_id/employee_name kept for backward
      // compatibility with any code still reading a single service/employee
      // off an appointment; the full multi-service, per-service-assignment
      // picture lives in service_ids/service_names/service_assignments.
      service_id: form.serviceIds[0],
      service_name: service_names,
      service_ids: form.serviceIds,
      service_names: summary.services.map((s) => s.name),
      total_fee: summary.totalFee,
      total_duration_min: summary.totalDuration,
      employee_id: primary?.employee_id,
      employee_name: primary?.employee_name,
      employee_ids: summary.employees.map((e) => e.id),
      service_assignments,
      date: form.date,
      time: form.time,
      status: "confirmed",
      created_at,
      updated_at,
    } as never);

    setConfirmed({ token });
    toast.success("Appointment confirmed!");
  }

  function bookAgain() {
    setForm(emptyForm);
    setConfirmed(null);
    setStep(1);
  }

  // Builds a downloadable PDF receipt for the confirmed booking — services,
  // per-service fee, total, and the booking token/date/time so the customer
  // has something to keep or show up with. This is the single receipt
  // action offered on the confirmation screen (no separate print option).
  function downloadReceipt() {
    if (!confirmed) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Appointment Receipt", 14, 16);

    doc.setFontSize(10);
    doc.text(`Booking token: ${confirmed.token}`, 14, 25);
    doc.text(`Date & time: ${form.date} at ${form.time}`, 14, 31);

    doc.text(`Name: ${form.name}`, 14, 41);
    doc.text(`Mobile: ${form.mobile}`, 14, 47);
    doc.text(`Email: ${form.email}`, 14, 53);
    doc.text(`Organization: ${summary.org?.name ?? "—"}`, 14, 59);

    autoTable(doc, {
      startY: 67,
      head: [["Service", "Employee", "Duration", "Fee"]],
      body: summary.assignments.map(({ service, employee }) => [
        service.name,
        employee?.name ?? "—",
        `${service.duration_min} min`,
        service.fee ? `₹${service.fee}` : "Free",
      ]),
      foot: [["Total", "", `${summary.totalDuration} min`, summary.totalFee ? `₹${summary.totalFee}` : "Free"]],
    });

    doc.save(`appointment-receipt-${confirmed.token}.pdf`);
    toast.success("Receipt downloaded");
  }

  const catMeta = categoryMeta(form.category);

  // ── Success screen ──────────────────────────────────────────────────────

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 flex items-center justify-center p-6 print:block print:min-h-0 print:bg-white print:p-0">
        <div className="w-full max-w-lg">
          <Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-2xl animate-[fadeUp_0.5s_ease-out] print:shadow-none print:rounded-none print:border-0">
            <CardContent className="p-8 text-center print:p-0">
              {/* Celebratory chrome — not part of the actual receipt, so it's
                 excluded from print output. Uses the same teal used across
                 the booking flow's category chips, buttons, and step dots. */}
              <div className="print:hidden">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                  {/* decorative confetti around the checkmark */}
                  <span className="absolute -left-6 top-3 h-2 w-2 rotate-45 bg-sky-300" />
                  <span className="absolute -right-5 top-7 h-1.5 w-1.5 rounded-full bg-sky-300" />
                  <span className="absolute left-3 -top-3 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span className="absolute -right-8 -top-1 h-2 w-2 rotate-45 bg-amber-300" />
                  <span className="absolute -left-4 bottom-1 h-2 w-2 rotate-45 bg-amber-300" />
                  <span className="absolute right-3 bottom-3 h-1.5 w-1.5 rounded-full bg-sky-300" />

                  <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-teal-400/40" />
                  <span className="relative grid h-16 w-16 place-items-center rounded-full bg-teal-500 text-white shadow-lg">
                    <Check className="h-8 w-8" />
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-foreground">Your booking is confirmed</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A confirmation has been sent to {form.email}
                </p>
              </div>

              {/* ── The actual receipt — this is the only part visible when
                 the browser's Print action fires; everything else on this
                 screen (celebration copy, nav buttons, receipt actions) is
                 chrome around it, kept outside this div. ── */}
              <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/40 p-5 text-left print:mt-0 print:rounded-none print:border-0 print:bg-white print:p-0">
                <div className="mb-4 flex items-center justify-between border-b border-teal-100 pb-3 print:pb-2">
                  <span className="text-sm font-bold uppercase tracking-wide text-foreground">Appointment Receipt</span>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Token</p>
                    <p className="font-mono text-sm font-bold text-teal-600">{confirmed.token}</p>
                  </div>
                </div>
                <SummaryRow icon={User} label="Name" value={form.name} />
                <SummaryRow icon={Building2} label="Organization" value={summary.org?.name} />
                <SummaryServicesRow assignments={summary.assignments} totalFee={summary.totalFee} totalDuration={summary.totalDuration} />
                <SummaryRow icon={CalendarCheck} label="Date" value={form.date} />
                <SummaryRow icon={Clock} label="Time" value={fmt12(timeToMin(form.time))} last />
              </div>

              {/* ── Actions — deliberately outside the receipt div above.
                 One visible trigger covers both receipt actions (download
                 PDF or print), and is itself hidden on print so the print
                 output only ever shows the receipt. ── */}
              <div className="mt-5 flex justify-center print:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-full border-teal-200 px-6 text-teal-700 hover:bg-teal-50">
                      <Download className="h-4 w-4" /> Receipt
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem onClick={downloadReceipt} className="gap-2">
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()} className="gap-2">
                      <Printer className="h-3.5 w-3.5" /> Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex gap-3 print:hidden">
                <Button asChild variant="outline" className="flex-1 gap-2 rounded-full">
                  <Link to="/">
                    <Home className="h-4 w-4" /> Back to Home
                  </Link>
                </Button>
                <Button className="flex-1 gap-2 rounded-full bg-teal-600 hover:bg-teal-700" onClick={bookAgain}>
                  <CalendarCheck className="h-4 w-4" /> Book Another Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // ── Booking flow ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600">Public booking</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Book an Appointment</h1>
          <p className="mt-1 text-sm text-muted-foreground">No login required. Confirmation in seconds.</p>
        </div>

        <StepDots step={step} />

        <Card className="mt-8 rounded-3xl border-0 bg-white/90 shadow-xl backdrop-blur">
          <CardContent className="p-8">
            {/* STEP 1 — DETAILS */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground">Your details</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" icon={User}>
                    <Input className="h-9 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                  </Field>
                 <Field label="Mobile number" icon={Phone}>
                    <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="9876543210" />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" icon={Mail}>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
                  </Field>
                    <Field label="Gender" icon={User}>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Organization category" icon={Building2}>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, orgId: "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Select organization" icon={catMeta?.icon ?? Building2}>
                  <Select
                    value={form.orgId}
                    onValueChange={(v) => setForm({ ...form, orgId: v, serviceIds: [], employeeAssignments: {} })}
                    disabled={!form.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={form.category ? "Select organization" : "Choose a category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {orgsFiltered.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">No organizations in this category yet</div>
                      )}
                      {orgsFiltered.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="flex justify-end pt-2">
                  <Button onClick={next} className="gap-2 bg-teal-600 hover:bg-teal-700">
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2 — BOOKING */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground">Service, staff & time</h2>

                {catMeta && (
                  <div
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
                    style={{ background: `${catMeta.color}0D`, borderColor: `${catMeta.color}33`, color: catMeta.color }}
                  >
                    <catMeta.icon className="h-3.5 w-3.5" />
                    {summary.org?.name} · {catMeta.label}
                  </div>
                )}

                <Field label="Services (select one or more)" icon={Wrench}>
                  <ServiceMultiSelect
                    services={servicesFiltered}
                    selectedIds={form.serviceIds}
                    onChange={(ids) =>
                      setForm((f) => {
                        // Drop any assignment for a service that just got
                        // unchecked, keep the rest as-is.
                        const pruned: Record<string, string> = {};
                        ids.forEach((sid) => {
                          if (f.employeeAssignments[sid]) pruned[sid] = f.employeeAssignments[sid];
                        });
                        return { ...f, serviceIds: ids, employeeAssignments: pruned, time: "" };
                      })
                    }
                  />
                  {form.serviceIds.length > 0 && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      {form.serviceIds.length} service{form.serviceIds.length > 1 ? "s" : ""} selected · {summary.totalDuration} min total
                      {summary.totalFee > 0 ? ` · ₹${summary.totalFee} total` : ""}
                    </p>
                  )}
                </Field>

                {/* Date comes before staff assignment — availability (who's
                   working, who's already booked) can't be evaluated without
                   a date, so staff options below are keyed off this. */}
                <Field label="Date" icon={CalendarCheck}>
                  <Input
                    type="date"
                    min={minDate}
                    value={form.date}
                    disabled={form.serviceIds.length === 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value, time: "", employeeAssignments: {} }))
                    }
                  />
                  {form.date && isOffDay(form.date) && (
                    <p className="pt-1 text-xs text-red-600">This is a weekly off day — no staff are working. Pick another date.</p>
                  )}
                </Field>

                {/* One employee picker per selected service — filtered to
                   staff who are (a) qualified for that specific service,
                   (b) actually working on the chosen date, and (c) not
                   already fully booked that day. A single employee often
                   can't cover every service (e.g. a bank Teller can't
                   process a Loan), so each service is staffed
                   independently. */}
                {form.serviceIds.length > 0 ? (
                  <Field label="Assign staff to each service" icon={UserCog}>
                    {!form.date ? (
                      <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                        Pick a date above to see who's available
                      </p>
                    ) : (
                      <div className="space-y-3 rounded-md border border-border p-3">
                        {summary.services.map((s) => {
                          const options = employeeOptionsByService[s.id] ?? [];
                          return (
                            <div key={s.id} className="flex items-center justify-between gap-3">
                              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{s.name}</span>
                              <Select
                                value={form.employeeAssignments[s.id] ?? ""}
                                onValueChange={(v) =>
                                  setForm((f) => ({
                                    ...f,
                                    employeeAssignments: { ...f.employeeAssignments, [s.id]: v },
                                    time: "", // previously-picked time may no longer fit this employee's shift
                                  }))
                                }
                              >
                                <SelectTrigger className="h-9 w-56 text-sm">
                                  <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">
                                      No staff available for "{s.name}" on this date
                                    </div>
                                  )}
                                  {options.map(({ employee, rangeLabel }) => (
                                    <SelectItem key={employee.id} value={employee.id}>
                                      {employee.name}
                                      {rangeLabel ? ` (${rangeLabel})` : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Field>
                ) : (
                  <Field label="Assign staff to each service" icon={UserCog}>
                    <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                      Select at least one service above to assign staff
                    </p>
                  </Field>
                )}

                {/* Time slot — limited to the intersection of every assigned
                   employee's shift range, minus any slot where an assigned
                   employee is already booked. This is what makes it
                   impossible to book a 6am–2pm employee at 5pm. */}
                <Field label="Time slot" icon={Clock}>
                  <Select
                    value={form.time}
                    onValueChange={(v) => setForm({ ...form, time: v })}
                    disabled={
                      !form.date ||
                      form.serviceIds.length === 0 ||
                      form.serviceIds.some((sid) => !form.employeeAssignments[sid])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !form.date
                            ? "Choose a date first"
                            : form.serviceIds.some((sid) => !form.employeeAssignments[sid])
                            ? "Assign staff first"
                            : "Select time"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {form.date && availableTimeSlots.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No slots left with the assigned staff on this date — pick another date or employee
                        </div>
                      )}
                      {availableTimeSlots.map((t) => (
                        <SelectItem key={t} value={t}>{fmt12(timeToMin(t))}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={back} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={next} className="gap-2 bg-teal-600 hover:bg-teal-700">
                    Review <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 — REVIEW (old logic, restyled) */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground">Review your booking</h2>

                <div className="rounded-2xl border bg-muted/20 px-4">
                  <SummaryRow icon={User} label="Name" value={form.name} />
                  <SummaryRow icon={User} label="Gender" value={form.gender} />
                  <SummaryRow icon={Phone} label="Mobile" value={form.mobile} />
                  <SummaryRow icon={Mail} label="Email" value={form.email} />
                  <SummaryRow icon={Building2} label="Organization" value={summary.org?.name} />
                  <SummaryServicesRow assignments={summary.assignments} totalFee={summary.totalFee} totalDuration={summary.totalDuration} />
                  <SummaryRow icon={CalendarCheck} label="Date" value={form.date} />
                  <SummaryRow icon={Clock} label="Time" value={form.time ? fmt12(timeToMin(form.time)) : ""} last />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={back} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={confirm} className="gap-2 bg-teal-600 hover:bg-teal-700">
                    <CheckCircle2 className="h-4 w-4" /> Confirm booking
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

// Renders a row with the icon + label on the left and the value on the
// right, separated by a dotted divider from the row below it. Used on the
// step-3 review screen.
function SummaryRow({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: typeof User;
  label: string;
  value?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 ${
        last ? "" : "border-b border-border/60"
      }`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

// Same visual row style as SummaryRow, but lists every selected service
// alongside the employee assigned to it (plus a running total) — used on
// the step-3 review screen wherever the old single-service/single-employee
// SummaryRow pair used to sit.
function SummaryServicesRow({
  assignments,
  totalFee,
  totalDuration,
}: {
  assignments: { service: Service; employee?: Employee }[];
  totalFee: number;
  totalDuration: number;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600">
        <Wrench className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Services</p>
        {assignments.length === 0 ? (
          <p className="text-sm font-semibold text-foreground">—</p>
        ) : (
          <div className="mt-1 space-y-1.5">
            {assignments.map(({ service, employee }) => (
              <div key={service.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-semibold text-foreground">
                  {service.name}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    → {employee?.name ?? "—"} · {service.duration_min} min
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-teal-700">
                  {service.fee ? `₹${service.fee}` : "Free"}
                </span>
              </div>
            ))}
            <p className="border-t border-dashed border-border/60 pt-1.5 text-xs font-bold text-foreground">
              Total: {totalDuration} min{totalFee > 0 ? ` · ₹${totalFee}` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}