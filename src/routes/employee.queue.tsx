import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Phone, RefreshCw, SkipForward, PauseCircle, Repeat } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { db, useDb, type AppointmentStatus } from "@/lib/mock/db";

export const Route = createFileRoute("/employee/queue")({ component: EmpQueue });

function EmpQueue() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");

  const rows = useDb(() =>
    db.all("appointments").filter(a => a.organization_id === user?.organization_id && a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time))
  );
  const org = useDb(() => db.all("organizations").find(o => o.id === user?.organization_id));

  function set(id: string, status: AppointmentStatus) {
    db.update("appointments", id, { status } as never);
    toast.success("Updated");
  }

  const serving = rows.find(r => r.status === "in_progress");
  const waiting = rows.filter(r => r.status === "confirmed");
  const allQueue = rows.filter(r => r.status === "in_progress" || r.status === "confirmed");

  function callNext() {
    if (serving) { toast.error("Complete the current patient first"); return; }
    const next = waiting[0];
    if (!next) { toast.error("Queue is empty"); return; }
    db.update("appointments", next.id, { status: "in_progress" } as never);
    toast.success(`Now serving ${next.token}`);
  }

  const filtered = search
    ? allQueue.filter(r => r.customer_name.toLowerCase().includes(search.toLowerCase()) || r.token.toLowerCase().includes(search.toLowerCase()))
    : allQueue;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Queue"
        subtitle={`Patients assigned to ${org?.name || "your counter"}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Refreshed")}>
              <RefreshCw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Queue paused")}>
              <PauseCircle className="mr-1 h-4 w-4" /> Pause
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Current patient card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 h-full">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Current Patient</div>
            {serving ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                    {serving.customer_name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <div className="font-semibold text-lg">{serving.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{serving.service_name} · {serving.token}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => set(serving.id, "completed")}>
                    <Check className="h-4 w-4" /> Complete
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => set(serving.id, "cancelled")}>
                    <SkipForward className="h-4 w-4" /> Skip
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => set(serving.id, "rescheduled")}>
                    <Repeat className="h-4 w-4" /> Transfer
                  </Button>
                  <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={callNext}>
                    <Phone className="h-4 w-4" /> Call next
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="text-muted-foreground text-sm">No patient currently being served</div>
                <Button onClick={callNext} disabled={waiting.length === 0}>
                  <Phone className="mr-1 h-4 w-4" /> Call next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Queue list */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Queue list ({filtered.length})</div>
              <div className="flex gap-2">
                <Input
                  className="w-48 h-8 text-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No patients in queue.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="pb-2 text-left font-medium">Patient</th>
                    <th className="pb-2 text-left font-medium">Position</th>
                    <th className="pb-2 text-left font-medium">Wait</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isServing = r.status === "in_progress";
                    const waitMin = i === 0 ? 0 : i * 8;
                    return (
                      <tr key={r.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 font-medium">{r.customer_name}</td>
                        <td className="py-3 text-muted-foreground">#{i + 1}</td>
                        <td className="py-3 text-muted-foreground">{waitMin} min</td>
                        <td className="py-3">
                          {isServing ? (
                            <Badge className="bg-primary/15 text-primary border-primary/30 border hover:bg-primary/15">In Service</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/50">Waiting</Badge>
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
