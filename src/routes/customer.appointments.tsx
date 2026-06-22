import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarX, Repeat } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/portal/PortalShell";
import { DataTable } from "@/components/portal/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { db, useDb } from "@/lib/mock/db";

export const Route = createFileRoute("/customer/appointments")({ component: MyAppts });

function MyAppts() {
  const { user } = useAuth();
  const [tab, setTab] = useState("ongoing");
  const all = useDb(() => db.all("appointments").filter(a => a.customer_email === user?.email));
  const ongoing = all.filter(a => a.status !== "completed" && a.status !== "cancelled");
  const past = all.filter(a => a.status === "completed" || a.status === "cancelled");

  const columns = [
    { key: "appointment_no" as const, header: "No.", sortable: true },
    { key: "service_name" as const, header: "Service" },
    { key: "date" as const, header: "Date", sortable: true },
    { key: "time" as const, header: "Time" },
    { key: "status" as const, header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status.replace("_", " ")}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="My appointments" subtitle="View your ongoing and previous appointments." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="ongoing">Ongoing ({ongoing.length})</TabsTrigger>
          <TabsTrigger value="past">Previous ({past.length})</TabsTrigger>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="ongoing" className="mt-4">
          <DataTable data={ongoing} exportName="my-ongoing-appointments" columns={columns}
            rowActions={r => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => { db.update("appointments", r.id, { status: "rescheduled" } as never); toast.success("Reschedule requested"); }}><Repeat className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { db.update("appointments", r.id, { status: "cancelled" } as never); toast.success("Cancelled"); }}><CalendarX className="h-4 w-4" /></Button>
              </div>
            )} />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <DataTable data={past} exportName="my-past-appointments" columns={columns} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <DataTable data={all} exportName="my-appointments" columns={columns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
