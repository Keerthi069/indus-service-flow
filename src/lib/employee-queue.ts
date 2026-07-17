// src/lib/employee-queue.ts
//
// Single source of truth for the Employee Portal's per-employee queue and
// appointment state. Dashboard, My Queue, My Schedule, and Performance all
// import from here instead of each re-deriving "who is this employee",
// "what's their category label", and "what's happening in their queue
// today" independently — that duplication is exactly what let the four
// screens drift out of sync (Dashboard's own local queue-name copy saying
// "Teller Queue" while db.ts's CATEGORY_LABELS could say something else,
// Performance generating fully fake numbers unrelated to real
// appointments, Dashboard's "waiting" count skipping the service_ids
// filter that Queue applies, etc).
//
// Verified against the real db.ts / seed.ts:
//   - AppointmentStatus = "confirmed" | "in_progress" | "completed" |
//     "cancelled" | "rescheduled" — all three of completed/cancelled/
//     rescheduled are terminal-for-today and excluded from the active queue.
//   - Employee.service_ids is NOT on the base Employee interface (only on
//     seed.ts's internal SeedEmployee type), so `(employee as any)
//     ?.service_ids` below is intentional, not a guess that missed.
//   - Feedback.rating, Service.duration_min, Organization.shift_hours all
//     confirmed to exist as assumed.

import {
  db,
  useDb,
  resolveEmployeeForUser,
  normalizeCategoryKey,
  CATEGORY_LABELS,
  type AppointmentStatus,
} from "@/lib/mock/db";

export const TERMINAL_STATUSES: AppointmentStatus[] = ["completed", "cancelled", "rescheduled"];
export const IN_PROGRESS: AppointmentStatus = "in_progress";
export const WAITING_STATUS: AppointmentStatus = "confirmed";

// Minutes-per-position-ahead-of-you estimate, used ONLY because there is
// no queued_at/started_at timestamp anywhere in the current data model to
// compute a real wait time from. My Queue's per-row "Wait" column and
// Performance's "Avg Wait Time" KPI both import this SAME constant so the
// two screens can never disagree with each other, even though it's an
// estimate rather than a measured value.
// TODO(real fix): add `queued_at` / `serve_started_at` timestamps to
// Appointment and replace this whole estimate with actual elapsed-time math.
export const EST_MINUTES_PER_QUEUE_POSITION = 8;

// Designations that are genuinely meant to sit on a literal teller
// counter (confirmed in seed.ts: banks have both "Teller" and "Customer
// Officer" as distinct designations). Everyone else — Customer Officers
// included — gets de-branded copy instead of "Teller Queue".
const TELLER_DESIGNATIONS = new Set(["teller", "cashier"]);

export function resolveQueueName(designation: string | undefined, fallbackQueueName: string): string {
  const isTellerCopy = fallbackQueueName?.trim().toLowerCase() === "teller queue";
  if (!isTellerCopy) return fallbackQueueName;

  const isTellerDesignation = designation ? TELLER_DESIGNATIONS.has(designation.trim().toLowerCase()) : false;
  return isTellerDesignation ? fallbackQueueName : "Customer Officer Queue";
}

type MinimalUser = { id?: string; organization_id?: string; name?: string; employee_id?: string } | null | undefined;

function sortByTime<T extends { time: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.time.localeCompare(b.time));
}

// Skip stamps a `_skipped_at` marker (via `as never`, matching this
// project's convention for fields not on the base Appointment type) so a
// skipped customer's queue POSITION actually changes — they drop behind
// everyone still waiting on their original time slot — without needing a
// new column on the real schema.
function sortWaiting<T extends { time: string; _skipped_at?: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aSkipped = a._skipped_at ?? 0;
    const bSkipped = b._skipped_at ?? 0;
    if (aSkipped || bSkipped) {
      if (!aSkipped) return -1;
      if (!bSkipped) return 1;
      return aSkipped - bSkipped;
    }
    return a.time.localeCompare(b.time);
  });
}

