import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import {
  useHydrated,
  resolveShiftDisplay,
  fmt12,
  shiftLabel,
  isTimeInShiftRange,
  type Appointment,
} from "@/lib/mock/db";
import { useEmployeeQueueData } from "../lib/employee-queue";

export const Route = createFileRoute("/employee/schedule")({
  component: SchedulePage,
});

type Slot = {
  label: string;
  kind: "available" | "break" | "off" | "unknown";
  startMin?: number;
  endMin?: number;
};

type DaySchedule = { day: string; slots: Slot[]; isToday: boolean };

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const OFF_DAY = "Sunday"; // adjust once per-employee off-days exist in your data model

function buildSlotsFromShift(startMin: number, endMin: number): Slot[] {
  const total = endMin - startMin;
  const breakLen = 30;
  const firstBlockEnd = startMin + Math.floor((total - breakLen) / 2);
  const breakEnd = firstBlockEnd + breakLen;

  return [
    {
      label: `${fmt12(startMin)} - ${fmt12(firstBlockEnd)}`,
      kind: "available",
      startMin,
      endMin: firstBlockEnd,
    },
    {
      label: `${fmt12(firstBlockEnd)} - ${fmt12(breakEnd)}`,
      kind: "break",
      startMin: firstBlockEnd,
      endMin: breakEnd,
    },
    {
      label: `${fmt12(breakEnd)} - ${fmt12(endMin)}`,
      kind: "available",
      startMin: breakEnd,
      endMin,
    },
  ];
}

function SchedulePage() {
  const { user } = useAuth();
  const hydrated = useHydrated();

  // Shared with Dashboard/Queue: same employee resolution, same org, same
  // "today's appointments" set, same shift-end calc, same auto-reschedule
  // effect — all of that now lives in useEmployeeQueueData so it runs on
  // every employee page, not just this one.
  const {
    employee,
    matchedByFallback,
    org,
    myAppointmentsToday,
  } = useEmployeeQueueData(user);

  // Ticking clock so "current slot" / "shift ended" state stays accurate
  // without needing a manual refresh — updates once a minute.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const todayName = ALL_DAYS[(now.getDay() + 6) % 7]; // JS getDay(): 0=Sun, local
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const todaysAppointments = myAppointmentsToday as Appointment[];

  if (!hydrated) {
    return null;
  }

  if (!employee) {
    return (
      <div>
        <PageHeader title="My Schedule" subtitle="No employee record found for this account." />
      </div>
    );
  }

  const shiftDef = resolveShiftDisplay((employee as any).shift, org);
  const parsed = shiftDef ? { startMin: shiftDef.startMin || 0, endMin: shiftDef.endMin || 0 } : undefined;
  const shiftHasEnded = parsed ? currentTimeMinutes > parsed.endMin : false;
  const label = shiftDef?.label ?? (parsed ? shiftLabel(parsed.startMin) : "Custom");
  const rangeDisplay = shiftDef?.display ?? (parsed ? `${fmt12(parsed.startMin)} - ${fmt12(parsed.endMin)}` : (employee as any).shift);

  const employeeSchedule: DaySchedule[] = ALL_DAYS.map((day) => {
    const isToday = day === todayName;
    if (day === OFF_DAY) {
      return { day, slots: [{ label: "Day off", kind: "off" }], isToday };
    }
    if (!parsed) {
      return {
        day,
        slots: [{ label: `Unrecognized shift format: "${(employee as any).shift}"`, kind: "unknown" }],
        isToday,
      };
    }
    return { day, slots: buildSlotsFromShift(parsed.startMin, parsed.endMin), isToday };
  });

  const outOfShiftToday = parsed
    ? todaysAppointments.filter((a) => !isTimeInShiftRange(a.time, parsed))
    : [];
  const shiftRangeText = parsed ? `${fmt12(parsed.startMin)} - ${fmt12(parsed.endMin)}` : rangeDisplay;

  const stillWaitingCount = todaysAppointments.filter((a) => a.status === "confirmed").length;
  const inProgressCount = todaysAppointments.filter((a) => a.status === "in_progress").length;

  const currentClock = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="My Schedule"
          subtitle={`Weekly working hours, breaks and weekly offs — ${label} (${rangeDisplay}).`}
        />
        <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
          <span className="text-muted-foreground/40">•</span>
          <Clock className="h-3.5 w-3.5" />
          {currentClock}
        </div>
      </div>

      {matchedByFallback && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          This account has no linked employee_id — showing the first employee record found for
          this organization instead of a confirmed match. Set employee_id on this user to fix this.
        </div>
      )}

      {shiftHasEnded && stillWaitingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Your {label.toLowerCase()} shift ({rangeDisplay}) has ended for today. {stillWaitingCount}{" "}
          appointment(s) still waiting are being moved to your next working day.
        </div>
      )}

      {outOfShiftToday.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {outOfShiftToday.length} appointment(s) today are booked outside your {label.toLowerCase()}{" "}
          shift window ({shiftRangeText}).
        </div>
      )}

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Today's shift" value={rangeDisplay} accent="text-primary" />
        <StatCard
          label="Shift status"
          value={shiftHasEnded ? "Ended" : "Active"}
          accent={shiftHasEnded ? "text-muted-foreground" : "text-emerald-600"}
        />
        <StatCard label="Waiting" value={String(stillWaitingCount)} accent="text-blue-600" />
        <StatCard label="In progress" value={String(inProgressCount)} accent="text-amber-600" />
      </div>

      {/* Weekly schedule — moved to the top as the primary view */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {employeeSchedule.map((day) => (
          <Card
            key={day.day}
            className={`border bg-white shadow-sm transition-all hover:shadow-md ${
              day.isToday ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">
                {day.day}
                {day.isToday && (
                  <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    Today
                  </span>
                )}
              </CardTitle>
              {day.slots[0]?.kind === "off" && (
                <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Off
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {day.slots.map((slot, index) => {
                const isLive =
                  day.isToday &&
                  slot.startMin !== undefined &&
                  slot.endMin !== undefined &&
                  currentTimeMinutes >= slot.startMin &&
                  currentTimeMinutes < slot.endMin;

                return (
                  <div
                    key={index}
                    className={`relative rounded-lg border p-2 pl-3 text-xs font-medium ${
                      slot.kind === "break"
                        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-700"
                        : slot.kind === "off"
                        ? "border-muted bg-muted/30 text-muted-foreground"
                        : slot.kind === "unknown"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-green-500/20 bg-green-500/10 text-green-700"
                    } ${isLive ? "ring-1 ring-primary/50" : ""}`}
                  >
                    {isLive && (
                      <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {slot.kind === "break" ? "Break" : slot.kind === "off" ? "" : ""}
                        {slot.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's appointments — moved below the weekly schedule */}
      <Card className="border bg-white shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">
            Today's Appointments ({todaysAppointments.length})
          </CardTitle>
          {todaysAppointments.length > 0 && (
            <span className="text-xs text-muted-foreground">Updated {currentClock}</span>
          )}
        </CardHeader>
        <CardContent>
          {todaysAppointments.length ? (
            <div className="space-y-2">
              {todaysAppointments.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                    a.status === "in_progress" ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {a.status === "in_progress" && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                    )}
                    <div>
                      <div className="font-medium">{a.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{a.service_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{a.time}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {a.status === "in_progress" ? "In Progress (Current Customer)" : a.status.replace("_", " ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              No appointments booked for today.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card className="border bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={`mt-1 text-lg font-semibold ${accent}`}>{value}</div>
      </CardContent>
    </Card>
  );
}