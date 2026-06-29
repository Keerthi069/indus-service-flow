import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowRight, Hospital, Stethoscope, Landmark, Store, Headphones,
  CalendarCheck, Users, BarChart3, Bot, Bell, MessageSquareHeart,
  ShieldCheck, KeyRound, ScrollText, Lock, Activity, FileLock2,
  Building2, UserCog, Check, ChevronRight, Zap, TrendingDown,
  Clock, Star,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { db, uid } from "@/lib/mock/db";
import heroReception from "@/assets/hero-reception.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indus Service Flow — Smart Appointment & Queue Management" },
      { name: "description", content: "Reduce waiting time and optimize operations across hospitals, clinics, banks, retail and customer support centers." },
    ],
  }),
  component: LandingPage,
});

const stats = [
  { label: "Organizations", value: "1,250+", icon: Building2 },
  { label: "Appointments managed", value: "8.4M", icon: CalendarCheck },
  { label: "Customers served", value: "12M+", icon: Users },
  { label: "Average wait reduction", value: "47%", icon: TrendingDown },
];

const features = [
  { icon: CalendarCheck, title: "Appointment booking", desc: "Multi-step booking with smart slot allocation and conflict prevention.", highlight: true },
  { icon: Users, title: "Queue management", desc: "Live tokens, transfers, pause/resume and instant notifications.", highlight: true },
  { icon: BarChart3, title: "Analytics dashboard", desc: "Wait-time trends, peak hours, bottlenecks and capacity planning." },
  { icon: Bot, title: "AI recommendations", desc: "Auto-suggested staffing, counter capacity and slot expansion." },
  { icon: Bell, title: "Notifications", desc: "In-app, email and SMS-ready channels segmented by role." },
  { icon: MessageSquareHeart, title: "Feedback management", desc: "Post-service ratings on quality, behaviour and recommendation." },
  { icon: ScrollText, title: "Reports and exports", desc: "Daily, monthly and annual reports with PDF, Excel and CSV." },
  { icon: ShieldCheck, title: "Role-based access", desc: "Granular RBAC across super-admin, org admin and employee." },
];

const security = [
  { icon: KeyRound, title: "JWT authentication", desc: "Access and refresh tokens with rotation and revocation." },
  { icon: ShieldCheck, title: "Role-based access", desc: "Strict RBAC enforced at API and UI layers." },
  { icon: ScrollText, title: "Audit logging", desc: "Every create, update and delete recorded with actor and IP." },
  { icon: Lock, title: "Data protection", desc: "Encryption in transit and at rest, with daily backups." },
  { icon: FileLock2, title: "Session management", desc: "Idle timeout, device sessions and remote sign-out." },
  { icon: Activity, title: "Activity monitoring", desc: "Real-time alerts on suspicious access patterns." },
];

const portals = [
  {
    icon: ShieldCheck, key: "super_admin",
    title: "Super admin", desc: "Govern the entire platform, organizations and tenants.",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    points: ["Approve and reject organization requests", "Manage categories, users and audit logs", "Platform-wide reports and revenue insights"],
  },
  {
    icon: Building2, key: "org_admin",
    title: "Org admin", desc: "Run a single organization end-to-end with full analytics.",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    points: ["Services, employees, customers, appointments", "Live queue, simulations and analytics", "AI recommendations and exports"],
  },
  {
    icon: UserCog, key: "employee",
    title: "Employee", desc: "Focused workflow for the people serving customers daily.",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    points: ["Personal queue and schedule", "Start, pause, resume and complete service", "Performance and rating trends"],
  },
];

const categories = [
  { icon: Hospital, name: "Hospitals" },
  { icon: Stethoscope, name: "Clinics" },
  { icon: Landmark, name: "Banks" },
  { icon: Store, name: "Retail stores" },
  { icon: Headphones, name: "Support centers" },
];

