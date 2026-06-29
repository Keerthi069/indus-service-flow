import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  Pause,
  RefreshCw,
  SkipForward,
  User,
  ArrowLeftRight,
  PhoneCall,
} from "lucide-react";

import { PageHeader } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth";
import {
  db,
  useDb,
  type AppointmentStatus,
} from "@/lib/mock/db";

export const Route = createFileRoute("/employee/queue")({
  component: EmpQueue,
});

function EmpQueue() {
  const { user } = useAuth();

  const today = new Date().toISOString().slice(0, 10);

  const rows = useDb(() =>
    db
      .all("appointments")
      .filter(
        (a) =>
          a.organization_id === user?.organization_id &&
          a.date === today
      )
  );

  const serving = rows.find(
    (r) => r.status === "in_progress"
  );

  const waiting = rows.filter(
    (r) => r.status === "confirmed"
  );

  function setStatus(
    id: string,
    status: AppointmentStatus
  ) {
    db.update("appointments", id, {
      status,
    } as never);

    toast.success("Queue updated");
  }

  function completeCurrent() {
    if (!serving) return;

    setStatus(serving.id, "completed");
    toast.success("Customer completed");
  }

  function skipCurrent() {
    if (!serving) return;

    setStatus(serving.id, "confirmed");
    toast.info("Customer skipped");
  }

  function serveNext() {
    const next = waiting[0];

    if (!next) {
      toast.info("No customers waiting");
      return;
    }

    if (serving) {
      setStatus(serving.id, "confirmed");
    }

    setStatus(next.id, "in_progress");
    toast.success(`Now serving ${next.customer_name}`);
  }

  function refreshQueue() {
    toast.success("Queue refreshed");
  }

  return (
    <div>
      <PageHeader
        title="My Queue"
        subtitle="Customers assigned to Queue-A"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshQueue}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current Customer */}
        <div className="rounded-2xl border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Current Customer
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <User className="h-7 w-7" />
            </div>

            <div>
              <div className="text-2xl font-bold">
                {serving?.customer_name ??
                  "No Active Customer"}
              </div>

              <div className="text-sm text-muted-foreground">
                {serving
                  ? `Queue-A • Token #${
                      rows.findIndex(
                        (r) => r.id === serving.id
                      ) + 1
                    }`
                  : "No active customer"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              disabled={!serving}
              onClick={completeCurrent}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete
            </Button>

            <Button
              variant="outline"
              disabled={!serving}
              onClick={skipCurrent}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>

            <Button
              variant="outline"
              disabled={!serving}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>

            <Button onClick={serveNext}>
              <PhoneCall className="mr-2 h-4 w-4" />
              Call Next
            </Button>
          </div>
        </div>

        {/* Queue List */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <div className="mb-4">
            <h3 className="font-semibold">
              Queue List ({rows.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">
                    Customer
                  </th>
                  <th className="py-3 text-left font-medium">
                    Position
                  </th>
                  <th className="py-3 text-left font-medium">
                    Wait
                  </th>
                  <th className="py-3 text-left font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, index) => {
                  const position = index + 1;

                  const wait =
                    r.status === "in_progress"
                      ? 0
                      : position * 8;

                  return (
                    <tr
                      key={r.id}
                      className="border-b"
                    >
                      <td className="py-4 font-medium">
                        {r.customer_name}
                      </td>

                      <td className="py-4">
                        #{position}
                      </td>

                      <td className="py-4">
                        {wait} min
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            r.status ===
                            "in_progress"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.status ===
                          "in_progress"
                            ? "In Service"
                            : "Waiting"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!rows.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No customers waiting
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