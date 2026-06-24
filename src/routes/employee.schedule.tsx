import { Fragment, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/employee/schedule")({ component: SchedPage });

const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const CELL_STYLE = (day: string, slot: string) => {
  if (day === "Sun")        return "border-red-200 bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900";
  if (slot === "13:00")     return "border-amber-200 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
};
const CELL_LABEL = (day: string, slot: string) =>
  day === "Sun" ? "Off" : slot === "13:00" ? "Break" : "Available";

function getWeekDates(offset: number): string[] {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const STATUS_STYLE: Record<string, string> = {
  confirmed:   "bg-blue-50 text-blue-600 border-blue-200",
  in_progress: "bg-emerald-50 text-emerald-600 border-emerald-200",
  completed:   "bg-gray-100 text-gray-500 border-gray-200",
  cancelled:   "bg-red-50 text-red-500 border-red-200",
  rescheduled: "bg-amber-50 text-amber-600 border-amber-200",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Upcoming", in_progress: "In Service",
  completed: "Completed", cancelled: "Cancelled", rescheduled: "Rescheduled",
};

function SchedPage() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const weekDates = getWeekDates(weekOffset);
  const apts = useDb(() =>
    db.all("appointments")
      .filter(a => a.organization_id === user?.organization_id)
      .sort((a, b) => a.time.localeCompare(b.time))
  );
  const dayApts = apts.filter(a => a.date === selectedDate);

  const weekLabel = `${new Date(weekDates[0]).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(weekDates[6]).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="My Schedule" subtitle="Weekly working hours, shifts and appointments." />

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{weekLabel}</span>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => setWeekOffset(0)}>Today</Button>
      </div>

      {/* Weekly grid */}
      <Card className="shadow-sm">
        <CardContent className="p-3 overflow-x-auto">
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            {/* Day headers */}
            <div />
            {DAYS.map((d, i) => {
              const dateStr = weekDates[i];
              const isToday = dateStr === new Date().toISOString().slice(0, 10);
              const isSelected = dateStr === selectedDate;
              const dayAptCount = apts.filter(a => a.date === dateStr).length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-2 text-center rounded-lg transition-colors ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                >
                  <div className="text-xs font-semibold">{d}</div>
                  <div className="text-[10px] text-inherit opacity-70">{new Date(dateStr).getDate()}</div>
                  {dayAptCount > 0 && <div className="mt-0.5 mx-auto h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
                </button>
              );
            })}

            {/* Slots */}
            {SLOTS.map(s => (
              <Fragment key={s}>
                <div className="p-2 text-right text-xs text-muted-foreground pt-4">{s}</div>
                {DAYS.map(d => (
                  <div key={`${s}-${d}`} className={`m-0.5 rounded-md border text-[10px] font-semibold flex items-center justify-center py-3 ${CELL_STYLE(d, s)}`}>
                    {CELL_LABEL(d, s)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected day appointments */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Appointments — {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            <Badge className="ml-2 bg-primary/10 text-primary border-primary/30 border hover:bg-primary/10">{dayApts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dayApts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No appointments for this day.
            </div>
          ) : (
            <div className="space-y-2">
              {dayApts.map((a, i) => (
                <div key={a.id} className="flex items-center gap-4 rounded-xl border border-border bg-card/50 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
                  <div className="w-14 shrink-0 text-sm font-semibold text-primary">{a.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.customer_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.service_name} · {a.token}</div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] border shrink-0 ${STATUS_STYLE[a.status] || ""}`}>
                    {STATUS_LABEL[a.status] || a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
