import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { Trophy, Star, Target, Clock, CheckCircle } from "lucide-react";

import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useHydrated, db } from "@/lib/mock/db";
import {
  useEmployeeQueueData,
  computeEmployeePerformanceScore,
  statusFromScore,
} from "../lib/employee-queue";

export const Route = createFileRoute("/employee/performance")({
  component: PerfPage,
});

// Category copy only (labels), no numbers — every number below is
// computed from real appointments/feedback via useEmployeeQueueData and
// computeEmployeePerformanceScore, the same functions Dashboard and My
// Queue use, so this page can no longer disagree with them.
type IndustryConfig = {
  waitTimeLabel: string;
  completionLabel: string;
};

const INDUSTRY_PRESETS: Record<string, IndustryConfig> = {
  hospitals: { waitTimeLabel: "Avg Wait Time", completionLabel: "Treatment Completion" },
  clinics: { waitTimeLabel: "Avg Wait Time", completionLabel: "Treatment Completion" },
  banks: { waitTimeLabel: "Avg Wait Time", completionLabel: "Transaction Completion" },
  retail: { waitTimeLabel: "Avg Service Time", completionLabel: "Order Completion" },
  support: { waitTimeLabel: "Avg Response Time", completionLabel: "Ticket Completion" },
  default: { waitTimeLabel: "Avg Wait Time", completionLabel: "Completion Rate" },
};

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PerfPage() {
  const { user } = useAuth();
  const hydrated = useHydrated();

  const {
    employee,
    org,
    categoryId,
    labels,
    completedToday,
    avgHandlingTime,
    avgWaitTimeEstimate,
    satisfaction,
    satisfactionSampleSize,
    allAppointments,
    allFeedback,
  } = useEmployeeQueueData(user);

  const cfg = INDUSTRY_PRESETS[categoryId] ?? INDUSTRY_PRESETS.default;

  // Real, deterministic performance score — computed from actual
  // completed/cancelled counts and actual feedback ratings, not a random
  // per-user hash.
  const myScore = useMemo(() => {
    if (!employee) return null;
    return computeEmployeePerformanceScore((employee as any).id, allAppointments, allFeedback);
  }, [employee, allAppointments, allFeedback]);

  // Real department ranking: score every colleague at the SAME
  // organization with the exact same formula and find this employee's
  // percentile.
  const ranking = useMemo(() => {
    if (!employee || !org) return null;
    const colleagues = (db.all("employees") as any[]).filter((e) => e.organization_id === (org as any).id);
    const scored = colleagues.map((e) => ({
      id: e.id,
      score: computeEmployeePerformanceScore(e.id, allAppointments, allFeedback).score,
    }));
    scored.sort((a, b) => b.score - a.score);
    const position = scored.findIndex((s) => s.id === (employee as any).id) + 1;
    const percentile = scored.length ? Math.round((position / scored.length) * 100) : 100;
    return { position, of: scored.length, percentile };
  }, [employee, org, allAppointments, allFeedback]);

  if (!hydrated) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!user || !employee || !myScore) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You need to be signed in as an employee to view performance data.
      </div>
    );
  }

  const status = statusFromScore(myScore.score);

  // Rule-based achievements from real thresholds — not a random pool.
  const achievements: string[] = [];
  if (satisfaction != null && satisfaction >= 4.5) achievements.push(`Consistently high ${labels.entity.toLowerCase()} satisfaction`);
  if (myScore.completionRate >= 95 && myScore.cancelledCount + myScore.completedCount > 0)
    achievements.push(`${myScore.completionRate}% completion rate this period`);
  if (completedToday.length > 0) achievements.push(`${completedToday.length} ${labels.entityPlural.toLowerCase()} completed today`);
  if (!achievements.length) achievements.push("Keep completing appointments to unlock achievements");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${(employee as any).name}'s Performance`}
        subtitle={`${(org as any)?.name ?? "Your organization"} · Real-time metrics from today's queue and all-time appointment history.`}
      />

      {/* KPIs — Customers Served Today matches Dashboard exactly */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Performance Score" value={`${myScore.score}/100`} />
        <Kpi label={`${labels.entityPlural} Served Today`} value={String(completedToday.length)} />
        <Kpi label={`${labels.entityPlural} Served (All-Time)`} value={String(myScore.completedCount)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{avgWaitTimeEstimate} min</p>
              <p className="text-sm text-muted-foreground">{cfg.waitTimeLabel} (est.)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{satisfaction != null ? satisfaction.toFixed(1) : "—"}</p>
              <p className="text-sm text-muted-foreground">
                Satisfaction Score {satisfactionSampleSize ? `(${satisfactionSampleSize} reviews)` : "(no reviews yet)"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{avgHandlingTime != null ? `${avgHandlingTime}m` : "—"}</p>
              <p className="text-sm text-muted-foreground">Average Handling Time (today, completed only)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Status</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Department Ranking</span>
                <span className="font-medium">
                  {ranking ? `#${ranking.position} of ${ranking.of} (top ${ranking.percentile}%)` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Completion Rate (all-time)</span>
                <span className="font-medium">{myScore.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cancelled (all-time)</span>
                <span className="font-medium">{myScore.cancelledCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span className="font-medium">
                  Today{" "}
                  {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress label={`${labels.entityPlural} Served Today`} value={Math.min(100, completedToday.length * 10)} />
            <Progress label={`${labels.entity} Satisfaction`} value={satisfaction != null ? Math.round((satisfaction / 5) * 100) : 0} />
            <Progress label={cfg.completionLabel} value={myScore.completionRate} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((a, i) => {
                const icons = [Trophy, Star, Target, CheckCircle];
                const colors = ["text-yellow-500", "text-amber-500", "text-green-500", "text-blue-500"];
                const Icon = icons[i % icons.length];
                return (
                  <div key={a} className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 ${colors[i % colors.length]}`} />
                    <span className="text-sm">{a}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}