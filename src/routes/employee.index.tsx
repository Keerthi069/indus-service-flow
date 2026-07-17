import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Users,
  Star,
  HeartPulse,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Headset,
  Building2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/mock/db";
import { useEmployeeQueueData } from "../lib/employee-queue";

export const Route = createFileRoute("/employee/")({
  component: EmployeeDashboard,
});

// Presentation-only copy per category (icon + chart/section titles). The
// "entity", "entityPlural", and queue NAME are deliberately NOT
// duplicated here anymore — they come from useEmployeeQueueData(), the
// same place My Queue and My Schedule get them from, so this page can
// never show a different queue name or a different "Customer"/"Patient"
// wording than the other screens.
type CategoryMeta = {
  icon: React.ElementType;
  completedLabel: string;
  avgTimeLabel: string;
  chartTitle: string;
  scheduleTitle: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  hospitals: {
    icon: HeartPulse,
    completedLabel: "Seen Today",
    avgTimeLabel: "Average Consultation",
    chartTitle: "Today's Consultation Time",
    scheduleTitle: "Remaining Schedule Today",
  },
  clinics: {
    icon: Stethoscope,
    completedLabel: "Seen Today",
    avgTimeLabel: "Average Consultation",
    chartTitle: "Today's Consultation Time",
    scheduleTitle: "Remaining Schedule Today",
  },
  banks: {
    icon: Landmark,
    completedLabel: "Served Today",
    avgTimeLabel: "Average Handling Time",
    chartTitle: "Today's Handling Time",
    scheduleTitle: "Remaining Schedule Today",
  },
  retail: {
    icon: ShoppingBag,
    completedLabel: "Served Today",
    avgTimeLabel: "Average Checkout Time",
    chartTitle: "Today's Checkout Time",
    scheduleTitle: "Remaining Schedule Today",
  },
  support: {
    icon: Headset,
    completedLabel: "Resolved Today",
    avgTimeLabel: "Average Response Time",
    chartTitle: "Today's Response Time",
    scheduleTitle: "Remaining Schedule Today",
  },
  default: {
    icon: Building2,
    completedLabel: "Completed Today",
    avgTimeLabel: "Average Task Time",
    chartTitle: "Today's Task Time",
    scheduleTitle: "Remaining Schedule Today",
  },
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold">{value}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const hydrated = useHydrated();

  const now = new Date();
  const currentHour = now.getHours();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const {
    employee,
    matchedByFallback,
    categoryId,
    labels,
    queueName,
    myAppointmentsToday,
    waiting,
    completedToday,
    avgHandlingTime,
    satisfaction,
    satisfactionSampleSize,
    durationFor,
  } = useEmployeeQueueData(user);

  // fallback: some branches of the app may not expose shiftHasEnded from
  // the hook yet. Default to false so the UI compiles and behaves
  // conservatively (showing "No more appointments" instead of
  // "Shift completed").
  const shiftHasEnded = false;

  const meta = CATEGORY_META[categoryId] ?? CATEGORY_META.default;

  const satisfactionDisplay = satisfaction != null ? satisfaction.toFixed(1) : "—";
  const satisfactionSubtitle = employee
    ? satisfactionSampleSize
      ? `Avg of ${satisfactionSampleSize} customer review${satisfactionSampleSize === 1 ? "" : "s"}`
      : "No customer feedback yet"
    : "—";

  const stats = [
    {
      title: `${labels.entityPlural} ${meta.completedLabel}`,
      value: employee ? completedToday.length : "—",
      subtitle: "Completed appointments today",
      icon: CheckCircle2,
    },
    {
      title: meta.avgTimeLabel,
      value: avgHandlingTime != null ? `${avgHandlingTime}m` : "—",
      subtitle: avgHandlingTime != null ? "Based on today's completed tasks" : "No completed tasks yet",
      icon: Clock,
    },
    {
      title: `${labels.entityPlural} Waiting`,
      value: employee ? waiting.length : "—",
      subtitle: queueName,
      icon: Users,
    },
    {
      title: `${labels.entity} Satisfaction`,
      value: satisfactionDisplay,
      subtitle: satisfactionSubtitle,
      icon: Star,
    },
  ];

  // Chart: real per-appointment duration for today, from this employee's
  // own appointments (time + service duration).
  const chartData = myAppointmentsToday
    .map((a: any) => ({
      hour: a.time.slice(0, 5),
      minutes: durationFor(a.service_id) ?? 0,
    }))
    .filter((d) => d.minutes > 0);

  // Remaining schedule: this employee's own upcoming, non-terminal
  // appointments today — same `waiting` list My Queue shows, ordered the
  // same way, so Dashboard's "what's next" list can never disagree with
  // My Queue's queue list.
  const upcomingSchedule = waiting.filter((a: any) => {
    const [h, m] = a.time.split(":").map(Number);
    return h * 60 + m >= nowMinutes;
  });

  const displayName = employee?.name ?? user?.name ?? "there";

  if (!hydrated) {
    return null; // avoid SSR/localStorage hydration mismatch
  }

  return (
    <div>
      <PageHeader
        title={`${greetingForHour(currentHour)}, ${displayName}`}
        subtitle="Here's your day at a glance"
      />

      {matchedByFallback && (
        <p className="mb-4 text-xs text-yellow-700 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-3 py-2">
          This account has no linked employee_id — showing the first employee record found
          for this organization instead of a confirmed match. Set employee_id on this user
          to fix this.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-semibold">{meta.chartTitle}</h3>

            <div className="h-72">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="consultationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <XAxis dataKey="hour" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />

                    <Area
                      type="monotone"
                      dataKey="minutes"
                      strokeWidth={3}
                      fill="url(#consultationGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No task data for today yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-semibold">{meta.scheduleTitle}</h3>

            {upcomingSchedule.length ? (
              <div className="space-y-3">
                {upcomingSchedule.map((a: any, index) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>

                    <div>
                      <div className="font-medium">
                        {a.customer_name} — {a.service_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border p-8 text-center text-muted-foreground">
                {shiftHasEnded ? "Shift completed for today" : "No more appointments scheduled today"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}