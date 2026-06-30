import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  X,
  Star,
  Users,
  Zap,
  Building2,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/super-admin/plans")({
  component: PlansPage,
});

// ── Data ─────────────────────────────────────────────────────────────────────

const PLAN_COLORS = {
  Starter: "#eda100",
  Growth: "#1baf7a",
  Enterprise: "#2a78d6",
};

const PLAN_ICONS = {
  Starter: Zap,
  Growth: Users,
  Enterprise: Building2,
};

const DEFAULT_ICON = Building2;
const DEFAULT_COLOR = "#7c5cff";

const DEFAULT_FEATURE_LABELS = [
  "Basic reports & history",
  "Detailed reports & data export",
  "Email support",
  "Priority email & chat support",
  "24/7 priority support",
  "Multiple branches / locations",
  "Custom staff roles & permissions",
  "Dedicated account manager",
];

const INITIAL_PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For small teams just getting set up",
    priceMonthly: 2999,
    priceAnnual: 2399,
    activeOrgs: 2,
    employeeLimit: 25,
    queueLimit: 5,
    popular: false,
    features: [
      { label: "Basic reports & history", included: true },
      { label: "Email support", included: true },
      { label: "Multiple branches / locations", included: false },
      { label: "Custom staff roles & permissions", included: false },
      { label: "Priority email & chat support", included: false },
      { label: "24/7 priority support", included: false },
      { label: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For busy orgs handling more daily volume",
    priceMonthly: 5999,
    priceAnnual: 4799,
    activeOrgs: 6,
    employeeLimit: 60,
    queueLimit: 12,
    popular: true,
    features: [
      { label: "Detailed reports & data export", included: true },
      { label: "Priority email & chat support", included: true },
      { label: "Multiple branches / locations", included: true },
      { label: "Custom staff roles & permissions", included: true },
      { label: "Basic reports & history", included: false },
      { label: "24/7 priority support", included: false },
      { label: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For large organizations with no limits",
    priceMonthly: 11999,
    priceAnnual: 9599,
    activeOrgs: 4,
    employeeLimit: Infinity,
    queueLimit: Infinity,
    popular: false,
    features: [
      { label: "Detailed reports & data export", included: true },
      { label: "24/7 priority support", included: true },
      { label: "Multiple branches / locations", included: true },
      { label: "Custom staff roles & permissions", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "Basic reports & history", included: false },
      { label: "Priority email & chat support", included: false },
    ],
  },
];

type Plan = typeof INITIAL_PLANS[number];
type PlanFeature = { label: string; included: boolean };
type PlanForm = {
  id: string | null;
  name: string;
  tagline: string;
  priceMonthly: string;
  priceAnnual: string;
  employeeLimit: string;
  queueLimit: string;
  unlimitedEmployees: boolean;
  unlimitedQueues: boolean;
  popular: boolean;
  features: PlanFeature[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function blankForm(): PlanForm {
  return {
    id: null,
    name: "",
    tagline: "",
    priceMonthly: "",
    priceAnnual: "",
    employeeLimit: "",
    queueLimit: "",
    unlimitedEmployees: false,
    unlimitedQueues: false,
    popular: false,
    features: DEFAULT_FEATURE_LABELS.map((label) => ({ label, included: false })),
  };
}

function planToForm(plan: Plan): PlanForm {
  return {
    id: plan.id,
    name: plan.name,
    tagline: plan.tagline,
    priceMonthly: String(plan.priceMonthly),
    priceAnnual: String(plan.priceAnnual),
    employeeLimit: plan.employeeLimit === Infinity ? "" : String(plan.employeeLimit),
    queueLimit: plan.queueLimit === Infinity ? "" : String(plan.queueLimit),
    unlimitedEmployees: plan.employeeLimit === Infinity,
    unlimitedQueues: plan.queueLimit === Infinity,
    popular: plan.popular,
    features: DEFAULT_FEATURE_LABELS.map((label) => ({
      label,
      included: !!plan.features.find((f) => f.label === label && f.included),
    })),
  };
}

function formToPlan(form: PlanForm, existingPlan?: Plan) {
  const employeeLimit = form.unlimitedEmployees ? Infinity : Number(form.employeeLimit) || 0;
  const queueLimit = form.unlimitedQueues ? Infinity : Number(form.queueLimit) || 0;

  const limitFeatures = [
    { label: employeeLimit === Infinity ? "Unlimited employees" : `Up to ${employeeLimit} employees`, included: true },
    { label: queueLimit === Infinity ? "Unlimited ongoing queues" : `Up to ${queueLimit} ongoing queues`, included: true },
  ];

  return {
    id: form.id ?? form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: form.name.trim() || "Untitled plan",
    tagline: form.tagline.trim(),
    priceMonthly: Number(form.priceMonthly) || 0,
    priceAnnual: Number(form.priceAnnual) || 0,
    activeOrgs: existingPlan?.activeOrgs ?? 0,
    employeeLimit,
    queueLimit,
    popular: form.popular,
    features: [...limitFeatures, ...form.features],
  };
}

// ── Plan form dialog ────────────────────────────────────────────────────────

function PlanFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  isEditing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PlanForm;
  setForm: (value: PlanForm | ((prev: PlanForm) => PlanForm)) => void;
  onSave: () => void;
  isEditing: boolean;
}) {
  function update<Field extends keyof PlanForm>(field: Field, value: PlanForm[Field]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleFeature(label: string) {
    setForm((f) => ({
      ...f,
      features: f.features.map((feat) =>
        feat.label === label ? { ...feat, included: !feat.included } : feat
      ),
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit plan" : "Create new plan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name" className="text-xs">Plan name</Label>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Growth"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.popular}
                  onChange={(e) => update("popular", e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-input"
                />
                Mark as most popular
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-tagline" className="text-xs">Tagline</Label>
            <Input
              id="plan-tagline"
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="e.g. For busy orgs handling more daily volume"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price-monthly" className="text-xs">Monthly price (₹)</Label>
              <Input
                id="price-monthly"
                type="number"
                value={form.priceMonthly}
                onChange={(e) => update("priceMonthly", e.target.value)}
                placeholder="5999"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price-annual" className="text-xs">Annual price (₹/mo)</Label>
              <Input
                id="price-annual"
                type="number"
                value={form.priceAnnual}
                onChange={(e) => update("priceAnnual", e.target.value)}
                placeholder="4799"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="employee-limit" className="text-xs">Max employees</Label>
              <Input
                id="employee-limit"
                type="number"
                value={form.employeeLimit}
                disabled={form.unlimitedEmployees}
                onChange={(e) => update("employeeLimit", e.target.value)}
                placeholder="60"
                className="h-8 text-xs"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.unlimitedEmployees}
                  onChange={(e) => update("unlimitedEmployees", e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-input"
                />
                Unlimited
              </label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="queue-limit" className="text-xs">Max ongoing queues</Label>
              <Input
                id="queue-limit"
                type="number"
                value={form.queueLimit}
                disabled={form.unlimitedQueues}
                onChange={(e) => update("queueLimit", e.target.value)}
                placeholder="12"
                className="h-8 text-xs"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.unlimitedQueues}
                  onChange={(e) => update("unlimitedQueues", e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-input"
                />
                Unlimited
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">What's included</Label>
            <div className="grid grid-cols-1 gap-1.5 rounded-lg border p-2.5 sm:grid-cols-2">
              {form.features.map((f) => (
                <label key={f.label} className="flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={f.included}
                    onChange={() => toggleFeature(f.label)}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={!form.name.trim()}>
            {isEditing ? "Save changes" : "Create plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function PlansPage() {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "annual"
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalActiveOrgs = plans.reduce((sum, p) => sum + p.activeOrgs, 0);

  function openCreateDialog() {
    setForm(blankForm());
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(plan: Plan) {
    setForm(planToForm(plan));
    setEditingId(plan.id);
    setDialogOpen(true);
  }

  function handleSave() {
    const existingPlan = plans.find((p) => p.id === editingId);
    const newPlan = formToPlan(form, existingPlan);

    setPlans((prev) => {
      // if marking this plan popular, un-mark the others
      const cleared = newPlan.popular
        ? prev.map((p) => ({ ...p, popular: false }))
        : prev;

      if (editingId) {
        return cleared.map((p) => (p.id === editingId ? newPlan : p));
      }
      return [...cleared, newPlan];
    });

    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Subscription plans"
          subtitle="Configure the plans available to organizations on the platform."
        />
        <div className="flex items-center gap-2 flex-wrap">
          {/* Billing toggle */}
          <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                billingCycle === "annual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-400">
                Save 20%
              </span>
            </button>
          </div>

          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCreateDialog}>
            <Plus className="h-3.5 w-3.5" />
            New plan
          </Button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Total plans</span>
            <span className="font-mono font-semibold text-foreground">{plans.length}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Active organizations</span>
            <span className="font-mono font-semibold text-foreground">{totalActiveOrgs}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Most popular</span>
            <span className="font-semibold text-foreground">
              {plans.find((p) => p.popular)?.name ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Plan cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name as keyof typeof PLAN_ICONS] ?? DEFAULT_ICON;
          const color = PLAN_COLORS[plan.name as keyof typeof PLAN_COLORS] ?? DEFAULT_COLOR;
          const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceAnnual;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular ? "border-2 ring-1 ring-offset-0" : ""
              }`}
              style={plan.popular ? ({ borderColor: color, "--tw-ring-color": color } as any) : undefined}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                  style={{ background: color }}
                >
                  <Star className="h-3 w-3 fill-current" />
                  MOST POPULAR
                </div>
              )}

              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${color}1A` }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color }} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit plan
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
                        View subscribers
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardTitle className="mt-3 text-lg font-semibold">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col px-5 pb-5">
                {/* Price */}
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold font-mono tracking-tight text-foreground">
                    {fmtINR(price)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                {billingCycle === "annual" && (
                  <p className="mb-4 text-xs text-muted-foreground">
                    billed annually ({fmtINR(price * 12)}/yr)
                  </p>
                )}
                {billingCycle === "monthly" && <div className="mb-4" />}

                <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Employees</p>
                    <p className="text-sm font-semibold font-mono text-foreground">
                      {plan.employeeLimit === Infinity ? "Unlimited" : `Up to ${plan.employeeLimit}`}
                    </p>
                  </div>
                  <div className="h-7 w-px bg-border" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ongoing queues</p>
                    <p className="text-sm font-semibold font-mono text-foreground">
                      {plan.queueLimit === Infinity ? "Unlimited" : `Up to ${plan.queueLimit}`}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2 text-xs">
                      {f.included ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/60"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{plan.activeOrgs}</span>{" "}
                    active org{plan.activeOrgs !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isEditing={!!editingId}
      />
    </div>
  );
}