import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CheckCircle2, ArrowRight, ArrowLeft, Waves } from "lucide-react";

import { db, uid, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/book-appointment")({
  component: BookAppointment,
});

const ICON_MAP: Record<string, string> = {
  hospital: "🏥",
  clinic: "🩺",
  bank: "🏦",
  retail: "🛍️",
  support: "☎️",
};

const CATEGORIES = [
  { id: "hospital", label: "Hospital" },
  { id: "clinic", label: "Clinic" },
  { id: "bank", label: "Bank" },
  { id: "retail", label: "Retail" },
  { id: "support", label: "Support" },
];

function BookAppointment() {
  const orgs = useDb(() => db.all("organizations"));
  const services = useDb(() => db.all("services"));
  const employees = useDb(() => db.all("employees"));

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    category: "",
    orgId: "",
    serviceId: "",
    employeeId: "",
    date: "",
    time: "",
  });

  const orgsFiltered = orgs.filter((o) => o.category === form.category);
  const servicesFiltered = services.filter((s) => s.organization_id === form.orgId);
  const employeesFiltered = employees.filter((e) => e.organization_id === form.orgId);

  const summary = useMemo(() => {
    const org = orgs.find((o) => o.id === form.orgId);
    const service = services.find((s) => s.id === form.serviceId);
    const employee = employees.find((e) => e.id === form.employeeId);
    return { org, service, employee };
  }, [form, orgs, services, employees]);

  function next() {
    if (step === 1 && (!form.name || !form.mobile || !form.email || !form.category)) {
      return toast.error("Fill all required fields");
    }
    if (step === 2 && (!form.orgId || !form.serviceId || !form.date || !form.time)) {
      return toast.error("Select all booking details");
    }
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  function confirm() {
    const id = uid("apt");
    const token = `T-${Math.floor(1000 + Math.random() * 9000)}`;
    const no = `ISF-${Math.floor(100000 + Math.random() * 900000)}`;

    const created_at = new Date().toISOString();
    const updated_at = created_at;
    const customer_id = uid("cus");
    const service_name = summary.service?.name || "";

    db.insert("appointments", {
      id,
      token,
      appointment_no: no,
      organization_id: form.orgId,
      customer_id,
      customer_name: form.name,
      customer_email: form.email,
      customer_mobile: form.mobile,
      service_id: form.serviceId,
      service_name,
      employee_id: form.employeeId || undefined,
      date: form.date,
      time: form.time,
      status: "confirmed",
      created_at,
      updated_at,
    });

    toast.success("Appointment Confirmed!");
    setStep(3);
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border rounded-2xl p-6 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
          <h2 className="text-xl font-bold mt-3">Booking Confirmed</h2>

          <div className="mt-4 text-left text-sm space-y-2">
            <p><b>Name:</b> {form.name}</p>
            <p><b>Mobile:</b> {form.mobile}</p>
            <p><b>Email:</b> {form.email}</p>
            <p><b>Organization:</b> {summary.org?.name}</p>
            <p><b>Service:</b> {summary.service?.name}</p>
            <p><b>Employee:</b> {summary.employee?.name || "Auto"}</p>
            <p><b>Date:</b> {form.date}</p>
            <p><b>Time:</b> {form.time}</p>
          </div>

          <div className="mt-6 flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
            <Button
              onClick={() => {
                setForm({
                  name: "",
                  mobile: "",
                  email: "",
                  category: "",
                  orgId: "",
                  serviceId: "",
                  employeeId: "",
                  date: "",
                  time: "",
                });
                setStep(1);
              }}
            >
              Book Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <div className="border-b p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Waves className="h-5 w-5" />
          Indus Service Flow
        </Link>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>

            <Field label="Mobile">
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </Field>

            <Field label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>

            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {ICON_MAP[c.id]} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex justify-end">
              <Button onClick={next}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Organization">
              <Select value={form.orgId} onValueChange={(v) => setForm({ ...form, orgId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {orgsFiltered.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Service">
              <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {servicesFiltered.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Employee (optional)">
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto assign or select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto Assign</SelectItem>
                  {employeesFiltered.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Date">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>

              <Field label="Time">
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </Field>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={back}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button onClick={next}>
                Review <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 REVIEW */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Review Details</h2>

            <div className="border rounded-xl p-4 text-sm space-y-1">
              <p><b>Name:</b> {form.name}</p>
              <p><b>Mobile:</b> {form.mobile}</p>
              <p><b>Email:</b> {form.email}</p>
              <p><b>Organization:</b> {summary.org?.name}</p>
              <p><b>Service:</b> {summary.service?.name}</p>
              <p><b>Employee:</b> {summary.employee?.name || "Auto"}</p>
              <p><b>Date:</b> {form.date}</p>
              <p><b>Time:</b> {form.time}</p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>

              <Button onClick={confirm}>
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}