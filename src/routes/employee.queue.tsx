import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, SkipForward, Repeat, Phone, RefreshCw, PauseCircle, Search, SlidersHorizontal, User, RotateCcw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { db, useDb, type AppointmentStatus } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/queue")({ component: EmpQueue });

function EmpQueue() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");

  const rows = useDb(() =>
    db.all("appointments")
      .filter(a => a.organization_id === user?.organization_id && a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time))
  );
  const org = useDb(() => db.all("organizations").find(o => o.id === user?.organization_id));

  function set(id: string, status: AppointmentStatus) {
    db.update("appointments", id, { status } as never);
    toast.success("Updated");
  }

  const serving = rows.find(r => r.status === "in_progress");
  const waiting = rows.filter(r => r.status === "confirmed");

  function callNext() {
    if (serving) { toast.error("Complete the current patient first"); return; }
    const next = waiting[0];
    if (!next) { toast.error("Queue is empty"); return; }
    db.update("appointments", next.id, { status: "in_progress" } as never);
    toast.success(`Now serving ${next.token}`);
  }

  // All active queue (in_progress + confirmed)
  const queueList = rows.filter(r => r.status === "in_progress" || r.status === "confirmed");
  const filtered = search
    ? queueList.filter(r =>
        r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        r.token.toLowerCase().includes(search.toLowerCase())
      )
    : queueList;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Queue"
        subtitle={`Patients assigned to ${org?.name ? "General-A" : "General-A"}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Refreshed")}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Queue paused")}>
              <PauseCircle className="h-4 w-4" /> Pause
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => { db.reset(); window.location.reload(); }} title="Reset demo data">
              <RotateCcw className="h-3.5 w-3.5" /> Reset Data
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ── Current Patient Card ── */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-teal-50/80 to-cyan-50/60 dark:from-teal-950/40 dark:to-cyan-950/30 p-6 h-full">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-5">
              Current Patient
            </p>

            {serving ? (
              <div className="space-y-6">
                {/* Patient info */}
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal-500 text-white text-lg font-bold shadow-md">
                    <User className="h-7 w-7" />
                  </span>
                  <div>
                    <div className="text-xl font-bold">{serving.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      General-A &bull; Token {serving.token}
                    </div>
                  </div>
                </div>

                {/* Action buttons — exactly like screenshot */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="gap-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-11"
                    onClick={() => set(serving.id, "completed")}
                  >
                    <Check className="h-4 w-4" /> Complete
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl h-11"
                    onClick={() => set(serving.id, "rescheduled")}
                  >
                    <SkipForward className="h-4 w-4" /> Skip
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl h-11"
                    onClick={() => set(serving.id, "confirmed")}
                  >
                    <Repeat className="h-4 w-4" /> Transfer
                  </Button>
                  <Button
                    className="gap-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-11"
                    onClick={callNext}
                  >
                    <Phone className="h-4 w-4" /> Call next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-teal-100 dark:bg-teal-900">
                  <User className="h-8 w-8 text-teal-500" />
                </span>
                <p className="text-sm text-muted-foreground">No patient currently in service</p>
                <Button
                  className="gap-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
                  onClick={callNext}
                  disabled={waiting.length === 0}
                >
                  <Phone className="h-4 w-4" /> Call next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Queue List ── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <h2 className="text-base font-semibold">
                Queue list ({filtered.length})
              </h2>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-44 pl-8 h-9 text-sm rounded-xl"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {/* Filters button */}
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl h-9">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No patients in queue.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="pb-3 text-left font-medium">Patient</th>
                    <th className="pb-3 text-left font-medium">Position</th>
                    <th className="pb-3 text-left font-medium">Wait</th>
                    <th className="pb-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isServing = r.status === "in_progress";
                    const waitMin   = isServing ? 0 : i * 8;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3.5 font-medium">{r.customer_name}</td>
                        <td className="py-3.5 text-muted-foreground">#{i + 1}</td>
                        <td className="py-3.5 text-muted-foreground">{waitMin} min</td>
                        <td className="py-3.5">
                          {isServing ? (
                            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-0.5 text-xs font-semibold text-teal-600 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
                              In Service
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50/60 px-3 py-0.5 text-xs font-semibold text-teal-600 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
                              Waiting
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
