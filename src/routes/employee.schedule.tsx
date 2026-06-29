import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/employee/schedule")({
  component: SchedulePage,
});

const employeeSchedule = [
  {
    day: "Monday",
    slots: [
      "09:00 - 11:00 Available",
      "11:00 - 13:00 Available",
      "13:00 - 14:00 Break",
      "14:00 - 18:00 Available",
    ],
  },
  {
    day: "Tuesday",
    slots: [
      "09:00 - 11:00 Available",
      "11:00 - 13:00 Available",
      "13:00 - 14:00 Break",
      "14:00 - 18:00 Available",
    ],
  },
  {
    day: "Wednesday",
    slots: [
      "09:00 - 11:00 Available",
      "11:00 - 13:00 Available",
      "13:00 - 14:00 Break",
      "14:00 - 18:00 Available",
    ],
  },
  {
    day: "Thursday",
    slots: [
      "09:00 - 11:00 Available",
      "11:00 - 13:00 Available",
      "13:00 - 14:00 Break",
      "14:00 - 18:00 Available",
    ],
  },
  {
    day: "Friday",
    slots: [
      "09:00 - 11:00 Available",
      "11:00 - 13:00 Available",
      "13:00 - 14:00 Break",
      "14:00 - 18:00 Available",
    ],
  },
  {
    day: "Saturday",
    slots: [
      "09:00 - 12:00 Available",
      "12:00 - 13:00 Break",
      "13:00 - 16:00 Available",
    ],
  },
  {
    day: "Sunday",
    slots: ["Day Off"],
  },
];

function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="My Schedule"
        subtitle="Weekly working hours, breaks and weekly offs."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {employeeSchedule.map((day) => (
          <Card
            key={day.day}
            className="overflow-hidden transition-all hover:shadow-md"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{day.day}</h3>

                {day.slots[0] === "Day Off" && (
                  <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Off
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {day.slots.map((slot, index) => {
                  const isBreak = slot.includes("Break");
                  const isOff = slot === "Day Off";

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border p-2 text-xs font-medium ${
                        isBreak
                          ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-700"
                          : isOff
                          ? "border-muted bg-muted/30 text-muted-foreground"
                          : "border-green-500/20 bg-green-500/10 text-green-700"
                      }`}
                    >
                      {slot}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
