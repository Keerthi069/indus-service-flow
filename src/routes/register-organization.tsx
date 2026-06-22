import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Waves, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, uid } from "@/lib/mock/db";

export const Route = createFileRoute("/register-organization")({
  head: () => ({ meta: [{ title: "Register Organization · Indus Service Flow" }, { name: "description", content: "Apply to onboard your organization onto the Indus Service Flow platform." }] }),
  component: RegisterOrg,
});

const CATEGORIES = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "bank", label: "Bank" },
  { value: "retail", label: "Retail Store" },
  { value: "support", label: "Customer Support Center" },
];

function RegisterOrg() {
  const nav = useNavigate();
  const [f, setF] = useState({
    name: "", category: "", contact_person: "", email: "", mobile: "",
    address: "", city: "", state: "", country: "India", password: "", confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof f>(k: K, v: string) { setF(prev => ({ ...prev, [k]: v })); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    for (const [k, v] of Object.entries(f)) if (!v) { toast.error(`Please fill in ${k.replace("_", " ")}`); return; }
    if (f.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (f.password !== f.confirm) { toast.error("Passwords do not match"); return; }

    setSubmitting(true);
    const id = uid("req");
    const created_at = new Date().toISOString();
    setTimeout(() => {
      db.insert("org_requests", {
        id, name: f.name, category: f.category, contact_person: f.contact_person,
        email: f.email, mobile: f.mobile, address: f.address, city: f.city, state: f.state, country: f.country,
        logo: "", plan: "professional", status: "pending", created_at,
      });
      db.insert("notifications", {
        id: uid("n"), role: "super_admin", title: "New organization request",
        message: `${f.name} (${f.category}) submitted a registration request.`,
        read: false, created_at,
      });
      setSubmitting(false);
      toast.success("Application submitted. You'll receive an email after approval.");
      nav({ to: "/" });
    }, 600);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Waves className="h-5 w-5" /></span>
            Indus Service Flow
          </Link>
          <Button asChild variant="ghost" size="sm"><Link to="/login">Already have access? Login</Link></Button>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4"><Link to="/">← Back to home</Link></Button>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></span>
          <div>
            <h1 className="font-display text-3xl font-bold">Register your organization</h1>
            <p className="text-sm text-muted-foreground">Submit details below. A super admin will review and approve your request.</p>
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Organization details</CardTitle><CardDescription>All fields are required. Status will be set to <b>Pending Approval</b>.</CardDescription></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Organization Name"><Input value={f.name} onChange={e => update("name", e.target.value)} placeholder="Apollo Hospitals Chennai" /></Field>
                <Field label="Category">
                  <Select value={f.category} onValueChange={v => update("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Contact Person"><Input value={f.contact_person} onChange={e => update("contact_person", e.target.value)} placeholder="Dr. Ramesh Iyer" /></Field>
                <Field label="Email"><Input type="email" value={f.email} onChange={e => update("email", e.target.value)} placeholder="admin@your-org.in" /></Field>
                <Field label="Mobile"><Input value={f.mobile} onChange={e => update("mobile", e.target.value)} placeholder="+91 98xxx xxxxx" /></Field>
                <Field label="City"><Input value={f.city} onChange={e => update("city", e.target.value)} placeholder="Chennai" /></Field>
                <Field label="State"><Input value={f.state} onChange={e => update("state", e.target.value)} placeholder="Tamil Nadu" /></Field>
                <Field label="Country"><Input value={f.country} onChange={e => update("country", e.target.value)} /></Field>
              </div>
              <Field label="Address"><Textarea rows={2} value={f.address} onChange={e => update("address", e.target.value)} placeholder="21, Greams Lane" /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Password"><Input type="password" value={f.password} onChange={e => update("password", e.target.value)} /></Field>
                <Field label="Confirm Password"><Input type="password" value={f.confirm} onChange={e => update("confirm", e.target.value)} /></Field>
              </div>
              <Button disabled={submitting} type="submit" className="justify-self-start">{submitting ? "Submitting..." : "Submit for approval"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
