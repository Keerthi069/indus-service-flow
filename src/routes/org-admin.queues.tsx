import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Phone,
  Check,
  Pause,
  Play,
  Plus,
  Download,
  Search,
  User,
  Activity,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Sheet,
} from "lucide-react";

import { v4 as uuid } from "uuid";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db, useDb } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/org-admin/queues")({
  component: QueuePage,
});

const PAGE_SIZE = 5;

const HOSPITAL_SERVICES = [
  "General Consultation",
  "Emergency",
  "Pediatrics",
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Gynecology",
  "Neurology",
  "Dental",
  "Radiology",
  "Pathology / Lab",
  "Pharmacy",
  "Physiotherapy",
  "Vaccination",
  "Diagnostics",
];

function QueuePage() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const [pausedServices, setPausedServices] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page, setPage] = useState(1);

  // New Queue dialog state
  const [newQueueOpen, setNewQueueOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerMobile, setNewCustomerMobile] = useState("");
  const [newService, setNewService] = useState("");

  const appointments = useDb(() =>
    db.all("appointments").filter((a) => a.organization_id === orgId)
  );

  const services = useMemo(() => {
    const fromData = appointments.map((a) => a.service_name);
    return Array.from(new Set([...HOSPITAL_SERVICES, ...fromData]));
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchService = serviceFilter === "all" || a.service_name === serviceFilter;
      const matchSearch =
        a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        a.token.toString().includes(search);
      return matchService && matchSearch;
    });
  }, [appointments, serviceFilter, search]);

  const queueCards = useMemo(() => {
    const map = new Map();

    filteredAppointments.forEach((a) => {
      if (!map.has(a.service_name)) {
        map.set(a.service_name, { service: a.service_name, serving: null, waiting: [] });
      }
      const item = map.get(a.service_name);
      if (a.status === "in_progress") item.serving = a;
      if (a.status === "confirmed") item.waiting.push(a);
    });

    return Array.from(map.values())
      .filter((q) => q.serving !== null)
      .sort((a, b) => b.waiting.length - a.waiting.length);
  }, [filteredAppointments]);

  const totalWaiting = filteredAppointments.filter((a) => a.status === "confirmed").length;
  const totalServing = filteredAppointments.filter((a) => a.status === "in_progress").length;
  const completedToday = filteredAppointments.filter((a) => a.status === "completed").length;
  const pausedCount = pausedServices.size;

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));

  const paginatedAppointments = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, page]);

  function handleServiceFilterChange(value: string) {
    setServiceFilter(value);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function toggleServicePause(service: string) {
    setPausedServices((prev) => {
      const next = new Set(prev);
      if (next.has(service)) {
        next.delete(service);
        toast.success(`${service} queue resumed`);
      } else {
        next.add(service);
        toast(`${service} queue paused`);
      }
      return next;
    });
  }

  function completeCustomer(id: string) {
    db.update("appointments", id, { status: "completed" } as never);
    toast.success("Customer completed");
  }

  function callNext(service: string) {
    if (pausedServices.has(service)) {
      toast.error(`${service} queue is paused`);
      return;
    }
    const current = filteredAppointments.find(
      (a) => a.service_name === service && a.status === "in_progress"
    );
    if (current) {
      toast.error("Complete current customer first.");
      return;
    }
    const next = filteredAppointments.find(
      (a) => a.service_name === service && a.status === "confirmed"
    );
    if (!next) {
      toast.error("No waiting customer.");
      return;
    }
    db.update("appointments", next.id, { status: "in_progress" } as never);
    toast.success(`Now serving ${next.customer_name}`);
  }

  function exportCsv() {
    const headers = ["Customer", "Service", "Token", "Status"];
    const csv = [
      headers.join(","),
      ...filteredAppointments.map((a) => [a.customer_name, a.service_name, a.token, a.status].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "queue.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportExcel() {
    const headers = ["Customer", "Service", "Token", "Status"];
    const tsv = [
      headers.join("\t"),
      ...filteredAppointments.map((a) => [a.customer_name, a.service_name, a.token, a.status].join("\t")),
    ].join("\n");
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "queue.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
  }

  // =========================
  // NEW QUEUE — dialog-driven instead of native prompt()
  // =========================
  function openNewQueueDialog() {
    setNewCustomerName("");
    setNewCustomerMobile("");
    setNewService("");
    setNewQueueOpen(true);
  }

  function submitNewQueue() {
    if (!newCustomerName.trim()) {
      toast.error("Enter a customer name");
      return;
    }
    if (!newService) {
      toast.error("Select a service");
      return;
    }

    db.insert("appointments", {
     id: uuid(),
      organization_id: orgId,
      customer_name: newCustomerName.trim(),
      service_name: newService,
      token: Math.floor(1000 + Math.random() * 9000).toString(),
      appointment_no: "",
      customer_id: "",
      customer_mobile: newCustomerMobile.trim(),
      customer_email: "",
      service_id: "",
      date: "",
      time: "",
      status: "confirmed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never);

    toast.success(`${newCustomerName.trim()} added to ${newService} queue`);
    setNewQueueOpen(false);
  }

  function statusBadge(status: string) {
    switch (status) {
      case "confirmed":
        return <Badge className="border-0 bg-amber-100 text-amber-700">Waiting</Badge>;
      case "completed":
        return <Badge className="border-0 bg-emerald-100 text-emerald-700">Completed</Badge>;
      case "in_progress":
        return <Badge className="border-0 bg-blue-100 text-blue-700">Serving</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Queue Management"
        subtitle="Monitor and control every service queue across your organization"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search customer or token..."
                className="pl-9"
              />
            </div>

            <select
              value={serviceFilter}
              onChange={(e) => handleServiceFilterChange(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All Services</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-1.5 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv}>
                  <FileText className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPdf}>
                  <Sheet className="mr-2 h-4 w-4" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" onClick={openNewQueueDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Queue
            </Button>
          </div>
        }
      />

      {pausedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Pause className="h-4 w-4" />
          {pausedCount} queue{pausedCount > 1 ? "s" : ""} paused — customers in{" "}
          {Array.from(pausedServices).join(", ")} won't be called until resumed.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Waiting</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{totalWaiting}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <Clock className="h-5 w-5 text-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Currently Serving</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{totalServing}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <Activity className="h-5 w-5 text-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{completedToday}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <Check className="h-5 w-5 text-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Services</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{services.length}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <Users className="h-5 w-5 text-foreground/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Cards — only services currently serving a customer */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Currently serving</h2>
          <span className="text-xs text-muted-foreground">{queueCards.length} active</span>
        </div>

        {queueCards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {queueCards.map((queue) => {
              const isPaused = pausedServices.has(queue.service);
              return (
                <Card key={queue.service} className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3.5">
                    <h3 className="truncate font-medium">{queue.service}</h3>
                    <button
                      onClick={() => toggleServicePause(queue.service)}
                      className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-3 w-3" />
                          Paused
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3" />
                          Live
                        </>
                      )}
                    </button>
                  </div>

                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Now serving</p>
                        <p className="truncate text-sm font-medium">{queue.serving.customer_name}</p>
                        <p className="text-xs text-primary">Token #{queue.serving.token}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Waiting</span>
                      <span className={`font-medium ${queue.waiting.length >= 5 ? "text-amber-600" : ""}`}>
                        {queue.waiting.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" onClick={() => completeCustomer(queue.serving.id)}>
                        <Check className="mr-1.5 h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPaused}
                        onClick={() => callNext(queue.service)}
                      >
                        <Phone className="mr-1.5 h-4 w-4" />
                        Call Next
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Next up: {queue.waiting.length ? `#${queue.waiting[0].token}` : "—"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No service is currently serving a customer.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Live Queue Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-lg font-semibold">Live Queue</h2>
              <p className="text-sm text-muted-foreground">
                {filteredAppointments.length} appointment{filteredAppointments.length === 1 ? "" : "s"} across{" "}
                {services.length} service{services.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Token</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.map((row) => (
                  <tr key={row.id} className="border-b transition hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium text-primary">#{row.token}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{row.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{row.customer_mobile || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="rounded-full">
                        {row.service_name}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">{statusBadge(row.status)}</td>
                  </tr>
                ))}

                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-muted-foreground">
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredAppointments.length > 0 && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredAppointments.length)} of {filteredAppointments.length}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Queue Dialog */}
      <Dialog open={newQueueOpen} onOpenChange={setNewQueueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to queue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer name</Label>
              <Input
                id="customer-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Jane Cooper"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-mobile">Mobile number</Label>
              <Input
                id="customer-mobile"
                value={newCustomerMobile}
                onChange={(e) => setNewCustomerMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select value={newService} onValueChange={setNewService}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewQueueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNewQueue}>Add to queue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}