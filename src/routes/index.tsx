import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowRight, Hospital, Landmark, Store, Headphones,
  CalendarCheck, Users, BarChart3, Bell, ShieldCheck, KeyRound,
  ScrollText, Lock, Activity, FileLock2, Building2, UserCog, Check,
  ChevronRight, Gauge, Radio,
  Mail, Phone, MapPin, Send, Clock,
  Hourglass, FileX, Frown, Ticket, UserCheck, Star, X,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
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
import heroImage from "@/assets/hero-reception.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indus Service Flow — Smart Appointment & Queue Management" },
      { name: "description", content: "Reduce waiting time and modernize operations across hospitals, clinics, banks, retail and customer support centers." },
    ],
  }),
  component: LandingPage,
});

// ── Tokens ───────────────────────────────────────────────────────────────────

const TEAL = "#0D9488";
const TEAL_DARK = "#134E4A";
const CYAN = "#0891B2";
const AMBER = "#F59E0B";

// ── Data ─────────────────────────────────────────────────────────────────────

const problems = [
  { icon: Hourglass, title: "Long, unpredictable waits", desc: "Customers queue with no idea how long is left, so they either wait anxiously or walk out." },
  { icon: FileX, title: "Paper tokens, lost records", desc: "Handwritten slips and register books go missing exactly when a visit needs to be traced." },
  { icon: Users, title: "No visibility across counters", desc: "Front desk staff can't see which counters are free, so load piles up unevenly." },
  { icon: Building2, title: "Disconnected branches", desc: "Every branch or department runs its own system, with no shared view for admins." },
  { icon: Bell, title: "Staff overload at peak hours", desc: "Shifts aren't matched to demand, so the busiest hours are also the most understaffed." },
  { icon: Frown, title: "Frustrated, walked-out customers", desc: "Poor wait experiences show up as lower ratings and repeat visits that never happen." },
];

const builtFor = [
  { icon: Hospital, title: "Hospitals & Clinics", desc: "Coordinate OPD, diagnostics and ward visits without a crowded waiting room." },
  { icon: Landmark, title: "Banks & Financial Institutions", desc: "Route customers to the right counter by service type, not by luck." },
  { icon: Store, title: "Retail Stores", desc: "Manage billing lines, trial rooms and service counters from one screen." },
  { icon: Headphones, title: "Support & Service Desks", desc: "Turn a walk-in support desk into a structured, trackable queue." },
];

const features = [
  { icon: CalendarCheck, title: "Appointment management", desc: "Multi-step booking with slot allocation, conflict prevention and reschedule flows." },
  { icon: Radio, title: "Live queue management", desc: "Tokens, transfers, pause/resume and instant status updates." },
  { icon: Gauge, title: "Wait time prediction", desc: "Estimates from live counter load and historical patterns." },
  { icon: Users, title: "Employee management", desc: "Shifts, holds, performance history and counter assignment." },
  { icon: BarChart3, title: "Analytics & reports", desc: "Wait-time trends, peak hours and bottlenecks, exportable to PDF, Excel and CSV." },
  { icon: Bell, title: "Notifications", desc: "In-app and email alerts segmented by role and event." },
];

const flowSteps = [
  { icon: CalendarCheck, title: "Book" },
  { icon: Ticket, title: "Check in" },
  { icon: Radio, title: "Queue" },
  { icon: UserCheck, title: "Serve" },
  { icon: BarChart3, title: "Analyze" },
];

const security = [
  { icon: KeyRound, title: "Secure authentication", desc: "Access and refresh tokens with rotation and revocation." },
  { icon: ShieldCheck, title: "Role-based access", desc: "Strict RBAC enforced at API and UI layers." },
  { icon: ScrollText, title: "Audit logs", desc: "Every create, update and delete recorded with actor and timestamp." },
  { icon: FileLock2, title: "Session management", desc: "Idle timeout, device sessions and remote sign-out." },
  { icon: Lock, title: "Data protection", desc: "Encryption in transit and at rest, with routine backups." },
  { icon: Activity, title: "Activity monitoring", desc: "Alerts on unusual access patterns across the platform." },
];

