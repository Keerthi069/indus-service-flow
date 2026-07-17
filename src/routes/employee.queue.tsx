import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  SkipForward,
  User,
  ArrowLeftRight,
  PhoneCall,
} from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/mock/db";
import {
  useEmployeeQueueData,
  markCompleted,
  callInToService,
  skipToBack,
  demoteToWaiting,
  EST_MINUTES_PER_QUEUE_POSITION,
} from "../lib/employee-queue";

export const Route = createFileRoute("/employee/queue")({
  component: EmpQueue,
});

function EmpQueue() {
  const { user } = useAuth();
  const hydrated = useHydrated();
  const [paused, setPaused] = useState(false);

  const {
    employee,
    matchedByFallback,
    labels,
    queueName,
    serving,
    waiting,
    duplicateInProgress,
  } = useEmployeeQueueData(user);

  // ── Data-integrity auto-correction ────────────────────────────────────
  // If more than one appointment for this employee is somehow
  // "in_progress" at once, demote every one after the earliest back to
  // waiting. This runs as an effect (not during render) so it doesn't
  // fight React's render cycle, and only re-fires when the actual set of
  // duplicate ids changes — once corrected, this list goes empty and the
  // effect goes quiet.
  useEffect(() => {
    if (!duplicateInProgress.length) return;
    duplicateInProgress.forEach((a: any) => demoteToWaiting(a.id));
    toast.warning(
      `Found ${duplicateInProgress.length} customer(s) incorrectly marked In Service at the same time — moved back to waiting.`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateInProgress.map((a: any) => a.id).join(",")]);

  // Complete just frees the "In Service" slot. It does NOT automatically
  // call the next waiting customer — the employee must explicitly click
  // "Call Next" to bring someone new in.
  function completeCurrent() {
    if (!serving) return;

    markCompleted(serving.id);
    toast.success(`${labels.entity} completed`);

    if (!waiting.length) {
      toast.info(`No ${labels.entityPlural.toLowerCase()} waiting`);
    }
  }

  // Skip also just frees the slot — no auto-advance. Use "Call Next" for
  // the next waiting customer.
  function skipCurrent() {
    if (!serving) return;

    skipToBack(serving.id);
    toast.info(`${labels.entity} skipped — moved to back of queue`);
  }

  function serveNext() {
    if (paused) {
      toast.error("Queue is paused — resume to call the next " + labels.entity.toLowerCase());
      return;
    }

    // Enforced here, not just in the button's `disabled`: only one
    // customer may be In Service at a time, so "Call Next" is a no-op
    // (not a bump) while someone is already being served.
    if (serving) {
      toast.error(`Complete or skip the current ${labels.entity.toLowerCase()} before calling the next one`);
      return;
    }

    const next = waiting[0];
    if (!next) {
      toast.info(`No ${labels.entityPlural.toLowerCase()} waiting`);
      return;
    }

    callInToService(next.id);
    toast.success(`Now serving ${next.customer_name}`);
  }

  // Transfer also just frees the slot — no auto-advance. Use "Call Next"
  // afterwards to bring in the next waiting customer.
  function transferCurrent() {
    if (!serving) return;

    skipToBack(serving.id);
    toast.info("Transfer isn't wired to another employee's queue yet — moved back to your own waiting list for now");
  }

  function refreshQueue() {
    toast.success("Queue refreshed");
  }

  function togglePause() {
    setPaused((p) => !p);
    toast.success(paused ? "Queue resumed" : "Queue paused");
  }

  if (!hydrated) {
    return null; // avoid SSR/localStorage hydration mismatch
  }

  if (!employee) {
    return (
      <div>
        <PageHeader title="My Queue" subtitle="No employee record found for this account." />
      </div>
    );
  }

  // Combined display order per spec item 4: current customer first, then
  // waiting customers in queue order. Completed/cancelled/rescheduled
  // never appear here since useEmployeeQueueData already excludes
  // terminal statuses.
  const displayRows = serving ? [serving, ...waiting] : waiting;

  return (
    <div>
      <PageHeader
        title="My Queue"
        subtitle={`${labels.entityPlural} assigned to ${queueName} — ${employee.name} (${(employee as any).designation})`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshQueue}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={togglePause}>
              {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
              {paused ? "Resume" : "Pause"}
            </Button>
          </div>
        }
      />

      {matchedByFallback && (
        <p className="mb-4 text-xs text-yellow-700 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-3 py-2">
          This account has no linked employee_id — showing the first employee record found
          for this organization instead of a confirmed match. Set employee_id on this user
          to fix this.
        </p>
      )}

      {paused && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Queue is paused. New {labels.entityPlural.toLowerCase()} won't be called until you resume.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current Customer */}
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Current {labels.entity}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <User className="h-7 w-7" />
            </div>

            <div>
              <div className="text-2xl font-bold">
                {serving?.customer_name ?? `No Active ${labels.entity}`}
              </div>

              <div className="text-sm text-muted-foreground">
                {serving ? `${queueName} • In Service` : `No active ${labels.entity.toLowerCase()}`}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button disabled={!serving} onClick={completeCurrent}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete
            </Button>

            <Button variant="outline" disabled={!serving} onClick={skipCurrent}>
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>

            <Button variant="outline" disabled={!serving} onClick={transferCurrent}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>

            {/* Disabled whenever someone is already being served — Call
               Next is for bringing in the FIRST customer, not bumping an
               active one. Complete/Skip/Transfer are how you free the slot. */}
            <Button onClick={serveNext} disabled={paused || !!serving}>
              <PhoneCall className="mr-2 h-4 w-4" />
              Call Next
            </Button>
          </div>
        </div>

        {/* Queue List */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <div className="mb-4">
            <h3 className="font-semibold">Queue List ({displayRows.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">{labels.entity}</th>
                  <th className="py-3 text-left font-medium">Service</th>
                  <th className="py-3 text-left font-medium">Position</th>
                  <th className="py-3 text-left font-medium">Wait</th>
                  <th className="py-3 text-left font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {displayRows.map((r: any) => {
                  const isServing = r.id === serving?.id;
                  // Waiting position excludes the current customer — #1
                  // waiting is the very next one to be called.
                  const waitingIndex = waiting.findIndex((w: any) => w.id === r.id);
                  const wait = isServing ? 0 : (waitingIndex + 1) * EST_MINUTES_PER_QUEUE_POSITION;

                  return (
                    <tr key={r.id} className="border-b">
                      <td className="py-4 font-medium">{r.customer_name}</td>

                      <td className="py-4 text-muted-foreground">{r.service_name}</td>

                      <td className="py-4">{isServing ? "Now Serving" : `#${waitingIndex + 1}`}</td>

                      <td className="py-4">{wait} min</td>

                      <td className="py-4">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            isServing
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isServing ? "In Service" : "Waiting"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!displayRows.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No {labels.entityPlural.toLowerCase()} waiting
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}