import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/employee/schedule")({ component: SchedPage });

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function SchedPage() {
  return (
    <div>
      <PageHeader title="My schedule" subtitle="Weekly working hours, breaks and weekly offs." />
      <Card><CardContent className="p-3 overflow-x-auto">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
          <div />
          {DAYS.map(d => <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
          {SLOTS.map(s => (
            <>
              <div key={s} className="p-2 text-right text-xs text-muted-foreground">{s}</div>
              {DAYS.map(d => {
                const off = d === "Sun";
                const brk = s === "13:00";
                return <div key={`${s}-${d}`} className={`m-0.5 rounded-md border text-[10px] font-medium ${off ? "border-destructive/20 bg-destructive/10 text-destructive" : brk ? "border-warning/30 bg-warning/10 text-warning" : "border-success/20 bg-success/10 text-success"} flex items-center justify-center py-3`}>
                  {off ? "Off" : brk ? "Break" : "Available"}
                </div>;
              })}
            </>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
