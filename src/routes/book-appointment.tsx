import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarIcon, Check, ChevronLeft, ChevronRight, Waves, Printer, Download, Hospital, Stethoscope, Landmark, Store, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { db, uid, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/book-appointment")({
  head: () => ({ meta: [{ title: "Book Appointment · Indus Service Flow" }, { name: "description", content: "Book an appointment with hospitals, clinics, banks, retail stores and customer support centers." }] }),
  component: BookAppointment,
});

const ICON_MAP: Record<string, any> = { hospital: Hospital, clinic: Stethoscope, bank: Landmark, retail: Store, support: Headphones };
const REQUIRES_EMPLOYEE = new Set(["hospital", "clinic"]);

const STEPS = ["Category", "Organization", "Service", "Employee", "Date", "Time", "Customer", "Confirm"];

function BookAppointment() {
  const orgs = useDb(() => db.all("organizations").filter(o => o.status === "approved" || o.status === "active"));
  const services = useDb(() => db.all("services"));
  const employees = useDb(() => db.all("employees"));
  const appointments = useDb(() => db.all("appointments"));

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [orgId, setOrgId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [cust, setCust] = useState({ name: "", email: "", mobile: "", notes: "" });
  const [confirmed, setConfirmed] = useState<{ token: string; no: string } | null>(null);

  const org = orgs.find(o => o.id === orgId);
  const service = services.find(s => s.id === serviceId);
  const employee = employees.find(e => e.id === employeeId);

  const orgsForCategory = orgs.filter(o => o.category === category);
  const servicesForOrg = services.filter(s => s.organization_id === orgId && s.status === "active");
  const employeesForOrg = employees.filter(e => e.organization_id === orgId && e.status === "active");

  const dateStr = date ? date.toISOString().slice(0, 10) : "";
  const allSlots = useMemo(() => {
    const out: string[] = [];
    for (let h = 9; h < 18; h++) for (const m of [0, 15, 30, 45]) out.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    return out;
  }, []);
  const takenSlots = new Set(appointments
    .filter(a => a.organization_id === orgId && a.date === dateStr && (!employeeId || a.employee_id === employeeId) && a.status !== "cancelled")
    .map(a => a.time));

  function next() {
    if (step === 0 && !category) return toast.error("Select a category");
    if (step === 1 && !orgId) return toast.error("Select an organization");
    if (step === 2 && !serviceId) return toast.error("Select a service");
    if (step === 3 && REQUIRES_EMPLOYEE.has(category) && !employeeId) return toast.error("Select an employee");
    if (step === 4 && !date) return toast.error("Select a date");
    if (step === 5 && !time) return toast.error("Select a time slot");
    if (step === 6) {
      if (!cust.name || !cust.email || !cust.mobile) return toast.error("Fill name, email and mobile");
    }
    setStep(s => Math.min(7, s + 1));
  }
  function back() { setStep(s => Math.max(0, s - 1)); }

  function confirm() {
    if (!org || !service || !date || !time) return;
    const token = `T-${1000 + Math.floor(Math.random() * 9000)}`;
    const no = `ISF-${100000 + Math.floor(Math.random() * 900000)}`;
    const created_at = new Date().toISOString();
    const custId = uid("cust");
    db.insert("customers", {
      id: custId, organization_id: org.id, name: cust.name, email: cust.email, mobile: cust.mobile,
      gender: "other", service: service.name, status: "active", created_at,
    });
    db.insert("appointments", {
      id: uid("apt"), token, appointment_no: no, organization_id: org.id,
      customer_id: custId, customer_name: cust.name, customer_email: cust.email, customer_mobile: cust.mobile,
      service_id: service.id, service_name: service.name, employee_id: employee?.id, employee_name: employee?.name,
      date: dateStr, time, status: "confirmed", notes: cust.notes, created_at, updated_at: created_at,
    });
    db.insert("notifications", {
      id: uid("n"), role: "org_admin", organization_id: org.id, title: "Appointment created",
      message: `New appointment ${no} for ${service.name} at ${time}.`, read: false, created_at,
    });
    setConfirmed({ token, no });
    setStep(7);
  }

  if (confirmed) return <Confirmation onAnother={() => { setStep(0); setCategory(""); setOrgId(""); setServiceId(""); setEmployeeId(""); setDate(undefined); setTime(""); setCust({ name: "", email: "", mobile: "", notes: "" }); setConfirmed(null); }} data={{ ...confirmed, org: org!, service: service!, employee, date: dateStr, time, cust }} />;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Waves className="h-5 w-5" /></span>
            Indus Service Flow
          </Link>
          <Button asChild variant="ghost" size="sm"><Link to="/login" search={{ redirect: undefined }}>Login</Link></Button>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Book an appointment</h1>
          <p className="text-sm text-muted-foreground">Tell us where, what and when. We'll generate a token and confirmation.</p>
        </div>
        <Stepper step={step} />
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">{STEPS[step]}</CardTitle></CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {(["hospital", "clinic", "bank", "retail", "support"] as const).map(c => {
                  const Icon = ICON_MAP[c];
                  const active = category === c;
                  return (
                    <button key={c} onClick={() => setCategory(c)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <span className={`grid h-10 w-10 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}><Icon className="h-5 w-5" /></span>
                      <span className="font-medium capitalize">{c === "support" ? "Customer Support" : c}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-3 md:grid-cols-2">
                {orgsForCategory.length === 0 && <Empty msg="No approved organizations in this category yet." />}
                {orgsForCategory.map(o => (
                  <button key={o.id} onClick={() => setOrgId(o.id)} className={`rounded-xl border p-4 text-left transition ${orgId === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <div className="font-medium">{o.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{o.city}, {o.state}</div>
                  </button>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-3 md:grid-cols-2">
                {servicesForOrg.length === 0 && <Empty msg="This organization hasn't published any services yet." />}
                {servicesForOrg.map(s => (
                  <button key={s.id} onClick={() => setServiceId(s.id)} className={`rounded-xl border p-4 text-left transition ${serviceId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between"><div className="font-medium">{s.name}</div><Badge variant="secondary">{s.duration_min} min</Badge></div>
                    <div className="mt-1 text-xs text-muted-foreground">Fee: {s.fee > 0 ? `₹${s.fee.toLocaleString("en-IN")}` : "Free"}</div>
                  </button>
                ))}
              </div>
            )}
            {step === 3 && (
              <div>
                {!REQUIRES_EMPLOYEE.has(category) && (
                  <div className="mb-3 rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Employee selection is optional for this category. You can leave it blank to be assigned automatically.
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {!REQUIRES_EMPLOYEE.has(category) && (
                    <button onClick={() => setEmployeeId("")} className={`rounded-xl border p-4 text-left ${employeeId === "" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <div className="font-medium">Auto-assign</div>
                      <div className="text-xs text-muted-foreground">Pick the next available employee at the counter.</div>
                    </button>
                  )}
                  {employeesForOrg.map(e => (
                    <button key={e.id} onClick={() => setEmployeeId(e.id)} className={`rounded-xl border p-4 text-left ${employeeId === e.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.designation} · Shift {e.shift}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="flex justify-center">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={d => d < new Date(new Date().toDateString())} />
              </div>
            )}
            {step === 5 && (
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                {allSlots.map(t => {
                  const taken = takenSlots.has(t);
                  const sel = time === t;
                  return (
                    <button key={t} disabled={taken} onClick={() => setTime(t)} className={`rounded-md border px-3 py-2 text-sm transition ${taken ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through" : sel ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{t}</button>
                  );
                })}
              </div>
            )}
            {step === 6 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Fld label="Full Name"><Input value={cust.name} onChange={e => setCust({ ...cust, name: e.target.value })} placeholder="Your full name" /></Fld>
                <Fld label="Email"><Input type="email" value={cust.email} onChange={e => setCust({ ...cust, email: e.target.value })} placeholder="you@example.in" /></Fld>
                <Fld label="Mobile"><Input value={cust.mobile} onChange={e => setCust({ ...cust, mobile: e.target.value })} placeholder="+91 98xxx xxxxx" /></Fld>
                <Fld label="Notes (optional)" full><Textarea rows={3} value={cust.notes} onChange={e => setCust({ ...cust, notes: e.target.value })} placeholder="Any additional context." /></Fld>
              </div>
            )}
            {step === 7 && (
              <div className="grid gap-3">
                <Summary org={org} service={service} employee={employee} date={dateStr} time={time} cust={cust} />
              </div>
            )}
            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={step === 0}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
              {step < 7 ? (
                <Button onClick={next}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
              ) : (
                <Button onClick={confirm}>Confirm booking</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs">
      {STEPS.map((s, i) => (
        <li key={s} className={`flex items-center gap-2 rounded-full border px-3 py-1 ${i === step ? "border-primary bg-primary/10 text-primary" : i < step ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground"}`}>
          {i < step ? <Check className="h-3 w-3" /> : <span className="grid h-4 w-4 place-items-center rounded-full bg-current text-[10px] text-background">{i + 1}</span>}
          {s}
        </li>
      ))}
    </ol>
  );
}

function Fld({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`grid gap-1.5 ${full ? "md:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="col-span-full rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{msg}</div>;
}

function Summary({ org, service, employee, date, time, cust }: any) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-5 md:grid-cols-2">
      <Row k="Organization" v={org?.name} />
      <Row k="Service" v={service?.name} />
      <Row k="Employee" v={employee?.name || "Auto-assign"} />
      <Row k="Date & Time" v={`${date} · ${time}`} />
      <Row k="Customer" v={cust.name} />
      <Row k="Contact" v={`${cust.mobile} · ${cust.email}`} />
    </div>
  );
}
function Row({ k, v }: { k: string; v?: string }) {
  return <div><div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div><div className="font-medium">{v || "—"}</div></div>;
}

function Confirmation({ data, onAnother }: { data: any; onAnother: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Waves className="h-5 w-5" /></span>
            Indus Service Flow
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"><Check className="h-8 w-8" /></div>
            <CardTitle className="text-center font-display text-2xl">Appointment confirmed</CardTitle>
            <p className="text-center text-sm text-muted-foreground">A confirmation has been sent to {data.cust.email}.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-5">
              <Big k="Appointment No" v={data.no} />
              <Big k="Queue Token" v={data.token} />
              <Row k="Organization" v={data.org.name} />
              <Row k="Service" v={data.service.name} />
              <Row k="Employee" v={data.employee?.name || "Auto-assign"} />
              <Row k="Date & Time" v={`${data.date} · ${data.time}`} />
              <Row k="Customer" v={data.cust.name} />
              <Row k="Contact" v={`${data.cust.mobile} · ${data.cust.email}`} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print</Button>
              <Button variant="outline" onClick={() => {
                const text = `Indus Service Flow — Appointment\n\nNo: ${data.no}\nToken: ${data.token}\nOrg: ${data.org.name}\nService: ${data.service.name}\nEmployee: ${data.employee?.name || "Auto-assign"}\nDate: ${data.date} ${data.time}\nCustomer: ${data.cust.name} (${data.cust.mobile})`;
                const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
                const a = document.createElement("a"); a.href = url; a.download = `${data.no}.txt`; a.click(); URL.revokeObjectURL(url);
              }}><Download className="mr-1 h-4 w-4" /> Download</Button>
              <Button variant="ghost" onClick={onAnother}>Book another</Button>
              <Button asChild variant="ghost"><Link to="/">Back to home</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Big({ k, v }: { k: string; v: string }) {
  return <div><div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div><div className="font-display text-xl font-bold text-primary">{v}</div></div>;
}
