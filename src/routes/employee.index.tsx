import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Users, Star } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/employee/")({
  component: EmployeeDashboard,
});

const handleTime = [
  { hour: "09:00", minutes: 12 },
  { hour: "10:00", minutes: 14 },
  { hour: "11:00", minutes: 11 },
  { hour: "12:00", minutes: 13 },
  { hour: "13:00", minutes: 10 },
  { hour: "14:00", minutes: 15 },
  { hour: "15:00", minutes: 12 },
  { hour: "16:00", minutes: 16 },
  { hour: "17:00", minutes: 11 },
];

const hospitalSchedule = [
  {
    start: 9,
    end: 11,
    title: "Outpatient Consultation",
  },
  {
    start: 11,
    end: 13,
    title: "Ward Round & Patient Assessment",
  },
  {
    start: 14,
    end: 16,
    title: "Follow-up Consultations",
  },
  {
    start: 16,
    end: 18,
    title: "Patient Documentation & Discharge Review",
  },
];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {title}
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              {value}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeDashboard() {
  const currentHour = new Date().getHours();

  const upcomingSchedule = hospitalSchedule.filter(
    (item) => item.end > currentHour
  );

  return (
    <div>
      <PageHeader
        title="Good Morning, Dr. Aishwarya"
        subtitle="Here's your day at a glance"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients Seen Today"
          value={24}
          subtitle="4 more than average"
          icon={CheckCircle2}
        />

        <StatCard
          title="Average Consultation"
          value="14m"
          subtitle="Within target time"
          icon={Clock}
        />

        <StatCard
          title="Patients Waiting"
          value={6}
          subtitle="General OPD Queue"
          icon={Users}
        />

        <StatCard
          title="Patient Satisfaction"
          value="4.9"
          subtitle="Excellent rating"
          icon={Star}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-semibold">
              Today's Consultation Time
            </h3>

            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={handleTime}>
                  <defs>
                    <linearGradient
                      id="consultationGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="hour"
                    fontSize={12}
                  />

                  <YAxis fontSize={12} />

                  <Tooltip
                    contentStyle={tooltipStyle}
                  />

                  <Area
                    type="monotone"
                    dataKey="minutes"
                    strokeWidth={3}
                    fill="url(#consultationGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 font-semibold">
              Remaining Schedule Today
            </h3>

            {upcomingSchedule.length ? (
              <div className="space-y-3">
                {upcomingSchedule.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>

                      <div>
                        <div className="font-medium">
                          {item.title}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {item.start}:00 - {item.end}:00
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl border p-8 text-center text-muted-foreground">
                Shift completed for today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}