import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Hospital, Stethoscope, Landmark, Store, Headphones, CalendarCheck, Users, BarChart3, Bot, Bell, MessageSquareHeart, ShieldCheck, KeyRound, ScrollText, Lock, Activity, FileLock2, Building2, UserCog, Briefcase, User, Check } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { db, uid } from "@/lib/mock/db";
import heroReception from "@/assets/hero-reception.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indus Service Flow — Smart Appointment & Queue Management" },
      { name: "description", content: "Reduce waiting time and optimize operations across hospitals, clinics, banks, retail and customer support centers." },
      { property: "og:title", content: "Indus Service Flow" },
      { property: "og:description", content: "Smart appointment and queue management platform for service businesses." },
    ],
  }),
  component: LandingPage,
});

const stats = [
  { label: "Organizations Served", value: "1,250+" },
  { label: "Appointments Managed", value: "8.4M" },
  { label: "Customers Served", value: "12M+" },
  { label: "Average Wait Reduction", value: "47%" },
];

const features = [
  { icon: CalendarCheck, title: "Appointment Booking", desc: "Multi-step booking with smart slot allocation and conflict prevention." },
  { icon: Users, title: "Queue Management", desc: "Live tokens, transfers, pause/resume and instant notifications." },
  { icon: Briefcase, title: "Employee Management", desc: "Shifts, designations, performance tracking and load balancing." },
  { icon: User, title: "Customer Management", desc: "Unified customer profiles, history, preferences and feedback." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Wait-time trends, peak hours, bottlenecks and capacity planning." },
  { icon: ScrollText, title: "Reports", desc: "Daily, monthly and annual reports with PDF, Excel and CSV exports." },
  { icon: Bell, title: "Notifications", desc: "In-app, email and SMS-ready channels segmented by role." },
  { icon: Bot, title: "AI Recommendations", desc: "Auto-suggested staffing, counter capacity and slot expansion." },
  { icon: MessageSquareHeart, title: "Feedback Management", desc: "Post-service ratings on quality, behaviour and recommendation." },
  { icon: ShieldCheck, title: "Role Based Access", desc: "Granular RBAC across super-admin, org admin, employee and customer." },
];

const security = [
  { icon: KeyRound, title: "JWT Authentication", desc: "Access + refresh tokens with rotation and revocation." },
  { icon: ShieldCheck, title: "Role Based Access", desc: "Strict RBAC enforced at API and UI layers." },
  { icon: ScrollText, title: "Audit Logging", desc: "Every create, update and delete recorded with actor and IP." },
  { icon: Lock, title: "Data Protection", desc: "Encryption in transit and at rest, with daily backups." },
  { icon: FileLock2, title: "Session Management", desc: "Idle timeout, device sessions and remote sign-out." },
  { icon: Activity, title: "Activity Monitoring", desc: "Real-time alerts on suspicious access patterns." },
];

const portals = [
  { icon: ShieldCheck, key: "super_admin", title: "Super Admin Portal", desc: "Govern the entire platform, organizations and tenants.", points: ["Approve / reject organization requests", "Manage categories, users and audit logs", "Platform-wide reports and revenue insights"] },
  { icon: Building2, key: "org_admin", title: "Organization Admin Portal", desc: "Run a single organization end-to-end.", points: ["Services, employees, customers, appointments", "Live queue, simulations and analytics", "AI recommendations and exports"] },
  { icon: UserCog, key: "employee", title: "Employee Portal", desc: "Focused workflow for the people serving customers.", points: ["Personal queue and schedule", "Start, pause, resume and complete service", "Performance and rating trends"] },
  { icon: User, key: "customer", title: "Customer Portal", desc: "Self-service for end customers.", points: ["Book and reschedule appointments", "Live queue position and wait time", "Submit feedback after service"] },
];

const categoryCards = [
  { icon: Hospital, name: "Hospitals" },
  { icon: Stethoscope, name: "Clinics" },
  { icon: Landmark, name: "Banks" },
  { icon: Store, name: "Retail Stores" },
  { icon: Headphones, name: "Customer Support Centers" },
];

const howSteps = [
  { n: 1, title: "Organization Registers", desc: "Sign up with category, contact and branding." },
  { n: 2, title: "Super Admin Approval", desc: "Platform team reviews and approves the request." },
  { n: 3, title: "Organization Setup", desc: "Add services, employees, shifts and counters." },
  { n: 4, title: "Customer Booking", desc: "Customers book through the public flow." },
  { n: 5, title: "Queue Processing", desc: "Live tokens, transfers and real-time updates." },
  { n: 6, title: "Analytics & Reporting", desc: "Optimize with insights and AI recommendations." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <About />
      <Features />
      <How />
      <Security />
      <Portals />
      <Contact />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-hero-gradient">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28 lg:px-8">
        <div>
          <Badge variant="secondary" className="mb-4 rounded-full">Multi-tenant SaaS · Built for India</Badge>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Smart <span className="text-gradient-brand">Appointment & Queue</span> Management Platform
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Reduce waiting time, improve customer experience, optimize service operations and manage appointments across Hospitals, Clinics, Banks, Retail Stores and Customer Support Centers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/book-appointment">Book Appointment <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Login</Link></Button>
            <Button asChild size="lg" variant="ghost"><Link to="/register-organization">Register Organization</Link></Button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur">
                <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Live Queue · Apollo Chennai</div>
            <div className="font-display text-lg font-semibold">Cardiology Counter 2</div>
          </div>
          <Badge className="bg-success text-success-foreground">Serving</Badge>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="Token" value="T-1042" />
          <Stat label="Waiting" value="14" />
          <Stat label="Avg Wait" value="11m" />
        </div>
        <div className="mt-5 space-y-2">
          {[
            { t: "T-1043", n: "Ananya Sharma", s: "Cardiology" },
            { t: "T-1044", n: "Rohan Gupta", s: "Cardiology" },
            { t: "T-1045", n: "Priya Desai", s: "Diagnostic" },
          ].map(r => (
            <div key={r.t} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">{r.t}</span>
              <span className="text-muted-foreground">{r.n}</span>
              <span className="text-xs">{r.s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-card p-4 shadow-xl md:block">
        <div className="text-xs text-muted-foreground">Wait time reduced</div>
        <div className="font-display text-2xl font-bold text-primary">−47%</div>
      </div>
      <div className="absolute -top-6 -right-6 hidden rounded-xl border border-border bg-card p-4 shadow-xl md:block">
        <div className="text-xs text-muted-foreground">CSAT</div>
        <div className="font-display text-2xl font-bold text-secondary">4.8/5</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 py-2">
      <div className="font-display text-base font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ id, eyebrow, title, subtitle, children }: { id: string; eyebrow: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full border-primary/40 text-primary">{eyebrow}</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function About() {
  return (
    <Section id="about" eyebrow="About" title="One platform for every service-led business"
      subtitle="Indus Service Flow unifies appointments, walk-in queues, employees and analytics in a single, opinionated workspace.">
      <div className="grid gap-5 md:grid-cols-5">
        {categoryCards.map(c => (
          <Card key={c.name} className="border-border/70 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground"><c.icon className="h-6 w-6" /></span>
              <div className="font-semibold">{c.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          { t: "Queue optimization", d: "Smarter load balancing and predictive wait times powered by Monte Carlo simulations." },
          { t: "Customer experience", d: "Real-time status, notifications, reminders and post-service feedback loops." },
          { t: "Operational visibility", d: "Live dashboards, peak-hour analysis and AI-driven recommendations." },
        ].map(b => (
          <Card key={b.t}><CardContent className="p-6"><div className="font-semibold">{b.t}</div><p className="mt-2 text-sm text-muted-foreground">{b.d}</p></CardContent></Card>
        ))}
      </div>
    </Section>
  );
}

function Features() {
  return (
    <Section id="features" eyebrow="Features" title="Everything you need to run service operations"
      subtitle="Each module is production-ready, role-aware, and ships with audit trails, exports and notifications.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(f => (
          <Card key={f.title} className="group border-border/70 transition hover:border-primary/40 hover:shadow-md">
            <CardHeader>
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></span>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{f.desc}</p></CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function How() {
  return (
    <Section id="how" eyebrow="How It Works" title="From signup to insights in six steps">
      <ol className="grid gap-5 md:grid-cols-3">
        {howSteps.map(s => (
          <li key={s.n}>
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="font-display text-3xl font-bold text-primary">{s.n.toString().padStart(2, "0")}</div>
                <div className="mt-2 font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Security() {
  return (
    <Section id="security" eyebrow="Security" title="Enterprise-grade by default">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {security.map(s => (
          <Card key={s.title}><CardContent className="p-6">
            <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-secondary/15 text-secondary"><s.icon className="h-5 w-5" /></span>
            <div className="font-semibold">{s.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </CardContent></Card>
        ))}
      </div>
    </Section>
  );
}

function Portals() {
  return (
    <Section id="portals" eyebrow="Portals" title="Four purpose-built experiences">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {portals.map(p => (
          <Dialog key={p.key}>
            <DialogTrigger asChild>
              <button className="block text-left">
                <Card className="h-full cursor-pointer border-border/70 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="p-6">
                    <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground"><p.icon className="h-5 w-5" /></span>
                    <div className="font-semibold">{p.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                    <div className="mt-4 text-xs font-medium text-primary">View details →</div>
                  </CardContent>
                </Card>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{p.title}</DialogTitle>
                <DialogDescription>{p.desc}</DialogDescription>
              </DialogHeader>
              <ul className="mt-2 space-y-2 text-sm">
                {p.points.map(pt => (
                  <li key={pt} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />{pt}</li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button asChild><Link to="/login">Login to portal</Link></Button>
                {p.key === "org_admin" && <Button asChild variant="outline"><Link to="/register-organization">Register Organization</Link></Button>}
                {p.key === "customer" && <Button asChild variant="outline"><Link to="/book-appointment">Book Appointment</Link></Button>}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill in name, email and message."); return; }
    setSending(true);
    db.insert("contact_messages", { id: uid("msg"), ...form, status: "new", created_at: new Date().toISOString() });
    db.insert("notifications", { id: uid("n"), role: "super_admin", title: "New contact message", message: `${form.name}: ${form.subject || "(no subject)"}`, read: false, created_at: new Date().toISOString() });
    setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent. Our team will get back to you.");
    }, 500);
  }
  return (
    <Section id="contact" eyebrow="Contact" title="Talk to our team" subtitle="Tell us about your operation and we'll come back with a tailored walkthrough.">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5"><Label htmlFor="c-name">Name</Label><Input id="c-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></div>
                <div className="grid gap-1.5"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.in" /></div>
              </div>
              <div className="grid gap-1.5"><Label htmlFor="c-subject">Subject</Label><Input id="c-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What can we help with?" /></div>
              <div className="grid gap-1.5"><Label htmlFor="c-msg">Message</Label><Textarea id="c-msg" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="A few lines about your setup..." /></div>
              <Button disabled={sending} type="submit" className="justify-self-start">{sending ? "Sending..." : "Send Message"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