const portals = [
  {
    icon: ShieldCheck, key: "super_admin",
    title: "Super admin", desc: "Govern the entire platform, organizations and tenants.",
    accent: TEAL,
    points: ["Approve and reject organization requests", "Manage categories, users and audit logs", "Platform-wide reports"],
    mock: "super_admin" as const,
  },
  {
    icon: Building2, key: "org_admin",
    title: "Org admin", desc: "Run a single organization end-to-end with full analytics.",
    accent: CYAN,
    points: ["Services, employees, customers, appointments", "Live queue and analytics", "Reports and exports"],
    mock: "org_admin" as const,
  },
  {
    icon: UserCog, key: "employee",
    title: "Employee", desc: "A focused workflow for the people serving customers daily.",
    accent: AMBER,
    points: ["Personal queue and schedule", "Start, pause, resume and complete service", "Performance history"],
    mock: "employee" as const,
  },
];

const featureRows = [
  "Online + walk-in booking",
  "Live queue dashboard",
  "Wait time prediction",
  "Multi-branch support",
  "Detailed analytics & export",
  "Custom SLAs & onboarding",
];

const plans = [
  {
    id: "starter", name: "Starter", color: TEAL,
    price: "₹2,999", cadence: "/month",
    counters: "Up to 2", support: "Email",
    included: [true, true, false, false, false, false],
    cta: "Subscribe Now", filled: false, popular: false,
  },
  {
    id: "professional", name: "Professional", color: TEAL,
    price: "₹5,999", cadence: "/month",
    counters: "Up to 10", support: "Email & chat",
    included: [true, true, true, true, true, false],
    cta: "Subscribe Now", filled: true, popular: true,
  },
  {
    id: "enterprise", name: "Enterprise", color: TEAL,
    price: "₹11,999", cadence: "/month",
    counters: "Unlimited", support: "24/7 phone & chat",
    included: [true, true, true, true, true, true],
    cta: "Subscribe Now", filled: false, popular: false,
  },
];

