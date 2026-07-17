import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import CsvLogo from "@/assets/csv.png";
import ExcelLogo from "@/assets/excel.png";
import PdfLogo from "@/assets/pdf.png"

import {
  Phone,
  Check,
  Pause,
  Play,
  Plus,
  UserPlus,
  Download,
  Search,
  Activity,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileDown,
  CalendarDays,
  Inbox,
  PhoneOff,
  ListPlus,
  ListFilter,
} from "lucide-react";

import { v4 as uuid } from "uuid";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { PageHeader } from "@/components/portal/PortalShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
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

// Shared status language — same hex-pill pattern used on Appointments,
// Requests, Categories and Organizations.
const STATUS_META = {
  confirmed: { label: "Waiting", icon: Clock, color: "#eda100" },
  in_progress: { label: "Serving", icon: Activity, color: "#2a78d6" },
  completed: { label: "Completed", icon: Check, color: "#1baf7a" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as keyof typeof STATUS_META];
  if (!meta) {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
        {status}
      </span>
    );
  }
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ background: `${meta.color}14`, borderColor: `${meta.color}33`, color: meta.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function initials(name: string) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function QueuePage() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const [pausedServices, setPausedServices] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Queues created with zero customers so far — these need to exist and show
  // up as a card/filter option even before any appointment references them.
  const [customQueues, setCustomQueues] = useState<string[]>([]);

  // "Create new queue" dialog — defines a brand-new service/queue.
  const [createQueueOpen, setCreateQueueOpen] = useState(false);
  const [newQueueName, setNewQueueName] = useState("");

  // "Add customer" dialog — enqueues a customer into an existing queue.
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerMobile, setNewCustomerMobile] = useState("");
  const [newCustomerService, setNewCustomerService] = useState("");

  const appointments = useDb(() =>
    db.all("appointments").filter((a) => a.organization_id === orgId)
  );

  // This org's real service catalog — the exact same source of truth the
  // Services page reads from (db.all("services") scoped to organization_id).
  // Previously the filter merged in a hardcoded HOSPITAL_SERVICES list
  // (Cardiology, Dental, ENT, etc.) regardless of the org's actual
  // category, which is why every organization — a bank, a retail store, a
  // support center — showed the exact same hospital-flavored service list
  // instead of its own. That hardcoded list is gone; only services that
  // genuinely exist for this org (i.e. appear on its own Services page)
  // are shown here.
  const orgServices = useDb(() =>
    db.all("services").filter((s) => s.organization_id === orgId)
  );

  const services = useMemo(() => {
    const fromCatalog = orgServices.map((s) => s.name);
    return Array.from(new Set([...fromCatalog, ...customQueues]));
  }, [orgServices, customQueues]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchService = serviceFilter === "all" || a.service_name === serviceFilter;
      const matchSearch =
        a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        a.token.toString().includes(search);
      return matchService && matchSearch;
    });
  }, [appointments, serviceFilter, search]);

  // Every queue with activity, PLUS any custom queue that was just created
  // and has no customers yet — shown as an idle card instead of vanishing.
  const queueCards = useMemo(() => {
    const map = new Map<string, { service: string; serving: any; waiting: any[] }>();

    filteredAppointments.forEach((a) => {
      if (!map.has(a.service_name)) {
        map.set(a.service_name, { service: a.service_name, serving: null, waiting: [] });
      }
      const item = map.get(a.service_name)!;
      if (a.status === "in_progress") item.serving = a;
      if (a.status === "confirmed") item.waiting.push(a);
    });

    customQueues.forEach((q) => {
      const matchesFilter = serviceFilter === "all" || serviceFilter === q;
      if (matchesFilter && !map.has(q)) {
        map.set(q, { service: q, serving: null, waiting: [] });
      }
    });

    return Array.from(map.values())
      .filter((q) => q.serving !== null || q.waiting.length > 0 || customQueues.includes(q.service))
      .sort((a, b) => b.waiting.length - a.waiting.length);
  }, [filteredAppointments, customQueues, serviceFilter]);

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

  function exportRows() {
    return filteredAppointments.map((a) => ({
      Customer: a.customer_name,
      Mobile: a.customer_mobile || "",
      Service: a.service_name,
      Token: a.token,
      Status: a.status,
    }));
  }

  function exportCsv() {
    if (!filteredAppointments.length) return toast.error("Nothing to export");
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "queue.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  }

  function exportExcel() {
    if (!filteredAppointments.length) return toast.error("Nothing to export");
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Queue");
    XLSX.writeFile(wb, "queue.xlsx");
    toast.success("Exported Excel");
  }

  function exportPdf() {
    if (!filteredAppointments.length) return toast.error("Nothing to export");
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["Token", "Customer", "Mobile", "Service", "Status"]],
      body: filteredAppointments.map((a) => [
        a.token,
        a.customer_name,
        a.customer_mobile || "—",
        a.service_name,
        a.status,
      ]),
    });
    doc.save("queue.pdf");
    toast.success("Exported PDF");
  }

  function generateUniqueToken() {
    const existing = new Set(appointments.map((a) => a.token));
    let token: string;
    do {
      token = Math.floor(1000 + Math.random() * 9000).toString();
    } while (existing.has(token));
    return token;
  }

  // =========================
  // CREATE NEW QUEUE — defines a service/queue with zero customers.
  // =========================
  function openCreateQueueDialog() {
    setNewQueueName("");
    setCreateQueueOpen(true);
  }

  function submitCreateQueue() {
    const name = newQueueName.trim();
    if (!name) {
      toast.error("Enter a queue name");
      return;
    }
    if (services.some((s) => s.toLowerCase() === name.toLowerCase())) {
      toast.error("A queue with this name already exists");
      return;
    }

    setCustomQueues((prev) => [...prev, name]);
    setServiceFilter(name);
    toast.success(`"${name}" queue created`);
    setCreateQueueOpen(false);
  }

  // =========================
  // ADD CUSTOMER — enqueues a customer into an existing queue.
  // =========================
  function openAddCustomerDialog(prefillService?: string) {
    setNewCustomerName("");
    setNewCustomerMobile("");
    setNewCustomerService(prefillService ?? "");
    setAddCustomerOpen(true);
  }

  function submitAddCustomer() {
    if (!newCustomerName.trim()) {
      toast.error("Enter a customer name");
      return;
    }
    if (!newCustomerService) {
      toast.error("Select a queue");
      return;
    }

    db.insert("appointments", {
      id: uuid(),
      organization_id: orgId,
      customer_name: newCustomerName.trim(),
      service_name: newCustomerService,
      token: generateUniqueToken(),
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

    toast.success(`${newCustomerName.trim()} added to ${newCustomerService} queue`);
    setAddCustomerOpen(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Queue management"
          subtitle="Monitor and control every service queue across your organization."
        />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search customer or token..."
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>

          <Select value={serviceFilter} onValueChange={handleServiceFilterChange}>
            <SelectTrigger className="h-9 w-[190px] gap-1.5 text-sm">
              <ListFilter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="All services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">

              <DropdownMenuItem onClick={exportCsv}>
                 <img src={CsvLogo} alt="CSV" className="h-5 w-5 object-contain" />
                CSV
              </DropdownMenuItem>

              <DropdownMenuItem onClick={exportExcel}>
                 <img src={ExcelLogo} alt="Excel" className="h-5 w-5 object-contain" />
                Excel
              </DropdownMenuItem>
             
              <DropdownMenuItem onClick={exportPdf}>
                 <img src={PdfLogo} alt="PDF" className="h-5 w-5 object-contain" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={openCreateQueueDialog}>
            <ListPlus className="h-3.5 w-3.5" />
            New queue
          </Button>
        </div>
      </div>

      {pausedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm" style={{ background: "#eda1000D", borderColor: "#eda1004D", color: "#a3690a" }}>
          <Pause className="h-4 w-4" />
          {pausedCount} queue{pausedCount > 1 ? "s" : ""} paused — customers in{" "}
          <span className="font-medium">{Array.from(pausedServices).join(", ")}</span> won't be called until resumed.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{totalWaiting}</div>
              <div className="text-xs text-muted-foreground">Total waiting</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{totalServing}</div>
              <div className="text-xs text-muted-foreground">Currently serving</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              <Check className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{completedToday}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground">{services.length}</div>
              <div className="text-xs text-muted-foreground">Services</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Active queues</h2>
          <span className="text-xs text-muted-foreground">{queueCards.length} with activity</span>
        </div>

        {queueCards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {queueCards.map((queue) => {
              const isPaused = pausedServices.has(queue.service);
              const isIdle = !queue.serving;
              const isEmpty = isIdle && queue.waiting.length === 0;
              return (
                <Card key={queue.service} className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3.5">
                    <h3 className="truncate font-medium">{queue.service}</h3>
                    <button
                      onClick={() => toggleServicePause(queue.service)}
                      className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition"
                      style={
                        isPaused
                          ? { background: "#eda1140D", borderColor: "#eda14D", color: "#a3690a" }
                          : { background: "#1baf7a0D", borderColor: "#1baf7a4D", color: "#1baf7a" }
                      }
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
                    {isEmpty ? (
                      <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
                        <PhoneOff className="h-4 w-4 flex-shrink-0" />
                        No customers yet in this queue.
                      </div>
                    ) : isIdle ? (
                      <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
                        <PhoneOff className="h-4 w-4 flex-shrink-0" />
                        Not serving anyone yet — call the first customer to start.
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(queue.serving.customer_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Now serving</p>
                          <p className="truncate text-sm font-medium">{queue.serving.customer_name}</p>
                          <p className="text-xs font-mono text-primary">Token #{queue.serving.token}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Waiting</span>
                      <span className="font-mono font-semibold" style={queue.waiting.length >= 5 ? { color: "#eda100" } : undefined}>
                        {queue.waiting.length}
                      </span>
                    </div>

                    {isEmpty ? (
                      <Button size="sm" className="w-full" onClick={() => openAddCustomerDialog(queue.service)}>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        Add first customer
                      </Button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" disabled={isIdle} onClick={() => queue.serving && completeCustomer(queue.serving.id)}>
                          <Check className="mr-1.5 h-4 w-4" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPaused || !isIdle || queue.waiting.length === 0}
                          onClick={() => callNext(queue.service)}
                        >
                          <Phone className="mr-1.5 h-4 w-4" />
                          Call next
                        </Button>
                      </div>
                    )}

                    {!isEmpty && (
                      <p className="text-xs text-muted-foreground">
                        Next up: {queue.waiting.length ? `#${queue.waiting[0].token}` : "—"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No active queues</p>
              <p className="text-xs text-muted-foreground">Create a queue or add a customer to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Live Queue Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Live queue</h2>
            <p className="text-xs text-muted-foreground">
              {filteredAppointments.length} appointment{filteredAppointments.length === 1 ? "" : "s"} across{" "}
              {services.length} service{services.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs font-semibold text-muted-foreground">
                <th className="px-5 py-2.5">Token</th>
                <th className="px-5 py-2.5">Customer</th>
                <th className="px-5 py-2.5">Mobile</th>
                <th className="px-5 py-2.5">Service</th>
                <th className="px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map((row) => (
                <tr key={row.id} className="border-b transition hover:bg-muted/20 last:border-b-0">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">#{row.token}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {initials(row.customer_name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{row.customer_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {row.customer_mobile || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {row.service_name}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}

              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">No appointments found</p>
                      <p className="text-xs">Try adjusting your search or filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredAppointments.length)} of {filteredAppointments.length}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-2 text-xs font-medium text-muted-foreground">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE NEW QUEUE DIALOG */}
      <Dialog open={createQueueOpen} onOpenChange={setCreateQueueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new queue</DialogTitle>
            <DialogDescription>
              Sets up a brand-new service queue with no customers yet. Add customers to it afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="queue-name">Queue / service name</Label>
            <Input
              id="queue-name"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              placeholder="e.g. Insurance Desk"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateQueueOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreateQueue}>Create queue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}