export function useEmployeeQueueData(user: MinimalUser) {
  const employees = useDb(() => db.all("employees"));
  const { employee, matchedByFallback } = resolveEmployeeForUser(user as any, employees);

  const org = useDb(() => {
    const orgId = (employee as any)?.organization_id ?? user?.organization_id;
    if (!orgId) return undefined;
    return db.all("organizations").find((o: any) => o.id === orgId);
  });

  const categoryId = normalizeCategoryKey((org as any)?.category);
  const labels = CATEGORY_LABELS[categoryId] ?? CATEGORY_LABELS.default;
  const queueName = resolveQueueName((employee as any)?.designation, labels.queueName);

  const services = useDb(() => db.all("services"));
  const allAppointments = useDb(() => db.all("appointments"));
  const allFeedback = useDb(() => db.all("feedback"));

  const employeeServiceIds = (employee as any)?.service_ids as string[] | undefined;
  const today = new Date().toISOString().slice(0, 10);

  const myAppointmentsToday = sortByTime(
    employee
      ? allAppointments.filter(
          (a: any) =>
            a.employee_id === employee.id &&
            a.date === today &&
            (!employeeServiceIds || employeeServiceIds.length === 0 || employeeServiceIds.includes(a.service_id))
        )
      : []
  );

  // ── Single-active-customer guard ─────────────────────────────────────
  // At most one appointment may be "in_progress" for this employee at
  // once. If more than one shows up (bad seed data, a race between two
  // tabs, etc), the earliest by scheduled time wins as the real "current
  // customer" and every other one is surfaced as a data-integrity problem
  // (`duplicateInProgress`) rather than silently rendered as a second
  // active customer.
  const inProgressToday = myAppointmentsToday.filter((a: any) => a.status === IN_PROGRESS);
  const serving = inProgressToday[0] ?? null;
  const duplicateInProgress = inProgressToday.slice(1);

  const activeToday = myAppointmentsToday.filter((a: any) => !TERMINAL_STATUSES.includes(a.status));
  const waiting = sortWaiting(activeToday.filter((a: any) => a.id !== serving?.id));

  const completedToday = myAppointmentsToday.filter((a: any) => a.status === "completed");
  const cancelledToday = myAppointmentsToday.filter((a: any) => a.status === "cancelled");

  const durationFor = (serviceId: string) =>
    services.find((s: any) => s.id === serviceId)?.duration_min ?? null;

  // Average Handling Time — completed customers ONLY, per spec item 2.
  const avgHandlingTime = (() => {
    const durations = completedToday
      .map((a: any) => durationFor(a.service_id))
      .filter((d: number | null): d is number => d != null);
    if (!durations.length) return null;
    return Math.round(durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length);
  })();

  // Estimated average wait — see EST_MINUTES_PER_QUEUE_POSITION above.
  const avgWaitTimeEstimate = waiting.length
    ? Math.round(
        waiting.reduce((sum, _row, index) => sum + (index + 1) * EST_MINUTES_PER_QUEUE_POSITION, 0) /
          waiting.length
      )
    : 0;

  const myAppointmentIdsAllTime = new Set(
    employee ? allAppointments.filter((a: any) => a.employee_id === employee.id).map((a: any) => a.id) : []
  );
  const myFeedback = allFeedback.filter((f: any) => myAppointmentIdsAllTime.has(f.appointment_id));

  const satisfaction = myFeedback.length
    ? myFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / myFeedback.length
    : employee
    ? (employee as any).rating ?? null
    : null;

  return {
    employee,
    matchedByFallback,
    org,
    categoryId,
    labels,
    queueName,
    today,
    services,
    myAppointmentsToday,
    serving,
    waiting,
    duplicateInProgress,
    completedToday,
    cancelledToday,
    avgHandlingTime,
    avgWaitTimeEstimate,
    satisfaction,
    satisfactionSampleSize: myFeedback.length,
    durationFor,
    allAppointments,
    allFeedback,
  };
}

// ── Shared status-transition actions ───────────────────────────────────
// Every screen that mutates an appointment's status goes through these,
// so "complete → auto-advance next" and "skip → drop to back of queue"
// behave identically everywhere instead of living only in My Queue's
// button handlers.

export function markCompleted(id: string) {
  db.update("appointments", id, { status: "completed" } as never);
}

export function callInToService(id: string) {
  db.update("appointments", id, { status: IN_PROGRESS } as never);
}

// Sends a customer back into the waiting pool, stamped so they sort
// behind everyone still waiting on their original time slot.
export function skipToBack(id: string) {
  db.update("appointments", id, {
    status: WAITING_STATUS,
    _skipped_at: Date.now(),
  } as never);
}

// Used by the duplicate-in-progress auto-correction guard.
export function demoteToWaiting(id: string) {
  db.update("appointments", id, { status: WAITING_STATUS } as never);
}

// ── Real Performance-score computation (replaces the old fake generator) ──
// Uses ONLY real data: all-time completed/cancelled counts for that
// employee, and the average of their real Feedback ratings. No random
// seeding, no per-user hash — same employee, same underlying data, same
// score, always.
export function computeEmployeePerformanceScore(
  employeeId: string,
  allAppointments: any[],
  allFeedback: any[]
) {
  const myAppts = allAppointments.filter((a) => a.employee_id === employeeId);
  const completed = myAppts.filter((a) => a.status === "completed");
  const cancelled = myAppts.filter((a) => a.status === "cancelled");
  const totalTerminal = completed.length + cancelled.length;
  const completionRate = totalTerminal ? (completed.length / totalTerminal) * 100 : 100;

  const myApptIds = new Set(myAppts.map((a) => a.id));
  const fb = allFeedback.filter((f) => myApptIds.has(f.appointment_id));
  const satisfaction = fb.length ? fb.reduce((s, f) => s + f.rating, 0) / fb.length : null;
  // If an employee has no reviews yet, don't let a null satisfaction drag
  // the score down — fall back to completion rate alone for that half.
  const satisfactionPct = satisfaction != null ? (satisfaction / 5) * 100 : completionRate;

  const score = Math.round(0.5 * completionRate + 0.5 * satisfactionPct);

  return {
    score,
    completionRate: Math.round(completionRate),
    satisfaction,
    completedCount: completed.length,
    cancelledCount: cancelled.length,
    reviewCount: fb.length,
  };
}

export function statusFromScore(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "Excellent", className: "bg-green-100 text-green-700" };
  if (score >= 75) return { label: "Good", className: "bg-blue-100 text-blue-700" };
  if (score >= 60) return { label: "Needs Improvement", className: "bg-amber-100 text-amber-700" };
  return { label: "At Risk", className: "bg-red-100 text-red-700" };
}

// Groups all-time completed appointments (or feedback) by ISO week for
// trend charts — real historical data, not a fabricated smooth curve.
// Sparse seed data will produce a sparse chart; that's correct behavior.
export function groupByISOWeek<T extends { date?: string }>(
  rows: T[],
  dateKey: (row: T) => string | undefined
): { week: string; count: number }[] {
  const buckets = new Map<string, number>();
  rows.forEach((row) => {
    const dateStr = dateKey(row);
    if (!dateStr) return;
    const d = new Date(`${dateStr}T00:00:00`);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    const key = `${d.getFullYear()}-W${weekNum}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}