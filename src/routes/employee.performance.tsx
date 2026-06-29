import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Trophy, Star, Target, Users, Clock, CheckCircle } from "lucide-react";

import { PageHeader, Kpi } from "@/components/portal/PortalShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/employee/performance")({
  component: PerfPage,
});

// Realistic hospital employee performance data
const rating = [
  { w: "W1", r: 4.3 },
  { w: "W2", r: 4.4 },
  { w: "W3", r: 4.5 },
  { w: "W4", r: 4.4 },
  { w: "W5", r: 4.6 },
  { w: "W6", r: 4.7 },
  { w: "W7", r: 4.8 },
  { w: "W8", r: 4.7 },
  { w: "W9", r: 4.8 },
  { w: "W10", r: 4.9 },
  { w: "W11", r: 4.8 },
  { w: "W12", r: 4.9 },
];

const patients = [
  { w: "W1", n: 48 },
  { w: "W2", n: 52 },
  { w: "W3", n: 55 },
  { w: "W4", n: 50 },
  { w: "W5", n: 58 },
  { w: "W6", n: 60 },
  { w: "W7", n: 64 },
  { w: "W8", n: 62 },
  { w: "W9", n: 66 },
  { w: "W10", n: 68 },
  { w: "W11", n: 70 },
  { w: "W12", n: 72 },
];

const volume = [
  { w: "W1", c: 82 },
  { w: "W2", c: 88 },
  { w: "W3", c: 91 },
  { w: "W4", c: 90 },
  { w: "W5", c: 94 },
  { w: "W6", c: 96 },
  { w: "W7", c: 98 },
  { w: "W8", c: 95 },
  { w: "W9", c: 97 },
  { w: "W10", c: 99 },
  { w: "W11", c: 98 },
  { w: "W12", c: 100 },
];

function Progress({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function PerfPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Overview"
        subtitle="Track your productivity, service quality, and patient satisfaction."
      />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Performance Score" value="94/100" />
        <Kpi label="Patients Served" value="412" />
        <Kpi label="On-Time Rate" value="92%" /> 
      </div>

      <div className="grid gap-4 md:grid-cols-3">
       
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">11 min</p>
              <p className="text-sm text-muted-foreground">
                Avg Wait Time
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-sm text-muted-foreground">
                Satisfaction Score
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">97%</p>
              <p className="text-sm text-muted-foreground">
                Resolution Rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Status</span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Excellent
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Department Ranking</span>
                <span className="font-medium">Top 10%</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Escalations</span>
                <span className="font-medium">2</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Shift Attendance</span>
                <span className="font-medium">98%</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Last Updated</span>
                <span className="font-medium">Today 10:45 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Goal Progress</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <Progress label="Patients Served" value={82} />
            <Progress label="Patient Satisfaction" value={96} />
            <Progress label="Treatment Completion" value={93} />
            <Progress label="Follow-up Compliance" value={88} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 h-4 w-4 text-yellow-500" />
                <span className="text-sm">
                  Top Performer of the Month
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-4 w-4 text-amber-500" />
                <span className="text-sm">
                  Maintained 4.8+ rating for 12 weeks
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Exceeded monthly patient target
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  97% first-time resolution rate
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Patient Rating Trend</CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rating}>
                <CartesianGrid vertical={false} opacity={0.15} />
                <XAxis dataKey="w" />
                <YAxis domain={[4, 5]} />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="r"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patients Served</CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patients}>
                <CartesianGrid vertical={false} opacity={0.15} />
                <XAxis dataKey="w" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="n"
                  stroke="var(--secondary)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Quality Index</CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volume}>
                <CartesianGrid vertical={false} opacity={0.15} />
                <XAxis dataKey="w" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="c"
                  stroke="var(--chart-3)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