const howSteps = [
  { title: "Register your organization", desc: "Sign up with category, contact details and branding in under 5 minutes." },
  { title: "Get approved", desc: "Platform team reviews and activates your account, usually within one business day." },
  { title: "Set up your workspace", desc: "Add services, employees, counters and shift schedules." },
  { title: "Go live with bookings", desc: "Customers book online or walk in — tokens issued instantly." },
  { title: "Serve in real time", desc: "Live queue processing with transfers, pauses and status updates." },
  { title: "Improve with insights", desc: "Analytics and AI recommendations surface what to optimize and when." },
];

const testimonials = [
  { name: "Dr. Kavitha Nair", role: "Medical Director, Apollo Clinics", text: "Wait times dropped by 40% in the first month. Patients now know their exact slot before they arrive.", stars: 5 },
  { name: "Ravi Shankar", role: "Branch Head, Canara Bank", text: "We eliminated the token-slip queue entirely. Staff can now focus on service, not crowd control.", stars: 5 },
  { name: "Priya Menon", role: "Ops Manager, Reliance Retail", text: "The AI staffing suggestions alone saved us ₹2L a month in unnecessary overtime.", stars: 5 },
];

// Live queue ticker — simulates real-time queue activity
const tickerItems = [
  "Apollo Hospitals · Counter 3 now serving token #47",
  "SBI Branch, MG Road · Wait time reduced to 8 min",
  "Fortis Clinic · 23 appointments completed today",
  "HDFC Bank, Banjara Hills · Queue cleared ahead of schedule",
  "Max Healthcare · AI extended slots during peak hours",
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % tickerItems.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm shadow-sm">
      <span className="flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span
        className={`text-muted-foreground transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {tickerItems[index]}
      </span>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <How />
        <Testimonials />
        <Portals />
        <Security />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.5)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-0 pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Live ticker */}
          <div className="mb-8 flex justify-center">
            <LiveTicker />
          </div>

          <Badge variant="outline" className="mb-5 rounded-full border-primary/30 px-4 py-1.5 text-sm text-primary">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Multi-tenant SaaS · Built for India
          </Badge>

          <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            No more waiting.{" "}
            <br className="hidden sm:block" />
            <span className="text-primary">Ever.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Indus Service Flow unifies appointments, live queues, employees and
            analytics — so hospitals, banks, clinics and retail stores can serve
            more people with less chaos.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="h-12 gap-2 px-7 text-base">
              <Link to="/register-organization">
                Register your organization <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-7 text-base">
              <Link to="/book-appointment">Book an appointment</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="h-12 px-6 text-base">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-card px-4 py-4 text-center shadow-sm">
                <s.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero image — flush to bottom of section */}
        <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-t-2xl border-x border-t shadow-2xl">
          <img
            src={heroReception}
            alt="Modern service reception"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

// ── Logo strip ────────────────────────────────────────────────────────────────

function LogoStrip() {
  return (
    <section className="border-b bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Serving every industry that keeps people waiting
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-2.5 rounded-full border bg-background px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground"
            >
              <c.icon className="h-4 w-4 text-primary" />
              {c.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  id, eyebrow, title, subtitle, children, alt = false,
}: {
  id: string; eyebrow: string; title: string; subtitle?: string;
  children: React.ReactNode; alt?: boolean;
}) {
  return (
    <section id={id} className={`border-b py-24 ${alt ? "bg-muted/20" : "bg-background"}`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-4 leading-relaxed text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

// ── Features bento ────────────────────────────────────────────────────────────

function Features() {
  return (
    <Section
      id="features"
      eyebrow="Features"
      title="Everything a service operation needs"
      subtitle="Every module ships role-aware, with audit trails, notifications and data exports — production-ready on day one."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Two highlight cards span 2 cols each on lg */}
        {features.map((f, i) => (
          <Card
            key={f.title}
            className={`group border-border/60 transition hover:border-primary/40 hover:shadow-md ${
              f.highlight && i === 0 ? "lg:col-span-2 lg:row-span-1" : ""
            } ${f.highlight && i === 1 ? "lg:col-span-2" : ""}`}
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div className={`font-semibold text-foreground ${f.highlight ? "text-base" : "text-sm"}`}>
                {f.title}
              </div>
              <p className={`mt-2 text-muted-foreground ${f.highlight ? "text-sm" : "text-xs"}`}>
                {f.desc}
              </p>
              {f.highlight && (
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
                  Core feature <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function How() {
  return (
    <Section id="how" eyebrow="How it works" title="From sign-up to live in one day" alt>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {howSteps.map((s, i) => (
          <div key={s.title} className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <div className="font-semibold text-foreground">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

function Testimonials() {
  return (
    <Section
      id="testimonials"
      eyebrow="Social proof"
      title="Used by teams across India"
      subtitle="Real results from organizations that replaced paper tokens and spreadsheets with Indus Service Flow."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.name} className="border-border/60">
            <CardContent className="flex h-full flex-col p-6">
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-foreground">"{t.text}"</p>
              <div className="mt-5 border-t pt-4">
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.role}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outcome strip */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: TrendingDown, stat: "47%", label: "average wait time reduction" },
          { icon: Clock, stat: "< 1 day", label: "from sign-up to going live" },
          { icon: Users, stat: "98%", label: "customer satisfaction score" },
        ].map((o) => (
          <div
            key={o.label}
            className="flex items-center gap-4 rounded-xl border bg-card px-6 py-5 shadow-sm"
          >
            <o.icon className="h-8 w-8 flex-shrink-0 text-primary" />
            <div>
              <div className="text-2xl font-bold text-foreground">{o.stat}</div>
              <div className="text-xs text-muted-foreground">{o.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Portals ───────────────────────────────────────────────────────────────────

function Portals() {
  return (
    <Section
      id="portals"
      eyebrow="Portals"
      title="Three purpose-built experiences"
      subtitle="Each role gets a focused workspace — not a watered-down version of someone else's."
      alt
    >
      <div className="grid gap-5 md:grid-cols-3">
        {portals.map((p) => (
          <Dialog key={p.key}>
            <DialogTrigger asChild>
              <button className="group block w-full text-left">
                <Card className="h-full cursor-pointer border-border/60 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl text-sm font-bold ${p.color}`}>
                      <p.icon className="h-5 w-5" />
                    </div>
                    <div className="text-base font-semibold text-foreground">{p.title}</div>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>
                    <ul className="mt-4 space-y-2">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-center text-xs font-semibold text-primary">
                      Learn more <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{p.title} portal</DialogTitle>
                <DialogDescription>{p.desc}</DialogDescription>
              </DialogHeader>
              <ul className="mt-3 space-y-2.5 text-sm">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                <Button asChild><Link to="/login">Sign in</Link></Button>
                {p.key === "org_admin" && (
                  <Button asChild variant="outline">
                    <Link to="/register-organization">Register organization</Link>
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </Section>
  );
}

// ── Security ──────────────────────────────────────────────────────────────────

function Security() {
  return (
    <Section
      id="security"
      eyebrow="Security"
      title="Enterprise-grade by default"
      subtitle="Security is not a feature request — it ships with every account, at every plan."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {security.map((s) => (
          <Card key={s.title} className="border-border/60">
            <CardContent className="p-6">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="font-semibold text-foreground">{s.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email and message.");
      return;
    }
    setSending(true);
    db.insert("contact_messages", { id: uid("msg"), ...form, status: "new", created_at: new Date().toISOString() });
    db.insert("notifications", { id: uid("n"), role: "super_admin", title: "New contact message", message: `${form.name}: ${form.subject || "(no subject)"}`, read: false, created_at: new Date().toISOString() });
    setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent. Our team will get back to you shortly.");
    }, 500);
  }

  return (
    <section id="contact" className="border-b bg-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">

          {/* Left copy */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Contact</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Talk to our team
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Tell us about your operation and we'll come back with a tailored
              walkthrough — no sales script, no commitment.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { label: "Response time", val: "Within one business day" },
                { label: "Onboarding", val: "Dedicated setup support for every new org" },
                { label: "Trial", val: "Full-featured, no credit card needed" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-name">Name</Label>
                    <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email">Email</Label>
                    <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.in" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-subject">Subject</Label>
                  <Input id="c-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What can we help with?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-msg">Message</Label>
                  <Textarea id="c-msg" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="A few lines about your setup..." />
                </div>
                <Button type="submit" disabled={sending} className="w-full">
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}