// ── Scroll-reveal helper ─────────────────────────────────────────────────────

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function Reveal({
  children, className = "", delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <WhatsBroken />
        <BuiltFor />
        <Features />
        <ProcessFlow />
        <Portals />
        <Security />
        <Contact />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  id, eyebrow, title, subtitle, children, tint = false,
}: {
  id: string; eyebrow: string; title: string; subtitle?: string;
  children: React.ReactNode; tint?: boolean;
}) {
  return (
    <section id={id} className={`py-24 ${tint ? "bg-[#0D9488]/[0.04]" : "bg-white"}`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0D9488]">{eyebrow}</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#134E4A] md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-4 leading-relaxed text-muted-foreground">{subtitle}</p>}
        </Reveal>
        {children}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-24px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </section>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0D9488]/[0.04]">
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <Reveal>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-[#134E4A] md:text-5xl lg:text-6xl">
            Your Entire Operation's{" "}
            <span className="text-[#0D9488]">Appointments &amp; Queues.</span>{" "}
            Organized. Live. Simple.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            All bookings, live tokens, staff schedules and reports — stored in
            one place and available the moment you need them.
          </p>

          <Button size="lg" asChild className="mt-8 h-12 gap-2 bg-[#0D9488] px-7 text-base shadow-lg shadow-[#0D9488]/20 hover:bg-[#0D9488]/90">
            <Link to="/register-organization">
              Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>

        <Reveal delay={150}>
          <div className="overflow-hidden rounded-3xl shadow-2xl shadow-[#0D9488]/20">
            <img
              src={heroImage}
              alt="A receptionist helping a customer at a service counter, with a queue wait-time display on the wall and other customers waiting in line"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── What's broken today ──────────────────────────────────────────────────────

function WhatsBroken() {
  return (
    <Section
      id="problem"
      eyebrow="Why this exists"
      title="What's Broken Today"
      subtitle="Walk-in service still runs on paper tokens and guesswork — except where it matters most."
    >
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((p, i) => (
          <Reveal key={p.title} delay={i * 70}>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#0D9488]/10 text-[#0D9488]">
              <p.icon className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold text-[#134E4A]">{p.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── Built for ────────────────────────────────────────────────────────────────

function BuiltFor() {
  return (
    <Section
      id="industries"
      eyebrow="Built for"
      title="Built for Every Service Operation"
      subtitle="Whether it's a ward, a counter, a trial room or a support desk — the workflow adapts to the service."
      tint
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {builtFor.map((b, i) => (
          <Reveal key={b.title} delay={i * 80}>
            <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[#0D9488]/10 text-[#0D9488]">
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold text-[#134E4A]">{b.title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── Everything you need ──────────────────────────────────────────────────────

function Features() {
  return (
    <Section
      id="features"
      eyebrow="Platform"
      title="Everything You Need to Stay on Schedule"
      subtitle="Every module ships role-aware, with audit trails, notifications and data exports."
    >
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 60}>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#0891B2]/10 text-[#0891B2]">
              <f.icon className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold text-[#134E4A]">{f.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── Process flow ──────────────────────────────────────────────────────────────

function ProcessFlow() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="Indus Service Flow Makes Service Simple"
      subtitle="A simple system that brings booking, queueing and reporting together."
      tint
    >
      <Reveal>
        <div className="relative flex flex-wrap items-start justify-center gap-x-2 gap-y-10">
          {flowSteps.map((s, i) => (
            <div key={s.title} className="relative flex flex-1 basis-28 flex-col items-center text-center">
              <div
                className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-md"
                style={{ background: i % 2 === 0 ? TEAL : TEAL_DARK }}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <span className="mt-3 text-sm font-semibold text-[#134E4A]">{s.title}</span>
              {i < flowSteps.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-[#0D9488]/30 sm:block" />
              )}
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted-foreground">
          No paper tokens. No guesswork. Just one structured flow, start to finish.
        </p>
      </Reveal>
    </Section>
  );
}

// ── Mini dashboard preview used inside portal cards ──────────────────────────

function MiniDashboard({ variant, accent }: { variant: "super_admin" | "org_admin" | "employee"; accent: string }) {
  if (variant === "super_admin") {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {["Orgs", "Requests", "Revenue"].map((label) => (
          <div key={label} className="rounded-lg bg-muted/60 p-2">
            <div className="font-mono text-sm font-bold tabular-nums text-foreground">{label === "Requests" ? "6" : label === "Orgs" ? "128" : "₹—"}</div>
            <div className="text-[9px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    );
  }
  if (variant === "org_admin") {
    return (
      <div className="space-y-1.5">
        <div className="flex h-8 items-end gap-1">
          {[40, 70, 55, 90, 60].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: `${accent}55` }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>Employees: 14</span><span>Queues: 3</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2.5">
      <div className="grid h-7 w-7 place-items-center rounded-md text-white" style={{ background: accent }}>
        <span className="font-mono text-[10px] font-bold">#12</span>
      </div>
      <div className="text-[10px] text-muted-foreground">Serving now · Counter 2</div>
    </div>
  );
}

function Portals() {
  return (
    <Section
      id="portals"
      eyebrow="Portals"
      title="Three Purpose-Built Experiences"
      subtitle="Each role gets a focused workspace, with a live preview of what it looks like."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {portals.map((p, i) => (
          <Reveal key={p.key} delay={i * 100}>
            <Dialog>
              <DialogTrigger asChild>
                <button className="group block w-full text-left">
                  <Card className="h-full cursor-pointer border-border/60 transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: `${p.accent}22` }}>
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${p.accent}1A`, color: p.accent }}>
                        <p.icon className="h-5 w-5" />
                      </div>
                      <div className="text-base font-semibold text-[#134E4A]">{p.title}</div>
                      <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>

                      <div className="mt-4 rounded-xl border bg-white/60 p-3">
                        <MiniDashboard variant={p.mock} accent={p.accent} />
                      </div>

                      <ul className="mt-4 space-y-2">
                        {p.points.map((pt) => (
                          <li key={pt} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: p.accent }} />
                            {pt}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5 flex items-center text-xs font-semibold" style={{ color: p.accent }}>
                        Learn more <ChevronRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-1" />
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
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.accent }} />
                      {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-2">
                  <Button asChild>
                    <Link to="/login" search={{ redirect: undefined }}>Sign in</Link>
                  </Button>
                  {p.key === "org_admin" && (
                    <Button asChild variant="outline">
                      <Link to="/register-organization">Register organization</Link>
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </Reveal>
        ))}
      </div>

      <Reveal delay={300} className="mt-10 text-center text-sm text-muted-foreground">
        Need a custom setup for multiple cities or a government tender? {" "}
        <a href="#contact" className="font-semibold text-primary hover:underline">
          Talk to our team
        </a>
        .
      </Reveal>
    </Section>
  );
}

// ── Security ──────────────────────────────────────────────────────────────────

function Security() {
  return (
    <Section
      id="security"
      eyebrow="Security"
      title="Enterprise-Grade by Default"
      subtitle="Security ships with every account, at every plan — not as an add-on."
      tint
    >
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {security.map((s, i) => (
          <Reveal key={s.title} delay={i * 60}>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white text-[#0D9488] shadow-sm">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold text-[#134E4A]">{s.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────────

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email and message.");
      return;
    }
    setSending(true);
    db.insert("contact_messages", { id: uid("msg"), ...form, status: "new", created_at: new Date().toISOString() } as never);
    db.insert("notifications", { id: uid("n"), role: "super_admin", title: "New contact message", message: `${form.name}: ${form.subject || "(no subject)"}`, read: false, created_at: new Date().toISOString() } as never);
    setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent. Our team will get back to you shortly.");
    }, 500);
  }, [form]);

  return (
    <section id="contact" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0D9488]">Contact</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#134E4A] md:text-4xl">Talk to Our Team</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Tell us about your operation and we'll walk you through the platform —
              no sales script, no commitment.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-[#0D9488]" /> hello@indusserviceflow.in
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-[#0D9488]" /> +91 (0) 40 000 0000
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-[#0D9488]" /> Hyderabad, Telangana, India
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-[#0D9488]" /> Mon–Sat, 9:30 AM – 6:30 PM IST
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
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
                  <Button type="submit" disabled={sending} className="w-full gap-2 bg-[#0D9488] hover:bg-[#0D9488]/90">
                    <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Plans & Features ─────────────────────────────────────────────────────────
// All three plan buttons link straight to /register-organization (no search
// param), same as the Hero and footer CTAs, so navigation isn't blocked by
// route search validation.

function Pricing() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#134E4A] md:text-4xl">Plans &amp; Features</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Choose the perfect plan for your organization's queue management needs.
          </p>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 100}>
              <div
                className={`relative flex h-full flex-col rounded-2xl bg-white p-7 ${
                  plan.popular ? "border-2 shadow-xl" : "border shadow-sm"
                }`}
                style={plan.popular ? { borderColor: plan.color } : undefined}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-sm"
                    style={{ background: TEAL_DARK }}
                  >
                    <Star className="h-3 w-3 fill-current" /> Most Popular
                  </div>
                )}

                <div className="text-xl font-bold text-[#134E4A]">{plan.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono text-3xl font-bold text-[#0D9488]">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.cadence}</span>
                </div>

                <div className="mt-6 flex items-center justify-between border-t py-3 text-sm">
                  <span className="text-muted-foreground">Counters</span>
                  <span className="font-medium text-[#134E4A]">{plan.counters}</span>
                </div>

                {/* Feature rows: not-included features are faded (font-light + low opacity),
                    included features stay full weight; the "not included" mark is red. */}
                <div className="space-y-0">
                  {featureRows.map((row, idx) => {
                    const isIncluded = plan.included[idx];
                    return (
                      <div key={row} className="flex items-center justify-between border-t py-3 text-sm">
                        <span
                          className={
                            isIncluded
                              ? "text-foreground"
                              : "font-light text-muted-foreground/50"
                          }
                        >
                          {row}
                        </span>
                        {isIncluded ? (
                          <Check className="h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />
                        ) : (
                          <X className="h-4 w-4 flex-shrink-0 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-y py-3 text-sm">
                  <span className="text-muted-foreground">Support</span>
                  <span className="font-medium text-[#134E4A]">{plan.support}</span>
                </div>

                <Button
                  asChild
                  className={`mt-7 h-11 w-full gap-2 text-sm ${plan.filled ? "" : "text-[#0D9488]"}`}
                  variant={plan.filled ? "default" : "outline"}
                  style={plan.filled ? { background: "#0D9488" } : { borderColor: "#0D9488" }}
                >
                  <Link to="/register-organization">
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#134E4A] pt-16 text-white/80">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              Indus Service Flow
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Helping organizations manage appointments and queues, without the wait.
            </p>
            <div className="mt-5 flex gap-3">
              <Button asChild size="sm" className="h-9 bg-[#0D9488] px-4 text-xs hover:bg-[#0D9488]/90">
                <Link to="/login" search={{ redirect: undefined }}>Log In</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-9 border-white/25 bg-transparent px-4 text-xs text-white hover:bg-white/10 hover:text-white">
                <Link to="/register-organization">Sign Up</Link>
              </Button>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Company</div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><a href="#industries" className="hover:text-white">About Us</a></li>
              <li><a href="#contact" className="hover:text-white">Contact Us</a></li>
              <li><a href="#pricing" className="hover:text-white">Plans &amp; Pricing</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Legal</div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#security" className="hover:text-white">Data Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Indus Service Flow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}